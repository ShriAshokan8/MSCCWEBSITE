/**
 * Firebase Cloud Functions for Nexus Staff Portal
 * MSC Initiative
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * Verify admin privileges
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
async function verifyAdmin(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return false;
        }
        
        const userData = userDoc.data();
        const adminRoles = [
            'Global - Initiative Director',
            'Global - Deputy Initiative Director'
        ];
        
        return userData.roles && userData.roles.some(role => adminRoles.includes(role));
    } catch (error) {
        console.error('Error verifying admin:', error);
        return false;
    }
}

/**
 * Log activity
 * @param {Object} logData - Activity log data
 */
async function logActivity(logData) {
    try {
        await db.collection('systemLogs').add({
            ...logData,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Create a new role
 */
exports.createRole = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Verify admin
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
    
    // Validate input
    if (!data.name) {
        throw new functions.https.HttpsError('invalid-argument', 'Role name is required');
    }
    
    try {
        // Check if role already exists
        const existingRole = await db.collection('roles')
            .where('name', '==', data.name)
            .get();
        
        if (!existingRole.empty) {
            throw new functions.https.HttpsError('already-exists', 'Role with this name already exists');
        }
        
        // Create role
        const roleData = {
            name: data.name,
            description: data.description || '',
            isAdmin: data.isAdmin || false,
            permissions: data.permissions || {},
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const roleRef = await db.collection('roles').add(roleData);
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Created role',
            details: `Role "${data.name}" created`,
            userId: context.auth.uid
        });
        
        return { success: true, roleId: roleRef.id };
        
    } catch (error) {
        console.error('Error creating role:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Update an existing role
 */
exports.updateRole = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Verify admin
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
    
    // Validate input
    if (!data.roleId) {
        throw new functions.https.HttpsError('invalid-argument', 'Role ID is required');
    }
    
    try {
        const roleRef = db.collection('roles').doc(data.roleId);
        const roleDoc = await roleRef.get();
        
        if (!roleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Role not found');
        }
        
        // Update role
        const updates = {
            ...data.updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await roleRef.update(updates);
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Updated role',
            details: `Role "${roleDoc.data().name}" updated`,
            userId: context.auth.uid
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error updating role:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Delete a role
 */
exports.deleteRole = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Verify admin
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
    
    // Validate input
    if (!data.roleId) {
        throw new functions.https.HttpsError('invalid-argument', 'Role ID is required');
    }
    
    try {
        const roleRef = db.collection('roles').doc(data.roleId);
        const roleDoc = await roleRef.get();
        
        if (!roleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Role not found');
        }
        
        const roleName = roleDoc.data().name;
        
        // Delete role
        await roleRef.delete();
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Deleted role',
            details: `Role "${roleName}" deleted`,
            userId: context.auth.uid
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error deleting role:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Assign a role to a user
 */
exports.assignUserRole = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Verify admin
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
    
    // Validate input
    if (!data.userId || !data.roleName) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID and role name are required');
    }
    
    try {
        const userRef = db.collection('users').doc(data.userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        
        const userData = userDoc.data();
        const currentRoles = userData.roles || [];
        
        // Check if user already has the role
        if (currentRoles.includes(data.roleName)) {
            throw new functions.https.HttpsError('already-exists', 'User already has this role');
        }
        
        // Add role
        await userRef.update({
            roles: admin.firestore.FieldValue.arrayUnion(data.roleName),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Assigned role',
            details: `Role "${data.roleName}" assigned to user ${userData.fullName}`,
            userId: context.auth.uid
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error assigning role:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Remove a role from a user
 */
exports.removeUserRole = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Verify admin
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
    
    // Validate input
    if (!data.userId || !data.roleName) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID and role name are required');
    }
    
    try {
        const userRef = db.collection('users').doc(data.userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        
        const userData = userDoc.data();
        
        // Remove role
        await userRef.update({
            roles: admin.firestore.FieldValue.arrayRemove(data.roleName),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Removed role',
            details: `Role "${data.roleName}" removed from user ${userData.fullName}`,
            userId: context.auth.uid
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error removing role:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Add a secondary email to a user
 */
exports.addSecondaryEmail = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Validate input
    if (!data.userId || !data.email) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID and email are required');
    }
    
    // Users can add emails to their own account, or admins can add to any account
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (context.auth.uid !== data.userId && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Permission denied');
    }
    
    try {
        const userRef = db.collection('users').doc(data.userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        
        const userData = userDoc.data();
        const currentEmails = userData.secondaryEmails || [];
        
        // Check if email already exists
        if (userData.primaryEmail === data.email || currentEmails.includes(data.email)) {
            throw new functions.https.HttpsError('already-exists', 'Email already exists for this user');
        }
        
        // Add email
        await userRef.update({
            secondaryEmails: admin.firestore.FieldValue.arrayUnion(data.email),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Added email',
            details: `Email "${data.email}" added to user ${userData.fullName}`,
            userId: context.auth.uid
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error adding email:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Remove a secondary email from a user
 */
exports.removeSecondaryEmail = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Validate input
    if (!data.userId || !data.email) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID and email are required');
    }
    
    // Users can remove emails from their own account, or admins can remove from any account
    const isAdmin = await verifyAdmin(context.auth.uid);
    if (context.auth.uid !== data.userId && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Permission denied');
    }
    
    try {
        const userRef = db.collection('users').doc(data.userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        
        const userData = userDoc.data();
        
        // Remove email
        await userRef.update({
            secondaryEmails: admin.firestore.FieldValue.arrayRemove(data.email),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log activity
        await logActivity({
            type: 'roles',
            action: 'Removed email',
            details: `Email "${data.email}" removed from user ${userData.fullName}`,
            userId: context.auth.uid
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error removing email:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Firebase Cloud Functions Client Wrappers
 * MSC Initiative - Nexus Portal
 * These functions call Firebase Cloud Functions for admin operations
 */

/**
 * Call a Firebase Cloud Function
 * @param {string} functionName - The name of the function to call
 * @param {Object} data - The data to pass to the function
 * @returns {Promise<any>}
 */
async function callFunction(functionName, data) {
    try {
        const functions = firebase.functions();
        const callable = functions.httpsCallable(functionName);
        const result = await callable(data);
        return result.data;
    } catch (error) {
        console.error(`Error calling function ${functionName}:`, error);
        if (error.code === 'unauthenticated') {
            throw new Error('You must be logged in to perform this action');
        } else if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to perform this action');
        }
        throw error;
    }
}

/**
 * Create a new role
 * @param {Object} roleData - { name, description, isAdmin, permissions }
 * @returns {Promise<Object>}
 */
async function createRole(roleData) {
    return await callFunction('createRole', roleData);
}

/**
 * Update an existing role
 * @param {string} roleId - The role ID to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>}
 */
async function updateRole(roleId, updates) {
    return await callFunction('updateRole', { roleId, updates });
}

/**
 * Delete a role
 * @param {string} roleId - The role ID to delete
 * @returns {Promise<Object>}
 */
async function deleteRole(roleId) {
    return await callFunction('deleteRole', { roleId });
}

/**
 * Assign a role to a user
 * @param {string} userId - The user ID
 * @param {string} roleName - The role name to assign
 * @returns {Promise<Object>}
 */
async function assignUserRole(userId, roleName) {
    return await callFunction('assignUserRole', { userId, roleName });
}

/**
 * Remove a role from a user
 * @param {string} userId - The user ID
 * @param {string} roleName - The role name to remove
 * @returns {Promise<Object>}
 */
async function removeUserRole(userId, roleName) {
    return await callFunction('removeUserRole', { userId, roleName });
}

/**
 * Add a secondary email to a user
 * @param {string} userId - The user ID
 * @param {string} email - The email to add
 * @returns {Promise<Object>}
 */
async function addSecondaryEmail(userId, email) {
    return await callFunction('addSecondaryEmail', { userId, email });
}

/**
 * Remove a secondary email from a user
 * @param {string} userId - The user ID
 * @param {string} email - The email to remove
 * @returns {Promise<Object>}
 */
async function removeSecondaryEmail(userId, email) {
    return await callFunction('removeSecondaryEmail', { userId, email });
}

/**
 * Get all roles
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
    try {
        const rolesSnapshot = await db.collection('roles').get();
        return rolesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting roles:', error);
        throw error;
    }
}

/**
 * Get all users
 * @returns {Promise<Array>}
 */
async function getAllUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        return usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
}

/**
 * Get users by role
 * @param {string} roleName - The role name to filter by
 * @returns {Promise<Array>}
 */
async function getUsersByRole(roleName) {
    try {
        const usersSnapshot = await db.collection('users')
            .where('roles', 'array-contains', roleName)
            .get();
        return usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting users by role:', error);
        throw error;
    }
}

/**
 * Search users by name or email
 * @param {string} query - The search query
 * @returns {Promise<Array>}
 */
async function searchUsers(query) {
    try {
        const lowercaseQuery = query.toLowerCase();
        const allUsers = await getAllUsers();
        
        return allUsers.filter(user => {
            const nameMatch = user.fullName?.toLowerCase().includes(lowercaseQuery);
            const primaryEmailMatch = user.primaryEmail?.toLowerCase().includes(lowercaseQuery);
            const secondaryEmailMatch = user.secondaryEmails?.some(email => 
                email.toLowerCase().includes(lowercaseQuery)
            );
            
            return nameMatch || primaryEmailMatch || secondaryEmailMatch;
        });
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
}

/**
 * Get activity logs
 * @param {string} type - The type of logs to retrieve ('roles', 'files', or 'all')
 * @param {number} limit - Maximum number of logs to retrieve
 * @returns {Promise<Array>}
 */
async function getActivityLogs(type = 'all', limit = 100) {
    try {
        let query = db.collection('systemLogs').orderBy('timestamp', 'desc').limit(limit);
        
        if (type !== 'all') {
            query = query.where('type', '==', type);
        }
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting activity logs:', error);
        throw error;
    }
}

/**
 * Log a file activity
 * @param {Object} activityData - { action, fileName, filePath, userId, userName }
 * @returns {Promise<void>}
 */
async function logFileActivity(activityData) {
    try {
        await db.collection('systemLogs').add({
            type: 'files',
            ...activityData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging file activity:', error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createRole,
        updateRole,
        deleteRole,
        assignUserRole,
        removeUserRole,
        addSecondaryEmail,
        removeSecondaryEmail,
        getAllRoles,
        getAllUsers,
        getUsersByRole,
        searchUsers,
        getActivityLogs,
        logFileActivity
    };
}

/**
 * Firebase Configuration and Initialization for Nexus Portal
 * MSC Initiative Staff Portal
 */

// Firebase Configuration - Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Helper Functions

/**
 * Get the current authenticated user
 * @returns {Promise<firebase.User|null>}
 */
async function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

/**
 * Get the current user's Firestore document
 * @returns {Promise<Object|null>}
 */
async function getCurrentUserDoc() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;
        
        const docRef = db.collection('users').doc(user.uid);
        const doc = await docRef.get();
        
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting user document:', error);
        return null;
    }
}

/**
 * Get custom claims for the current user
 * @returns {Promise<Object|null>}
 */
async function getUserClaims() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;
        
        const idTokenResult = await user.getIdTokenResult();
        return idTokenResult.claims;
    } catch (error) {
        console.error('Error getting user claims:', error);
        return null;
    }
}

/**
 * Check if current user is an admin
 * @returns {Promise<boolean>}
 */
async function isAdmin() {
    try {
        const userDoc = await getCurrentUserDoc();
        if (!userDoc || !userDoc.roles) return false;
        
        const adminRoles = [
            'Global - Initiative Director',
            'Global - Deputy Initiative Director'
        ];
        
        return userDoc.roles.some(role => adminRoles.includes(role));
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
async function signOut() {
    try {
        await auth.signOut();
        window.location.href = '/nexus/login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

/**
 * Require authentication - redirect to login if not authenticated
 * @returns {Promise<firebase.User>}
 */
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/nexus/login.html';
        throw new Error('Authentication required');
    }
    return user;
}

/**
 * Require admin access - redirect to dashboard if not admin
 * @returns {Promise<void>}
 */
async function requireAdmin() {
    await requireAuth();
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/nexus/dashboard.html';
        throw new Error('Admin access required');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        auth,
        db,
        getCurrentUser,
        getCurrentUserDoc,
        getUserClaims,
        isAdmin,
        signOut,
        requireAuth,
        requireAdmin
    };
}

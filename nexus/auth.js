import { auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, doc, getDoc, setDoc, updateDoc } from './firebase.js';
import { MSCRoles } from './roles.js';

// Allowed email domains
const ALLOWED_DOMAINS = ['@hfed.net', '@harrispurley.org.uk'];

// User mapping: each person has two emails that map to ONE unified account
const USER_MAPPING = {
  // Shri Ashokan (Director)
  's.ashokan@harrispurley.org.uk': {
    sharedUid: 'user_shri',
    primaryEmail: 's.ashokan@harrispurley.org.uk',
    role: MSCRoles.Director,
    linkedEmails: ['s.ashokan@harrispurley.org.uk', 's.ashokan@hfed.net']
  },
  's.ashokan@hfed.net': {
    sharedUid: 'user_shri',
    primaryEmail: 's.ashokan@harrispurley.org.uk',
    role: MSCRoles.Director,
    linkedEmails: ['s.ashokan@harrispurley.org.uk', 's.ashokan@hfed.net']
  },
  
  // Atene Stanisauskaite (DeputyDirector)
  'a.stanisaukaite@harrispurley.org.uk': {
    sharedUid: 'user_atene',
    primaryEmail: 'a.stanisaukaite@harrispurley.org.uk',
    role: MSCRoles.DeputyDirector,
    linkedEmails: ['a.stanisaukaite@harrispurley.org.uk', 'a.stanisaukaite@hfed.net']
  },
  'a.stanisaukaite@hfed.net': {
    sharedUid: 'user_atene',
    primaryEmail: 'a.stanisaukaite@harrispurley.org.uk',
    role: MSCRoles.DeputyDirector,
    linkedEmails: ['a.stanisaukaite@harrispurley.org.uk', 'a.stanisaukaite@hfed.net']
  },
  
  // Jay Vyas (Support)
  'j.vyas@harrispurley.org.uk': {
    sharedUid: 'user_jay',
    primaryEmail: 'j.vyas@harrispurley.org.uk',
    role: MSCRoles.Support,
    linkedEmails: ['j.vyas@harrispurley.org.uk', 'j.vyas1@hfed.net']
  },
  'j.vyas1@hfed.net': {
    sharedUid: 'user_jay',
    primaryEmail: 'j.vyas@harrispurley.org.uk',
    role: MSCRoles.Support,
    linkedEmails: ['j.vyas@harrispurley.org.uk', 'j.vyas1@hfed.net']
  },
  
  // Jhanavi Fernandez (Core)
  'j.fernandez@harrispurley.org.uk': {
    sharedUid: 'user_jhanavi',
    primaryEmail: 'j.fernandez@harrispurley.org.uk',
    role: MSCRoles.Core,
    linkedEmails: ['j.fernandez@harrispurley.org.uk', 'j.fernandez@hfed.net']
  },
  'j.fernandez@hfed.net': {
    sharedUid: 'user_jhanavi',
    primaryEmail: 'j.fernandez@harrispurley.org.uk',
    role: MSCRoles.Core,
    linkedEmails: ['j.fernandez@harrispurley.org.uk', 'j.fernandez@hfed.net']
  },
  
  // Maganth Aswin Ramesh (Support)
  'm.ramesh@harrispurley.org.uk': {
    sharedUid: 'user_maganth',
    primaryEmail: 'm.ramesh@harrispurley.org.uk',
    role: MSCRoles.Support,
    linkedEmails: ['m.ramesh@harrispurley.org.uk', 'm.ramesh@hfed.net']
  },
  'm.ramesh@hfed.net': {
    sharedUid: 'user_maganth',
    primaryEmail: 'm.ramesh@harrispurley.org.uk',
    role: MSCRoles.Support,
    linkedEmails: ['m.ramesh@harrispurley.org.uk', 'm.ramesh@hfed.net']
  },
  
  // Nicholas Walpole (StaffCoordinator)
  'n.walpole@harrispurley.org.uk': {
    sharedUid: 'user_nicholas',
    primaryEmail: 'n.walpole@harrispurley.org.uk',
    role: MSCRoles.StaffCoordinator,
    linkedEmails: ['n.walpole@harrispurley.org.uk', 'n.walpole@hfed.net']
  },
  'n.walpole@hfed.net': {
    sharedUid: 'user_nicholas',
    primaryEmail: 'n.walpole@harrispurley.org.uk',
    role: MSCRoles.StaffCoordinator,
    linkedEmails: ['n.walpole@harrispurley.org.uk', 'n.walpole@hfed.net']
  }
};

/**
 * Validate if email has an allowed domain
 */
function validateDomain(email) {
  const emailLower = email.toLowerCase();
  const isValid = ALLOWED_DOMAINS.some(domain => emailLower.endsWith(domain));
  
  if (!isValid) {
    throw new Error('Only official school emails are allowed.');
  }
  
  return true;
}

/**
 * Get user mapping info for an email
 */
function getUserMapping(email) {
  const emailLower = email.toLowerCase();
  return USER_MAPPING[emailLower];
}

/**
 * Get or create unified user document in Firestore
 */
async function getOrCreateUserDoc(email, firebaseUser) {
  const mapping = getUserMapping(email);
  
  if (!mapping) {
    throw new Error('User not found in MSC Nexus directory.');
  }
  
  const userDocRef = doc(db, 'users', mapping.sharedUid);
  const userDocSnap = await getDoc(userDocRef);
  
  if (userDocSnap.exists()) {
    // Return existing user doc
    return {
      ...userDocSnap.data(),
      firebaseUid: firebaseUser.uid
    };
  } else {
    // Create new user document with default values
    const newUserDoc = {
      email: email,
      primaryEmail: mapping.primaryEmail,
      role: mapping.role,
      mustChangePassword: true,
      sharedUid: mapping.sharedUid,
      linkedEmails: mapping.linkedEmails,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    await setDoc(userDocRef, newUserDoc);
    
    return {
      ...newUserDoc,
      firebaseUid: firebaseUser.uid
    };
  }
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(sharedUid, email) {
  const userDocRef = doc(db, 'users', sharedUid);
  await updateDoc(userDocRef, {
    email: email,
    lastLoginAt: new Date().toISOString()
  });
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with Firestore info
 */
export async function login(email, password) {
  try {
    // Validate domain
    validateDomain(email);
    
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Get or create unified user document
    const userData = await getOrCreateUserDoc(email, firebaseUser);
    
    // Update last login
    await updateLastLogin(userData.sharedUid, email);
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide user-friendly error messages
    if (error.message === 'Only official school emails are allowed.') {
      throw error;
    } else if (error.message === 'User not found in MSC Nexus directory.') {
      throw error;
    } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Sign-in failed. Please try again.');
    }
  }
}

/**
 * Logout current user
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Observe user authentication state
 * @param {Function} callback - Callback function with user data or null
 */
export function observeUserState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get email from Firebase user
        const email = firebaseUser.email;
        
        // Validate domain
        validateDomain(email);
        
        // Get user mapping
        const mapping = getUserMapping(email);
        
        if (!mapping) {
          // Sign out if user not in directory
          await signOut(auth);
          callback(null);
          return;
        }
        
        // Get user document
        const userDocRef = doc(db, 'users', mapping.sharedUid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          callback({
            ...userDocSnap.data(),
            firebaseUid: firebaseUser.uid
          });
        } else {
          // Create user doc if doesn't exist
          const userData = await getOrCreateUserDoc(email, firebaseUser);
          callback(userData);
        }
      } catch (error) {
        console.error('Auth state error:', error);
        // Sign out on error
        await signOut(auth);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Force password change for current user
 * @param {string} newPassword - New password
 */
export async function forcePasswordChange(newPassword) {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently signed in.');
    }
    
    // Update Firebase password
    await updatePassword(user, newPassword);
    
    // Get user mapping
    const mapping = getUserMapping(user.email);
    
    if (!mapping) {
      throw new Error('User not found in MSC Nexus directory.');
    }
    
    // Update Firestore document
    const userDocRef = doc(db, 'users', mapping.sharedUid);
    await updateDoc(userDocRef, {
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Password change error:', error);
    
    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please sign in again before changing your password.');
    } else {
      throw new Error(error.message || 'Failed to change password. Please try again.');
    }
  }
}

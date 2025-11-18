/**
 * MSC Nexus Editor - Firestore Service Layer
 * 
 * This module provides CRUD operations for Firestore collections:
 * - workspaces
 * - folders
 * - documents
 */

import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from '../firebase.js';

/**
 * Load all workspaces
 * @returns {Promise<Array>} Array of workspace objects with id
 */
export async function loadWorkspaces() {
  try {
    const workspacesRef = collection(db, 'workspaces');
    const snapshot = await getDocs(workspacesRef);
    
    const workspaces = [];
    snapshot.forEach((doc) => {
      workspaces.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return workspaces;
  } catch (error) {
    console.error('Error loading workspaces:', error);
    throw new Error('Failed to load workspaces');
  }
}

/**
 * Load folders for a specific workspace
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Array>} Array of folder objects with id
 */
export async function loadFolders(workspaceId) {
  try {
    const foldersRef = collection(db, 'folders');
    const q = query(foldersRef, where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);
    
    const folders = [];
    snapshot.forEach((doc) => {
      folders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return folders;
  } catch (error) {
    console.error('Error loading folders:', error);
    throw new Error('Failed to load folders');
  }
}

/**
 * Load documents for a specific folder
 * @param {string} folderId - Folder ID
 * @returns {Promise<Array>} Array of document objects with id
 */
export async function loadDocuments(folderId) {
  try {
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, where('folderId', '==', folderId));
    const snapshot = await getDocs(q);
    
    const documents = [];
    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return documents;
  } catch (error) {
    console.error('Error loading documents:', error);
    throw new Error('Failed to load documents');
  }
}

/**
 * Load all documents across all folders (for search)
 * @returns {Promise<Array>} Array of all document objects with id
 */
export async function loadAllDocuments() {
  try {
    const documentsRef = collection(db, 'documents');
    const snapshot = await getDocs(documentsRef);
    
    const documents = [];
    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return documents;
  } catch (error) {
    console.error('Error loading all documents:', error);
    throw new Error('Failed to load documents');
  }
}

/**
 * Get a single document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document object with id
 */
export async function getDocument(documentId) {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Document not found');
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw new Error('Failed to load document');
  }
}

/**
 * Get a single folder by ID
 * @param {string} folderId - Folder ID
 * @returns {Promise<Object>} Folder object with id
 */
export async function getFolder(folderId) {
  try {
    const folderRef = doc(db, 'folders', folderId);
    const folderSnap = await getDoc(folderRef);
    
    if (folderSnap.exists()) {
      return {
        id: folderSnap.id,
        ...folderSnap.data()
      };
    } else {
      throw new Error('Folder not found');
    }
  } catch (error) {
    console.error('Error getting folder:', error);
    throw new Error('Failed to load folder');
  }
}

/**
 * Create a new folder
 * @param {string} name - Folder name
 * @param {string} workspaceId - Parent workspace ID
 * @param {string} ownerSharedUid - Owner's sharedUid
 * @returns {Promise<string>} New folder ID
 */
export async function createFolder(name, workspaceId, ownerSharedUid) {
  try {
    const foldersRef = collection(db, 'folders');
    const newFolder = {
      name: name,
      workspaceId: workspaceId,
      owner: ownerSharedUid,
      sharedWith: [],
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(foldersRef, newFolder);
    return docRef.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw new Error('Failed to create folder');
  }
}

/**
 * Create a new document
 * @param {string} title - Document title
 * @param {string} folderId - Parent folder ID
 * @param {string} workspaceId - Parent workspace ID
 * @param {string} ownerSharedUid - Owner's sharedUid
 * @param {string} content - Initial content (optional, defaults to empty)
 * @returns {Promise<string>} New document ID
 */
export async function createDocument(title, folderId, workspaceId, ownerSharedUid, content = '') {
  try {
    const documentsRef = collection(db, 'documents');
    const newDocument = {
      title: title,
      folderId: folderId,
      workspaceId: workspaceId,
      content: content,
      owner: ownerSharedUid,
      sharedWith: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(documentsRef, newDocument);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw new Error('Failed to create document');
  }
}

/**
 * Update document content
 * @param {string} documentId - Document ID
 * @param {string} content - New content
 * @returns {Promise<void>}
 */
export async function updateDocumentContent(documentId, content) {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      content: content,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to save document');
  }
}

/**
 * Check if user can edit a document based on permissions
 * @param {Object} document - Document object
 * @param {Object} folder - Folder object (optional)
 * @param {string} userSharedUid - User's sharedUid
 * @param {string} userRole - User's role
 * @returns {boolean} True if user can edit
 */
export function canEditDocument(document, folder, userSharedUid, userRole) {
  // Leadership roles (Director, DeputyDirector, StaffCoordinator) can always edit
  const leadershipRoles = ['Director', 'DeputyDirector', 'StaffCoordinator'];
  if (leadershipRoles.includes(userRole)) {
    return true;
  }
  
  // Document owner can edit
  if (document.owner === userSharedUid) {
    return true;
  }
  
  // User in document's sharedWith can edit
  if (document.sharedWith && document.sharedWith.includes(userSharedUid)) {
    return true;
  }
  
  // User in folder's sharedWith can edit
  if (folder && folder.sharedWith && folder.sharedWith.includes(userSharedUid)) {
    return true;
  }
  
  return false;
}

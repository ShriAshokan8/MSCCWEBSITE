/**
 * MSC Nexus Editor - Editor Engine with Firestore Integration
 * 
 * This module handles document editing with Firestore as the backend.
 */

import {
  getDocument,
  updateDocumentContent,
  canEditDocument,
  getFolder
} from './firestore-service.js';

// Editor state
let engineInitialized = false;
let engineContainer = null;
let currentDocument = null;
let currentFolder = null;
let currentUser = null;
let editorTextarea = null;
let saveButton = null;
let isReadOnly = false;
let unsavedChanges = false;

/**
 * Parse user context from URL query parameters
 */
function parseUserContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    email: params.get('email') || '',
    role: params.get('role') || '',
    sharedUid: params.get('sharedUid') || ''
  };
}

/**
 * Initialize the editor engine
 */
export async function initializeEditorEngine() {
  console.log('[MSC Nexus Editor] Initializing editor engine...');
  
  try {
    // Parse user context from query parameters
    currentUser = parseUserContext();
    
    if (!currentUser.sharedUid) {
      throw new Error('User context not available. Please log in through the MSC Nexus wrapper.');
    }
    
    console.log('[MSC Nexus Editor] User context:', {
      email: currentUser.email,
      role: currentUser.role,
      sharedUid: currentUser.sharedUid
    });
    
    // Get the main editor root element
    const editorRoot = document.getElementById('msc-editor-root');
    if (!editorRoot) {
      throw new Error('Editor root element not found');
    }

    // Remove loading indicator
    const loadingElement = document.getElementById('msc-loading');
    if (loadingElement) {
      loadingElement.remove();
    }

    // Create engine container
    engineContainer = document.createElement('div');
    engineContainer.id = 'msc-engine-container';
    editorRoot.appendChild(engineContainer);

    // Create editor interface
    createEditorInterface();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

    engineInitialized = true;
    console.log('[MSC Nexus Editor] Engine initialization complete');
    
    return true;
  } catch (error) {
    console.error('[MSC Nexus Editor] Failed to initialize engine:', error);
    showErrorState(error.message);
    return false;
  }
}

/**
 * Create the editor interface
 */
function createEditorInterface() {
  if (!engineContainer) return;

  engineContainer.innerHTML = `
    <div class="msc-editor-container" style="
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--msc-surface);
    ">
      <!-- Editor Toolbar -->
      <div class="msc-editor-toolbar" style="
        padding: 12px 16px;
        border-bottom: 1px solid var(--msc-border);
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
      ">
        <button id="msc-save-btn" class="msc-btn-primary" style="
          padding: 8px 16px;
          background: var(--msc-primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        ">
          💾 Save
        </button>
        <span id="msc-save-status" style="
          font-size: 13px;
          color: var(--msc-text-tertiary);
        "></span>
        <div id="msc-readonly-badge" style="
          display: none;
          margin-left: auto;
          padding: 6px 12px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        ">
          🔒 Read-only mode
        </div>
      </div>
      
      <!-- Editor Content Area -->
      <div class="msc-editor-content" style="
        flex: 1;
        overflow: auto;
        padding: 24px;
      ">
        <div id="msc-editor-welcome" style="
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          padding: 48px 24px;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
          <h2 style="color: var(--msc-text-primary); margin-bottom: 12px;">
            Welcome to MSC Nexus Editor
          </h2>
          <p style="color: var(--msc-text-secondary); line-height: 1.6;">
            Select a document from the sidebar to start editing, or create a new document.
          </p>
        </div>
        
        <textarea id="msc-editor-textarea" style="
          display: none;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          min-height: 500px;
          padding: 24px;
          border: 1px solid var(--msc-border);
          border-radius: 8px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          background: white;
        "></textarea>
      </div>
    </div>
  `;
  
  // Get references to elements
  editorTextarea = document.getElementById('msc-editor-textarea');
  saveButton = document.getElementById('msc-save-btn');
  
  // Set up save button handler
  if (saveButton) {
    saveButton.addEventListener('click', handleSave);
  }
  
  // Track changes
  if (editorTextarea) {
    editorTextarea.addEventListener('input', () => {
      unsavedChanges = true;
      updateSaveStatus('Unsaved changes');
    });
  }
}

/**
 * Load and display a document
 * @param {string} documentId - Document ID to load
 */
export async function loadDocument(documentId) {
  try {
    if (!currentUser || !currentUser.sharedUid) {
      throw new Error('User not authenticated');
    }
    
    updateSaveStatus('Loading document...');
    
    // Load document from Firestore
    const document = await getDocument(documentId);
    currentDocument = document;
    
    // Load folder to check permissions
    currentFolder = await getFolder(document.folderId);
    
    // Check if user can edit
    isReadOnly = !canEditDocument(document, currentFolder, currentUser.sharedUid, currentUser.role);
    
    // Show editor UI
    const welcomeDiv = document.getElementById('msc-editor-welcome');
    if (welcomeDiv) {
      welcomeDiv.style.display = 'none';
    }
    
    if (editorTextarea) {
      editorTextarea.style.display = 'block';
      editorTextarea.value = document.content || '';
      editorTextarea.readOnly = isReadOnly;
    }
    
    // Update toolbar
    const readonlyBadge = document.getElementById('msc-readonly-badge');
    if (readonlyBadge) {
      readonlyBadge.style.display = isReadOnly ? 'block' : 'none';
    }
    
    if (saveButton) {
      saveButton.disabled = isReadOnly;
      saveButton.style.opacity = isReadOnly ? '0.5' : '1';
      saveButton.style.cursor = isReadOnly ? 'not-allowed' : 'pointer';
    }
    
    unsavedChanges = false;
    updateSaveStatus(isReadOnly ? 'Read-only mode' : 'Ready');
    
    console.log('[MSC Nexus Editor] Document loaded:', documentId);
  } catch (error) {
    console.error('[MSC Nexus Editor] Failed to load document:', error);
    updateSaveStatus('Error: ' + error.message);
    alert('Failed to load document: ' + error.message);
  }
}

/**
 * Handle save button click
 */
async function handleSave() {
  if (!currentDocument || !editorTextarea || isReadOnly) {
    return;
  }
  
  try {
    saveButton.disabled = true;
    updateSaveStatus('Saving...');
    
    const newContent = editorTextarea.value;
    await updateDocumentContent(currentDocument.id, newContent);
    
    // Update local state
    currentDocument.content = newContent;
    unsavedChanges = false;
    
    updateSaveStatus('Saved successfully');
    
    // Clear status after 2 seconds
    setTimeout(() => {
      if (!unsavedChanges) {
        updateSaveStatus('Ready');
      }
    }, 2000);
    
    console.log('[MSC Nexus Editor] Document saved:', currentDocument.id);
  } catch (error) {
    console.error('[MSC Nexus Editor] Failed to save document:', error);
    updateSaveStatus('Error: ' + error.message);
    alert('Failed to save document: ' + error.message);
  } finally {
    saveButton.disabled = false;
  }
}

/**
 * Update save status message
 */
function updateSaveStatus(message) {
  const statusElement = document.getElementById('msc-save-status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!isReadOnly && unsavedChanges) {
        handleSave();
      }
    }
  });
}

/**
 * Show error state in the editor
 */
function showErrorState(message) {
  const editorRoot = document.getElementById('msc-editor-root');
  if (!editorRoot) return;

  editorRoot.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 32px;">
      <div style="text-align: center; max-width: 500px;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h2 style="color: var(--msc-error); margin-bottom: 12px;">
          Failed to Initialize Editor
        </h2>
        <p style="color: var(--msc-text-secondary);">
          ${message}
        </p>
      </div>
    </div>
  `;
}

/**
 * Get current user context
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Get engine container element
 */
export function getEngineContainer() {
  return engineContainer;
}

/**
 * Check if engine is initialized
 */
export function isEngineInitialized() {
  return engineInitialized;
}

/**
 * Get current document
 */
export function getCurrentDocument() {
  return currentDocument;
}

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEditorEngine);
} else {
  initializeEditorEngine();
}

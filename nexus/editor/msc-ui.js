/**
 * MSC Nexus Editor - UI Wiring and Behavior with Firestore Integration
 * 
 * This module handles the user interface components including
 * topbar, sidebar, menus, and other UI interactions backed by Firestore.
 */

import { initializeEditorEngine, isEngineInitialized, loadDocument, getCurrentUser } from './editor.js';
import {
  loadWorkspaces,
  loadFolders,
  loadDocuments,
  loadAllDocuments,
  createFolder,
  createDocument
} from './firestore-service.js';

// UI state
const uiState = {
  sidebarOpen: true,
  currentDocument: null,
  userMenuOpen: false,
  workspaces: [],
  folders: {},
  documents: {},
  allDocuments: [],
  searchQuery: ''
};

/**
 * Initialize MSC Nexus UI components
 */
export async function initializeMscUi() {
  console.log('[MSC Nexus UI] Initializing UI components...');

  try {
    // Initialize UI components
    initializeTopbar();
    initializeUserMenu();
    
    // Set up event listeners
    setupEventListeners();
    
    // Wait for editor engine to be ready
    if (!isEngineInitialized()) {
      console.log('[MSC Nexus UI] Waiting for editor engine...');
      // Wait a bit for editor to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Load data from Firestore
    await loadDataFromFirestore();
    
    // Initialize sidebar with loaded data
    initializeSidebar();

    console.log('[MSC Nexus UI] UI initialization complete');
  } catch (error) {
    console.error('[MSC Nexus UI] Failed to initialize UI:', error);
    alert('Failed to load editor data: ' + error.message);
  }
}

/**
 * Load all data from Firestore
 */
async function loadDataFromFirestore() {
  try {
    console.log('[MSC Nexus UI] Loading data from Firestore...');
    
    // Load workspaces
    uiState.workspaces = await loadWorkspaces();
    console.log('[MSC Nexus UI] Loaded workspaces:', uiState.workspaces.length);
    
    // Load folders for each workspace
    for (const workspace of uiState.workspaces) {
      const folders = await loadFolders(workspace.id);
      uiState.folders[workspace.id] = folders;
      
      // Load documents for each folder
      for (const folder of folders) {
        const documents = await loadDocuments(folder.id);
        uiState.documents[folder.id] = documents;
      }
    }
    
    // Load all documents for search
    uiState.allDocuments = await loadAllDocuments();
    
    console.log('[MSC Nexus UI] Data loaded from Firestore');
  } catch (error) {
    console.error('[MSC Nexus UI] Error loading from Firestore:', error);
    throw error;
  }
}

/**
 * Initialize topbar components
 */
function initializeTopbar() {
  const topbar = document.getElementById('msc-topbar');
  if (!topbar) return;

  // Add search bar to topbar center
  const topbarCenter = document.querySelector('.msc-topbar-center');
  if (topbarCenter) {
    topbarCenter.innerHTML = `
      <div style="position: relative; width: 100%; max-width: 500px;">
        <input 
          type="text" 
          id="msc-search-input" 
          placeholder="Search documents, folders, workspaces..."
          style="
            width: 100%;
            padding: 8px 36px 8px 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.15);
            color: white;
            font-size: 14px;
          "
        />
        <span style="
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
        ">🔍</span>
      </div>
      <div id="msc-search-results" style="
        display: none;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 400px;
        overflow-y: auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
      "></div>
    `;
    
    // Set up search handler
    const searchInput = document.getElementById('msc-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
      searchInput.addEventListener('focus', handleSearch);
      
      // Close search results when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.msc-topbar-center')) {
          const searchResults = document.getElementById('msc-search-results');
          if (searchResults) {
            searchResults.style.display = 'none';
          }
        }
      });
    }
  }

  topbar.style.display = 'flex';
}

/**
 * Handle search input
 */
function handleSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  const searchResults = document.getElementById('msc-search-results');
  
  if (!searchResults) return;
  
  if (query.length < 2) {
    searchResults.style.display = 'none';
    return;
  }
  
  // Search across workspaces, folders, and documents
  const results = [];
  
  // Search workspaces
  for (const workspace of uiState.workspaces) {
    if (workspace.name.toLowerCase().includes(query)) {
      results.push({
        type: 'workspace',
        workspace: workspace,
        text: workspace.name,
        path: workspace.name
      });
    }
  }
  
  // Search folders
  for (const workspaceId in uiState.folders) {
    const workspace = uiState.workspaces.find(w => w.id === workspaceId);
    for (const folder of uiState.folders[workspaceId]) {
      if (folder.name.toLowerCase().includes(query)) {
        results.push({
          type: 'folder',
          workspace: workspace,
          folder: folder,
          text: folder.name,
          path: `${workspace?.name || 'Unknown'} / ${folder.name}`
        });
      }
    }
  }
  
  // Search documents (title and content)
  for (const doc of uiState.allDocuments) {
    const titleMatch = doc.title.toLowerCase().includes(query);
    const contentMatch = doc.content && doc.content.toLowerCase().includes(query);
    
    if (titleMatch || contentMatch) {
      // Find workspace and folder
      const workspace = uiState.workspaces.find(w => w.id === doc.workspaceId);
      let folder = null;
      if (workspace && uiState.folders[workspace.id]) {
        folder = uiState.folders[workspace.id].find(f => f.id === doc.folderId);
      }
      
      results.push({
        type: 'document',
        workspace: workspace,
        folder: folder,
        document: doc,
        text: doc.title,
        path: `${workspace?.name || 'Unknown'} / ${folder?.name || 'Unknown'} / ${doc.title}`,
        matchType: titleMatch ? 'title' : 'content'
      });
    }
  }
  
  // Display results
  if (results.length === 0) {
    searchResults.innerHTML = `
      <div style="padding: 16px; color: var(--msc-text-tertiary); text-align: center;">
        No results found for "${query}"
      </div>
    `;
  } else {
    searchResults.innerHTML = results.slice(0, 20).map(result => `
      <div class="msc-search-result" data-type="${result.type}" 
           data-id="${result.document?.id || result.folder?.id || result.workspace?.id}"
           data-workspace-id="${result.workspace?.id || ''}"
           data-folder-id="${result.folder?.id || ''}"
           style="
             padding: 12px 16px;
             border-bottom: 1px solid var(--msc-border);
             cursor: pointer;
             transition: background 0.2s;
           ">
        <div style="font-size: 12px; color: var(--msc-text-tertiary); margin-bottom: 4px;">
          ${result.path}
        </div>
        <div style="color: var(--msc-text-primary); font-weight: 500;">
          ${result.type === 'workspace' ? '📁' : result.type === 'folder' ? '📂' : '📄'} ${result.text}
        </div>
        ${result.matchType === 'content' ? '<div style="font-size: 11px; color: var(--msc-text-tertiary); margin-top: 4px;">Match in content</div>' : ''}
      </div>
    `).join('');
    
    // Add click handlers to results
    document.querySelectorAll('.msc-search-result').forEach(resultEl => {
      resultEl.addEventListener('click', () => {
        const type = resultEl.dataset.type;
        const id = resultEl.dataset.id;
        
        if (type === 'document') {
          loadDocument(id);
          searchResults.style.display = 'none';
        }
      });
      
      resultEl.addEventListener('mouseenter', (e) => {
        e.target.style.background = 'var(--msc-hover)';
      });
      
      resultEl.addEventListener('mouseleave', (e) => {
        e.target.style.background = 'transparent';
      });
    });
  }
  
  searchResults.style.display = 'block';
}

/**
 * Initialize sidebar components
 */
function initializeSidebar() {
  const sidebar = document.getElementById('msc-sidebar');
  if (!sidebar) return;

  // Create sidebar navigation structure
  const sidebarNav = sidebar.querySelector('.msc-sidebar-nav');
  if (!sidebarNav) return;

  // Build sidebar tree from Firestore data
  let sidebarHtml = '';
  
  for (const workspace of uiState.workspaces) {
    const folders = uiState.folders[workspace.id] || [];
    
    sidebarHtml += `
      <div class="msc-sidebar-section">
        <div class="msc-workspace-header" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin-bottom: 4px;
          font-weight: 600;
          color: var(--msc-text-primary);
        ">
          <span>📁 ${workspace.name}</span>
          <button class="msc-add-folder-btn" data-workspace-id="${workspace.id}" style="
            background: none;
            border: none;
            color: var(--msc-primary);
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            width: 24px;
            height: 24px;
          " title="Add folder">➕</button>
        </div>
        <div class="msc-folders-container">
    `;
    
    if (folders.length === 0) {
      sidebarHtml += `
        <div class="msc-empty-message" style="
          padding: 8px 12px;
          color: var(--msc-text-tertiary);
          font-style: italic;
          font-size: 13px;
        ">
          No folders yet
        </div>
      `;
    } else {
      for (const folder of folders) {
        const documents = uiState.documents[folder.id] || [];
        
        sidebarHtml += `
          <div class="msc-folder" style="margin-bottom: 8px;">
            <div class="msc-folder-header" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 6px 12px;
              cursor: pointer;
              border-radius: 6px;
              transition: background 0.2s;
            ">
              <span style="font-weight: 500; color: var(--msc-text-primary);">
                📂 ${folder.name}
              </span>
              <button class="msc-add-document-btn" data-folder-id="${folder.id}" data-workspace-id="${workspace.id}" style="
                background: none;
                border: none;
                color: var(--msc-primary);
                cursor: pointer;
                font-size: 14px;
                padding: 0;
              " title="Add document">➕</button>
            </div>
            <div class="msc-documents-list" style="padding-left: 24px;">
        `;
        
        if (documents.length === 0) {
          sidebarHtml += `
            <div class="msc-empty-message" style="
              padding: 4px 12px;
              color: var(--msc-text-tertiary);
              font-style: italic;
              font-size: 12px;
            ">
              No documents
            </div>
          `;
        } else {
          for (const doc of documents) {
            sidebarHtml += `
              <div class="msc-document-item" data-document-id="${doc.id}" style="
                padding: 6px 12px;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
                font-size: 14px;
              ">
                📄 ${doc.title}
              </div>
            `;
          }
        }
        
        sidebarHtml += `
            </div>
          </div>
        `;
      }
    }
    
    sidebarHtml += `
        </div>
      </div>
    `;
  }
  
  if (uiState.workspaces.length === 0) {
    sidebarHtml = `
      <div style="padding: 24px; text-align: center; color: var(--msc-text-tertiary);">
        <div style="font-size: 48px; margin-bottom: 12px;">📁</div>
        <p>No workspaces available</p>
        <p style="font-size: 12px; margin-top: 8px;">Contact an administrator to create workspaces</p>
      </div>
    `;
  }
  
  sidebarNav.innerHTML = sidebarHtml;

  // Add sidebar item styles
  addSidebarStyles();
  
  // Set up event handlers
  setupSidebarHandlers();
}

/**
 * Add styles for sidebar navigation items
 */
function addSidebarStyles() {
  const existingStyle = document.getElementById('msc-sidebar-styles');
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = 'msc-sidebar-styles';
  style.textContent = `
    .msc-sidebar-section {
      margin-bottom: 24px;
    }

    .msc-folder-header:hover {
      background: rgba(102, 126, 234, 0.08);
    }

    .msc-document-item:hover {
      background: rgba(102, 126, 234, 0.08);
    }

    .msc-document-item.active {
      background: rgba(102, 126, 234, 0.12);
      font-weight: 500;
    }
    
    .msc-add-folder-btn:hover,
    .msc-add-document-btn:hover {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Set up sidebar event handlers
 */
function setupSidebarHandlers() {
  // Document click handlers
  document.querySelectorAll('.msc-document-item').forEach(item => {
    item.addEventListener('click', async () => {
      const documentId = item.dataset.documentId;
      
      // Remove active class from all items
      document.querySelectorAll('.msc-document-item').forEach(el => {
        el.classList.remove('active');
      });
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Load document
      await loadDocument(documentId);
    });
  });
  
  // Add folder button handlers
  document.querySelectorAll('.msc-add-folder-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const workspaceId = btn.dataset.workspaceId;
      showCreateFolderDialog(workspaceId);
    });
  });
  
  // Add document button handlers
  document.querySelectorAll('.msc-add-document-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderId = btn.dataset.folderId;
      const workspaceId = btn.dataset.workspaceId;
      showCreateDocumentDialog(folderId, workspaceId);
    });
  });
}

/**
 * Show create folder dialog
 */
function showCreateFolderDialog(workspaceId) {
  const folderName = prompt('Enter folder name:');
  
  if (!folderName || !folderName.trim()) {
    return;
  }
  
  const user = getCurrentUser();
  if (!user || !user.sharedUid) {
    alert('User not authenticated');
    return;
  }
  
  createFolder(folderName.trim(), workspaceId, user.sharedUid)
    .then(() => {
      alert('Folder created successfully');
      // Reload data and UI
      return loadDataFromFirestore();
    })
    .then(() => {
      initializeSidebar();
    })
    .catch(error => {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + error.message);
    });
}

/**
 * Show create document dialog
 */
function showCreateDocumentDialog(folderId, workspaceId) {
  const documentTitle = prompt('Enter document title:');
  
  if (!documentTitle || !documentTitle.trim()) {
    return;
  }
  
  const user = getCurrentUser();
  if (!user || !user.sharedUid) {
    alert('User not authenticated');
    return;
  }
  
  createDocument(documentTitle.trim(), folderId, workspaceId, user.sharedUid, 'New empty document.')
    .then((docId) => {
      alert('Document created successfully');
      // Reload data and UI
      return loadDataFromFirestore();
    })
    .then(() => {
      initializeSidebar();
    })
    .catch(error => {
      console.error('Error creating document:', error);
      alert('Failed to create document: ' + error.message);
    });
}

/**
 * Initialize user menu
 */
function initializeUserMenu() {
  const userMenu = document.getElementById('msc-user-menu');
  if (!userMenu) return;

  const user = getCurrentUser();
  const initials = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  userMenu.innerHTML = `
    <div class="msc-user-avatar" style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--msc-primary), var(--msc-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    ">
      ${initials}
    </div>
  `;
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
  // Sidebar toggle for mobile
  setupMobileSidebarToggle();
  
  // User menu clicks
  setupUserMenuHandlers();
}

/**
 * Setup mobile sidebar toggle
 */
function setupMobileSidebarToggle() {
  if (window.innerWidth <= 768) {
    const topbarLeft = document.querySelector('.msc-topbar-left');
    if (topbarLeft) {
      const hamburger = document.createElement('button');
      hamburger.className = 'msc-hamburger';
      hamburger.innerHTML = '☰';
      hamburger.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        margin-right: 8px;
      `;
      hamburger.addEventListener('click', toggleSidebar);
      topbarLeft.insertBefore(hamburger, topbarLeft.firstChild);
    }
  }
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  const sidebar = document.getElementById('msc-sidebar');
  if (!sidebar) return;

  uiState.sidebarOpen = !uiState.sidebarOpen;
  sidebar.classList.toggle('is-open', uiState.sidebarOpen);
}

/**
 * Setup user menu handlers
 */
function setupUserMenuHandlers() {
  const userAvatar = document.querySelector('.msc-user-avatar');
  if (!userAvatar) return;

  userAvatar.addEventListener('click', () => {
    console.log('[MSC Nexus UI] User menu clicked');
  });
}

// Initialize UI when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMscUi);
} else {
  initializeMscUi();
}

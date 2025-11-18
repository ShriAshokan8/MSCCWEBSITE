/**
 * MSC Nexus Editor - UI Wiring and Behavior
 * 
 * This module handles the user interface components including
 * topbar, sidebar, menus, and other UI interactions.
 */

import { initializeEditorEngine, isEngineInitialized } from './editor.js';

// UI state
const uiState = {
  sidebarOpen: true,
  currentDocument: null,
  userMenuOpen: false
};

/**
 * Initialize MSC Nexus UI components
 */
export async function initializeMscUi() {
  console.log('[MSC Nexus UI] Initializing UI components...');

  try {
    // Initialize UI components
    initializeTopbar();
    initializeSidebar();
    initializeUserMenu();
    
    // Set up event listeners
    setupEventListeners();
    
    // Wait for editor engine to be ready
    if (!isEngineInitialized()) {
      console.log('[MSC Nexus UI] Waiting for editor engine...');
      // Engine initialization is handled by editor.js
    }

    console.log('[MSC Nexus UI] UI initialization complete');
  } catch (error) {
    console.error('[MSC Nexus UI] Failed to initialize UI:', error);
  }
}

/**
 * Initialize topbar components
 */
function initializeTopbar() {
  const topbar = document.getElementById('msc-topbar');
  if (!topbar) return;

  // Add topbar functionality here
  // For now, just ensure it's visible
  topbar.style.display = 'flex';
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

  // Add placeholder navigation items
  sidebarNav.innerHTML = `
    <div class="msc-sidebar-section">
      <h3 style="font-size: 12px; font-weight: 600; color: var(--msc-text-tertiary); 
                  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding: 0 8px;">
        Workspace
      </h3>
      <nav class="msc-nav-items">
        <div class="msc-nav-item" data-nav="documents">
          <span class="msc-nav-icon">📄</span>
          <span class="msc-nav-label">Documents</span>
        </div>
        <div class="msc-nav-item" data-nav="recent">
          <span class="msc-nav-icon">🕐</span>
          <span class="msc-nav-label">Recent</span>
        </div>
        <div class="msc-nav-item" data-nav="starred">
          <span class="msc-nav-icon">⭐</span>
          <span class="msc-nav-label">Starred</span>
        </div>
      </nav>
    </div>
    
    <div class="msc-sidebar-section" style="margin-top: 24px;">
      <h3 style="font-size: 12px; font-weight: 600; color: var(--msc-text-tertiary); 
                  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding: 0 8px;">
        Projects
      </h3>
      <nav class="msc-nav-items">
        <!-- Project list will be populated dynamically -->
        <div class="msc-nav-item msc-nav-placeholder">
          <span class="msc-nav-label" style="color: var(--msc-text-tertiary); font-style: italic;">
            No projects yet
          </span>
        </div>
      </nav>
    </div>
  `;

  // Add sidebar item styles
  addSidebarStyles();
}

/**
 * Add styles for sidebar navigation items
 */
function addSidebarStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .msc-sidebar-section {
      margin-bottom: 16px;
    }

    .msc-nav-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .msc-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s ease;
      user-select: none;
    }

    .msc-nav-item:hover {
      background: rgba(102, 126, 234, 0.08);
    }

    .msc-nav-item.active {
      background: rgba(102, 126, 234, 0.12);
      font-weight: 500;
    }

    .msc-nav-item.msc-nav-placeholder {
      cursor: default;
      opacity: 0.6;
    }

    .msc-nav-item.msc-nav-placeholder:hover {
      background: transparent;
    }

    .msc-nav-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    .msc-nav-label {
      font-size: 14px;
      color: var(--msc-text-primary);
      flex: 1;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize user menu
 */
function initializeUserMenu() {
  const userMenu = document.getElementById('msc-user-menu');
  if (!userMenu) return;

  // Add user menu placeholder
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
      U
    </div>
  `;
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
  // Sidebar toggle for mobile
  setupMobileSidebarToggle();
  
  // Navigation item clicks
  setupNavigationHandlers();
  
  // User menu clicks
  setupUserMenuHandlers();
}

/**
 * Setup mobile sidebar toggle
 */
function setupMobileSidebarToggle() {
  // Add hamburger menu for mobile if needed
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
 * Setup navigation item handlers
 */
function setupNavigationHandlers() {
  document.addEventListener('click', (event) => {
    const navItem = event.target.closest('.msc-nav-item:not(.msc-nav-placeholder)');
    if (!navItem) return;

    // Remove active class from all items
    document.querySelectorAll('.msc-nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to clicked item
    navItem.classList.add('active');

    // Handle navigation
    const navType = navItem.dataset.nav;
    handleNavigation(navType);
  });
}

/**
 * Handle navigation actions
 */
function handleNavigation(navType) {
  console.log(`[MSC Nexus UI] Navigating to: ${navType}`);
  // TODO: Implement navigation logic in future steps
}

/**
 * Setup user menu handlers
 */
function setupUserMenuHandlers() {
  const userAvatar = document.querySelector('.msc-user-avatar');
  if (!userAvatar) return;

  userAvatar.addEventListener('click', () => {
    // TODO: Implement user menu dropdown in future steps
    console.log('[MSC Nexus UI] User menu clicked');
  });
}

/**
 * Update sidebar with projects
 */
export function updateProjects(projects) {
  const projectsContainer = document.querySelector('.msc-sidebar-section:last-child .msc-nav-items');
  if (!projectsContainer || !projects || projects.length === 0) return;

  projectsContainer.innerHTML = projects.map(project => `
    <div class="msc-nav-item" data-project-id="${project.id}">
      <span class="msc-nav-icon">${project.icon || '📁'}</span>
      <span class="msc-nav-label">${project.name}</span>
    </div>
  `).join('');
}

/**
 * Update current document title
 */
export function updateDocumentTitle(title) {
  uiState.currentDocument = title;
  const topbarCenter = document.querySelector('.msc-topbar-center');
  if (topbarCenter) {
    topbarCenter.innerHTML = `
      <span style="color: rgba(255, 255, 255, 0.9); font-size: 14px;">
        ${title}
      </span>
    `;
  }
}

// Initialize UI when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMscUi);
} else {
  initializeMscUi();
}

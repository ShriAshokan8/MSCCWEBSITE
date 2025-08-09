/**
 * MSC Initiative Navigation Module
 * Self-contained IIFE for accessible navigation functionality
 */
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    selectors: {
      toggle: '[data-nav-toggle]',
      panel: '[data-nav]',
      links: '[data-nav] a',
      allLinks: 'a[href^="/"], a[href^="./"], a[href^="../"]',
      body: 'body',
      html: 'html',
      themeToggle: '.theme-toggle',
      focusableElements: 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      // New selectors for tabbed navigation
      tabletMoreToggle: '.tablet-more-toggle',
      tabletMoreDropdown: '.tablet-more-dropdown',
      mobileMoreToggle: '.mobile-more-toggle',
      mobileMoreDropdown: '.mobile-more-dropdown'
    },
    attributes: {
      expanded: 'aria-expanded',
      current: 'aria-current',
      hidden: 'hidden',
      dataTheme: 'data-theme',
      ariaPressed: 'aria-pressed'
    },
    classes: {
      scrollLock: 'scroll-lock',
      active: 'active'
    },
    keys: {
      ESCAPE: 'Escape',
      TAB: 'Tab'
    },
    storage: {
      themeKey: 'theme'
    },
    themes: {
      LIGHT: 'light',
      DARK: 'dark',
      SYSTEM: 'system'
    }
  };
  
  // State
  let state = {
    isOpen: false,
    reducedMotion: false,
    focusableElements: [],
    lastFocusedElement: null,
    currentTheme: CONFIG.themes.SYSTEM,
    systemPrefersDark: false,
    // New state for dropdown menus
    tabletMoreOpen: false,
    mobileMoreOpen: false
  };
  
  // DOM references
  let elements = {
    toggle: null,
    panel: null,
    body: null,
    html: null,
    links: [],
    // New DOM references for tabbed navigation
    tabletMoreToggle: null,
    tabletMoreDropdown: null,
    mobileMoreToggle: null,
    mobileMoreDropdown: null
  };
  
  /**
   * Initialize the navigation module
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Check for reduced motion preference
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Get DOM elements
    elements.toggle = document.querySelector(CONFIG.selectors.toggle);
    elements.panel = document.querySelector(CONFIG.selectors.panel);
    elements.body = document.querySelector(CONFIG.selectors.body);
    elements.html = document.querySelector(CONFIG.selectors.html);
    elements.links = Array.from(document.querySelectorAll(CONFIG.selectors.links));
    
    // Get new tabbed navigation elements
    elements.tabletMoreToggle = document.querySelector(CONFIG.selectors.tabletMoreToggle);
    elements.tabletMoreDropdown = document.querySelector(CONFIG.selectors.tabletMoreDropdown);
    elements.mobileMoreToggle = document.querySelector(CONFIG.selectors.mobileMoreToggle);
    elements.mobileMoreDropdown = document.querySelector(CONFIG.selectors.mobileMoreDropdown);
    
    // Initialize theme system
    initThemeSystem();
    
    // Setup navigation if elements exist
    if (elements.toggle && elements.panel) {
      setupToggleButton();
      setupPanel();
      setupEventListeners();
    } else {
      console.warn('Navigation: Toggle or panel elements not found');
    }
    
    // Setup tabbed navigation dropdowns
    setupTabbedNavigation();
    
    // These always run
    setCurrentPage();
    setupLinkPrefetch();
    
    console.log('Navigation module initialized');
  }
  
  /**
   * Initialize theme system - Automatic system preference detection only
   */
  function initThemeSystem() {
    // Detect system preference
    state.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme based on system preference
    state.currentTheme = state.systemPrefersDark ? CONFIG.themes.DARK : CONFIG.themes.LIGHT;
    
    // Apply initial theme
    applyTheme();
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      state.systemPrefersDark = e.matches;
      state.currentTheme = state.systemPrefersDark ? CONFIG.themes.DARK : CONFIG.themes.LIGHT;
      applyTheme();
    });
    
    console.log('Theme system initialized with automatic detection:', state.currentTheme);
  }

  /**
   * Apply the current theme - Automatic system detection
   */
  function applyTheme() {
    if (!elements.html) return;
    
    // Apply theme based on current system preference
    elements.html.setAttribute(CONFIG.attributes.dataTheme, state.currentTheme);
  }

  /**
   * Setup toggle button attributes and initial state
   */
  function setupToggleButton() {
    // Ensure proper ARIA attributes
    elements.toggle.setAttribute(CONFIG.attributes.expanded, 'false');
    elements.toggle.setAttribute('aria-controls', elements.panel.id || 'navigation-panel');
    
    // Set ID on panel if not present
    if (!elements.panel.id) {
      elements.panel.id = 'navigation-panel';
    }
    
    // Add spans for hamburger if not present
    if (elements.toggle.children.length === 0) {
      for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.setAttribute('aria-hidden', 'true');
        elements.toggle.appendChild(span);
      }
    }
  }
  
  /**
   * Setup navigation panel
   */
  function setupPanel() {
    // Ensure panel is hidden initially
    elements.panel.setAttribute(CONFIG.attributes.hidden, '');
    
    // Get focusable elements within panel
    updateFocusableElements();
    
    // Add focus trap elements
    addFocusTrap();
  }
  
  /**
   * Add invisible focus trap elements
   */
  function addFocusTrap() {
    const startTrap = document.createElement('div');
    startTrap.className = 'focus-trap-start';
    startTrap.tabIndex = 0;
    startTrap.setAttribute('aria-hidden', 'true');
    
    const endTrap = document.createElement('div');
    endTrap.className = 'focus-trap-end';
    endTrap.tabIndex = 0;
    endTrap.setAttribute('aria-hidden', 'true');
    
    elements.panel.insertBefore(startTrap, elements.panel.firstChild);
    elements.panel.appendChild(endTrap);
    
    // Handle focus wrapping
    startTrap.addEventListener('focus', () => {
      if (state.focusableElements.length > 0) {
        state.focusableElements[state.focusableElements.length - 1].focus();
      }
    });
    
    endTrap.addEventListener('focus', () => {
      if (state.focusableElements.length > 0) {
        state.focusableElements[0].focus();
      }
    });
  }
  
  /**
   * Update list of focusable elements within panel
   */
  function updateFocusableElements() {
    state.focusableElements = Array.from(
      elements.panel.querySelectorAll(CONFIG.selectors.focusableElements)
    ).filter(el => !el.hasAttribute('disabled') && !el.classList.contains('focus-trap-start') && !el.classList.contains('focus-trap-end'));
  }
  
  /**
   * Setup tabbed navigation dropdowns
   */
  function setupTabbedNavigation() {
    // Setup tablet more dropdown
    if (elements.tabletMoreToggle && elements.tabletMoreDropdown) {
      elements.tabletMoreToggle.addEventListener('click', handleTabletMoreToggle);
      elements.tabletMoreToggle.addEventListener('keydown', handleDropdownKeydown);
    }
    
    // Setup mobile more dropdown
    if (elements.mobileMoreToggle && elements.mobileMoreDropdown) {
      elements.mobileMoreToggle.addEventListener('click', handleMobileMoreToggle);
      elements.mobileMoreToggle.addEventListener('keydown', handleDropdownKeydown);
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', handleDropdownOutsideClick);
    
    // Close dropdowns on escape key
    document.addEventListener('keydown', handleDropdownEscape);
  }
  
  /**
   * Handle tablet more dropdown toggle
   */
  function handleTabletMoreToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Close mobile dropdown if open
    if (state.mobileMoreOpen) {
      closeMobileMoreDropdown();
    }
    
    if (state.tabletMoreOpen) {
      closeTabletMoreDropdown();
    } else {
      openTabletMoreDropdown();
    }
  }
  
  /**
   * Handle mobile more dropdown toggle
   */
  function handleMobileMoreToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Close tablet dropdown if open
    if (state.tabletMoreOpen) {
      closeTabletMoreDropdown();
    }
    
    if (state.mobileMoreOpen) {
      closeMobileMoreDropdown();
    } else {
      openMobileMoreDropdown();
    }
  }
  
  /**
   * Handle dropdown keyboard events
   */
  function handleDropdownKeydown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      event.target.click();
    }
  }
  
  /**
   * Handle clicks outside dropdowns
   */
  function handleDropdownOutsideClick(event) {
    // Close tablet dropdown if clicking outside
    if (state.tabletMoreOpen && 
        elements.tabletMoreDropdown && 
        !elements.tabletMoreDropdown.contains(event.target)) {
      closeTabletMoreDropdown();
    }
    
    // Close mobile dropdown if clicking outside
    if (state.mobileMoreOpen && 
        elements.mobileMoreDropdown && 
        !elements.mobileMoreDropdown.contains(event.target)) {
      closeMobileMoreDropdown();
    }
  }
  
  /**
   * Handle escape key for dropdowns
   */
  function handleDropdownEscape(event) {
    if (event.key === CONFIG.keys.ESCAPE) {
      if (state.tabletMoreOpen) {
        closeTabletMoreDropdown();
        elements.tabletMoreToggle.focus();
      }
      if (state.mobileMoreOpen) {
        closeMobileMoreDropdown();
        elements.mobileMoreToggle.focus();
      }
    }
  }
  
  /**
   * Open tablet more dropdown
   */
  function openTabletMoreDropdown() {
    if (!elements.tabletMoreDropdown || state.tabletMoreOpen) return;
    
    state.tabletMoreOpen = true;
    elements.tabletMoreDropdown.classList.add(CONFIG.classes.active);
    elements.tabletMoreToggle.setAttribute(CONFIG.attributes.expanded, 'true');
    
    // Announce to screen readers
    announceToScreenReader('More navigation options expanded');
  }
  
  /**
   * Close tablet more dropdown
   */
  function closeTabletMoreDropdown() {
    if (!elements.tabletMoreDropdown || !state.tabletMoreOpen) return;
    
    state.tabletMoreOpen = false;
    elements.tabletMoreDropdown.classList.remove(CONFIG.classes.active);
    elements.tabletMoreToggle.setAttribute(CONFIG.attributes.expanded, 'false');
    
    // Announce to screen readers
    announceToScreenReader('More navigation options collapsed');
  }
  
  /**
   * Open mobile more dropdown
   */
  function openMobileMoreDropdown() {
    if (!elements.mobileMoreDropdown || state.mobileMoreOpen) return;
    
    state.mobileMoreOpen = true;
    elements.mobileMoreDropdown.classList.add(CONFIG.classes.active);
    elements.mobileMoreToggle.setAttribute(CONFIG.attributes.expanded, 'true');
    
    // Announce to screen readers
    announceToScreenReader('More navigation options expanded');
  }
  
  /**
   * Close mobile more dropdown
   */
  function closeMobileMoreDropdown() {
    if (!elements.mobileMoreDropdown || !state.mobileMoreOpen) return;
    
    state.mobileMoreOpen = false;
    elements.mobileMoreDropdown.classList.remove(CONFIG.classes.active);
    elements.mobileMoreToggle.setAttribute(CONFIG.attributes.expanded, 'false');
    
    // Announce to screen readers
    announceToScreenReader('More navigation options collapsed');
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Toggle button click
    elements.toggle.addEventListener('click', handleToggleClick);
    
    // Toggle button keyboard
    elements.toggle.addEventListener('keydown', handleToggleKeydown);
    
    // Panel link clicks
    elements.links.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });
    
    // Global keyboard events
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Click outside to close
    document.addEventListener('click', handleOutsideClick);
    
    // Handle reduced motion changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      state.reducedMotion = e.matches;
    });
    
    // Handle resize
    window.addEventListener('resize', debounce(handleResize, 250));
  }
  
  /**
   * Handle toggle button click
   */
  function handleToggleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (state.isOpen) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }
  
  /**
   * Handle toggle button keyboard events
   */
  function handleToggleKeydown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggleClick(event);
    }
  }
  
  /**
   * Handle navigation link clicks
   */
  function handleLinkClick(event) {
    // Close navigation on internal link click (mobile-friendly)
    if (state.isOpen && window.innerWidth <= 768) {
      closeNavigation();
    }
  }
  
  /**
   * Handle global keyboard events
   */
  function handleGlobalKeydown(event) {
    if (!state.isOpen) return;
    
    if (event.key === CONFIG.keys.ESCAPE) {
      event.preventDefault();
      closeNavigation();
      elements.toggle.focus();
    }
    
    // Trap focus within panel
    if (event.key === CONFIG.keys.TAB) {
      trapFocus(event);
    }
  }
  
  /**
   * Handle clicks outside navigation
   */
  function handleOutsideClick(event) {
    if (!state.isOpen) return;
    
    if (!elements.panel.contains(event.target) && !elements.toggle.contains(event.target)) {
      closeNavigation();
    }
  }
  
  /**
   * Handle window resize
   */
  function handleResize() {
    // Close mobile navigation if window becomes wide
    if (state.isOpen && window.innerWidth > 768) {
      closeNavigation();
    }
    
    // Close dropdowns on resize
    if (state.tabletMoreOpen) {
      closeTabletMoreDropdown();
    }
    if (state.mobileMoreOpen) {
      closeMobileMoreDropdown();
    }
  }
  
  /**
   * Open navigation panel
   */
  function openNavigation() {
    if (state.isOpen) return;
    
    state.isOpen = true;
    state.lastFocusedElement = document.activeElement;
    
    // Update attributes
    elements.toggle.setAttribute(CONFIG.attributes.expanded, 'true');
    elements.panel.removeAttribute(CONFIG.attributes.hidden);
    
    // Lock body scroll
    elements.body.classList.add(CONFIG.classes.scrollLock);
    
    // Update focusable elements
    updateFocusableElements();
    
    // Focus first element or toggle
    setTimeout(() => {
      if (state.focusableElements.length > 0) {
        state.focusableElements[0].focus();
      } else {
        elements.toggle.focus();
      }
    }, state.reducedMotion ? 0 : 100);
    
    // Announce to screen readers
    announceToScreenReader('Navigation menu opened');
  }
  
  /**
   * Close navigation panel
   */
  function closeNavigation() {
    if (!state.isOpen) return;
    
    state.isOpen = false;
    
    // Update attributes
    elements.toggle.setAttribute(CONFIG.attributes.expanded, 'false');
    elements.panel.setAttribute(CONFIG.attributes.hidden, '');
    
    // Unlock body scroll
    elements.body.classList.remove(CONFIG.classes.scrollLock);
    
    // Restore focus
    if (state.lastFocusedElement) {
      state.lastFocusedElement.focus();
      state.lastFocusedElement = null;
    }
    
    // Announce to screen readers
    announceToScreenReader('Navigation menu closed');
  }
  
  /**
   * Trap focus within navigation panel
   */
  function trapFocus(event) {
    if (state.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }
    
    const firstElement = state.focusableElements[0];
    const lastElement = state.focusableElements[state.focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /**
   * Set current page indicator
   */
  function setCurrentPage() {
    const currentPath = window.location.pathname;
    const allNavLinks = document.querySelectorAll('nav a, [data-nav] a');
    
    allNavLinks.forEach(link => {
      // Remove existing aria-current
      link.removeAttribute(CONFIG.attributes.current);
      
      // Get link path
      const linkPath = new URL(link.href, window.location.origin).pathname;
      
      // Normalize paths for comparison (handle both clean URLs and .html extensions)
      const normalizedCurrentPath = currentPath.replace(/\.html$/, '');
      const normalizedLinkPath = linkPath.replace(/\.html$/, '');
      
      // Check if this is the current page
      if (normalizedLinkPath === normalizedCurrentPath || 
          (normalizedCurrentPath === '/' && normalizedLinkPath === '/') ||
          (normalizedCurrentPath !== '/' && normalizedLinkPath !== '/' && normalizedCurrentPath.startsWith(normalizedLinkPath))) {
        link.setAttribute(CONFIG.attributes.current, 'page');
      }
    });
  }
  
  /**
   * Setup link prefetching for performance
   */
  function setupLinkPrefetch() {
    if (!('IntersectionObserver' in window) || state.reducedMotion) {
      return;
    }
    
    let prefetched = new Set();
    let prefetchTimeout;
    
    // Prefetch on hover with delay
    function prefetchLink(url) {
      if (prefetched.has(url)) return;
      
      prefetched.add(url);
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }
    
    // Add hover listeners to internal links
    document.querySelectorAll(CONFIG.selectors.allLinks).forEach(link => {
      if (link.hostname === window.location.hostname) {
        link.addEventListener('mouseenter', () => {
          clearTimeout(prefetchTimeout);
          prefetchTimeout = setTimeout(() => {
            prefetchLink(link.href);
          }, 100);
        });
        
        link.addEventListener('mouseleave', () => {
          clearTimeout(prefetchTimeout);
        });
      }
    });
  }
  
  /**
   * Announce message to screen readers
   */
  function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  /**
   * Debounce utility function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Public API
   */
  window.MSCNavigation = {
    // Navigation controls
    open: openNavigation,
    close: closeNavigation,
    toggle: () => state.isOpen ? closeNavigation() : openNavigation(),
    isOpen: () => state.isOpen,
    setCurrentPage: setCurrentPage,
    
    // Dropdown controls
    openTabletMore: openTabletMoreDropdown,
    closeTabletMore: closeTabletMoreDropdown,
    toggleTabletMore: () => state.tabletMoreOpen ? closeTabletMoreDropdown() : openTabletMoreDropdown(),
    isTabletMoreOpen: () => state.tabletMoreOpen,
    
    openMobileMore: openMobileMoreDropdown,
    closeMobileMore: closeMobileMoreDropdown,
    toggleMobileMore: () => state.mobileMoreOpen ? closeMobileMoreDropdown() : openMobileMoreDropdown(),
    isMobileMoreOpen: () => state.mobileMoreOpen,
    
    // Theme status (read-only)
    getTheme: () => state.currentTheme
  };
  
  // Initialize when script loads
  init();
  
})();
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
      focusableElements: 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      themeKey: 'msc-theme-preference'
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
    systemPrefersDark: false
  };
  
  // DOM references
  let elements = {
    toggle: null,
    panel: null,
    body: null,
    html: null,
    links: [],
    themeToggles: []
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
    elements.themeToggles = Array.from(document.querySelectorAll(CONFIG.selectors.themeToggle));
    
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
    
    // These always run
    setCurrentPage();
    setupLinkPrefetch();
    
    console.log('Navigation module initialized');
  }
  
  /**
   * Initialize theme system - User-controlled only (no auto mode)
   */
  function initThemeSystem() {
    // Load saved preference or default to light
    const savedTheme = localStorage.getItem(CONFIG.storage.themeKey);
    if (savedTheme && (savedTheme === CONFIG.themes.LIGHT || savedTheme === CONFIG.themes.DARK)) {
      state.currentTheme = savedTheme;
    } else {
      // Default to light theme
      state.currentTheme = CONFIG.themes.LIGHT;
    }
    
    // Apply initial theme
    applyTheme();
    
    // Setup theme toggle listeners
    elements.themeToggles.forEach(toggle => {
      toggle.addEventListener('click', handleThemeToggle);
      
      // Add keyboard support
      toggle.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          handleThemeToggle(event);
        }
      });
    });
    
    console.log('Theme system initialized:', state.currentTheme);
  }
  
  /**
   * Handle theme toggle button click - Simple light/dark toggle
   */
  function handleThemeToggle(event) {
    event.preventDefault();
    
    // Simple toggle between light and dark
    state.currentTheme = state.currentTheme === CONFIG.themes.LIGHT ? CONFIG.themes.DARK : CONFIG.themes.LIGHT;
    
    // Save preference
    localStorage.setItem(CONFIG.storage.themeKey, state.currentTheme);
    
    // Apply theme
    applyTheme();
    
    // Announce change to screen readers
    const themeText = getThemeDisplayText();
    announceToScreenReader(`Theme changed to ${themeText}`);
  }
  
  /**
   * Apply the current theme - User-controlled only
   */
  function applyTheme() {
    if (!elements.html) return;
    
    // Always set explicit theme (no system fallback)
    elements.html.setAttribute(CONFIG.attributes.dataTheme, state.currentTheme);
    
    // Update theme toggle buttons
    updateThemeToggleUI(state.currentTheme);
  }
  
  /**
   * Update theme toggle button appearance - Simple light/dark
   */
  function updateThemeToggleUI(actualTheme) {
    const themeText = getThemeDisplayText();
    const icon = actualTheme === CONFIG.themes.DARK ? '☀️' : '🌙';
    
    elements.themeToggles.forEach(toggle => {
      // Update button text and icon
      toggle.innerHTML = `${icon} ${themeText}`;
      
      // Update aria-pressed based on current theme
      const isPressed = actualTheme === CONFIG.themes.DARK;
      toggle.setAttribute(CONFIG.attributes.ariaPressed, isPressed.toString());
      
      // Update aria-label for accessibility
      toggle.setAttribute('aria-label', `Switch theme. Current: ${themeText}`);
    });
  }
  
  /**
   * Get human-readable theme text - Simple light/dark
   */
  function getThemeDisplayText() {
    switch (state.currentTheme) {
      case CONFIG.themes.LIGHT:
        return 'Light';
      case CONFIG.themes.DARK:
        return 'Dark';
      default:
        return 'Light';
    }
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
    
    // Theme controls
    getTheme: () => state.currentTheme,
    setTheme: (theme) => {
      if (Object.values(CONFIG.themes).includes(theme)) {
        state.currentTheme = theme;
        localStorage.setItem(CONFIG.storage.themeKey, theme);
        applyTheme();
      }
    },
    toggleTheme: () => handleThemeToggle({ preventDefault: () => {} })
  };
  
  // Initialize when script loads
  init();
  
})();
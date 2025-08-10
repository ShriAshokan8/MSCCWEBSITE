/**
 * MSC Initiative Navigation Module - Minimal Implementation
 * Handles active state detection and mobile scroll-to-active functionality
 */
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    selectors: {
      navLinks: '.desktop-nav a, .mobile-nav a',
      mobileNav: '.mobile-nav',
      navList: '.nav-list'
    },
    attributes: {
      current: 'aria-current'
    }
  };
  
  // State
  let reducedMotion = false;
  
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
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Setup navigation
    setActiveState();
    setupMobileScrollHints();
    scrollActiveIntoView();
    
    console.log('Navigation module initialized');
  }
  
  /**
   * Set active state based on current URL
   */
  function setActiveState() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(CONFIG.selectors.navLinks);
    
    navLinks.forEach(link => {
      // Remove existing aria-current
      link.removeAttribute(CONFIG.attributes.current);
      
      // Get link path
      const linkPath = new URL(link.href, window.location.origin).pathname;
      
      // Normalize paths for comparison (handle clean URLs)
      const normalizedCurrentPath = currentPath.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      const normalizedLinkPath = linkPath.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      
      // Check if this is the current page
      if (normalizedLinkPath === normalizedCurrentPath) {
        link.setAttribute(CONFIG.attributes.current, 'page');
      }
    });
  }
  
  /**
   * Setup mobile navigation scroll hints
   */
  function setupMobileScrollHints() {
    const mobileNav = document.querySelector(CONFIG.selectors.mobileNav);
    if (!mobileNav) return;
    
    function updateScrollHints() {
      const scrollLeft = mobileNav.scrollLeft;
      const scrollWidth = mobileNav.scrollWidth;
      const clientWidth = mobileNav.clientWidth;
      
      // Check if content is scrollable
      if (scrollWidth <= clientWidth) {
        mobileNav.classList.remove('scrollable-left', 'scrollable-right');
        return;
      }
      
      // Update left hint
      if (scrollLeft > 10) {
        mobileNav.classList.add('scrollable-left');
      } else {
        mobileNav.classList.remove('scrollable-left');
      }
      
      // Update right hint
      if (scrollLeft < scrollWidth - clientWidth - 10) {
        mobileNav.classList.add('scrollable-right');
      } else {
        mobileNav.classList.remove('scrollable-right');
      }
    }
    
    // Initial check
    updateScrollHints();
    
    // Update on scroll
    mobileNav.addEventListener('scroll', updateScrollHints);
    
    // Update on resize
    window.addEventListener('resize', updateScrollHints);
  }
  
  /**
   * Scroll active link into view on mobile
   */
  function scrollActiveIntoView() {
    if (window.innerWidth >= 768) return; // Desktop only
    
    const mobileNav = document.querySelector(CONFIG.selectors.mobileNav);
    const activeLink = document.querySelector('.mobile-nav a[aria-current="page"]');
    
    if (!mobileNav || !activeLink) return;
    
    // Use timeout to ensure layout is complete
    setTimeout(() => {
      const navRect = mobileNav.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      
      // Calculate if link is fully visible
      const linkLeft = linkRect.left - navRect.left + mobileNav.scrollLeft;
      const linkRight = linkLeft + linkRect.width;
      const visibleLeft = mobileNav.scrollLeft;
      const visibleRight = visibleLeft + mobileNav.clientWidth;
      
      // Scroll if link is not fully visible
      if (linkLeft < visibleLeft || linkRight > visibleRight) {
        const scrollTo = linkLeft - (mobileNav.clientWidth / 2) + (linkRect.width / 2);
        
        if (reducedMotion) {
          mobileNav.scrollLeft = Math.max(0, scrollTo);
        } else {
          mobileNav.scrollTo({
            left: Math.max(0, scrollTo),
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  }
  
  /**
   * Handle window resize
   */
  function handleResize() {
    // Re-setup scroll hints for mobile
    setupMobileScrollHints();
    
    // Re-scroll active into view if switching to mobile
    if (window.innerWidth < 768) {
      scrollActiveIntoView();
    }
  }
  
  // Listen for resize events
  window.addEventListener('resize', handleResize);
  
  // Listen for reduced motion changes
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', (e) => {
    reducedMotion = e.matches;
  });
  
  /**
   * Public API
   */
  window.MSCNavigation = {
    setActiveState: setActiveState,
    scrollActiveIntoView: scrollActiveIntoView
  };
  
  // Initialize when script loads
  init();
  
})();
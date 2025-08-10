/**
 * MSC Initiative Tabbed Navigation
 * Handles overflow detection, "More" dropdown, and keyboard navigation
 */

class TabbedNavigation {
  constructor() {
    this.tabsNav = document.querySelector('.tabs-nav');
    if (!this.tabsNav) return;

    this.tabsContainer = this.tabsNav.querySelector('.tabs-container');
    this.tabsScroll = this.tabsNav.querySelector('.tabs-scroll');
    this.tabsList = this.tabsNav.querySelector('.tabs-list');
    this.moreButton = this.tabsNav.querySelector('.more-button');
    this.moreMenu = this.tabsNav.querySelector('.more-menu');
    this.fadeLeft = this.tabsNav.querySelector('.tabs-fade-left');
    this.fadeRight = this.tabsNav.querySelector('.tabs-fade-right');

    this.allTabs = [];
    this.visibleTabs = [];
    this.hiddenTabs = [];
    this.resizeObserver = null;

    this.init();
  }

  init() {
    this.collectTabs();
    this.setActiveTab();
    this.setupEventListeners();
    this.setupResizeObserver();
    this.checkOverflow();
    this.updateScrollIndicators();
  }

  collectTabs() {
    // Get all tab links and store their data
    const tabLinks = this.tabsList.querySelectorAll('.tab-link');
    this.allTabs = Array.from(tabLinks).map(link => ({
      element: link.parentElement, // li element
      link: link,
      href: link.getAttribute('href'),
      text: link.textContent.trim(),
      isActive: this.isActiveTab(link)
    }));
  }

  isActiveTab(link) {
    const href = link.getAttribute('href');
    const currentPath = window.location.pathname;
    
    // Handle home page
    if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
      return true;
    }
    
    // Handle other pages (remove trailing slash for comparison)
    const normalizedHref = href.replace(/\/$/, '');
    const normalizedPath = currentPath.replace(/\/$/, '').replace(/\.html$/, '');
    
    return normalizedHref === normalizedPath;
  }

  setActiveTab() {
    // Remove all active states
    this.allTabs.forEach(tab => {
      tab.link.removeAttribute('aria-selected');
    });

    // Set active tab
    const activeTab = this.allTabs.find(tab => tab.isActive);
    if (activeTab) {
      activeTab.link.setAttribute('aria-selected', 'true');
    }
  }

  setupEventListeners() {
    // More button click
    this.moreButton?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMoreMenu();
    });

    // Close more menu on outside click
    document.addEventListener('click', (e) => {
      if (!this.tabsNav.contains(e.target)) {
        this.closeMoreMenu();
      }
    });

    // Close more menu on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMoreMenu();
      }
    });

    // Keyboard navigation for tabs
    this.tabsList?.addEventListener('keydown', (e) => {
      this.handleTabKeydown(e);
    });

    // Scroll indicators
    this.tabsScroll?.addEventListener('scroll', () => {
      this.updateScrollIndicators();
    });

    // Handle font loading
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.checkOverflow();
      });
    }
  }

  setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkOverflow();
        this.updateScrollIndicators();
      });
      this.resizeObserver.observe(this.tabsContainer);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', () => {
        this.checkOverflow();
        this.updateScrollIndicators();
      });
    }
  }

  checkOverflow() {
    if (!this.tabsContainer || !this.tabsList || !this.moreButton) return;

    // Reset all tabs to visible first
    this.allTabs.forEach(tab => {
      if (tab.element.parentElement === this.moreMenu) {
        this.tabsList.appendChild(tab.element);
      }
    });

    // Hide more button initially
    this.moreButton.style.display = 'none';
    this.hiddenTabs = [];
    this.visibleTabs = [...this.allTabs];

    // Force layout recalculation
    this.tabsContainer.offsetWidth;

    const containerWidth = this.tabsContainer.offsetWidth;
    const moreButtonWidth = this.moreButton.offsetWidth + 16; // Include margin
    const availableWidth = containerWidth - moreButtonWidth;
    
    let usedWidth = 0;
    let overflowIndex = -1;

    // Ensure active tab is always visible if possible
    const activeTab = this.allTabs.find(tab => tab.isActive);
    let activeTabWidth = 0;
    if (activeTab) {
      activeTabWidth = activeTab.element.offsetWidth + 8; // Include gap
    }

    // Calculate which tabs fit
    for (let i = 0; i < this.allTabs.length; i++) {
      const tab = this.allTabs[i];
      const tabWidth = tab.element.offsetWidth + 8; // Include gap
      
      if (usedWidth + tabWidth > availableWidth) {
        overflowIndex = i;
        break;
      }
      
      usedWidth += tabWidth;
    }

    // If we have overflow, move tabs to more menu
    if (overflowIndex >= 0) {
      // If active tab would be hidden, try to make room for it
      if (activeTab && overflowIndex <= this.allTabs.indexOf(activeTab)) {
        // Calculate if we can fit the active tab by moving one more to overflow
        if (overflowIndex > 0) {
          overflowIndex--;
        }
      }

      this.visibleTabs = this.allTabs.slice(0, overflowIndex);
      this.hiddenTabs = this.allTabs.slice(overflowIndex);

      // Move overflow tabs to more menu
      this.hiddenTabs.forEach(tab => {
        this.moreMenu.appendChild(tab.element);
      });

      // Show more button if we have hidden tabs
      if (this.hiddenTabs.length > 0) {
        this.moreButton.style.display = 'inline-flex';
      }
    }

    this.updateMoreButtonState();
  }

  updateMoreButtonState() {
    if (this.hiddenTabs.length > 0) {
      this.moreButton.style.display = 'inline-flex';
      
      // Update more button text with count
      const buttonText = this.moreButton.querySelector('span') || this.moreButton.firstChild;
      if (buttonText && buttonText.nodeType === Node.TEXT_NODE) {
        buttonText.textContent = `More (${this.hiddenTabs.length})`;
      }
    } else {
      this.moreButton.style.display = 'none';
      this.closeMoreMenu();
    }
  }

  toggleMoreMenu() {
    const isExpanded = this.moreButton.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      this.closeMoreMenu();
    } else {
      this.openMoreMenu();
    }
  }

  openMoreMenu() {
    this.moreButton.setAttribute('aria-expanded', 'true');
    this.moreMenu.removeAttribute('hidden');
    
    // Focus first item in menu
    const firstItem = this.moreMenu.querySelector('.tab-link');
    if (firstItem) {
      firstItem.focus();
    }
  }

  closeMoreMenu() {
    this.moreButton.setAttribute('aria-expanded', 'false');
    this.moreMenu.setAttribute('hidden', '');
  }

  handleTabKeydown(e) {
    const tabs = Array.from(this.tabsList.querySelectorAll('.tab-link'));
    const currentIndex = tabs.indexOf(e.target);
    
    if (currentIndex === -1) return;

    let nextIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        tabs[nextIndex].focus();
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        tabs[nextIndex].focus();
        break;
        
      case 'Home':
        e.preventDefault();
        tabs[0].focus();
        break;
        
      case 'End':
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.target.click();
        break;
    }
  }

  updateScrollIndicators() {
    if (!this.tabsScroll) return;

    const scrollLeft = this.tabsScroll.scrollLeft;
    const scrollWidth = this.tabsScroll.scrollWidth;
    const clientWidth = this.tabsScroll.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Show/hide fade indicators
    const canScrollLeft = scrollLeft > 0;
    const canScrollRight = scrollLeft < maxScroll;

    this.tabsNav.classList.toggle('can-scroll-left', canScrollLeft);
    this.tabsNav.classList.toggle('can-scroll-right', canScrollRight);
  }

  // Public method to refresh the tabs (useful for dynamic content)
  refresh() {
    this.collectTabs();
    this.setActiveTab();
    this.checkOverflow();
    this.updateScrollIndicators();
  }

  // Cleanup method
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TabbedNavigation();
  });
} else {
  new TabbedNavigation();
}

// Make available globally for debugging
window.TabbedNavigation = TabbedNavigation;
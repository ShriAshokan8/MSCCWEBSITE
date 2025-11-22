// MSC Initiative Website JavaScript - Ultra Modern Edition

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initializeUltraNavigation();
    initializeScrollEffects();
    initializeLoadingAnimations();
    setCurrentYear();
    
    console.log('MSC Initiative website loaded successfully!');
});

// Set current year in footer
function setCurrentYear() {
    const currentYearElements = document.querySelectorAll('#currentYear');
    currentYearElements.forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

// Ultra-modern navigation functionality
function initializeUltraNavigation() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const nav = document.querySelector('.ultra-nav');
    
    if (mobileToggle && mobileOverlay) {
        // Toggle mobile menu
        mobileToggle.addEventListener('click', function() {
            toggleMobileMenu();
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && mobileOverlay.getAttribute('aria-hidden') === 'false') {
                closeMobileMenu();
            }
        });
        
        // Close when clicking outside
        mobileOverlay.addEventListener('click', function(event) {
            if (event.target === mobileOverlay) {
                closeMobileMenu();
            }
        });
        
        // Close when clicking a link
        const mobileLinks = mobileOverlay.querySelectorAll('.mobile-nav-item');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMobileMenu();
            });
        });
        
        function toggleMobileMenu() {
            const isHidden = mobileOverlay.getAttribute('aria-hidden') === 'true';
            if (isHidden) {
                openMobileMenu();
            } else {
                closeMobileMenu();
            }
        }
        
        function openMobileMenu() {
            mobileOverlay.setAttribute('aria-hidden', 'false');
            mobileToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            mobileOverlay.setAttribute('aria-hidden', 'true');
            mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
    
    // Scroll effect for navigation
    if (nav) {
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.style.boxShadow = '0 4px 20px rgba(255, 160, 122, 0.15)';
            } else {
                nav.style.boxShadow = '';
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }
}

// Scroll-triggered animations using IntersectionObserver
function initializeScrollEffects() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Skip animations for users who prefer reduced motion
        return;
    }
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Optionally unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const animatableElements = document.querySelectorAll(
        '.hero-section, .content-section, .bento-card, .timeline-card, ' +
        '.expansion-card, .value-card, .newsletter-item, .team-member, ' +
        '.highlight-card, .split-section, .bento-section'
    );
    
    animatableElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Loading animations for page elements
function initializeLoadingAnimations() {
    // Add CSS for animate-in class
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Stagger animations for cards
    const cards = document.querySelectorAll('.bento-card, .timeline-card, .expansion-card, .value-card');
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navHeight = document.querySelector('.ultra-nav')?.offsetHeight || 80;
            const targetPosition = target.offsetTop - navHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Utility functions
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

// Performance optimization for scroll events
const optimizedScrollHandler = debounce(function() {
    // Handle scroll events here if needed
}, 10);

window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

// Export functions for global use
window.MSC = {
    initializeUltraNavigation,
    initializeScrollEffects,
    initializeLoadingAnimations,
    setCurrentYear
};
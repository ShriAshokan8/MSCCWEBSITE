document.addEventListener('DOMContentLoaded', () => {
    console.log("STEM Crafts Club website loaded successfully!");
    initializeBasicFeatures();
    initScrollHeaderEffect();
    
    // Register service worker for PWA offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
});

function initializeBasicFeatures() {
    console.log("Basic features initialized");
}

/**
 * Initialize scroll-based header effect
 * Header becomes smaller and semi-transparent with blur on scroll
 */
function initScrollHeaderEffect() {
    const header = document.querySelector('header');
    if (!header) return;
    
    let lastScrollTop = 0;
    let ticking = false;
    
    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
    
    // Initial check
    updateHeader();
}

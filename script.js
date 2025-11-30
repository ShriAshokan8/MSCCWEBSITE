document.addEventListener('DOMContentLoaded', () => {
    console.log("MSC Initiative website loaded successfully!");
    initializeBasicFeatures();
    initMSCRunningStopwatch();
    initScrollHeaderEffect();
    initNavActiveState();
    
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
 * Initialize navigation active state based on current page
 * Applies .is-active class to matching nav links
 */
function initNavActiveState() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Normalize paths for comparison
        const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
        const normalizedLinkPath = linkHref.replace(/\/$/, '') || '/';
        
        // Check for exact match or if current path starts with link path (for nested pages)
        if (normalizedCurrentPath === normalizedLinkPath ||
            (normalizedLinkPath !== '/' && normalizedCurrentPath.startsWith(normalizedLinkPath))) {
            link.classList.add('is-active');
        }
    });
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

/**
 * Convert a UK local date-time (Europe/London, respecting GMT/BST) to UTC epoch milliseconds.
 * Handles DST correctly by using Intl.DateTimeFormat when available.
 */
function zonedUKToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }) {
    const timeZone = 'Europe/London';

    // Fallback for very old browsers without Intl/timeZone support:
    if (
        typeof Intl === 'undefined' ||
        !Intl.DateTimeFormat ||
        !Intl.DateTimeFormat().resolvedOptions().timeZone
    ) {
        // This treats the given components as local time in the browser.
        // It's less accurate but avoids total failure.
        return new Date(year, month - 1, day, hour, minute, second).getTime();
    }

    // Construct as if those components are UTC
    const localAsUTC = Date.UTC(year, month - 1, day, hour, minute, second);

    // Format that instant in the UK zone to find the real offset at that date
    const dtf = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    const parts = dtf.formatToParts(new Date(localAsUTC));
    const map = {};
    for (const p of parts) map[p.type] = p.value;

    // Convert those zone components back to UTC to compute offset
    const asUTCFromZoned = Date.UTC(
        Number(map.year), Number(map.month) - 1, Number(map.day),
        Number(map.hour), Number(map.minute), Number(map.second)
    );

    // Offset = zoneTimeInUTC - naiveUTC
    const offset = asUTCFromZoned - localAsUTC;

    // Real UTC epoch for intended UK local components:
    return localAsUTC - offset;
}

/**
 * Helper: set text content and trigger a small tick animation when value changes.
 */
function setValueWithTick(el, newText) {
    if (!el) return;
    if (el.textContent === newText) return; // no change, no animation

    el.textContent = newText;
    el.classList.remove('ticking');
    // Force reflow so animation can restart
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add('ticking');
}

/**
 * Initialize the count-up stopwatch from UK start time.
 * - Shows days, hours, minutes, seconds
 * - Uses Europe/London rules via zonedUKToUtc (GMT/BST aware)
 * - Announces via aria-live only once per minute for accessibility
 */
function initMSCRunningStopwatch() {
    const root = document.getElementById('mscStopwatch');
    if (!root) return;

    // Start from: 23rd September 2024 at 17:03:37 (UK time)
    const START_UK = { year: 2024, month: 9, day: 23, hour: 17, minute: 3, second: 37 };
    const startMs = zonedUKToUtc(START_UK);

    const daysEl  = root.querySelector('.value[data-unit="days"]');
    const hoursEl = root.querySelector('.value[data-unit="hours"]');
    const minsEl  = root.querySelector('.value[data-unit="minutes"]');
    const secsEl  = root.querySelector('.value[data-unit="seconds"]');

    // Live region: we reuse the visible note for announcements
    const liveRegion = document.getElementById('mscStartNote');

    const pad2 = (n) => String(n).padStart(2, '0');
    let lastAnnouncedMinute = null;

    function update() {
        const nowMs = Date.now();
        let diffSec = Math.floor((nowMs - startMs) / 1000);

        if (diffSec < 0) {
            // If start is in the future, clamp to 0
            diffSec = 0;
        }

        // Total elapsed days
        const totalDays = Math.floor(diffSec / 86400);

        // Remainder within current (partial) day
        const rem = diffSec % 86400;
        const hours = Math.floor(rem / 3600);
        const rem2 = rem - hours * 3600;
        const minutes = Math.floor(rem2 / 60);
        const seconds = rem2 - minutes * 60;

        // Update visible values with tick animation
        setValueWithTick(daysEl,  String(totalDays));
        setValueWithTick(hoursEl, pad2(hours));
        setValueWithTick(minsEl,  pad2(minutes));
        setValueWithTick(secsEl,  pad2(seconds));

        // Accessibility: announce only once per minute to avoid spam
        const totalMinutes = totalDays * 24 * 60 + hours * 60 + minutes;
        if (liveRegion && totalMinutes !== lastAnnouncedMinute) {
            liveRegion.textContent =
                `MSC has been running for ${totalDays} day${totalDays === 1 ? '' : 's'}, ` +
                `${hours} hour${hours === 1 ? '' : 's'} and ` +
                `${minutes} minute${minutes === 1 ? '' : 's'}. ` +
                `Started on the 23rd of September 2024 at 17:03:37 GMT/BST (Europe/London).`;
            lastAnnouncedMinute = totalMinutes;
        }
    }

    update();
    // Update every second
    setInterval(update, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("MSC Initiative website loaded successfully!");
    initializeBasicFeatures();
    initMSCRunningStopwatch();
    
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
 * Convert a UK local date-time (Europe/London, respecting GMT/BST) to UTC epoch milliseconds.
 * Handles DST correctly by using Intl.DateTimeFormat.
 */
function zonedUKToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }) {
    const timeZone = 'Europe/London';

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
 * Initialize the count-up stopwatch from UK start time.
 * Day counter now shows fully elapsed whole days (Day 0 at the start moment).
 */
function initMSCRunningStopwatch() {
    const root = document.getElementById('mscStopwatch');
    if (!root) return;

    // Start from: 23rd September 2024 at 17:03:37 (UK time)
    const START_UK = { year: 2024, month: 9, day: 23, hour: 17, minute: 3, second: 37 };
    const startMs = zonedUKToUtc(START_UK);

    const daysEl = root.querySelector('.value[data-unit="days"]');
    const hoursEl = root.querySelector('.value[data-unit="hours"]');
    const minsEl  = root.querySelector('.value[data-unit="minutes"]');
    const secsEl  = root.querySelector('.value[data-unit="seconds"]');

    const pad2 = (n) => String(n).padStart(2, '0');

    function update() {
        const nowMs = Date.now();
        let diffSec = Math.floor((nowMs - startMs) / 1000);

        if (diffSec < 0) {
            // If start is in the future, clamp to 0
            diffSec = 0;
        }

        // Elapsed whole days (Day 0 at the exact start timestamp)
        const elapsedDays = Math.floor(diffSec / 86400);

        // Remainder within current (partial) day
        const rem = diffSec % 86400;
        const hours = Math.floor(rem / 3600);
        const rem2 = rem - hours * 3600;
        const minutes = Math.floor(rem2 / 60);
        const seconds = rem2 - minutes * 60;

        if (daysEl)  daysEl.textContent = String(elapsedDays);
        if (hoursEl) hoursEl.textContent = pad2(hours);
        if (minsEl)  minsEl.textContent = pad2(minutes);
        if (secsEl)  secsEl.textContent = pad2(seconds);
    }

    update();
    // Update every second
    setInterval(update, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("MSC Initiative website loaded successfully!");
    
    // Basic website functionality only - no timers, scores, or announcements
    initializeBasicFeatures();
    
    function initializeBasicFeatures() {
        // Any basic website functionality can be added here
        console.log("Basic features initialized");
    }

    // Stopwatch: MSC running time since 2024-09-23 17:14:37 UTC
    const START_ISO = '2024-09-23T17:14:37Z';
    const stopwatchRoot = document.getElementById('mscStopwatch');
    if (stopwatchRoot) {
        const daysEl = stopwatchRoot.querySelector('.value[data-unit="days"]');
        const hoursEl = stopwatchRoot.querySelector('.value[data-unit="hours"]');
        const minsEl  = stopwatchRoot.querySelector('.value[data-unit="minutes"]');
        const secsEl  = stopwatchRoot.querySelector('.value[data-unit="seconds"]');
        
        const startMs = Date.parse(START_ISO);

        const pad2 = (n) => String(n).padStart(2, '0');

        function updateStopwatch() {
            const now = Date.now();
            let diffSec = Math.max(0, Math.floor((now - startMs) / 1000));

            const days = Math.floor(diffSec / 86400);
            diffSec -= days * 86400;
            const hours = Math.floor(diffSec / 3600);
            diffSec -= hours * 3600;
            const minutes = Math.floor(diffSec / 60);
            diffSec -= minutes * 60;
            const seconds = diffSec;

            if (daysEl) daysEl.textContent = days;
            if (hoursEl) hoursEl.textContent = pad2(hours);
            if (minsEl) minsEl.textContent = pad2(minutes);
            if (secsEl) secsEl.textContent = pad2(seconds);
        }

        updateStopwatch();
        setInterval(updateStopwatch, 1000);
    }
});

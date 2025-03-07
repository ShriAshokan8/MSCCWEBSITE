document.addEventListener('DOMContentLoaded', () => {
    console.log("The DOM has successfully loaded. Ready to fetch and display scores.");

    // Fetch and display scores
    fetchScores('scores.json')
        .then(data => displayScores(data))
        .catch(error => console.error('Error fetching scores:', error));

    // Display Scores in the scores section
    function displayScores(data) {
        const scoresSection = document.getElementById('scoresSection');
        if (scoresSection) {
            scoresSection.innerHTML = ''; // Clear existing content
            const studentList = document.createElement('ul');

            data.forEach(student => {
                const studentItem = createStudentItem(student);
                studentList.appendChild(studentItem);
            });

            scoresSection.appendChild(studentList);
        }
    }

    // Create a list item for each student
    function createStudentItem(student) {
        const studentItem = document.createElement('li');
        studentItem.innerHTML = `
            <strong>${student.Name}</strong><br>
            R1S - ${student.R1S} / 100<br>
            R2MS - ${student.R2MS} / 100<br>
            R2SS - ${student.R2SS} / 100<br>
            R2CS - ${student.R2CS} / 100<br>
            R2CoS - ${student.R2CoS} / 100
        `;
        return studentItem;
    }

    // Fetch the scores from the given URL
    function fetchScores(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok " + response.statusText);
                }
                return response.json();
            });
    }

    // Countdown Timer (for future usage)
    function startCountdown() {
        const eventDate = new Date("March 7, 2025 08:00:00 GMT").getTime();
        const timerElement = document.getElementById("countdown-timer");
        const announcementElement = document.getElementById("announcement");

        if (!timerElement) {
            console.error("❌ Countdown Timer element NOT found!");
            return;
        }

        // Update countdown every second
        const countdownInterval = setInterval(() => updateCountdown(eventDate, timerElement, countdownInterval, announcementElement), 1000);
    }

    // Update countdown timer
    function updateCountdown(eventDate, timerElement, countdownInterval, announcementElement) {
        const now = new Date().getTime();
        const timeLeft = eventDate - now;

        if (timeLeft <= 0) {
            timerElement.innerHTML = "🎉 The event has started!";
            clearInterval(countdownInterval);
            createAnnouncement(announcementElement); // Create announcement when the event starts
            return;
        }

        const { days, hours, minutes, seconds } = calculateTimeLeft(timeLeft);

        timerElement.innerHTML = `Event starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    // Calculate time left for the event
    function calculateTimeLeft(timeLeft) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }

    // Create the event announcement
    function createAnnouncement(announcementElement) {
        if (announcementElement) {
            // Show the announcement content
            announcementElement.innerHTML = `<h2>🎉 The event has officially started! 🎉</h2>`;
            announcementElement.style.display = "block"; // Ensure the announcement is visible

            // Optionally, you can add some animation here to make it more exciting.
            announcementElement.classList.add('fade-in');
        } else {
            console.error("❌ Announcement element NOT found!");
        }
    }

    startCountdown(); // Initialize countdown timer
});

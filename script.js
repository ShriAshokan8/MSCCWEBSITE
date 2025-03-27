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

            // Group students by categories
            const categories = groupByCategory(data);

            // Create accordion for each category
            Object.keys(categories).forEach(category => {
                const categoryElement = createCategoryElement(category, categories[category]);
                scoresSection.appendChild(categoryElement);
            });
        }
    }

    // Group students by categories
    function groupByCategory(data) {
        return data.reduce((acc, student) => {
            const category = student.Group;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(student);
            return acc;
        }, {});
    }

    // Create a category element
    function createCategoryElement(category, students) {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category');

        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        categoryHeader.addEventListener('click', () => {
            categoryContent.classList.toggle('hidden');
        });

        const categoryContent = document.createElement('div');
        categoryContent.classList.add('hidden', 'category-content');

        students.forEach(student => {
            const studentElement = createStudentElement(student);
            categoryContent.appendChild(studentElement);
        });

        categoryDiv.appendChild(categoryHeader);
        categoryDiv.appendChild(categoryContent);

        return categoryDiv;
    }

    // Create a student element
    function createStudentElement(student) {
        const studentDiv = document.createElement('div');
        studentDiv.classList.add('student');

        const studentHeader = document.createElement('h4');
        studentHeader.textContent = student.Name;
        studentHeader.addEventListener('click', () => {
            studentContent.classList.toggle('hidden');
        });

        const studentContent = document.createElement('div');
        studentContent.classList.add('hidden', 'student-content');
        studentContent.innerHTML = `
            <span style="color: black;">
                R1S - ${student.R1S} / 100<br>
                R2MS - ${student.R2MS} / 100<br>
                R2SS - ${student.R2SS} / 100<br>
                R2CS - ${student.R2CS} / 100<br>
                R2CoS - ${student.R2CoS} / 100
            </span>
        `;

        studentDiv.appendChild(studentHeader);
        studentDiv.appendChild(studentContent);

        return studentDiv;
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

    // Countdown Timer
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
            createAnnouncements(announcementElement); // Create announcements when the event starts
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

    // Create the event announcements
    function createAnnouncements(announcementElement) {
        if (announcementElement) {
            // Define the announcements
            const announcements = [
                "🎉 The wait is over! The MSC Competition has officially begun, and we are thrilled to have you all participate in the exciting STEM event. 🎉",
                "🎉 If you require a pass for the respective clubs, please reach out to any member of the MSC Team members! 🎉",
            ];

            // Show the announcement content
            announcementElement.innerHTML = announcements.map(announcement => `<div class="announcement"><h2>${announcement}</h2></div>`).join('');
            announcementElement.style.display = "block"; // Ensure the announcement is visible

            announcementElement.classList.add('fade-in');
        } else {
            console.error("❌ Announcement element NOT found!");
        }
    }

    startCountdown(); // Initialize countdown timer

    // Dark/Light Mode Toggle
    const toggleButton = document.getElementById('theme-toggle');
    
    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            toggleButton.textContent = 'Switch to Light Mode';
        } else {
            toggleButton.textContent = 'Switch to Dark Mode';
        }
    });

    // Timer Functions
    let timerInterval;
    let timeLeft;
    const timerElement = document.getElementById('timer');

    function startTimer() {
        const duration = timerElement.getAttribute('data-duration');
        timeLeft = parseInt(duration, 10);

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
            } else {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        const duration = timerElement.getAttribute('data-duration');
        timeLeft = parseInt(duration, 10);
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;

    // Initialize timer display
    if (timerElement) {
        resetTimer();
    }

    // Toggle the navigation menu
    window.toggleMenu = function() {
        const navbarLinks = document.querySelector('.navbar-links');
        if (navbarLinks) {
            navbarLinks.classList.toggle('hidden');
        }
    };
});

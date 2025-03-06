document.addEventListener('DOMContentLoaded', () => {
    console.log("The DOM has successfully loaded and been parsed. Ready to fetch and display scores.");

    // Fetch and display scores
    fetch('scores.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(data => displayScores(data))
        .catch(error => console.error('Error fetching scores:', error));

    function displayScores(data) {
        const scoresSection = document.getElementById('scoresSection');
        if (scoresSection) {
            scoresSection.innerHTML = ''; // Clear existing content
            const studentList = document.createElement('ul');

            data.forEach(student => {
                const studentItem = document.createElement('li');
                studentItem.innerHTML = `
                    <strong>${student.Name}</strong><br>
                    R1S - ${student.R1S} / 100<br>
                    R2MS - ${student.R2MS} / 100<br>
                    R2SS - ${student.R2SS} / 100<br>
                    R2CS - ${student.R2CS} / 100<br>
                    R2CoS - ${student.R2CoS} / 100
                `;
                studentList.appendChild(studentItem);
            });

            scoresSection.appendChild(studentList);
        }
    }

    // Countdown Timer
    function startCountdown() {
        const eventDate = new Date("March 7, 2025 08:00:00 GMT").getTime();
        const timerElement = document.getElementById("countdown-timer");

        if (!timerElement) {
            console.error("❌ Countdown Timer element NOT found!");
            return;
        }

        function updateCountdown() {
            const now = new Date().getTime();
            const timeLeft = eventDate - now;

            if (timeLeft <= 0) {
                timerElement.innerHTML = "🎉 The event has started!";
                clearInterval(countdownInterval);
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            timerElement.innerHTML = `Event starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        updateCountdown(); // Run immediately to prevent 1s delay
        const countdownInterval = setInterval(updateCountdown, 1000);
    }

    startCountdown(); // Initialize countdown timer
});

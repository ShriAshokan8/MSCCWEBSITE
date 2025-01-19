document.addEventListener('DOMContentLoaded', () => {
    // Initialization when DOM content is fully loaded
    console.log("The DOM has successfully loaded!");

    // Fetching the scores from the database to populate the page
    fetchScores();

    // Event listener for editing scores in the admin panel
    const editButtons = document.querySelectorAll('.edit-score');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const studentId = e.target.dataset.id;  // Get the student ID
            showEditModal(studentId);
        });
    });

    // Function to fetch scores from the database
    async function fetchScores() {
        try {
            const response = await fetch('/api/scores');
            const data = await response.json();

            // Render the scores dynamically on the page
            renderScores(data);
        } catch (error) {
            console.error("Error fetching scores:", error);
        }
    }

    // Function to render the scores on the page
    function renderScores(data) {
        const scoresContainer = document.querySelector("#scores-list");
        data.forEach(student => {
            const studentElement = document.createElement("li");
            studentElement.innerHTML = `
                <strong>${student.name}</strong> - Score: ${student.score}
                <button class="edit-score" data-id="${student.id}">Edit</button>
            `;
            scoresContainer.appendChild(studentElement);
        });
    }

    // Function to show the edit modal for a student
    function showEditModal(studentId) {
        const modal = document.querySelector("#edit-modal");
        modal.classList.add('visible');

        // Fetch student data by ID
        fetch(`/api/student/${studentId}`)
            .then(response => response.json())
            .then(data => {
                document.querySelector("#student-name").value = data.name;
                document.querySelector("#student-score").value = data.score;
                document.querySelector("#save-button").dataset.id = studentId;
            })
            .catch(error => console.error("Error fetching student data:", error));
    }

    // Event listener for saving the edited score
    const saveButton = document.querySelector("#save-button");
    saveButton.addEventListener('click', async () => {
        const studentId = saveButton.dataset.id;
        const updatedScore = document.querySelector("#student-score").value;

        // Save the updated score to the database
        try {
            const response = await fetch(`/api/student/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score: updatedScore })
            });

            if (response.ok) {
                alert("Score updated successfully!");
                location.reload();  // Reload the page to update the displayed scores
            } else {
                alert("Error updating score");
            }
        } catch (error) {
            console.error("Error saving score:", error);
        }
    });

    // Close the modal if clicked outside
    const modal = document.querySelector("#edit-modal");
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });
});

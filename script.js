document.addEventListener('DOMContentLoaded', () => {
    console.log("The DOM has successfully loaded and been parsed. Ready to fetch and display scores.");

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
});

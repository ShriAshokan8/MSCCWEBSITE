document.addEventListener('DOMContentLoaded', () => {
    console.log("The DOM has loaded. Ready to fetch and display scores.");

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

        const categories = ['7M1', '7A1', '7A2', '7H1', '7H2', '7S1'];

        categories.forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.classList.add('category-section');

            const categoryHeader = document.createElement('h3');
            categoryHeader.innerHTML = `All Scores from ${category}`;
            categoryHeader.classList.add('category-header');
            categoryHeader.addEventListener('click', () => {
                const studentList = categorySection.querySelector('.student-list');
                studentList.classList.toggle('hidden');
            });

            const categoryData = data.filter(student => student.Group === category);
            const studentList = document.createElement('ul');
            studentList.classList.add('student-list', 'hidden');

            categoryData.forEach(student => {
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

            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(studentList);
            scoresSection.appendChild(categorySection);
        });
    }
});

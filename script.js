document.addEventListener('DOMContentLoaded', () => {
    console.log("The DOM has successfully loaded and been parsed. Ready to fetch and display scores.");

    document.getElementById('upload').addEventListener('change', handleFile, false);

    function handleFile(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            displayScores(json);
        };
        reader.readAsArrayBuffer(file);
    }

    function displayScores(data) {
        const scoresSection = document.getElementById('scoresSection');
        scoresSection.innerHTML = ''; // Clear existing content
        
        data.forEach(group => {
            const groupSection = document.createElement('section');
            groupSection.innerHTML = `
                <h3>Outstanding Students from ${group.Group}</h3>
                <ul>
                    ${group.Students.map(student => `<li><strong>${student.Name}</strong> - Score: ${student.Score}</li>`).join('')}
                </ul>
            `;
            scoresSection.appendChild(groupSection);
        });
    }
});

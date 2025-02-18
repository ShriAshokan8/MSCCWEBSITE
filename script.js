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
            const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            displayScores(json);
        };
        reader.readAsArrayBuffer(file);
    }

    function displayScores(data) {
        const scoresSection = document.getElementById('scoresSection');
        scoresSection.innerHTML = ''; // Clear existing content
        
        const headers = data[0];
        const rows = data.slice(1);

        rows.forEach(row => {
            const groupSection = document.createElement('section');
            groupSection.innerHTML = `
                <h3>Outstanding Students from ${row[0]}</h3>
                <ul>
                    <li><strong>${row[1]}</strong> - R1 Score: ${row[2]}, R2MS Score: ${row[3]}, R2SS Score: ${row[4]}, R2CS Score: ${row[5]}, R2CoS Score: ${row[6]}</li>
                </ul>
            `;
            scoresSection.appendChild(groupSection);
        });
    }
});

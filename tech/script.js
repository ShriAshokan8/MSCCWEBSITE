document.getElementById("quizForm").addEventListener("submit", function(event) {
    let score = 0;
    const correctAnswers = {
        q1: "B",
        q2: "A",
        q3: "D",
        q4: "B",
        q5: "B",
        q6: "B",
        q7: "B",
        q8: "B",
        q9: "B",
        q10: "B",
        q11: "C",
        q12: "C",
        q13: "B",
        q14: "A",
        q15: "A",
    };

    for (let i = 1; i <= 15; i++) {
        const answer = document.querySelector(`input[name="q${i}"]:checked`);
        if (answer && answer.value === correctAnswers[`q${i}`]) {
            score++;
        }
    }

    document.getElementById("scoreField").value = score;
});

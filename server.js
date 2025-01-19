// server.js

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Simple GET route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sample API endpoint for editing scores (could connect to your database)
let scores = [
    { id: 1, name: "Alice", score: 75 },
    { id: 2, name: "Bob", score: 85 },
    { id: 3, name: "Charlie", score: 90 },
];

// GET scores endpoint
app.get('/api/scores', (req, res) => {
    res.json(scores);
});

// POST endpoint to update a score
app.post('/api/scores/:id', (req, res) => {
    const { id } = req.params;
    const { score } = req.body;

    // Find the score by ID and update it
    const scoreToUpdate = scores.find(s => s.id === parseInt(id));
    if (scoreToUpdate) {
        scoreToUpdate.score = score;
        return res.json({ message: 'Score updated successfully', score: scoreToUpdate });
    } else {
        return res.status(404).json({ message: 'Score not found' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 

const app = express();
const PORT = 3000;

// Middleware: Allows React to talk to this server
app.use(cors()); 
app.use(express.json()); 

// Path to your database file
const dbPath = path.join(__dirname, 'data', 'db.json');

// --- Member 2 Tasks (File Handling) ---

// GET Skills: This reads the db.json file and sends it to React
app.get('/api/skills', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Check if db.json is in backend/data/" });
        }
        const skills = JSON.parse(data).skills;
        res.json(skills);
    });
});

// POST User: Placeholder for Member 2's Signup logic
app.post('/api/users', (req, res) => {
    res.status(201).json({ message: "Ready for Member 2 to add fs.writeFile logic" });
});

app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`SERVER RUNNING: http://localhost:${PORT}`);
    console.log(`Member 1 Tasks: COMPLETED`);
    console.log(`==========================================`);
});
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

    const newUser = req.body;

    fs.readFile(dbPath, 'utf8', (err, data) => {

        if (err) {
            return res.status(500).json({ error: "Error reading database" });
        }

        const db = JSON.parse(data);

        const userWithId = {
            id: Date.now().toString(),
            ...newUser
        };

        db.users.push(userWithId);

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {

            if (err) {
                return res.status(500).json({ error: "Error writing to database" });
            }

            res.status(201).json(userWithId);
        });

    });

});

// POST Activity Log: This appends activity logs to a text file
app.post('/api/activity-log', (req, res) => {

    const logPath = path.join(__dirname, 'data', 'activity.txt');

    const logEntry = `Activity: ${JSON.stringify(req.body)}\n`;

    fs.appendFile(logPath, logEntry, (err) => {

        if (err) {
            return res.status(500).json({ error: "Error appending log file" });
        }

        res.json({ message: "Activity logged successfully" });
    });

});

// DELETE Swap Request: This removes a swap request from db.json based on ID
app.delete('/api/swap-requests/:id', (req, res) => {

    const requestId = req.params.id;

    fs.readFile(dbPath, 'utf8', (err, data) => {

        if (err) {
            return res.status(500).json({ error: "Error reading database" });
        }

        const db = JSON.parse(data);

        db.swapRequests = db.swapRequests.filter(
            request => request.id !== requestId
        );

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {

            if (err) {
                return res.status(500).json({ error: "Error deleting request" });
            }

            res.json({ message: "Swap request deleted successfully" });
        });

    });

});

app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`SERVER RUNNING: http://localhost:${PORT}`);
    console.log(`==========================================`);
});
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'data', 'db.json');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

app.get('/api/features', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }
        const db = JSON.parse(data);
        res.json(db.features || []);
    });
});

app.get('/api/skills', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Check if db.json is in backend/data/' });
        }
        const db = JSON.parse(data);
        res.json(db.skills || []);
    });
});

app.get('/api/users', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }
        const db = JSON.parse(data);
        const users = db.users || [];
        const email = (req.query.email || '').toString().toLowerCase().trim();

        if (!email) {
            return res.json(users);
        }

        const filteredUsers = users.filter(
            user => (user.email || '').toString().toLowerCase() === email
        );
        res.json(filteredUsers);
    });
});

app.post('/api/users', (req, res) => {
    const newUser = req.body;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }

        const db = JSON.parse(data);
        const userWithId = {
            id: Date.now().toString(),
            ...newUser,
        };

        db.users = db.users || [];
        db.users.push(userWithId);

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing to database' });
            }

            res.status(201).json(userWithId);
        });
    });
});

app.patch('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }

        const db = JSON.parse(data);
        const users = db.users || [];
        const userIndex = users.findIndex(user => String(user.id) === String(userId));

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[userIndex] = {
            ...users[userIndex],
            ...updates,
        };

        db.users = users;

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing to database' });
            }

            res.json(users[userIndex]);
        });
    });
});

app.post('/api/activity-log', (req, res) => {
    const logPath = path.join(__dirname, 'data', 'activity.txt');
    const logEntry = `Activity: ${JSON.stringify(req.body)}\n`;

    fs.appendFile(logPath, logEntry, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error appending log file' });
        }

        res.json({ message: 'Activity logged successfully' });
    });
});

app.get('/api/swap-requests', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }

        const db = JSON.parse(data);
        res.json(db.swapRequests || []);
    });
});

app.post('/api/swap-requests', (req, res) => {
    const newRequest = req.body;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }

        const db = JSON.parse(data);
        const requestWithId = {
            id: Date.now().toString(),
            ...newRequest,
        };

        db.swapRequests = db.swapRequests || [];
        db.swapRequests.push(requestWithId);

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing to database' });
            }

            res.status(201).json(requestWithId);
        });
    });
});

app.delete('/api/swap-requests/:id', (req, res) => {
    const requestId = req.params.id;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }

        const db = JSON.parse(data);
        db.swapRequests = (db.swapRequests || []).filter(
            request => request.id !== requestId
        );

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error deleting request' });
            }

            res.json({ message: 'Swap request deleted successfully' });
        });
    });
});

// --- MEMBER 4: Performance Expert - True Streaming ---

app.get('/api/export-history', (req, res) => {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    res.setHeader('Content-Disposition', `attachment; filename="TradeReport.${format}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

    const readStream = fs.createReadStream(dbPath);

    readStream.pipe(res);

    readStream.on('error', (err) => {
        console.error("Streaming error:", err);
        if (!res.headersSent) res.status(500).send("Streaming failed");
    });
});

// Swap Reviews
app.get('/api/swap-reviews', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading database' });
        }

        const db = JSON.parse(data);
        res.json(db.swapReviews || []);
    });
});

// --- MEMBER 3: Static Serving ---

app.use(express.static(frontendDistPath));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`SERVER RUNNING: http://localhost:${PORT}`);
    console.log('==========================================');
});
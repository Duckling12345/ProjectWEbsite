const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL pool
const pool = new Pool({
    connectionString: 'postgresql://promise_zxbc_user:QnHnTyfi203ovlhNHVqnjjTTNSZgpGRz@dpg-d0elbjc9c44c7386c5l0-a.oregon-postgres.render.com/promise_zxbc',
    ssl: { rejectUnauthorized: false }
});

// Brute-force protection
const loginAttempts = {}; // Track attempts per username
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

// Whitelist for safe HTML pages
const allowedPages = ['landingPage.html', 'auth.html'];

// Serve landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'landingPage.html'));
});

// Signup Route (Secure)
app.post('/signup', async (req, res) => {
    const { first_name, last_name, contact_number, username, password } = req.body;

    try {
        const userResults = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (userResults.rows.length > 0) {
            return res.status(409).json({ error: 'Username is already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (first_name, last_name, contact_number, username, password)
             VALUES ($1, $2, $3, $4, $5)`,
            [first_name, last_name, contact_number, username, hashedPassword]
        );

        res.status(200).json({ message: 'Signup successful! Redirecting to login.' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed. Please try again.' });
    }
});

// Login Route with brute-force protection
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const now = Date.now();

    // Check if user is locked
    const attempts = loginAttempts[username];
    if (attempts && attempts.lockUntil && attempts.lockUntil > now) {
        const remainingMs = attempts.lockUntil - now;
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        return res.status(429).json({ error: `Too many failed attempts. Try again in ${minutes} minute(s) and ${seconds} second(s).` });
    }
    

    try {
        // Check in admins table
        let result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);

        // If not found in admins, check users table
        if (result.rows.length === 0) {
            result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        }

        // No user found
        if (result.rows.length === 0) {
            recordFailedLogin(username);
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            recordFailedLogin(username);
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Login successful – clear failed attempts
        delete loginAttempts[username];

        res.json({ message: `Welcome back, ${username}!` });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Helper: Track failed login attempts
function recordFailedLogin(username) {
    const now = Date.now();

    if (!loginAttempts[username]) {
        loginAttempts[username] = { count: 1, lockUntil: null };
    } else {
        loginAttempts[username].count++;
    }

    if (loginAttempts[username].count >= MAX_ATTEMPTS) {
        loginAttempts[username].lockUntil = now + LOCK_DURATION;
    }
}

// Safe File Viewer
app.get('/view', (req, res) => {
    const page = req.query.page;

    if (!allowedPages.includes(page)) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    const filePath = path.join(__dirname, 'public', 'html', page);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'File not found.' });
        }
        res.send(data);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

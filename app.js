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
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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
            return res.status(409).send('Username is already in use.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (first_name, last_name, contact_number, username, password)
             VALUES ($1, $2, $3, $4, $5)`,
            [first_name, last_name, contact_number, username, hashedPassword]
        );

        res.redirect('/html/auth.html');
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('Signup failed. Please try again.');
    }
});

// Login Route (Secure)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid username or password.');
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send('Invalid username or password.');
        }

        res.json({ message: `Welcome back, ${username}!` });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Login failed. Please try again.');
    }
});

// Safe File Viewer
app.get('/view', (req, res) => {
    const page = req.query.page;

    if (!allowedPages.includes(page)) {
        return res.status(403).send('Access denied.');
    }

    const filePath = path.join(__dirname, 'public', 'html', page);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('File not found.');
        }
        res.send(data);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

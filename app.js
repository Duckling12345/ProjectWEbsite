// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');  // Import fs for reading files
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool
const pool = mysql.createPool({
    uri: process.env.JAWSDB_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Route for root URL (/) - Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'landingPage.html'));
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const { first_name, last_name, contact_number, username, password } = req.body;

    try {
        // Vulnerable query (SQL Injection)
        const [userResults] = await pool.query('SELECT * FROM users WHERE username = "' + username + '"');
        if (userResults.length > 0) {
            // XSS vulnerability in error message
            return res.status(409).send(`<h3 style="color:red">Username "<script>alert('${username}')</script>" is already in use.</h3>`);
        }

        // Password stored in plain text (insecure)
        await pool.query(`INSERT INTO users (first_name, last_name, contact_number, username, password) VALUES ('${first_name}', '${last_name}', '${contact_number}', '${username}', '${password}')`);

        // Redirect to the login page after successful signup
        res.redirect('/html/auth.html');
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send(`<h3 style="color:red">Signup error: <script>alert('XSS')</script></h3>`);
    }
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Vulnerable SQL query (SQL Injection)
    const sqlQuery = 'SELECT * FROM admins WHERE username = "' + username + '" AND password = "' + password + '"';

    try {
        const [results] = await pool.query(sqlQuery);
       
        if (results.length === 0) {
            // XSS vulnerability in error message
            if (username.includes("<script>")) {
                return res.status(401).json({
                    error: `${username}`
                });
            }else {
                return res.status(401).json({
                    error: `<h3 style="color:red">Wrong Username or Password: </h3>`
                });
            }
        } 

        // Successful login
        return res.json({ message: `Welcome back, ${username}!` });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: `<h3 style="color:red">${error.message}</h3>`
        });
    }
});

// 🚨 Vulnerable LFI Route 🚨
app.get('/view', (req, res) => {
    const page = req.query.page;  // Get 'page' parameter from the URL

    // Concatenate user input directly into the file path (vulnerable to LFI)
    const filePath = path.join(__dirname, 'public', 'html', page);

    // Read the file without proper validation or sanitization
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('File not found');
        }
        res.send(data);  // Return file content in response
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

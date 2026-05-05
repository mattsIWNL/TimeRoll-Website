const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. DATABASE CONNECTION
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'Partime' // Your database name
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log("Connected to Partime MySQL Database!");
});

// --- API ENDPOINTS ---

// 2. GET ALL EMPLOYEES (For Employee List Page)
app.get('/api/employees', (req, res) => {
    const sql = "SELECT CCODE, CFULLNAME, POSITION_I, DEPTID, ACTIVE FROM employee";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. GET SINGLE EMPLOYEE DETAILS (For Employee Details Lookup)
app.get('/api/employees/:ccode', (req, res) => {
    const sql = "SELECT * FROM employee WHERE CCODE = ?";
    db.query(sql, [req.params.ccode], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

// 4. GET ALL SHIFTS (For Schedule Page)
app.get('/api/shifts', (req, res) => {
    const sql = "SELECT CCODE, CDESC, CLOGIN, CLOGOUT, WORKHRS FROM shiftdb";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 5. GET HOLIDAYS (For Holiday Lookup Page)
app.get('/api/holidays', (req, res) => {
    const sql = "SELECT * FROM holiday ORDER BY MONTH, DAY";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

// 6. ADD NEW HOLIDAY
app.post('/api/holidays', (req, res) => {
    // Log exactly what is arriving from the browser
    console.log("Data received from browser:", req.body);

    const { month, day, desc_text, type, holiday, branchcode, branchdesc } = req.body;
    
    const sql = "INSERT INTO holiday (MONTH, DAY, DESC_TEXT, TYPE, HOLIDAY, BRANCHCODE, BRANCHDESC) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [month, day, desc_text, type, holiday, branchcode, branchdesc], (err, result) => {
        if (err) {
            // Log the detailed error to your terminal
            console.error("MYSQL ERROR:", err.sqlMessage); 
            // Send the detailed error back to the browser alert
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Success" });
    });
});

// 7. GET DTR FOR SPECIFIC EMPLOYEE (For View DTR Page)
app.get('/api/dtr/:empcode', (req, res) => {
    const sql = "SELECT * FROM tmpdtrf1 WHERE CEMPCODE = ? ORDER BY DTR_DATE DESC";
    db.query(sql, [req.params.empcode], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 8. START SERVER
app.listen(3000, () => {
    console.log("TimeRoll Backend running on http://localhost:3000");
});
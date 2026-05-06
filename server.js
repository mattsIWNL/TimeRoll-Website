const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());

app.all('/api/employees', (req, res, next) => {
    console.log('HIT:', req.method);
    next();
});

app.use(express.urlencoded({ extended: true }));

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
    const sql = `
        SELECT 
            e.CCODE,
            e.CFULLNAME,
            e.POSITION_I,
            e.DEPTID,
            e.ACTIVE,
            e.EMAIL_ADD,
            e.MOBILENO,
            e.ADDRESS1,
            s.CCODE   AS SHIFT_CODE,
            s.CDESC   AS SHIFT_TYPE,
            s.CLOGIN  AS SHIFT_IN,
            s.CLOGOUT AS SHIFT_OUT,
            s.WORKHRS AS SHIFT_HOURS
        FROM employee e
        LEFT JOIN shiftdb s ON e.SHIFT_ID = s.CCODE
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// GET SINGLE EMPLOYEE BY ID
app.get('/api/employees/:id', (req, res) => {
    const sql = `
        SELECT e.CCODE, e.CFNAME, e.CMNAME, e.CLNAME, e.CFULLNAME,
               e.POSITION_I, e.DEPTID, e.EMAIL_ADD,
               e.MOBILENO, e.ADDRESS1, e.ACTIVE, e.EMP_STATUS,
               e.SHIFT_ID
        FROM employee e
        WHERE e.CCODE = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error("MYSQL ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        if (results.length === 0) return res.status(404).json({ error: 'Employee not found.' });
        res.json(results[0]);
    });
});


// UPDATE EMPLOYEE BY ID
app.put('/api/employees/:id', (req, res) => {
    const { firstname, lastname, position, department, email, phone, address, statusCode, isActive, shiftId } = req.body;
    const fullname = `${lastname}, ${firstname}`;

    const sql = `
        UPDATE employee
        SET CFNAME = ?, CLNAME = ?, CFULLNAME = ?,
            POSITION_I = ?, DEPTID = ?,
            EMAIL_ADD = ?, MOBILENO = ?, ADDRESS1 = ?,
            EMP_STATUS = ?, ACTIVE = ?,
            SHIFT_ID = ?
        WHERE CCODE = ?
    `;
    db.query(sql, [
        firstname, lastname, fullname,
        position, department,
        email, phone, address,
        statusCode, isActive,
        shiftId || '',
        req.params.id
    ], (err) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json({ message: 'Employee updated successfully.' });
    });
});

// 3B. ADD NEW EMPLOYEE
app.post('/api/employees', (req, res) => {
    console.log("POST /api/employees hit!");
    console.log("Body received:", req.body);
    const { ccode, firstname, middlename, lastname, position, department, email, phone, address, status } = req.body;

    const fullname  = `${lastname}, ${firstname}`;
    const empStatus = status === 'Active'     ? 'AC'
                    : status === 'Onboarding' ? 'OB'
                    : status === 'Contract'   ? 'CT'
                    : 'IN';
    const isActive  = (status === 'Active') ? 1 : 0;

    const sql = `
        INSERT INTO employee (
            CCODE, CFNAME, CMNAME, CLNAME, CFULLNAME,
            EMAIL_ADD, MOBILENO, ADDRESS1, ADDRESS2,
            POSITION_I, DEPTID, ACTIVE, EMP_STATUS,
            SHIFT_ID, BRANCHID, CGROUP, DED_SCHED,
            CIVILSTAT, SEX, SAL_TYPE, TAX_STATUS, PAYMODE,
            SALARY, PERHRFLAG,
            DHIRED, DRESIGN, DCONTRACT, DTERMINATE,
            LTERMINATE, LRESIGN, LPROJECTBA, CONFIDENTI,
            WITH_ATM, LECOLA, ECOLAAUTO,
            TERMREASON, BIRTHPLACE, CITIZENSHI,
            TELNO, ZIPCODE, SPOUSE, SPOUSETIN,
            EMER_NAME, EMER_NO, PICT_PATH,
            HEIGHT, WEIGHT, RELIGION,
            BANK_NAME, ACCT_NO,
            TIN_NO, SSS_NO, PH_NO, PI_NO,
            TIN_EXEMPT, SSS_EXEMPT, PH_EXEMPT, PI_EXEMPT,
            TIN_BASIS, SSS_BASIS, PH_BASIS, PI_BASIS,
            TIN_PBASIS, TAX_SHIELD, TAX_SHIEL2,
            TAXPERSHIE, TAXAMTSHIE,
            MONTH_COMP, DAILY_COMP, HOUR_COMP,
            NECOLAAMT, NECOLADAY, NECOLAHR,
            PREVGROSS, PREVPI_EE, PREVPI_ER,
            PAY_TAX, PAY_SSS, NBONUS, NWTAX,
            NTOTTAXINC, NPREMDED,
            SPOUSEGROS, SPOUSEWITH,
            BDATE, SPOUSEEFFY,
            AGE
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, '',
            ?, ?, ?, ?,
            '', '', '', '',
            '', 0, 'M', '', '',
            0, 0,
            '1900-01-01', '1900-01-01', '1900-01-01', '1900-01-01',
            0, 0, 0, 0,
            0, 0, 0,
            '', '', '',
            '', '', '', '',
            '', '', '',
            '', '', '',
            '', '',
            '', '', '', '',
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0,
            0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0, 0,
            0, 0,
            0, 0,
            '1900-01-01', '1900-01-01',
            0
        )
    `;

    db.query(sql, [
        ccode, firstname, middlename || '', lastname, fullname,
        email || '', phone || '', address || '',
        position || '', department || '', isActive, empStatus
    ], (err, result) => {
        if (err) {
            console.error("MYSQL INSERT ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Employee added successfully." });
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

// ADD NEW SHIFT
app.post('/api/shifts', (req, res) => {
    const { ccode, cdesc, clogin, clogout, workhrs } = req.body;
    const sql = "INSERT INTO shiftdb (CCODE, CDESC, CLOGIN, CLOGOUT, WORKHRS) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [ccode, cdesc, clogin, clogout, workhrs], (err) => {
        if (err) {
            console.error("MYSQL INSERT ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Shift added successfully." });
    });
});

// UPDATE SHIFT
app.put('/api/shifts/:id', (req, res) => {
    const { cdesc, clogin, clogout, workhrs } = req.body;
    const sql = "UPDATE shiftdb SET CDESC = ?, CLOGIN = ?, CLOGOUT = ?, WORKHRS = ? WHERE CCODE = ?";
    db.query(sql, [cdesc, clogin, clogout, workhrs, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json({ message: "Shift updated successfully." });
    });
});

// DELETE SHIFT
app.delete('/api/shifts/:id', (req, res) => {
    const sql = "DELETE FROM shiftdb WHERE CCODE = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Shift not found." });
        res.json({ message: "Shift deleted successfully." });
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

// 7. DELETE A HOLIDAY
app.delete('/api/holidays/:month/:day/:branchcode', (req, res) => {
    const { month, day, branchcode } = req.params;
    
    // We use Month, Day, and BranchCode to ensure we delete the specific holiday
    const sql = "DELETE FROM holiday WHERE MONTH = ? AND DAY = ? AND BRANCHCODE = ?";
    
    db.query(sql, [month, day, branchcode], (err, result) => {
        if (err) {
            console.error("MYSQL DELETE ERROR:", err.sqlMessage); 
            return res.status(500).json({ error: err.sqlMessage });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Holiday not found." });
        }

        res.json({ message: "Holiday deleted successfully" });
    });
});

// 8. UPDATE AN EXISTING HOLIDAY
app.put('/api/holidays', (req, res) => {
    const { 
        oldMonth, oldDay, oldBranchCode, // Used to find the record
        month, day, holiday, type, branchcode, branchdesc, desc_text // New values
    } = req.body;

    const sql = `
        UPDATE holiday 
        SET MONTH = ?, DAY = ?, HOLIDAY = ?, TYPE = ?, BRANCHCODE = ?, BRANCHDESC = ?, DESC_TEXT = ?
        WHERE MONTH = ? AND DAY = ? AND BRANCHCODE = ?`;

    const params = [month, day, holiday, type, branchcode, branchdesc, desc_text, oldMonth, oldDay, oldBranchCode];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("MYSQL UPDATE ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Update successful" });
    });
});

// 9. GET DTR FOR SPECIFIC EMPLOYEE (For View DTR Page)
app.get('/api/dtr/:empcode', (req, res) => {
    const sql = "SELECT * FROM tmpdtrf1 WHERE CEMPCODE = ? ORDER BY DTR_DATE DESC";
    db.query(sql, [req.params.empcode], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 10. START SERVER
app.listen(3000, () => {
    console.log("TimeRoll Backend running on http://localhost:3000");
});
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

// GET ALL BREAKS
app.get('/api/breaks', (req, res) => {
    const sql = `
        SELECT b.CCODE, b.DESC_TEXT, b.BREAK_OUT, b.BREAK_IN,
               b.ISNEXTDAY, b.SYSBRKDESC, b.SHIFTCODE,
               b.BREAKSEQ, s.CDESC AS SHIFT_NAME
        FROM breaksched b
        LEFT JOIN shiftdb s ON b.SHIFTCODE = s.CCODE
        ORDER BY b.SHIFTCODE, b.BREAKSEQ
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json(results);
    });
});

// ADD BREAK
app.post('/api/breaks', (req, res) => {
    const { ccode, descText, breakOut, breakIn, isNextDay, sysBrkDesc, shiftCode, breakSeq } = req.body;
    const sql = `
        INSERT INTO breaksched 
            (CCODE, DESC_TEXT, BREAK_OUT, BREAK_IN, ISNEXTDAY, SYSBRKDESC, SHIFTCODE, BREAKSEQ)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [ccode, descText, breakOut, breakIn, isNextDay ? 1 : 0, sysBrkDesc, shiftCode, breakSeq], (err) => {
        if (err) {
            console.error("MYSQL INSERT ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Break added successfully." });
    });
});

// UPDATE BREAK BY CCODE
app.put('/api/breaks/:ccode', (req, res) => {
    const { newCcode, descText, breakOut, breakIn, isNextDay, sysBrkDesc, breakSeq, shiftCode } = req.body;
    const oldCcode = req.params.ccode;

    // If code hasn't changed, just update normally
    if (newCcode === oldCcode) {
        const sql = `
            UPDATE breaksched
            SET DESC_TEXT = ?, BREAK_OUT = ?, BREAK_IN = ?,
                ISNEXTDAY = ?, SYSBRKDESC = ?, BREAKSEQ = ?
            WHERE CCODE = ?
        `;
        db.query(sql, [descText, breakOut, breakIn, isNextDay ? 1 : 0, sysBrkDesc, breakSeq, oldCcode], (err) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            res.json({ message: "Break updated successfully." });
        });
    } else {
        // Code changed — delete old, insert new
        const deleteSql = "DELETE FROM breaksched WHERE CCODE = ?";
        db.query(deleteSql, [oldCcode], (err) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });

            const insertSql = `
                INSERT INTO breaksched 
                    (CCODE, DESC_TEXT, BREAK_OUT, BREAK_IN, ISNEXTDAY, SYSBRKDESC, SHIFTCODE, BREAKSEQ)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertSql, [newCcode, descText, breakOut, breakIn, isNextDay ? 1 : 0, sysBrkDesc, shiftCode, breakSeq], (err) => {
                if (err) return res.status(500).json({ error: err.sqlMessage });
                res.json({ message: "Break updated successfully." });
            });
        });
    }
});

// DELETE BREAK BY CCODE
app.delete('/api/breaks/:ccode', (req, res) => {
    const sql = "DELETE FROM breaksched WHERE CCODE = ?";
    db.query(sql, [req.params.ccode], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Break not found." });
        res.json({ message: "Break deleted successfully." });
    });
});

// DELETE ALL BREAKS FOR A SHIFT (used when re-saving breaks on edit)
app.delete('/api/breaks/shift/:shiftCode', (req, res) => {
    const sql = "DELETE FROM breaksched WHERE SHIFTCODE = ?";
    db.query(sql, [req.params.shiftCode], (err) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json({ message: "Breaks cleared." });
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

// POST /api/login  — authenticate a user against the users table
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const sql = 'SELECT id, username, role, emp_code FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error('Login query error:', err.sqlMessage);
            return res.status(500).json({ error: 'Server error.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const user = results[0];
        res.json({
            message: 'Login successful.',
            username: user.username,
            role: user.role,
            emp_code: user.emp_code || null
        });
    });
});
 
 
// POST /api/users  — admin creates a new user account
// Requires adminUser + adminPass in the body to verify the requester is an admin
app.post('/api/users', (req, res) => {
    const { adminUser, adminPass, username, password, role, empCode } = req.body;
 
    if (!adminUser || !adminPass || !username || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
 
    // 1. Verify admin credentials
    const verifySql = "SELECT role FROM users WHERE username = ? AND password = ?";
    db.query(verifySql, [adminUser, adminPass], (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (results.length === 0) {
            return res.status(401).json({ error: 'Admin verification failed. Check your credentials.' });
        }
        if (results[0].role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can create new accounts.' });
        }
 
        // 2. Check if username already exists
        const checkSql = "SELECT id FROM users WHERE username = ?";
        db.query(checkSql, [username], (err, existing) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            if (existing.length > 0) {
                return res.status(409).json({ error: `Username "${username}" is already taken.` });
            }
 
            // 3. Insert new user (role defaults to 'admin' in DB but we set it explicitly here)
            const insertSql = "INSERT INTO users (username, password, role, emp_code) VALUES (?, ?, ?, ?)";
            db.query(insertSql, [username, password, role, empCode || null], (err) => {
                if (err) {
                    console.error('Insert user error:', err.sqlMessage);
                    return res.status(500).json({ error: err.sqlMessage });
                }
                res.json({ message: `Account "${username}" created successfully.` });
            });
        });
    });
});
 
 
// GET /api/users  — list all users (admin only, verified server-side)
// Usage: GET /api/users?adminUser=xxx&adminPass=yyy
app.get('/api/users', (req, res) => {
    const { adminUser, adminPass } = req.query;
 
    const verifySql = "SELECT role FROM users WHERE username = ? AND password = ?";
    db.query(verifySql, [adminUser, adminPass], (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
 
        const sql = "SELECT id, username, role FROM users ORDER BY id DESC";
        db.query(sql, (err, users) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            res.json(users);
        });
    });
});
 
 
// DELETE /api/users/:id  — admin deletes a user account
app.delete('/api/users/:id', (req, res) => {
    const { adminUser, adminPass } = req.body;
 
    const verifySql = "SELECT role FROM users WHERE username = ? AND password = ?";
    db.query(verifySql, [adminUser, adminPass], (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
 
        const sql = "DELETE FROM users WHERE id = ?";
        db.query(sql, [req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found.' });
            res.json({ message: 'User deleted.' });
        });
    });
});

// Helper: PH-time date string  →  "YYYY-MM-DD"
function phDate(d = new Date()) {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function phNow() {
    const now = new Date();
    const ph  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const pad = n => String(n).padStart(2, '0');
    return `${ph.getFullYear()}-${pad(ph.getMonth()+1)}-${pad(ph.getDate())} ${pad(ph.getHours())}:${pad(ph.getMinutes())}:${pad(ph.getSeconds())}`;
}

// Helper: current datetime in MySQL-friendly format
function sqlNow() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// POST /api/dtr/checkin
app.post('/api/dtr/checkin', (req, res) => {
    const { empCode } = req.body;
    if (!empCode) return res.status(400).json({ error: 'Employee code required.' });

    const today    = phDate();
    const nowSql   = phNow();

    // 1. Verify employee exists
    db.query(
        'SELECT CFULLNAME, BRANCHID FROM employee WHERE CCODE = ?',
        [empCode],
        (err, empRows) => {
            if (err)  return res.status(500).json({ error: err.sqlMessage });
            if (!empRows.length)
                return res.status(404).json({ error: 'Employee record not found.' });

            // 2. Check for an open session (any date — catches carry-over from yesterday)
            db.query(
                "SELECT id, session_date FROM dtr_sessions WHERE emp_code = ? AND status = 'open' LIMIT 1",
                [empCode],
                (err, openRows) => {
                    if (err) return res.status(500).json({ error: err.sqlMessage });

                    if (openRows.length) {
                        const d = new Date(openRows[0].session_date)
                            .toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
                        return res.status(409).json({
                            error: `You have an open session from ${d}. Please check out first.`
                        });
                    }

                    // 3. Insert new session
                    db.query(
                        `INSERT INTO dtr_sessions
                            (emp_code, session_date, checkin_time, status)
                         VALUES (?, ?, ?, 'open')`,
                        [empCode, today, nowSql],
                        (err, result) => {
                            if (err) return res.status(500).json({ error: err.sqlMessage });
                            res.json({
                                message:     'Check-in successful.',
                                sessionId:   result.insertId,
                                checkinTime: nowSql
                            });
                        }
                    );
                }
            );
        }
    );
});

// ── GET /api/dtr/sessions/:empCode?date=YYYY-MM-DD ────────────
// Returns all sessions for an employee on a given date (today if omitted).
// Also returns the daily total and flags any orphaned sessions.
app.get('/api/dtr/sessions/:empCode', (req, res) => {
    const empCode = req.params.empCode;
    const date    = req.query.date || phDate();

    db.query(
        `SELECT
            id, session_date, checkin_time, checkout_time,
            work_hrs, status, created_at
         FROM dtr_sessions
         WHERE emp_code = ? AND session_date = ?
         ORDER BY checkin_time ASC`,
        [empCode, date],
        (err, sessions) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });

            const totalHrs = sessions.reduce((sum, s) => sum + (parseFloat(s.work_hrs) || 0), 0);
            const hasOpen  = sessions.some(s => s.status === 'open');
            const orphaned = sessions.filter(s => s.status === 'orphaned');

            res.json({ date, sessions, totalHrs: +totalHrs.toFixed(2), hasOpen, orphaned });
        }
    );
});

// ── GET /api/dtr/status/:empCode ──────────────────────────────
// Quick status check — does this employee have an open session right now?
app.get('/api/dtr/status/:empCode', (req, res) => {
    db.query(
        `SELECT id, checkin_time, session_date
         FROM dtr_sessions
         WHERE emp_code = ? AND status = 'open'
         LIMIT 1`,
        [req.params.empCode],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            if (!rows.length) return res.json({ isClockedIn: false });

            res.json({
                isClockedIn:  true,
                sessionId:    rows[0].id,
                checkinTime:  rows[0].checkin_time,
                sessionDate:  rows[0].session_date
            });
        }
    );
});

// ── POST /api/dtr/auto-checkout ───────────────────────────────
// Called by a scheduled job (midnight cron) or manually by an admin.
// Closes any open sessions older than `cutoffHours` (default 14h).
// Marks them 'auto_closed' and flags truly orphaned ones.
app.post('/api/dtr/auto-checkout', (req, res) => {
    const { adminUser, adminPass } = req.body;
    const cutoffHours = req.body.cutoffHours ?? 14;

    // Admin verification
    db.query(
        "SELECT role FROM users WHERE username = ? AND password = ?",
        [adminUser, adminPass],
        (err, authRows) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            if (!authRows.length || authRows[0].role !== 'admin')
                return res.status(403).json({ error: 'Admin access required.' });

            const cutoffSql = phNow(); // reference point

            // Find all open sessions older than cutoffHours
            db.query(
                `SELECT id, emp_code, checkin_time
                 FROM dtr_sessions
                 WHERE status = 'open'
                   AND checkin_time <= DATE_SUB(?, INTERVAL ? HOUR)`,
                [cutoffSql, cutoffHours],
                (err, stale) => {
                    if (err) return res.status(500).json({ error: err.sqlMessage });
                    if (!stale.length)
                        return res.json({ message: 'No stale sessions found.', closed: 0 });

                    // Batch-update them
                    const ids     = stale.map(s => s.id);
                    const nowSql  = phNow();
                    const details = stale.map(s => {
                        const hrs = ((new Date(nowSql) - new Date(s.checkin_time)) / 3600000).toFixed(2);
                        return { id: s.id, empCode: s.emp_code, workHrs: hrs };
                    });

                    db.query(
                        `UPDATE dtr_sessions
                         SET checkout_time = ?,
                             work_hrs = TIMESTAMPDIFF(SECOND, checkin_time, ?) / 3600,
                             status = 'auto_closed',
                             updated_at = ?
                         WHERE id IN (?)`,
                        [nowSql, nowSql, nowSql, ids],
                        (err) => {
                            if (err) return res.status(500).json({ error: err.sqlMessage });
                            res.json({
                                message: `Auto-closed ${stale.length} stale session(s).`,
                                closed:  stale.length,
                                details
                            });
                        }
                    );
                }
            );
        }
    );
});

// GET /api/dtr/checked-in  — employees with an open session right now
app.get('/api/dtr/checked-in', (req, res) => {
    const sql = `
        SELECT
            e.CFULLNAME,
            e.DEPTID,
            s.checkin_time
        FROM dtr_sessions s
        JOIN employee e ON s.emp_code = e.CCODE
        WHERE s.status = 'open'
        ORDER BY s.checkin_time ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json(results);
    });
});

// ── GET /api/dtr/:empcode  (legacy — keep for View DTR page) ──
// Now aggregates from dtr_sessions instead of tmpdtrf1.
// Falls back to tmpdtrf1 for dates that predate the migration.
app.get('/api/dtr/:empcode', (req, res) => {
    const empcode = req.params.empcode;

    // STEP 1: Fetch employee + their assigned shift (this was missing!)
    db.query(
        `SELECT
            e.CCODE,
            e.CFULLNAME,
            e.SHIFT_ID,
            s.CDESC   AS SHIFT_DESC,
            s.CLOGIN  AS SHIFT_LOGIN,
            s.CLOGOUT AS SHIFT_LOGOUT,
            s.WORKHRS AS SHIFT_WORKHRS
         FROM employee e
         LEFT JOIN shiftdb s ON e.SHIFT_ID = s.CCODE
         WHERE e.CCODE = ?`,
        [empcode],
        (err, empRows) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            if (!empRows.length) return res.status(404).json({ error: 'Employee not found.' });

            const emp = empRows[0];

            function parseTimeToMinutes(timeStr) {
                 if (!timeStr) return null;
                timeStr = timeStr.trim();

                // HH:MM:SS or HH:MM, strictly 24-hour
                const match24 = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
                if (match24) {
                    const h = parseInt(match24[1]);
                    const m = parseInt(match24[2]);
                    if (h > 23 || m > 59) return null; // guards against garbage
                    return h * 60 + m;
                }

                // H:MM AM/PM, only if explicitly marked
                const matchAMPM = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                if (matchAMPM) {
                    let h = parseInt(matchAMPM[1]);
                    const m = parseInt(matchAMPM[2]);
                    const meridiem = matchAMPM[3].toUpperCase();
                    if (meridiem === 'PM' && h !== 12) h += 12;
                    if (meridiem === 'AM' && h === 12) h = 0;
                    return h * 60 + m;
                }

                return null; // unrecognized format — don't guess
            }

            function extractTimeFromDatetime(datetimeVal) {
                if (!datetimeVal) return null;
                const date = (datetimeVal instanceof Date)
                    ? datetimeVal
                    : new Date(String(datetimeVal).replace(' ', 'T'));

                return date.toLocaleTimeString('en-GB', {
                    timeZone: 'Asia/Manila',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }); // returns "HH:MM:SS" in PH time
            }

            function formatTime12h(datetimeVal) {
                if (!datetimeVal) return null;
                // Convert to PH time (UTC+8) before formatting
                const date = (datetimeVal instanceof Date)
                    ? datetimeVal
                    : new Date(String(datetimeVal).replace(' ', 'T'));
                
                return date.toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Manila',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }

            // STEP 2: Now fetch the DTR sessions
            db.query(
                `SELECT
                    session_date,
                    checkin_time,
                    checkout_time,
                    COALESCE(work_hrs, 0) AS work_hrs,
                    status
                 FROM dtr_sessions
                 WHERE emp_code = ?
                 ORDER BY checkin_time DESC`,
                [empcode],
                (err, sessions) => {
                    if (err) return res.status(500).json({ error: err.sqlMessage });

                    const shiftLoginMins  = parseTimeToMinutes(emp.SHIFT_LOGIN);
                    const shiftLogoutMins = parseTimeToMinutes(emp.SHIFT_LOGOUT);
                    console.log('SHIFT_LOGOUT raw:', emp.SHIFT_LOGOUT, 'parsed mins:', shiftLogoutMins);

                    const rows = sessions.map(s => {
                        const rawDate = (s.session_date instanceof Date)
                            ? s.session_date.toISOString().slice(0, 10)
                            : String(s.session_date).slice(0, 10);

                        const checkinMins  = parseTimeToMinutes(extractTimeFromDatetime(s.checkin_time));
                        const checkoutMins = parseTimeToMinutes(extractTimeFromDatetime(s.checkout_time));
                        console.log('checkout raw:', s.checkout_time, 'extracted:', extractTimeFromDatetime(s.checkout_time), 'parsed mins:', checkoutMins);

                        const lateMins = (checkinMins !== null && shiftLoginMins !== null)
                            ? Math.max(0, checkinMins - shiftLoginMins) : 0;
                        const otMins = (checkoutMins !== null && shiftLogoutMins !== null)
                            ? Math.max(0, checkoutMins - shiftLogoutMins) : 0;

                        return {
                            DTR_DATE:    rawDate,
                            SHIFT_DESC:  emp.SHIFT_DESC  || '—',
                            SHIFT_SCHED: emp.SHIFT_LOGIN && emp.SHIFT_LOGOUT
                                             ? `${emp.SHIFT_LOGIN} – ${emp.SHIFT_LOGOUT}`
                                             : '—',
                            TIME_IN:     formatTime12h(s.checkin_time)  || '—',
                            TIME_OUT:    formatTime12h(s.checkout_time) || 'Open',
                            WORKHRS:     parseFloat(s.work_hrs).toFixed(2),
                            NLATE:       lateMins,
                            NREGOT:      otMins,
                            REMARKS:     s.status
                        };
                    });

                    res.json({
                        employee: {
                            code:      emp.CCODE,
                            name:      emp.CFULLNAME,
                            shiftDesc: emp.SHIFT_DESC  || 'No shift assigned',
                            shiftIn:   emp.SHIFT_LOGIN || '—',
                            shiftOut:  emp.SHIFT_LOGOUT|| '—',
                            shiftHrs:  emp.SHIFT_WORKHRS || '—'
                        },
                        records: rows
                    });
                }
            );
        }
    );
});

// POST /api/dtr/checkout
app.post('/api/dtr/checkout', (req, res) => {
    const { empCode } = req.body;
    if (!empCode) return res.status(400).json({ error: 'Employee code required.' });

    const nowSql = phNow();

    db.query(
        "SELECT id, checkin_time FROM dtr_sessions WHERE emp_code = ? AND status = 'open' LIMIT 1",
        [empCode],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            if (!rows.length)
                return res.status(404).json({ error: 'No open check-in found. Please check in first.' });

            const session = rows[0];
            const workHrs = (
                (new Date(nowSql) - new Date(session.checkin_time)) / 3600000
            ).toFixed(2);

            db.query(
                `UPDATE dtr_sessions
                 SET checkout_time = ?, work_hrs = ?, status = 'closed', updated_at = ?
                 WHERE id = ?`,
                [nowSql, workHrs, nowSql, session.id],
                (err) => {
                    if (err) return res.status(500).json({ error: err.sqlMessage });
                    res.json({
                        message:      'Check-out successful.',
                        checkoutTime: nowSql,
                        workHrs:      parseFloat(workHrs)
                    });
                }
            );
        }
    );
});

// 10. START SERVER
app.listen(3000, () => {
    console.log("TimeRoll Backend running on http://localhost:3000");
});
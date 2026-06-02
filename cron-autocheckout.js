// cron-autocheckout.js
// Run this daily at midnight, e.g.:
//   crontab: 0 0 * * * node /path/to/cron-autocheckout.js
//   Windows: Task Scheduler → Action: node C:\path\cron-autocheckout.js

const mysql = require('mysql2');

const db = mysql.createConnection({
    host:     'localhost',
    user:     'root',
    password: '',
    database: 'Partime'
});

const CUTOFF_HOURS = 14; // sessions open longer than this get auto-closed

db.connect(err => {
    if (err) { console.error('DB connect failed:', err); process.exit(1); }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 1. Find all open sessions older than CUTOFF_HOURS
    db.query(
        `SELECT id, emp_code, checkin_time
         FROM dtr_sessions
         WHERE status = 'open'
           AND checkin_time <= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        [CUTOFF_HOURS],
        (err, stale) => {
            if (err) { console.error('Query error:', err); db.end(); return; }

            if (!stale.length) {
                console.log(`[${now}] Auto-checkout: no stale sessions.`);
                db.end();
                return;
            }

            const ids = stale.map(s => s.id);
            db.query(
                `UPDATE dtr_sessions
                 SET
                     checkout_time = NOW(),
                     work_hrs      = TIMESTAMPDIFF(SECOND, checkin_time, NOW()) / 3600,
                     status        = 'auto_closed',
                     updated_at    = NOW()
                 WHERE id IN (?)`,
                [ids],
                (err) => {
                    if (err) { console.error('Update error:', err); db.end(); return; }

                    console.log(`[${now}] Auto-closed ${stale.length} session(s):`);
                    stale.forEach(s =>
                        console.log(`  emp=${s.emp_code}  in=${s.checkin_time}  session_id=${s.id}`)
                    );

                    // 2. Flag truly orphaned sessions (open but session_date < today)
                    db.query(
                        `UPDATE dtr_sessions
                         SET status = 'orphaned'
                         WHERE status = 'open'
                           AND session_date < CURDATE()`,
                        (err) => {
                            if (err) console.error('Orphan flag error:', err);
                            db.end();
                        }
                    );
                }
            );
        }
    );
});
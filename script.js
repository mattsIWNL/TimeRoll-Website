let isEditMode = false;
let editIdentifiers = {};
let isEditShift = false;
let editShiftCode = '';
let breakRowCount = 0;

function to12Hour(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function to24Hour(timeStr) {
    if (!timeStr) return '';
    const [time, modifier] = timeStr.trim().split(' ');
    if (!modifier) return timeStr; // already 24hr
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function addBreakRow(data = null) {
    breakRowCount++;
    const seq = breakRowCount;
    const container = document.getElementById('breakRowsContainer');
    const noBreaksMsg = document.getElementById('noBreaksMsg');
    if (noBreaksMsg) noBreaksMsg.style.display = 'none';

    const row = document.createElement('div');
    row.className = 'break-row';
    row.dataset.seq = seq;
    row.style.cssText = 'background:#f9f9f9; border:1px solid #e0e0e0; border-radius:8px; padding:12px; margin-bottom:10px; position:relative;';

    row.innerHTML = `
        <button type="button" onclick="removeBreakRow(this)" 
            style="position:absolute; top:8px; right:10px; background:none; border:none; color:#e74c3c; cursor:pointer; font-size:14px;">
            <i class="fas fa-times"></i>
        </button>
        <div style="font-size:12px; font-weight:600; color:#666; margin-bottom:8px;">Break #${seq}</div>
        <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
                <label style="font-size:12px;">Break Code <span style="color:red;">*</span></label>
                <input type="text" class="brk-ccode" placeholder="e.g. BRK00${seq}" 
                    value="${data ? data.CCODE : ''}">
            </div>
            <div class="form-group">
                <label style="font-size:12px;">Description <span style="color:red;">*</span></label>
                <input type="text" class="brk-desc" placeholder="e.g. Lunch Break" 
                    value="${data ? data.DESC_TEXT : ''}">
            </div>
        </div>
        <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
                <label style="font-size:12px;">Break Out <span style="color:red;">*</span></label>
                <input type="time" class="brk-out" value="${data ? to24Hour(data.BREAK_OUT) : ''}">
            </div>
            <div class="form-group">
                <label style="font-size:12px;">Break In <span style="color:red;">*</span></label>
                <input type="time" class="brk-in" value="${data ? to24Hour(data.BREAK_IN) : ''}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label style="font-size:12px;">System Break Desc <span style="color:red;">*</span></label>
                <input type="text" class="brk-sysdesc" placeholder="e.g. LUNCH" 
                    value="${data ? data.SYSBRKDESC : ''}">
            </div>
            <div class="form-group" style="flex-direction:row; align-items:center; gap:8px; padding-top:20px;">
                <input type="checkbox" class="brk-nextday" ${data && data.ISNEXTDAY ? 'checked' : ''} 
                    style="width:auto;">
                <label style="margin:0; font-size:12px;">Continues to next day</label>
            </div>
        </div>
    `;

    container.appendChild(row);
}

function removeBreakRow(btn) {
    const row = btn.closest('.break-row');
    row.remove();
    const container = document.getElementById('breakRowsContainer');
    const remaining = container.querySelectorAll('.break-row');
    if (remaining.length === 0) {
        document.getElementById('noBreaksMsg').style.display = 'block';
    }
    // Re-number the remaining rows
    remaining.forEach((r, i) => {
        r.querySelector('div[style*="Break #"]').textContent = `Break #${i + 1}`;
        r.dataset.seq = i + 1;
    });
}

function clearShiftModal() {
    ['shiftCode','shiftDesc','shiftLogin','shiftLogout','shiftWorkhrs']
        .forEach(id => document.getElementById(id).value = '');
    document.getElementById('shiftCode').disabled = false;
    document.getElementById('breakRowsContainer').innerHTML = `
        <p id="noBreaksMsg" style="color:#999; font-size:13px; text-align:center; padding:10px 0;">
            No breaks added. Click "Add Break" to configure rest periods.
        </p>`;
    document.getElementById('shiftModalError').style.display = 'none';
    breakRowCount = 0;
}

function openEditShift(code, desc, login, logout, workhrs) {
    isEditShift = true;
    editShiftCode = code;

    document.getElementById('shiftModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Shift';
    document.getElementById('shiftCode').value    = code;
    document.getElementById('shiftCode').disabled = true;
    document.getElementById('shiftDesc').value    = desc;
    document.getElementById('shiftLogin').value   = to24Hour(login);
    document.getElementById('shiftLogout').value  = to24Hour(logout);
    document.getElementById('shiftWorkhrs').value = workhrs;
    document.getElementById('confirmShift').textContent = 'Update Shift';
    document.getElementById('shiftModalError').style.display = 'none';

    // Clear break rows then load existing breaks for this shift
    document.getElementById('breakRowsContainer').innerHTML = `
        <p id="noBreaksMsg" style="color:#999; font-size:13px; text-align:center; padding:10px 0;">
            No breaks added. Click "Add Break" to configure rest periods.
        </p>`;
    breakRowCount = 0;

    fetch('http://localhost:3000/api/breaks')
        .then(r => r.json())
        .then(breaks => {
            const shiftBreaks = breaks.filter(b => b.SHIFTCODE === code);
            shiftBreaks.forEach(b => addBreakRow(b));
        })
        .catch(err => console.error('Error loading breaks for edit:', err));

    document.getElementById('shiftModal').style.display = 'flex';
}

function openEditBreakModal(b) {
    document.getElementById('editBrkCcode').value    = b.CCODE;
    document.getElementById('editBrkCcode').dataset.original = b.CCODE;
    document.getElementById('editBrkSeq').value      = b.BREAKSEQ;
    document.getElementById('editBrkDesc').value     = b.DESC_TEXT;
    document.getElementById('editBrkSysDesc').value  = b.SYSBRKDESC;
    document.getElementById('editBrkOut').value      = to24Hour(b.BREAK_OUT);
    document.getElementById('editBrkIn').value       = to24Hour(b.BREAK_IN);
    document.getElementById('editBrkNextDay').checked = b.ISNEXTDAY == 1;
    document.getElementById('editBrkShiftCode').value = b.SHIFTCODE;
    document.getElementById('editBreakError').style.display = 'none';
    document.getElementById('editBreakModal').style.display = 'flex';
}

async function deleteBreak(ccode, descText) {
    if (!confirm(`Delete break "${descText}"?`)) return;
    try {
        const response = await fetch(`http://localhost:3000/api/breaks/${ccode}`, { method: 'DELETE' });
        const result = await response.json();
        if (response.ok) {
            alert('Break deleted.');
            loadBreaksConfigTable();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Could not connect to server.');
    }
}

async function deleteShift(code) {
    if (!confirm(`Delete shift "${code}"? This will also remove all its break configs.`)) return;
    try {
        const response = await fetch(`http://localhost:3000/api/shifts/${code}`, { method: 'DELETE' });
        const result = await response.json();
        if (response.ok) {
            alert('Shift deleted.');
            loadShiftsTable();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Could not connect to server.');
    }
}

function openEditModal(h) {
    isEditMode = true;
    editIdentifiers = { oldMonth: h.MONTH, oldDay: h.DAY, oldBranchCode: h.BRANCHCODE };
 
    document.getElementById('hHoliday').value = h.HOLIDAY;
    document.getElementById('hMonth').value = h.MONTH;
    document.getElementById('hDay').value = h.DAY;
    document.getElementById('hType').value = h.TYPE;
    document.getElementById('hBranchCode').value = h.BRANCHCODE;
    document.getElementById('hBranchDesc').value = h.BRANCHDESC;
 
    document.querySelector('#holidayFormContainer h3').textContent = "Edit Holiday";
    document.getElementById('saveHolidayToDB').textContent = "Update Database";
    document.getElementById('holidayFormContainer').style.display = 'block';
}

function openEditShift(code, desc, login, logout, workhrs) {
    isEditShift = true;
    editShiftCode = code;
    document.getElementById('shiftModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Shift';
    document.getElementById('shiftCode').value    = code;
    document.getElementById('shiftCode').disabled = true;
    document.getElementById('shiftDesc').value    = desc;
    document.getElementById('shiftLogin').value   = login;
    document.getElementById('shiftLogout').value  = logout;
    document.getElementById('shiftWorkhrs').value = workhrs;
    document.getElementById('confirmShift').textContent = 'Update Shift';
    document.getElementById('shiftModalError').style.display = 'none';
    document.getElementById('shiftModal').style.display = 'flex';
}

async function deleteShift(code) {
    if (!confirm(`Delete shift "${code}"? Employees assigned to it will lose their schedule.`)) return;
    try {
        const response = await fetch(`http://localhost:3000/api/shifts/${code}`, { method: 'DELETE' });
        const result = await response.json();
        if (response.ok) {
            alert('Shift deleted.');
            loadShiftsTable();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Could not connect to server.');
    }
}

// --- 1. GATEKEEPER ---
const isLoggedIn  = localStorage.getItem('isLoggedIn');
const currentRole = localStorage.getItem('userRole');
const onLoginPage = window.location.pathname.includes('login.html');

if (!isLoggedIn && !onLoginPage) {
    window.location.href = 'login.html';
}

function isAdmin() {
    return localStorage.getItem('userRole') === 'admin';
}

function requireAdmin() {
    if (!isAdmin()) {
        alert('Access denied. This section requires admin privileges.');
        window.location.href = 'index.html';
    }
}
 
// --- 2. GLOBAL FUNCTIONS ---
 
async function loadEmployeeTable() {
     const tableBody = document.querySelector('#list-view .employee-table tbody');
    if (!tableBody) return;
    try {
        const response = await fetch('http://localhost:3000/api/employees');
        const employees = await response.json();
        tableBody.innerHTML = '';
        employees.forEach(emp => {
            tableBody.innerHTML += `
                <tr>
                    <td>${emp.CCODE}</td>
                    <td>${emp.CFULLNAME}</td>
                    <td>${emp.POSITION_I}</td>
                    <td>${emp.DEPTID || '—'}</td>
                    <td>${emp.EMAIL_ADD || '—'}</td>
                    <td>${emp.MOBILENO || '—'}</td>
                    <td>${emp.ADDRESS1 || '—'}</td>
                    <td><span class="status-pill">${emp.ACTIVE ? 'Active' : 'Inactive'}</span></td>
                </tr>`;
        });
    } catch (error) { console.error("Error loading employees:", error); }
}

async function loadBreaksTable() {
    const tableBody = document.getElementById('breaksTableBody');
    if (!tableBody) return;

    // Break rules per shift
    const breakRules = {
        'Morning Shift':   { period: '11:00 AM – 12:00 NN', duration: '1 hour' },
        'Afternoon Shift': { period: '05:00 PM – 06:00 PM', duration: '1 hour' },
        'Night Shift':     { period: '01:00 AM – 02:00 AM', duration: '1 hour' }
    };

    const shiftBadgeClass = {
        'Morning Shift':   'shift-morning',
        'Afternoon Shift': 'shift-afternoon',
        'Night Shift':     'shift-night'
    };

    try {
        const response = await fetch('http://localhost:3000/api/employees');
        const employees = await response.json();
        tableBody.innerHTML = '';

        employees.forEach(emp => {
            const shift = emp.SHIFT_TYPE || 'Morning Shift'; // fallback default
            const rule  = breakRules[shift] || { period: 'N/A', duration: 'N/A' };
            const badge = shiftBadgeClass[shift] || '';

            tableBody.innerHTML += `
                <tr>
                    <td>${emp.CCODE}</td>
                    <td>${emp.CFULLNAME}</td>
                    <td>${emp.DEPARTMENT || '—'}</td>
                    <td><span class="badge ${badge}">${shift}</span></td>
                    <td>${emp.SHIFT_HOURS || '—'}</td>
                    <td>${rule.period}</td>
                    <td>${rule.duration}</td>
                </tr>`;
        });
    } catch (error) {
        console.error('Error loading breaks table:', error);
    }
}

async function loadShiftDropdown() {
    const select = document.getElementById('editSchedule');
    if (!select) return;
    try {
        const response = await fetch('http://localhost:3000/api/shifts');
        const shifts = await response.json();
        select.innerHTML = '<option value="">-- Select Schedule --</option>';
        shifts.forEach(s => {
            select.innerHTML += `<option value="${s.CCODE}">${s.CDESC} (${s.CLOGIN} - ${s.CLOGOUT})</option>`;
        });
    } catch (err) {
        console.error('Error loading shifts:', err);
    }
}

async function loadShiftsTable() {
    const tableBody = document.getElementById('shiftsTableBody');
    if (!tableBody) return;
    try {
        const response = await fetch('http://localhost:3000/api/shifts');
        const shifts = await response.json();
        tableBody.innerHTML = '';
        if (shifts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">No shifts found. Create one to get started.</td></tr>';
            return;
        }
        shifts.forEach(s => {
            tableBody.innerHTML += `
                <tr>
                    <td>${s.CCODE}</td>
                    <td>${s.CDESC}</td>
                    <td>${s.CLOGIN}</td>
                    <td>${s.CLOGOUT}</td>
                    <td>${s.WORKHRS} hrs</td>
                    <td style="text-align:center;">
                        <button class="action-icon edit" onclick="openEditShift('${s.CCODE}','${s.CDESC}','${s.CLOGIN}','${s.CLOGOUT}',${s.WORKHRS})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" onclick="deleteShift('${s.CCODE}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error('Error loading shifts:', err);
    }
}

async function loadAssignedScheduleTable() {
    const tableBody = document.getElementById('assignedScheduleBody');
    if (!tableBody) return;
    try {
        const response = await fetch('http://localhost:3000/api/employees');
        const employees = await response.json();
        tableBody.innerHTML = '';

        if (employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#999;">No employees found.</td></tr>';
            return;
        }

        employees.forEach(emp => {
            const hasShift = emp.SHIFT_TYPE && emp.SHIFT_TYPE.trim() !== '';
            const shiftBadgeClass = {
                'Morning Shift':   'shift-morning',
                'Afternoon Shift': 'shift-afternoon',
                'Night Shift':     'shift-night'
            }[emp.SHIFT_TYPE] || '';

            tableBody.innerHTML += `
                <tr>
                    <td>${emp.CCODE}</td>
                    <td>${emp.CFULLNAME}</td>
                    <td>${emp.POSITION_I || '—'}</td>
                    <td>${emp.DEPTID || '—'}</td>
                    <td>${hasShift
                        ? `<span class="badge ${shiftBadgeClass}">${emp.SHIFT_TYPE}</span>`
                        : '<span style="color:#999;">— Unassigned —</span>'
                    }</td>
                    <td>${emp.SHIFT_IN  || '—'}</td>
                    <td>${emp.SHIFT_OUT || '—'}</td>
                    <td>${emp.SHIFT_HOURS ? emp.SHIFT_HOURS + ' hrs' : '—'}</td>
                </tr>`;
        });
    } catch (err) {
        console.error('Error loading assigned schedules:', err);
    }
}

async function loadBreaksConfigTable() {
    const tableBody = document.getElementById('breaksConfigTableBody');
    if (!tableBody) return;
    try {
        const response = await fetch('http://localhost:3000/api/breaks');
        const breaks = await response.json();
        tableBody.innerHTML = '';

        if (breaks.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999;">No break configs found. Create a shift with breaks to populate this table.</td></tr>';
            return;
        }

        let lastShift = null;
        breaks.forEach(b => {
            const shiftBadgeClass = {
                'Morning Shift':   'shift-morning',
                'Afternoon Shift': 'shift-afternoon',
                'Night Shift':     'shift-night'
            }[b.SHIFT_NAME] || '';

            const shiftCell = b.SHIFTCODE !== lastShift
                ? `<span class="badge ${shiftBadgeClass}">${b.SHIFT_NAME || b.SHIFTCODE}</span>`
                : '<span style="color:#ccc;">—</span>';
            lastShift = b.SHIFTCODE;

            const bJson = JSON.stringify(b).replace(/"/g, '&quot;');
            tableBody.innerHTML += `
                <tr>
                    <td>${shiftCell}</td>
                    <td>${b.BREAKSEQ}</td>
                    <td>${b.DESC_TEXT}</td>
                    <td>${b.BREAK_OUT}</td>
                    <td>${b.BREAK_IN}</td>
                    <td>${b.ISNEXTDAY ? '<span class="status-pill">Yes</span>' : '—'}</td>
                    <td style="text-align:center;">
                        <button class="action-icon edit" onclick='openEditBreakModal(${bJson})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" onclick="deleteBreak('${b.CCODE}','${b.DESC_TEXT}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error('Error loading break configs:', err);
    }
}

async function loadHolidaysFromDB() {
    const tableBody = document.getElementById('holidayTableBody');
    if (!tableBody) return;
    try {
        const response = await fetch('http://localhost:3000/api/holidays');
        if (!response.ok) throw new Error('Network response was not ok');
        const holidays = await response.json();
        tableBody.innerHTML = '';
        const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        holidays.forEach(h => {
            const hString = JSON.stringify(h).replace(/"/g, '&quot;');
            tableBody.innerHTML += `
                <tr>
                    <td>${h.HOLIDAY}</td>
                    <td>${monthNames[h.MONTH]} ${h.DAY}</td>
                    <td><span class="badge ${h.TYPE === 'Legal' ? 'shift-morning' : 'shift-afternoon'}">${h.TYPE}</span></td>
                    <td>${h.BRANCHDESC}</td>
                    <td style="text-align: center;">
                        <button class="action-icon edit" onclick='openEditModal(${hString})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" onclick="deleteHoliday(${h.MONTH}, ${h.DAY}, '${h.BRANCHCODE}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    } catch (err) { console.error("Error loading holidays:", err); }
}
 
async function deleteHoliday(month, day, branch) {
    if (!confirm(`Are you sure you want to delete this holiday?`)) return;
    try {
        const response = await fetch(`http://localhost:3000/api/holidays/${month}/${day}/${branch}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            alert("Holiday deleted successfully.");
            loadHolidaysFromDB();
        } else {
            alert("Error deleting holiday: " + (result.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("Could not connect to server. Check if Node is running.");
    }
}
 
function loadSavedCompanyName() {
    const nameInput = document.getElementById('companyName');
    if (nameInput) {
        const savedName = localStorage.getItem('companyName');
        nameInput.value = savedName ? savedName : "Par Excellence Search Consulting Inc.";
    }
}
 
function updateTime() {
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    if (clockElement && dateElement) {
        const savedTZ = localStorage.getItem('sysTimezone') || 'Asia/Manila';
        const savedProcessDate = localStorage.getItem('processDate');
        const now = new Date();
        
        clockElement.textContent = now.toLocaleTimeString('en-US', { timeZone: savedTZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        
        if (savedProcessDate) {
            const pDate = new Date(savedProcessDate + 'T00:00:00');
            dateElement.textContent = pDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            dateElement.textContent = now.toLocaleDateString('en-US', { timeZone: savedTZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        const tzLabels = {
            'Asia/Manila':      'Philippine Standard Time',
            'Singapore':        'Singapore Standard Time',
            'UTC':              'Coordinated Universal Time',
            'America/New_York': 'Eastern Standard Time',
            'Europe/London':    'Greenwich Mean Time'
        };
        const homeDisplay = document.getElementById('homeTimezoneDisplay');
        if (homeDisplay) homeDisplay.textContent = tzLabels[savedTZ] || savedTZ;

        const activeDisplay = document.getElementById('activeTimezoneDisplay');
        if (activeDisplay) activeDisplay.textContent = tzLabels[savedTZ] || savedTZ;

    }
}

setInterval(updateTime, 1000);
updateTime();

async function loadCheckedInEmployees() {
    const tableBody = document.getElementById('checkedInTableBody');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:3000/api/dtr/checked-in');
        const employees = await response.json();
        tableBody.innerHTML = '';

        if (employees.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; color:#999;">
                        No employees currently checked in.
                    </td>
                </tr>`;
            return;
        }

        employees.forEach(emp => {
            const checkInTime = new Date(emp.checkin_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            tableBody.innerHTML += `
                <tr>
                    <td>${emp.CFULLNAME}</td>
                    <td>${emp.DEPTID || '—'}</td>
                    <td>${checkInTime}</td>
                </tr>`;
        });
    } catch (err) {
        console.error('Error loading checked-in employees:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; color:#e74c3c;">
                    Could not load data. Is the server running?
                </td>
            </tr>`;
    }
}

// --- 3. MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
 
    // Initial Loads
    loadSavedCompanyName();
    if (document.getElementById('holidayTableBody')) loadHolidaysFromDB();
    if (document.querySelector('#list-view .employee-table')) loadEmployeeTable();
    if (document.getElementById('breaksTableBody')) loadBreaksTable();
    if (document.getElementById('editSchedule')) loadShiftDropdown();
    if (document.getElementById('assignedScheduleBody')) loadAssignedScheduleTable();
    if (document.getElementById('breaksConfigTableBody')) loadBreaksConfigTable();
    if (document.getElementById('checkedInTableBody')) {
            loadCheckedInEmployees();
            setInterval(loadCheckedInEmployees, 30000); // refresh every 30s
        }
    
    document.querySelectorAll('.username').forEach(el => {
        el.textContent = localStorage.getItem('username') || 'User';
    });
    
     if (!isAdmin()) {
        document.querySelectorAll('.nav-links .dropdown').forEach(drop => {
            const links = drop.querySelectorAll('.dropdown-content a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                const adminPages = ['company.html','employee.html','schedule.html',
                                    'configuration.html','holiday-lookup.html',
                                    'change-process-date.html','convert-logs.html',
                                    'upload.html','generate.html'];
                if (adminPages.some(p => href && href.includes(p))) {
                    link.style.display = 'none';
                }
            });
        });
    }
 
    // ── CHECK IN / CHECK OUT  (multi-session version) ──────────────
    const btnCheckIn        = document.getElementById('btnCheckIn');
    const btnCheckOut       = document.getElementById('btnCheckOut');
    const attendanceStatus  = document.getElementById('attendanceStatus');
    const clockInDisplay    = document.getElementById('clockInDisplay');
    const attendanceMessage = document.getElementById('attendanceMessage');

    if (btnCheckIn && btnCheckOut) {
        const empCode  = localStorage.getItem('empCode');
        const userRole = localStorage.getItem('userRole');

        if (userRole === 'admin') {
            attendanceStatus.textContent = 'N/A (Admin)';
            btnCheckIn.disabled  = true;
            btnCheckOut.disabled = true;
            btnCheckIn.style.opacity  = '0.4';
            btnCheckOut.style.opacity = '0.4';

        } else if (!empCode) {
            attendanceStatus.textContent = 'Not linked to employee record';
            btnCheckIn.disabled  = true;
            btnCheckOut.disabled = true;
            btnCheckIn.style.opacity  = '0.4';
            btnCheckOut.style.opacity = '0.4';

        } else {

            // Always fetch live status from server on load
            fetchAndSyncStatus();

            btnCheckIn.addEventListener('click', async () => {
                btnCheckIn.disabled = true;
                try {
                    const res  = await fetch('http://localhost:3000/api/dtr/checkin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ empCode })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showAttendanceMsg(data.message, 'success');
                        await fetchAndSyncStatus();
                    } else {
                        showAttendanceMsg(data.error || 'Check-in failed.', 'error');
                        btnCheckIn.disabled = false;
                    }
                } catch {
                    showAttendanceMsg('Could not connect to server.', 'error');
                    btnCheckIn.disabled = false;
                }
            });

            btnCheckOut.addEventListener('click', async () => {
                btnCheckOut.disabled = true;
                try {
                    const res  = await fetch('http://localhost:3000/api/dtr/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ empCode })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showAttendanceMsg(
                            `${data.message}  Session: ${data.workHrs} hrs`, 'success'
                        );
                        await fetchAndSyncStatus();
                    } else {
                        showAttendanceMsg(data.error || 'Check-out failed.', 'error');
                        btnCheckOut.disabled = false;
                    }
                } catch {
                    showAttendanceMsg('Could not connect to server.', 'error');
                    btnCheckOut.disabled = false;
                }
            });
        }

        // Fetches live session status and updates the UI to match
        async function fetchAndSyncStatus() {
            const empCode = localStorage.getItem('empCode');
            if (!empCode) return;

            try {
                // Live open-session check
                const [statusRes, summaryRes] = await Promise.all([
                    fetch(`http://localhost:3000/api/dtr/status/${empCode}`),
                    fetch(`http://localhost:3000/api/dtr/sessions/${empCode}`)
                ]);
                const status  = await statusRes.json();
                const summary = await summaryRes.json();

                const isClockedIn   = status.isClockedIn;
                const sessionCount  = summary.sessions?.length || 0;
                const totalHrs      = summary.totalHrs || 0;

                updateAttendanceUI(isClockedIn, status.checkinTime, sessionCount, totalHrs);

                // Keep localStorage roughly in sync for other tabs
                localStorage.setItem('isClockedIn', String(isClockedIn));
            } catch {
                // Fallback to localStorage if server unreachable
                const isClockedIn = localStorage.getItem('isClockedIn') === 'true';
                const clockInTime  = localStorage.getItem('clockInTime');
                updateAttendanceUI(isClockedIn, clockInTime, '?', '?');
            }
        }

        function updateAttendanceUI(isClockedIn, checkinTime, sessionCount, totalHrs) {
            const timeLabel = checkinTime
                ? new Date(checkinTime).toLocaleTimeString('en-US',
                    { hour: '2-digit', minute: '2-digit' })
                : '';

            if (isClockedIn) {
                attendanceStatus.textContent      = 'In';
                attendanceStatus.style.color      = '#28a745';
                clockInDisplay.textContent        =
                    `Checked in at ${timeLabel}` +
                    (sessionCount > 1 ? `  ·  Session ${sessionCount} today (${totalHrs} hrs total)` : '');
                btnCheckIn.disabled               = true;
                btnCheckOut.disabled              = false;
                btnCheckIn.style.opacity          = '0.4';
                btnCheckOut.style.opacity         = '1';
            } else {
                attendanceStatus.textContent      = 'Out';
                attendanceStatus.style.color      = '#dc3545';
                clockInDisplay.textContent        = sessionCount > 0
                    ? `${sessionCount} session(s) today · ${totalHrs} hrs total`
                    : '';
                btnCheckIn.disabled               = false;
                btnCheckOut.disabled              = true;
                btnCheckIn.style.opacity          = '1';
                btnCheckOut.style.opacity         = '0.4';
            }
        }

        function showAttendanceMsg(msg, type) {
            attendanceMessage.textContent          = msg;
            attendanceMessage.style.display        = 'block';
            attendanceMessage.style.color          = type === 'success' ? '#155724' : '#dc3545';
            attendanceMessage.style.background     = type === 'success' ? '#d4edda' : '#fff5f5';
            attendanceMessage.style.padding        = '8px 12px';
            attendanceMessage.style.borderRadius   = '4px';
            attendanceMessage.style.border         = type === 'success'
                ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
            setTimeout(() => { attendanceMessage.style.display = 'none'; }, 5000);
        }
    }

    // EXIT / LOGOUT
    const exitBtn = document.querySelector('.exit-btn');
    const logoutModal = document.getElementById('logoutModal');
    if (exitBtn && logoutModal) {
        exitBtn.addEventListener('click', (e) => { e.preventDefault(); logoutModal.style.display = 'flex'; });
        document.getElementById('cancelLogout').addEventListener('click', () => { logoutModal.style.display = 'none'; });
        document.getElementById('confirmLogout').addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            localStorage.removeItem('isClockedIn');
            localStorage.removeItem('clockInTime');
            window.location.href = 'login.html';
        });
    }
 
    // ADD EMPLOYEE MODAL
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    const btnAddEmployee = document.querySelector('.btn-add');
    if (btnAddEmployee && addEmployeeModal) {

        // Open modal
        btnAddEmployee.addEventListener('click', () => {
            // Clear all fields
            ['newEmpId','newFirstName','newLastName','newPosition',
            'newDepartment','newEmail','newPhone','newAddress'].forEach(id => {
                document.getElementById(id).value = '';
            });
            document.getElementById('newStatus').value = 'Active';
            document.getElementById('addEmployeeError').style.display = 'none';
            addEmployeeModal.style.display = 'flex';
        });

        // Close modal
        document.getElementById('closeAddEmployeeModal').addEventListener('click', () => {
            addEmployeeModal.style.display = 'none';
        });
        document.getElementById('cancelAddEmployee').addEventListener('click', () => {
            addEmployeeModal.style.display = 'none';
        });

        // Close on backdrop click
        addEmployeeModal.addEventListener('click', (e) => {
            if (e.target === addEmployeeModal) addEmployeeModal.style.display = 'none';
        });

        // Save employee
        document.getElementById('confirmAddEmployee').addEventListener('click', async () => {
            const empId     = document.getElementById('newEmpId').value.trim();
            const firstName = document.getElementById('newFirstName').value.trim();
            const lastName  = document.getElementById('newLastName').value.trim();
            const errorDiv  = document.getElementById('addEmployeeError');
            

            // Validation: ID and Full Name required
            if (!empId || !firstName || !lastName) {
                errorDiv.style.display = 'block';
                return;
            }
            errorDiv.style.display = 'none';

            const payload = {
                ccode:      empId,
                firstname:  firstName,
                middlename: '',
                lastname:   lastName,
                position:   document.getElementById('newPosition').value.trim(),
                department: document.getElementById('newDepartment').value.trim(),
                email:      document.getElementById('newEmail').value.trim(),
                phone:      document.getElementById('newPhone').value.trim(),
                address:    document.getElementById('newAddress').value.trim(),
                status:     document.getElementById('newStatus').value
            };

            try {
                console.log("Sending payload:", JSON.stringify(payload));
                const response = await fetch('http://localhost:3000/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Employee added successfully!');
                    addEmployeeModal.style.display = 'none';
                    loadEmployeeTable(); // Refresh the table
                } else {
                    alert('Error saving employee: ' + (result.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Could not connect to server. Check if Node is running.');
            }
        });

        
    }

    // SHIFTS TABLE + MODAL
    if (document.getElementById('shiftsTableBody')) loadShiftsTable();

    const shiftModal = document.getElementById('shiftModal');
    const openAddShiftBtn = document.getElementById('openAddShiftModal');
    if (shiftModal && openAddShiftBtn) {

        // Open for Add
        openAddShiftBtn.addEventListener('click', () => {
            isEditShift = false;
            editShiftCode = '';
            document.getElementById('shiftModalTitle').innerHTML = '<i class="fas fa-clock"></i> Create New Shift';
            document.getElementById('confirmShift').textContent = 'Save Shift';
            clearShiftModal();
            shiftModal.style.display = 'flex';
        });

        document.getElementById('addBreakRowBtn').addEventListener('click', () => addBreakRow());

        document.getElementById('closeShiftModal').addEventListener('click', () => shiftModal.style.display = 'none');
        document.getElementById('cancelShift').addEventListener('click', () => shiftModal.style.display = 'none');
        shiftModal.addEventListener('click', (e) => { if (e.target === shiftModal) shiftModal.style.display = 'none'; });

        document.getElementById('confirmShift').addEventListener('click', async () => {
            const code    = document.getElementById('shiftCode').value.trim();
            const desc    = document.getElementById('shiftDesc').value.trim();
            const login   = document.getElementById('shiftLogin').value;
            const logout  = document.getElementById('shiftLogout').value;
            const workhrs = document.getElementById('shiftWorkhrs').value;
            const errorDiv = document.getElementById('shiftModalError');

            if (!code || !desc || !login || !logout || !workhrs) {
                errorDiv.style.display = 'block';
                return;
            }
            errorDiv.style.display = 'none';

            // Collect break rows
            const breakRows = document.querySelectorAll('#breakRowsContainer .break-row');
            const breaks = [];
            let breakValid = true;

            breakRows.forEach((row, i) => {
                const bCcode   = row.querySelector('.brk-ccode').value.trim();
                const bDesc    = row.querySelector('.brk-desc').value.trim();
                const bOut     = row.querySelector('.brk-out').value;
                const bIn      = row.querySelector('.brk-in').value;
                const bSysDesc = row.querySelector('.brk-sysdesc').value.trim();
                const bNextDay = row.querySelector('.brk-nextday').checked;

                if (!bCcode || !bDesc || !bOut || !bIn || !bSysDesc) {
                    breakValid = false;
                    row.style.borderColor = '#e74c3c';
                } else {
                    row.style.borderColor = '#e0e0e0';
                    breaks.push({
                        ccode:     bCcode,
                        descText:  bDesc,
                        breakOut:  to12Hour(bOut),
                        breakIn:   to12Hour(bIn),
                        sysBrkDesc: bSysDesc,
                        isNextDay: bNextDay,
                        shiftCode: code,
                        breakSeq:  i + 1
                    });
                }
            });

            if (!breakValid) {
                errorDiv.textContent = 'Please fill in all break fields.';
                errorDiv.style.display = 'block';
                return;
            }

            try {
                // 1. Save or update the shift
                const shiftPayload = { ccode: code, cdesc: desc, clogin: to12Hour(login), clogout: to12Hour(logout), workhrs: parseFloat(workhrs) };
                const shiftUrl    = isEditShift ? `http://localhost:3000/api/shifts/${editShiftCode}` : 'http://localhost:3000/api/shifts';
                const shiftMethod = isEditShift ? 'PUT' : 'POST';

                const shiftRes = await fetch(shiftUrl, {
                    method: shiftMethod,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shiftPayload)
                });
                if (!shiftRes.ok) {
                    const err = await shiftRes.json();
                    alert('Error saving shift: ' + (err.error || 'Unknown error'));
                    return;
                }

                // 2. If editing, delete old breaks first then re-insert
                if (isEditShift) {
                    await fetch(`http://localhost:3000/api/breaks/shift/${editShiftCode}`, { method: 'DELETE' });
                }

                // 3. Save each break
                for (const b of breaks) {
                    const bRes = await fetch('http://localhost:3000/api/breaks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(b)
                    });
                    if (!bRes.ok) {
                        const err = await bRes.json();
                        alert('Error saving break: ' + (err.error || 'Unknown error'));
                        return;
                    }
                }

                alert(isEditShift ? 'Shift updated!' : 'Shift created!');
                shiftModal.style.display = 'none';
                loadShiftsTable();
                loadBreaksConfigTable();

            } catch (err) {
                alert('Could not connect to server.');
            }
        });
    }

    // EDIT BREAK MODAL
    const editBreakModal = document.getElementById('editBreakModal');
    if (editBreakModal) {
        document.getElementById('closeEditBreakModal').addEventListener('click', () => editBreakModal.style.display = 'none');
        document.getElementById('cancelEditBreak').addEventListener('click', () => editBreakModal.style.display = 'none');
        editBreakModal.addEventListener('click', (e) => { if (e.target === editBreakModal) editBreakModal.style.display = 'none'; });

        document.getElementById('confirmEditBreak').addEventListener('click', async () => {
            const ccodeInput = document.getElementById('editBrkCcode');
            const oldCcode   = ccodeInput.dataset.original;
            const newCcode   = ccodeInput.value.trim();
            const desc       = document.getElementById('editBrkDesc').value.trim();
            const sysDesc    = document.getElementById('editBrkSysDesc').value.trim();
            const breakOut   = document.getElementById('editBrkOut').value;
            const breakIn    = document.getElementById('editBrkIn').value;
            const seq        = document.getElementById('editBrkSeq').value;
            const nextDay    = document.getElementById('editBrkNextDay').checked;
            const shiftCode  = document.getElementById('editBrkShiftCode').value;
            const errorDiv   = document.getElementById('editBreakError');

            if (!newCcode || !desc || !sysDesc || !breakOut || !breakIn || !seq) {
                errorDiv.style.display = 'block';
                return;
            }
            errorDiv.style.display = 'none';

            try {
                const response = await fetch(`http://localhost:3000/api/breaks/${oldCcode}`, {  // <-- fixed
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        newCcode,        // <-- added
                        descText:   desc,
                        breakOut:   to12Hour(breakOut),
                        breakIn:    to12Hour(breakIn),
                        isNextDay:  nextDay,
                        sysBrkDesc: sysDesc,
                        breakSeq:   parseInt(seq),
                        shiftCode        // <-- added
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Break updated!');
                    editBreakModal.style.display = 'none';
                    loadBreaksConfigTable();
                } else {
                    alert('Error: ' + (result.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('Edit break error:', err);
                alert('Could not connect to server.');
            }
        });
    }


    // HOLIDAY MODAL TOGGLE
    const openHolidayBtn = document.getElementById('openHolidayModal');
    const holidayFormContainer = document.getElementById('holidayFormContainer');
    if (openHolidayBtn && holidayFormContainer) {
        openHolidayBtn.addEventListener('click', () => {
            isEditMode = false;
            document.querySelector('#holidayFormContainer h3').textContent = "Add New Holiday";
            document.getElementById('saveHolidayToDB').textContent = "Save to Database";
            document.getElementById('hHoliday').value = "";
            holidayFormContainer.style.display = 'block';
        });
        document.getElementById('closeHolidayForm').addEventListener('click', () => holidayFormContainer.style.display = 'none');
    }
 
    // HOLIDAY SAVE TO DB
    const saveHolidayBtn = document.getElementById('saveHolidayToDB');
    if (saveHolidayBtn) {
        saveHolidayBtn.addEventListener('click', async () => {
            const payload = {
                month: parseInt(document.getElementById('hMonth').value),
                day: parseInt(document.getElementById('hDay').value),
                holiday: document.getElementById('hHoliday').value,
                type: document.getElementById('hType').value,
                branchcode: document.getElementById('hBranchCode').value,
                branchdesc: document.getElementById('hBranchDesc').value,
                desc_text: "HOLIDAY"
            };
 
            let currentMethod = isEditMode ? 'PUT' : 'POST';
            if (isEditMode) {
                Object.assign(payload, editIdentifiers);
            }
 
            try {
                const response = await fetch('http://localhost:3000/api/holidays', {
                    method: currentMethod,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
 
                const result = await response.json();
 
                if (response.ok) {
                    alert("Saved to Database!");
                    document.getElementById('holidayFormContainer').style.display = 'none';
                    isEditMode = false;
                    loadHolidaysFromDB();
                } else {
                    alert("MySQL Error: " + result.error);
                }
            } catch (err) {
                alert("Could not connect to server. Check if Node is running.");
            }
        });
    }
 
    // HOLIDAY SEARCH
    const holidaySearch = document.getElementById('holidaySearch');
    if (holidaySearch) {
        holidaySearch.addEventListener('input', () => {
            const filter = holidaySearch.value.toLowerCase();
            const rows = document.querySelectorAll('#holidayTableBody tr');
            rows.forEach(row => {
                const holidayName = row.cells[0].textContent.toLowerCase();
                const classification = row.cells[2].textContent.toLowerCase();
                if (holidayName.includes(filter) || classification.includes(filter)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }
 
    // COMPANY SAVE
    const saveCompanyBtn = document.getElementById('saveBtn');
    if (saveCompanyBtn) {
        saveCompanyBtn.addEventListener('click', () => {
            const newName = document.getElementById('companyName').value.trim();
            if (newName !== "") {
                localStorage.setItem('companyName', newName);
                alert("Saved: " + newName);
            }
        });
    }
 
    // SIDEBAR SWITCHER
    const setupSidebar = (sidebarId, storageKey, sectionIds) => {
        const sidebar = document.getElementById(sidebarId);
        if (!sidebar) return;
 
        const links = sidebar.querySelectorAll('li');
        if (links.length === 0) return;
 
        const switchTab = (index) => {
            const targetIndex = parseInt(index, 10);
            Object.keys(sectionIds).forEach(key => {
                const i = parseInt(key, 10);
                if (links[i]) {
                    links[i].classList.toggle('active', i === targetIndex);
                }
                const sectionId = sectionIds[i];
                if (sectionId) {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.style.display = (i === targetIndex) ? 'block' : 'none';
                    }
                }
            });
            localStorage.setItem(storageKey, targetIndex);
        };
 
        links.forEach((link, index) => {
            if (sectionIds[index] !== undefined) {
                link.addEventListener('click', (e) => {
                    const anchor = e.target.closest('a');
                    if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href').includes('.html')) {
                        return;
                    }
                    e.preventDefault();
                    switchTab(index);
                });
            }
        });
 
        const saved = localStorage.getItem(storageKey);
        let initialIndex = saved !== null ? parseInt(saved, 10) : 0;
        if (!sectionIds[initialIndex]) {
            initialIndex = 0;
        }
        switchTab(initialIndex);
    };
 
    setupSidebar('employee-sidebar', 'employeeSidebarTab', [
        'list-view',
        'details-view',
        'schedule-view',
        'breaks-view'     // index 3
    ]);
 
    setupSidebar('schedule-sidebar', 'scheduleSidebarTab', [
        'shifts-view',
        'breaks-view',
        'upload-view'
    ]);
 
    setupSidebar('upload-sidebar', 'uploadSidebarTab', [
        'excel-logs-view',
        'ot-view',
        'deductions-view'
    ]);
 
    setupSidebar('generate-sidebar', 'generateSidebarTab', [
        'approval-gen-view',
        'payroll-gen-view'
    ]);
 
    // EMPLOYEE DETAILS LOOKUP
    const btnLookup = document.getElementById('btnLookup');
    if (btnLookup) {
        btnLookup.addEventListener('click', async () => {
            const empId = document.getElementById('searchId').value.trim();
            if (!empId) {
                alert('Please enter an Employee ID.');
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/employees/${empId}`);
                if (response.status === 404) {
                    alert('No employee found with that ID.');
                    return;
                }
                const emp = await response.json();

                // Name fallback: use CFNAME/CLNAME if available, else split CFULLNAME
                let firstName = emp.CFNAME || '';
                let lastName  = emp.CLNAME  || '';
                if (!firstName && !lastName && emp.CFULLNAME) {
                    const parts = emp.CFULLNAME.split(',');
                    lastName  = (parts[0] || '').trim();
                    firstName = (parts[1] || '').trim();
                }

                // Populate the form fields
                document.getElementById('editFirstName').value  = emp.CFNAME       || '';
                document.getElementById('editLastName').value   = emp.CLNAME        || '';
                document.getElementById('editPosition').value   = emp.POSITION_I    || '';
                document.getElementById('editDepartment').value = emp.DEPTID        || '';
                document.getElementById('editEmail').value      = emp.EMAIL_ADD     || '';
                document.getElementById('editContact').value    = emp.MOBILENO      || '';
                document.getElementById('editAddress').value    = emp.ADDRESS1      || '';
                document.getElementById('editSchedule').value = emp.SHIFT_ID || '';

                // Map EMP_STATUS back to the dropdown values
                const statusMap = { AC: 'Active', OB: 'Onboarding', CT: 'Contract', IN: 'Inactive' };
                document.getElementById('editStatus').value = statusMap[emp.EMP_STATUS] || 'Active';

            } catch (err) {
                console.error('Lookup error:', err);
                alert('Could not connect to server. Check if Node is running.');
            }
        });
    }

    // SAVE CHANGES (Employee Details)
    const btnUpdateDetails = document.getElementById('btnUpdateDetails');
    if (btnUpdateDetails) {
        btnUpdateDetails.addEventListener('click', async () => {
            const empId = document.getElementById('searchId').value.trim();
            if (!empId) { alert('Please look up an employee first.'); return; }

            const statusVal = document.getElementById('editStatus').value;
            const statusCode = { Active: 'AC', Onboarding: 'OB', Contract: 'CT', Inactive: 'IN' }[statusVal] || 'AC';

            const payload = {
                firstname:  document.getElementById('editFirstName').value.trim(),
                lastname:   document.getElementById('editLastName').value.trim(),
                position:   document.getElementById('editPosition').value.trim(),
                department: document.getElementById('editDepartment').value.trim(),
                email:      document.getElementById('editEmail').value.trim(),
                phone:      document.getElementById('editContact').value.trim(),
                address:    document.getElementById('editAddress').value.trim(),
                statusCode,
                isActive:   statusVal === 'Active' ? 1 : 0,
                shiftId:    document.getElementById('editSchedule').value
            };

            try {
                const response = await fetch(`http://localhost:3000/api/employees/${empId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (response.ok) {
                    document.getElementById('updateMessage').style.display = 'block';
                    setTimeout(() => document.getElementById('updateMessage').style.display = 'none', 3000);
                    loadEmployeeTable(); // refresh the list
                } else {
                    alert('Error: ' + (result.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Could not connect to server.');
            }
        });
    }

    // DTR SEARCH
    const btnSearchDTR = document.getElementById('btnSearchDTR');
    if (btnSearchDTR) {
        btnSearchDTR.addEventListener('click', async () => {
            const empCode = document.getElementById('dtrSearchInput').value.trim();
            if (!empCode) { alert('Please enter an Employee ID.'); return; }

            try {
                const res  = await fetch(`http://localhost:3000/api/dtr/${empCode}`);
                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'No records found.');
                    document.getElementById('dtrResults').style.display      = 'none';
                    document.getElementById('dtrEmployeeCard').style.display = 'none';
                    return;
                }

                const { employee, records } = data;

                // Populate employee header card
                document.getElementById('dtrEmpName').textContent   = employee.name;
                document.getElementById('dtrEmpCode').textContent   = employee.code;
                document.getElementById('dtrShiftDesc').textContent = employee.shiftDesc;
                document.getElementById('dtrShiftTime').textContent =
                    employee.shiftIn !== '—' ? `${employee.shiftIn} – ${employee.shiftOut}` : '—';
                document.getElementById('dtrEmployeeCard').style.display = 'block';

                if (!records.length) {
                    alert('No DTR records found for this employee.');
                    document.getElementById('dtrResults').style.display = 'none';
                    return;
                }

                // Compute summary stats
                const totalHrs   = records.reduce((s, r) => s + parseFloat(r.WORKHRS  || 0), 0);
                const totalOT    = records.reduce((s, r) => s + parseInt(r.NREGOT     || 0), 0);
                const totalLate  = records.reduce((s, r) => s + parseInt(r.NLATE      || 0), 0);
                const daysPresent = records.filter(r => r.TIME_IN !== '—').length;

                document.getElementById('statHours').textContent   = totalHrs.toFixed(2);
                document.getElementById('statOT').textContent      = totalOT;
                document.getElementById('statLate').textContent    = totalLate;
                document.getElementById('statPresent').textContent = daysPresent;
                document.getElementById('statAbsent').textContent  = '—'; // requires schedule calendar to compute

                // Render table rows
                const tbody = document.getElementById('dtrTableBody');
                tbody.innerHTML = records.map(row => {
                    const rawDate  = row.DTR_DATE instanceof Date
                        ? row.DTR_DATE.toISOString().slice(0, 10)
                        : String(row.DTR_DATE).slice(0, 10);
                    const dateStr  = new Date(rawDate + 'T00:00:00')
                        .toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
                    const lateCell = row.NLATE > 0
                        ? `<span style="color:#dc3545; font-weight:600;">${row.NLATE}</span>`
                        : `<span style="color:#999;">0</span>`;
                    const otCell   = row.NREGOT > 0
                        ? `<span style="color:#28a745; font-weight:600;">${row.NREGOT}</span>`
                        : `<span style="color:#999;">0</span>`;
                    const statusClass = row.TIME_OUT === 'Open' ? 'color:#e67e22; font-weight:600;' : '';

                    return `
                        <tr>
                            <td>${dateStr}</td>
                            <td>
                                <div style="font-size:13px; font-weight:600;">${row.SHIFT_DESC}</div>
                                <div style="font-size:11px; color:#888;">${row.SHIFT_SCHED}</div>
                            </td>
                            <td>${row.TIME_IN}</td>
                            <td style="${statusClass}">${row.TIME_OUT}</td>
                            <td>${row.WORKHRS}</td>
                            <td>${lateCell}</td>
                            <td>${otCell}</td>
                            <td><span style="font-size:11px; color:#888;">${row.REMARKS}</span></td>
                        </tr>`;
                }).join('');

                document.getElementById('dtrResults').style.display = 'block';

            } catch (err) {
                console.error('DTR fetch error:', err);
                alert('Could not connect to server. Is Node running?');
            }
        });
    }
    
    // SYSTEM CONFIGURATION - Timezone Save
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const timezoneSelect = document.getElementById('timezoneSelect');
    if (saveConfigBtn && timezoneSelect) {

        // On page load, restore saved timezone and set the dropdown
        const savedTZ = localStorage.getItem('sysTimezone') || 'Asia/Manila';
        timezoneSelect.value = savedTZ;

        // Update the label next to the clock
        const updateTimezoneLabel = (tz) => {
            const labels = {
                'Asia/Manila':     'Philippine Standard Time (UTC+8)',
                'Singapore':       'Singapore Standard Time (UTC+8)',
                'UTC':             'Coordinated Universal Time (UTC+0)',
                'America/New_York':'Eastern Standard Time (UTC-5)',
                'Europe/London':   'Greenwich Mean Time (UTC+0)'
            };
            const display = document.getElementById('activeTimezoneDisplay');
            if (display) display.textContent = labels[tz] || tz;
        };

        updateTimezoneLabel(savedTZ); // apply on page load

        saveConfigBtn.addEventListener('click', () => {
            const selectedTZ = timezoneSelect.value;
            localStorage.setItem('sysTimezone', selectedTZ);

            updateTimezoneLabel(selectedTZ);

            // Flash the success message
            const msg = document.getElementById('configMessage');
            if (msg) {
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 3000);
            }

            // Force an immediate clock refresh
            updateTime();
        });
    }

    // CHANGE PROCESS DATE
    const saveProcessDateBtn = document.getElementById('saveProcessDateBtn');
    const processDateInput = document.getElementById('processDateInput');
    if (saveProcessDateBtn && processDateInput) {

        // Helper: format a date string (YYYY-MM-DD) into a readable label
        const formatProcessDate = (dateStr) => {
            if (!dateStr) return 'No date set';
            const d = new Date(dateStr + 'T00:00:00'); // force local time, no UTC shift
            return d.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        };

        // On page load: restore saved process date
        const savedDate = localStorage.getItem('processDate');
        if (savedDate) {
            processDateInput.value = savedDate;
        }

        // Update the display card
        const updateProcessDateDisplay = (dateStr) => {
            const display = document.getElementById('currentProcessDateDisplay');
            if (display) {
                display.textContent = dateStr ? formatProcessDate(dateStr) : 'Not set — using system date';
            }
        };

        updateProcessDateDisplay(savedDate); // apply on page load

        saveProcessDateBtn.addEventListener('click', () => {
            const selectedDate = processDateInput.value; // "YYYY-MM-DD"

            if (!selectedDate) {
                alert('Please select a date before saving.');
                return;
            }

            localStorage.setItem('processDate', selectedDate);
            updateProcessDateDisplay(selectedDate);

            // Flash success message
            const msg = document.getElementById('processDateMessage');
            if (msg) {
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 3000);
            }

            // Immediately update the navbar clock on this page too
            updateTime();
        });
    }

}); // <-- DOMContentLoaded closes HERE

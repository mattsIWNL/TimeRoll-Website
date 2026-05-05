let isEditMode = false;
let editIdentifiers = {};
 
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
 
// --- 1. GATEKEEPER ---
if (!localStorage.getItem('isLoggedIn') && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
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
                    <td><span class="status-pill">${emp.ACTIVE ? 'Active' : 'Inactive'}</span></td>
                </tr>`;
        });
    } catch (error) { console.error("Error loading employees:", error); }
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
    }
}
 
setInterval(updateTime, 1000);
updateTime();
 
// --- 3. MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
 
    // Initial Loads
    loadSavedCompanyName();
    if (document.getElementById('holidayTableBody')) loadHolidaysFromDB();
    if (document.querySelector('#list-view .employee-table')) loadEmployeeTable();
 
    // EXIT / LOGOUT
    const exitBtn = document.querySelector('.exit-btn');
    const logoutModal = document.getElementById('logoutModal');
    if (exitBtn && logoutModal) {
        exitBtn.addEventListener('click', (e) => { e.preventDefault(); logoutModal.style.display = 'flex'; });
        document.getElementById('cancelLogout').addEventListener('click', () => { logoutModal.style.display = 'none'; });
        document.getElementById('confirmLogout').addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
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
        'schedule-view'
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
 
    // DTR SEARCH
    const btnSearchDTR = document.getElementById('btnSearchDTR');
    if (btnSearchDTR) {
        btnSearchDTR.addEventListener('click', async () => {
            const empCode = document.getElementById('dtrSearchInput').value;
            const response = await fetch(`http://localhost:3000/api/dtr/${empCode}`);
            const dtrData = await response.json();
            const resultsDiv = document.getElementById('dtrResults');
            if (dtrData.length > 0) {
                resultsDiv.style.display = 'block';
                const tableBody = document.getElementById('dtrTableBody');
                tableBody.innerHTML = dtrData.map(row => `
                    <tr>
                        <td>${new Date(row.DTR_DATE).toLocaleDateString()}</td>
                        <td>${row.TIME_IN}</td><td>${row.TIME_OUT}</td>
                        <td>${row.NLATE}</td><td>${row.NREGOT}</td>
                        <td>${row.WORKHRS}</td><td>${row.REMARKS}</td>
                    </tr>`).join('');
            } else { alert("No records found."); resultsDiv.style.display = 'none'; }
        });
    }
 
}); // <-- DOMContentLoaded closes HERE

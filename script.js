// --- 1. GATEKEEPER ---
if (!localStorage.getItem('isLoggedIn') && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
}

// --- 2. GLOBAL FUNCTIONS (Defined outside so they are accessible everywhere) ---

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
            tableBody.innerHTML += `
                <tr>
                    <td>${h.HOLIDAY}</td>
                    <td>${monthNames[h.MONTH]} ${h.DAY}</td>
                    <td><span class="badge ${h.TYPE === 'Legal' ? 'shift-morning' : 'shift-afternoon'}">${h.TYPE}</span></td>
                    <td>${h.BRANCHDESC}</td>
                    <td style="text-align: center;">
                        <button class="action-icon delete" onclick="deleteHoliday(${h.MONTH}, ${h.DAY}, '${h.BRANCHCODE}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    } catch (err) { console.error("Error loading holidays:", err); }
}

// New function to handle deletion
async function deleteHoliday(month, day, branch) {
    if (!confirm("Delete this holiday?")) return;
    try {
        // You'll need to add this DELETE route to your server.js later
        alert("Delete functionality triggered for: " + month + "/" + day);
    } catch (err) { console.error(err); }
}async function deleteHoliday(month, day, branch) {
    // 1. Ask for confirmation
    if (!confirm(`Are you sure you want to delete this holiday?`)) return;

    try {
        // 2. Send DELETE request to the server
        const response = await fetch(`http://localhost:3000/api/holidays/${month}/${day}/${branch}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            alert("Holiday deleted successfully.");
            // 3. Refresh the table to show it's gone
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

// Start Clock
setInterval(updateTime, 1000);
updateTime();

// --- 3. MAIN INITIALIZATION (One single DOMContentLoaded) ---
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
        openHolidayBtn.addEventListener('click', () => holidayFormContainer.style.display = 'block');
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

            try {
                const response = await fetch('http://localhost:3000/api/holidays', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Saved to Database!");
                    document.getElementById('holidayFormContainer').style.display = 'none';
                    loadHolidaysFromDB();
                } else {
                    // This will now show the EXACT error from MySQL
                    alert("MySQL Error: " + result.error);
                }
            } catch (err) {
                alert("Could not connect to server. Check if Node is running.");
            }
        });
    }

    /* === HOLIDAY SEARCH FUNCTIONALITY === */
    const holidaySearch = document.getElementById('holidaySearch');
    
    if (holidaySearch) {
        holidaySearch.addEventListener('input', () => {
            const filter = holidaySearch.value.toLowerCase();
            // Select all rows currently in the holiday table body
            const rows = document.querySelectorAll('#holidayTableBody tr');

            rows.forEach(row => {
                // Get the text from the Name column (index 0) and Type column (index 2)
                const holidayName = row.cells[0].textContent.toLowerCase();
                const classification = row.cells[2].textContent.toLowerCase();

                // If the search text (filter) is found in either column, show the row
                if (holidayName.includes(filter) || classification.includes(filter)) {
                    row.style.display = ""; // Show row
                } else {
                    row.style.display = "none"; // Hide row
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

    /* === FIXED SIDEBAR SWITCHER (Generic) === */
    const setupSidebar = (sidebarId, storageKey, sectionIds) => {
        const sidebar = document.getElementById(sidebarId);
        if (!sidebar) return; // Exit silently if sidebar isn't on this page

        const links = sidebar.querySelectorAll('li');
        if (links.length === 0) return;

        const switchTab = (index) => {
            links.forEach((l, i) => {
                // Toggle active class on the link
                l.classList.toggle('active', i == index);
                
                // Find the section element by ID
                const section = document.getElementById(sectionIds[i]);
                if (section) {
                    section.style.display = (i == index) ? 'block' : 'none';
                }
            });
            // Save the active tab to local storage
            localStorage.setItem(storageKey, index);
        };

        // Add click events to links
        links.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(index);
            });
        });

        // Restore saved tab or default to 0
        const saved = localStorage.getItem(storageKey);
        switchTab(saved !== null ? saved : 0);
    };

    setupSidebar('upload-sidebar', 'activeUploadTab', { 0: document.getElementById('excel-logs-view'), 1: document.getElementById('ot-view'), 2: document.getElementById('deductions-view') });
    setupSidebar('generate-sidebar', 'activeGenerateTab', { 0: document.getElementById('approval-gen-view'), 1: document.getElementById('payroll-gen-view') });
    // 1. Employee Page Sidebar
    setupSidebar('employee-sidebar', 'activeEmployeeTab', { 
        0: 'list-view', 
        1: 'details-view', 
        2: 'schedule-view' 
    });

    // 2. Schedule Page Sidebar
    setupSidebar('schedule-sidebar', 'activeScheduleTab', { 
        0: 'shifts-view', 
        1: 'breaks-view', 
        2: 'upload-view' 
    });

    // 3. Upload Page Sidebar
    setupSidebar('upload-sidebar', 'activeUploadTab', { 
        0: 'excel-logs-view', 
        1: 'ot-view', 
        2: 'deductions-view' 
    });

    // 4. Generate Page Sidebar
    setupSidebar('generate-sidebar', 'activeGenerateTab', { 
        0: 'approval-gen-view', 
        1: 'payroll-gen-view' 
    });
    // Note: Add logic for Employee sidebar here if needed using the same pattern

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
});
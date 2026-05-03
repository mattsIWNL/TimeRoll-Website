// --- GATEKEEPER: REDIRECT TO LOGIN IF NOT AUTHENTICATED ---
if (!localStorage.getItem('isLoggedIn') && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
}

async function loadEmployeeTable() {
    const tableBody = document.querySelector('#list-view .employee-table tbody');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:3000/api/employees');
        const employees = await response.json();

        tableBody.innerHTML = ''; // Clear existing rows
        employees.forEach(emp => {
            const row = `
                <tr>
                    <td>${emp.CCODE}</td>
                    <td>${emp.CFULLNAME}</td>
                    <td>${emp.POSITION_I}</td>
                    <td><span class="status-pill">${emp.ACTIVE ? 'Active' : 'Inactive'}</span></td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error loading employees:", error);
    }
}

function loadSavedCompanyName() {
    const nameInput = document.getElementById('companyName');
    
    // Only proceed if we are actually on the Company page (where the input exists)
    if (nameInput) {
        const savedName = localStorage.getItem('companyName');
        
        if (savedName) {
            // Set the input box value to the saved name
            nameInput.value = savedName;
        } else {
            // Default value if nothing has ever been saved
            nameInput.value = "Par Excellence Search Consulting Inc.";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // --- EXIT / LOGOUT LOGIC ---
    const exitBtn = document.querySelector('.exit-btn');
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');

    if (exitBtn && logoutModal) {
        // 1. Show Modal
        exitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.style.display = 'flex';
        });

        // 2. Cancel - Hide Modal
        cancelLogout.addEventListener('click', () => {
            logoutModal.style.display = 'none';
        });

        // 3. Confirm - Clear storage and redirect
        confirmLogout.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn'); // Remove "Session"
            window.location.href = 'login.html';
        });

        // 4. Close modal if user clicks outside of the white box
        window.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.style.display = 'none';
            }
        });
    }

    // ... existing sidebar and form logic here ...
});

// --- 1. DYNAMIC CLOCK & PROCESS DATE LOGIC ---
function updateTime() {
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    const homeTzDisplay = document.getElementById('homeTimezoneDisplay');
    const configTzDisplay = document.getElementById('activeTimezoneDisplay');

    if (clockElement && dateElement) {
        // A. GET SYSTEM SETTINGS
        const savedTZ = localStorage.getItem('sysTimezone') || 'Asia/Manila';
        const savedProcessDate = localStorage.getItem('processDate');
        
        const now = new Date();

        // B. UPDATE THE CLOCK (Always Real-Time based on Timezone)
        const optionsTime = { 
            timeZone: savedTZ, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: true 
        };
        clockElement.textContent = now.toLocaleTimeString('en-US', optionsTime);

        // C. UPDATE THE DATE (Use Process Date if available, else use Real-Time)
        if (savedProcessDate) {
            // Create a date object from the saved "YYYY-MM-DD" string
            // We add 'T00:00:00' to ensure it reflects the exact date selected without timezone shifts
            const pDate = new Date(savedProcessDate + 'T00:00:00'); 
            
            const optionsDate = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = pDate.toLocaleDateString('en-US', optionsDate);
        } else {
            // Fallback: Show real-time date based on selected timezone
            const optionsDate = { 
                timeZone: savedTZ, 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = now.toLocaleDateString('en-US', optionsDate);
        }

        // D. UPDATE TIMEZONE LABELS
        const friendlyName = savedTZ === 'Asia/Manila' ? 'Philippine Standard Time' : 
                             savedTZ === 'Singapore' ? 'Singapore Standard Time' : 
                             savedTZ.replace('_', ' ');

        if (homeTzDisplay) homeTzDisplay.textContent = friendlyName;
        if (configTzDisplay) configTzDisplay.textContent = friendlyName;
    }
}

// Run the clock
setInterval(updateTime, 1000);
updateTime();


// --- 2. GLOBAL DOM CONTENT LOADED ---
document.addEventListener('DOMContentLoaded', () => {
    
     /* === NEW: HOME DASHBOARD INITIALIZATION === */
    const homeProcessDateDisplay = document.getElementById('homeProcessDateDisplay');
    if (homeProcessDateDisplay) {
        const savedDate = localStorage.getItem('processDate');
        if (savedDate) {
            const dateObj = new Date(savedDate);
            homeProcessDateDisplay.textContent = dateObj.toLocaleDateString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric' 
            });
        } else {
            homeProcessDateDisplay.textContent = "Using System Today";
        }
    }
    
    // CONFIGURATION PAGE LOGIC
    const tzSelect = document.getElementById('timezoneSelect');
    const saveConfigBtn = document.getElementById('saveConfigBtn');

    if (tzSelect && saveConfigBtn) {
        // 1. Set the dropdown to the currently saved value on load
        const savedTZ = localStorage.getItem('sysTimezone') || 'Asia/Manila';
        tzSelect.value = savedTZ;

        // 2. Save the new timezone
        saveConfigBtn.addEventListener('click', () => {
            localStorage.setItem('sysTimezone', tzSelect.value);
            
            const msg = document.getElementById('configMessage');
            msg.style.display = 'block';
            
            // Refresh clock immediately
            updateTime();

            setTimeout(() => { msg.style.display = 'none'; }, 3000);
        });
    }

    /* === B. EMPLOYEE PAGE VIEW SWITCHER (Persistent) === */
    const sidebarLinks = document.querySelectorAll('.sidebar-links li');
    const listView = document.getElementById('list-view');
    const detailsView = document.getElementById('details-view');
    const scheduleView = document.getElementById('schedule-view');

    if (sidebarLinks.length > 0 && listView) {
        const switchEmployeeTab = (index) => {
            // 1. Reset
            sidebarLinks.forEach(l => l.classList.remove('active'));
            listView.style.display = 'none';
            detailsView.style.display = 'none';
            if(scheduleView) scheduleView.style.display = 'none';

            // 2. Show correct section
            if (index == 0) listView.style.display = 'block';
            else if (index == 1) detailsView.style.display = 'block';
            else if (index == 2 && scheduleView) scheduleView.style.display = 'block';

            // 3. Set Active
            sidebarLinks[index].classList.add('active');
            
            // 4. SAVE STATE
            localStorage.setItem('activeEmployeeTab', index);
        };

        sidebarLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchEmployeeTab(index);
            });
        });

        // RECOVERY LOGIC: Check if a tab was saved before refresh
        const savedTab = localStorage.getItem('activeEmployeeTab');
        if (savedTab !== null) {
            switchEmployeeTab(savedTab);
        }
    }

    /* === C. EMPLOYEE LOOKUP & UPDATE === */
    const btnLookup = document.getElementById('btnLookup');
    if (btnLookup) {
        btnLookup.addEventListener('click', () => {
            const id = document.getElementById('searchId').value;
            if (id === "2024-001") {
                document.getElementById('editFirstName').value = "Juan";
                document.getElementById('editLastName').value = "Dela Cruz";
                document.getElementById('editEmail').value = "juan.dc@parexcellence.com";
                document.getElementById('editContact').value = "09171234567";
            } else {
                alert("Employee ID not found. Try 2024-001");
            }
        });
    }

    const btnUpdateDetails = document.getElementById('btnUpdateDetails');
    if (btnUpdateDetails) {
        btnUpdateDetails.addEventListener('click', () => {
            const msg = document.getElementById('updateMessage');
            if(msg) {
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 3000);
            }
        });
    }

    /* === D. HOMEPAGE ATTENDANCE LOGIC === */
    const checkInBtn = document.querySelector('.check-in');
    const checkOutBtn = document.querySelector('.check-out');
    const statusText = document.getElementById('status');

    if (checkInBtn && statusText) {
        checkInBtn.addEventListener('click', () => {
            statusText.textContent = "Checked In";
            statusText.style.color = "green";
            alert("Check-in successful!");
        });
    }

    if (checkOutBtn && statusText) {
        checkOutBtn.addEventListener('click', () => {
            statusText.textContent = "Checked Out";
            statusText.style.color = "red";
            alert("Check-out successful!");
        });
    }

    /* === E. SCHEDULE PAGE VIEW SWITCHER (Persistent) === */
    const scheduleSidebarLinks = document.querySelectorAll('#schedule-sidebar li');
    const scheduleSections = {
        0: document.getElementById('shifts-view'),
        1: document.getElementById('breaks-view'),
        2: document.getElementById('upload-view')
    };

    if (scheduleSidebarLinks.length > 0) {
        const switchScheduleTab = (index) => {
            Object.values(scheduleSections).forEach(sec => { if (sec) sec.style.display = 'none'; });
            if (scheduleSections[index]) scheduleSections[index].style.display = 'block';
            scheduleSidebarLinks.forEach(l => l.classList.remove('active'));
            scheduleSidebarLinks[index].classList.add('active');
            
            // SAVE STATE
            localStorage.setItem('activeScheduleTab', index);
        };

        scheduleSidebarLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchScheduleTab(index);
            });
        });

        const savedScheduleTab = localStorage.getItem('activeScheduleTab');
        if (savedScheduleTab !== null) switchScheduleTab(savedScheduleTab);
    }
    
    /* === F. HOLIDAY LOOKUP LOGIC === */
    const holidaySearch = document.getElementById('holidaySearch');
    const holidayTable = document.getElementById('holidayTable');

    if (holidaySearch && holidayTable) {
        holidaySearch.addEventListener('keyup', function() {
            const filter = holidaySearch.value.toLowerCase();
            const rows = holidayTable.getElementsByTagName('tr');

            for (let i = 1; i < rows.length; i++) { // Skip header
                const nameCell = rows[i].getElementsByTagName('td')[0];
                const classCell = rows[i].getElementsByTagName('td')[2];
                
                if (nameCell || classCell) {
                    const textValue = (nameCell.textContent + classCell.textContent).toLowerCase();
                    rows[i].style.display = textValue.indexOf(filter) > -1 ? "" : "none";
                }
            }
        });
    }

    // Handling Delete and Modal Toggle
    const openModalBtn = document.getElementById('openHolidayModal');
    const closeModalBtn = document.getElementById('closeHolidayForm');
    const holidayForm = document.getElementById('holidayFormContainer');

    if (openModalBtn && holidayForm) {
        openModalBtn.addEventListener('click', () => {
            holidayForm.style.display = 'block';
        });

        closeModalBtn.addEventListener('click', () => {
            holidayForm.style.display = 'none';
        });
    }

    // Add Delete functionality to existing and future buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete')) {
            if (confirm("Are you sure you want to remove this holiday?")) {
                e.target.closest('tr').remove();
            }
        }
        // Edit logic can be added here similarly
    });

    /* === G. CHANGE PROCESS DATE LOGIC === */
    const processDateInput = document.getElementById('processDateInput');
    const saveProcessDateBtn = document.getElementById('saveProcessDateBtn');
    const currentDateDisplay = document.getElementById('currentProcessDateDisplay');

    if (currentDateDisplay) {
        // 1. Function to format and show the saved process date
        const displaySavedDate = () => {
            const savedDate = localStorage.getItem('processDate');
            
            if (savedDate) {
                // Format the saved string (YYYY-MM-DD) into a readable date
                const dateObj = new Date(savedDate);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                currentDateDisplay.textContent = dateObj.toLocaleDateString('en-US', options);
                if (processDateInput) processDateInput.value = savedDate;
            } else {
                // Default to Today (Philippines Time) if nothing is saved
                const today = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Manila'}); // YYYY-MM-DD format
                currentDateDisplay.textContent = "Not Set (Using System Today)";
                if (processDateInput) processDateInput.value = today;
            }
        };

    displaySavedDate();

        // 2. Save new Process Date
        if (saveProcessDateBtn && processDateInput) {
            saveProcessDateBtn.addEventListener('click', () => {
                const newDate = processDateInput.value;
                if (newDate) {
                    localStorage.setItem('processDate', newDate);
                    displaySavedDate(); // Update the display immediately
                    
                    const msg = document.getElementById('processDateMessage');
                    msg.style.display = 'block';
                    setTimeout(() => { msg.style.display = 'none'; }, 3000);
                } else {
                    alert("Please select a valid date.");
                }
            });
        }
    }

    /* === H. UPLOAD PAGE VIEW SWITCHER (Persistent) === */
    const uploadSidebarLinks = document.querySelectorAll('#upload-sidebar li');
    const uploadSections = {
        0: document.getElementById('excel-logs-view'),
        1: document.getElementById('ot-view'),
        2: document.getElementById('deductions-view')
    };

    if (uploadSidebarLinks.length > 0) {
        const switchUploadTab = (index) => {
            Object.values(uploadSections).forEach(sec => { if (sec) sec.style.display = 'none'; });
            if (uploadSections[index]) uploadSections[index].style.display = 'block';
            uploadSidebarLinks.forEach(l => l.classList.remove('active'));
            uploadSidebarLinks[index].classList.add('active');
            localStorage.setItem('activeUploadTab', index);
        };

        uploadSidebarLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchUploadTab(index);
            });
        });

        const savedUploadTab = localStorage.getItem('activeUploadTab');
        if (savedUploadTab !== null) switchUploadTab(savedUploadTab);
    }

    // Global function for upload simulation (Place this outside DOMContentLoaded)
    function simulateUpload(type) {
        let msgId = "";
        if(type === 'logs') msgId = "logsMessage";
        if(type === 'ot') msgId = "otMessage";
        if(type === 'deductions') msgId = "deductionsMessage";

        const msg = document.getElementById(msgId);
        if(msg) {
            msg.style.display = 'block';
            setTimeout(() => { msg.style.display = 'none'; }, 3000);
        }
    }

    /* === I. CONVERT LOGS LOGIC === */
    const startConversionBtn = document.getElementById('startConversionBtn');
    const excelInput = document.getElementById('excelConverterInput');
    const conversionTable = document.getElementById('conversionTable')?.getElementsByTagName('tbody')[0];

    if (startConversionBtn && excelInput && conversionTable) {
        startConversionBtn.addEventListener('click', () => {
            const file = excelInput.files[0];
            
            if (!file) {
                alert("Please select an Excel file first.");
                return;
            }

            // Get Current Date/Time for display
            const now = new Date();
            const dateTimeStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // 1. Create a new row
            const newRow = conversionTable.insertRow(0); // Add to the top
            
            // 2. Insert Cells
            newRow.innerHTML = `
                <td>${file.name}</td>
                <td>Admin_User</td>
                <td>${dateTimeStr}</td>
                <td><span class="badge shift-afternoon" id="temp-status">Pending</span></td>
            `;

            // 3. Show Success Message
            const msg = document.getElementById('conversionMessage');
            msg.style.display = 'block';
            
            // 4. Reset Input
            excelInput.value = "";

            // 5. Simulate "Processing" to "Completed"
            setTimeout(() => {
                const statusSpan = newRow.querySelector('#temp-status');
                statusSpan.textContent = "Completed";
                statusSpan.className = "status-pill"; // Change color to green
                msg.style.display = 'none';
            }, 4000);
        });
    }

    /* === J. GENERATE PAGE VIEW SWITCHER (Persistent) === */
    const generateSidebarLinks = document.querySelectorAll('#generate-sidebar li');
    const generateSections = {
        0: document.getElementById('approval-gen-view'),
        1: document.getElementById('payroll-gen-view')
    };

    if (generateSidebarLinks.length > 0) {
        const switchGenerateTab = (index) => {
            Object.values(generateSections).forEach(sec => { if (sec) sec.style.display = 'none'; });
            if (generateSections[index]) generateSections[index].style.display = 'block';
            generateSidebarLinks.forEach(l => l.classList.remove('active'));
            generateSidebarLinks[index].classList.add('active');
            localStorage.setItem('activeGenerateTab', index);
        };

        generateSidebarLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchGenerateTab(index);
            });
        });

        const savedGenerateTab = localStorage.getItem('activeGenerateTab');
        if (savedGenerateTab !== null) switchGenerateTab(savedGenerateTab);
    }

    // Global simulation function
    function simulateGeneration(type) {
        const msgId = type === 'approval' ? 'approvalMessage' : 'payrollMessage';
        const msg = document.getElementById(msgId);
        if(msg) {
            msg.style.display = 'block';
            setTimeout(() => { msg.style.display = 'none'; }, 4000);
        }
    }

    /* === K. VIEW DTR LOGIC === */
    const btnSearchDTR = document.getElementById('btnSearchDTR');
    const dtrResults = document.getElementById('dtrResults');

    if (btnSearchDTR) {
        btnSearchDTR.addEventListener('click', async () => {
            const empCode = document.getElementById('dtrSearchInput').value;
            const dtrResults = document.getElementById('dtrResults');

            try {
                const response = await fetch(`http://localhost:3000/api/dtr/${empCode}`);
                const dtrData = await response.json();

                if (dtrData.length > 0) {
                    dtrResults.style.display = 'block';
                    const tableBody = document.getElementById('dtrTableBody');
                    tableBody.innerHTML = '';

                    dtrData.forEach(row => {
                        tableBody.innerHTML += `
                            <tr>
                                <td>${new Date(row.DTR_DATE).toLocaleDateString()}</td>
                                <td>${row.TIME_IN}</td>
                                <td>${row.TIME_OUT}</td>
                                <td>${row.NLATE}</td>
                                <td>${row.NREGOT}</td>
                                <td>${row.WORKHRS}</td>
                                <td>${row.REMARKS}</td>
                            </tr>`;
                    });
                } else {
                    alert("No records found for this Employee Code.");
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    loadSavedCompanyName();

    /* === K. COMPANY PAGE SAVING LOGIC === */
    const saveBtn = document.getElementById('saveBtn');
    const nameInput = document.getElementById('companyName');
    const msg = document.getElementById('message');

    if (saveBtn && nameInput) {
        saveBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            
            if (newName !== "") {
                // 1. Save to LocalStorage
                localStorage.setItem('companyName', newName);
                
                // 2. Show Success Message on screen
                if (msg) {
                    msg.style.display = 'block';
                    msg.textContent = "Changes saved successfully!";
                    setTimeout(() => { msg.style.display = 'none'; }, 3000);
                }

                // 3. Simple Alert confirmation
                alert("The company name has been saved as: " + newName);
            } else {
                alert("Please enter a company name.");
            }
        });
    }

});
// Create Client Page JavaScript

let currentClient = null;
let isUpdateMode = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeCreateClientPage();
    checkUpdateMode();
});

function initializeCreateClientPage() {
    const form = document.getElementById('clientForm');
    const trialBalanceYears = document.getElementById('trialBalanceYears');
    const glTransactionYears = document.getElementById('glTransactionYears');
    const migrationFromDate = document.getElementById('migrationFromDate');
    const fiscalYear = document.getElementById('fiscalYear');
    const saveAndUpdateTracker = document.getElementById('saveAndUpdateTracker');
    const saveAndPreCheck = document.getElementById('saveAndPreCheck');

    // Event listeners
    trialBalanceYears.addEventListener('change', updateTrialBalanceYears);
    glTransactionYears.addEventListener('change', updateGLTransactionYears);
    migrationFromDate.addEventListener('change', updateDateRanges);
    fiscalYear.addEventListener('change', updateDateRanges);
    
    form.addEventListener('submit', handleSave);
    saveAndUpdateTracker.addEventListener('click', handleSaveAndUpdateTracker);
    saveAndPreCheck.addEventListener('click', handleSaveAndPreCheck);
}

function checkUpdateMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('id');
    const updateMode = urlParams.get('update') === 'true';
    
    if (updateMode && clientId) {
        isUpdateMode = true;
        loadClientForUpdate(clientId);
        
        // Update page title and form title
        document.title = 'Update Client - Intacct Implementation';
        document.querySelector('.form-title').innerHTML = '✏️ Update Client Information';
        
        // Update button text
        document.querySelector('button[type="submit"]').innerHTML = '💾 Update';
        document.getElementById('saveAndUpdateTracker').innerHTML = '🔄 Update and Go to Tracker';
    }
}

function loadClientForUpdate(clientId) {
    const clients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    currentClient = clients.find(c => c.id === clientId);
    
    if (currentClient) {
        // Populate form fields
        document.getElementById('clientName').value = currentClient.clientName;
        document.getElementById('noOfEntities').value = currentClient.noOfEntities;
        document.getElementById('goLiveDate').value = currentClient.goLiveDate;
        document.getElementById('legacySystemName').value = currentClient.legacySystemName;
        document.getElementById('accessAvailable').value = currentClient.accessAvailable;
        document.getElementById('fiscalYear').value = currentClient.fiscalYear;
        document.getElementById('migrationFromDate').value = currentClient.migrationFromDate;
        document.getElementById('migrationToDate').value = currentClient.migrationToDate;
        document.getElementById('trialBalanceYears').value = currentClient.trialBalanceYears;
        document.getElementById('glTransactionYears').value = currentClient.glTransactionYears;
        
        // Trigger updates to show year details
        updateTrialBalanceYears();
        updateGLTransactionYears();
        
        // Populate year details if they exist
        if (currentClient.trialBalanceDetails) {
            setTimeout(() => {
                currentClient.trialBalanceDetails.forEach((detail, index) => {
                    const fromInput = document.getElementById(`trialBalance_year${detail.year}_from`);
                    const toInput = document.getElementById(`trialBalance_year${detail.year}_to`);
                    if (fromInput && toInput) {
                        fromInput.value = detail.fromDate;
                        toInput.value = detail.toDate;
                    }
                });
            }, 100);
        }
        
        if (currentClient.glTransactionDetails) {
            setTimeout(() => {
                currentClient.glTransactionDetails.forEach((detail, index) => {
                    const fromInput = document.getElementById(`glTransaction_year${detail.year}_from`);
                    const toInput = document.getElementById(`glTransaction_year${detail.year}_to`);
                    if (fromInput && toInput) {
                        fromInput.value = detail.fromDate;
                        toInput.value = detail.toDate;
                    }
                });
            }, 100);
        }
    }
}

function updateTrialBalanceYears() {
    const years = parseInt(document.getElementById('trialBalanceYears').value);
    const detailsContainer = document.getElementById('trialBalanceDetails');
    const yearsList = document.getElementById('trialBalanceYearsList');
    
    if (years > 0) {
        detailsContainer.classList.remove('hidden');
        yearsList.innerHTML = '';
        
        for (let i = 1; i <= years; i++) {
            const yearDiv = createYearInputs(`trialBalance_year${i}`, `Year ${i}`, 'trial balance');
            yearsList.appendChild(yearDiv);
        }
        
        // Auto-populate dates
        updateTrialBalanceDates();
    } else {
        detailsContainer.classList.add('hidden');
    }
    
    // Update GL Transaction years to start after trial balance
    updateGLTransactionYears();
}

function updateGLTransactionYears() {
    const years = parseInt(document.getElementById('glTransactionYears').value);
    const detailsContainer = document.getElementById('glTransactionDetails');
    const yearsList = document.getElementById('glTransactionYearsList');
    
    if (years > 0) {
        detailsContainer.classList.remove('hidden');
        yearsList.innerHTML = '';
        
        for (let i = 1; i <= years; i++) {
            const yearDiv = createYearInputs(`glTransaction_year${i}`, `Year ${i}`, 'GL transaction');
            yearsList.appendChild(yearDiv);
        }
        
        // Auto-populate dates
        updateGLTransactionDates();
    } else {
        detailsContainer.classList.add('hidden');
    }
}

function createYearInputs(id, label, type) {
    const div = document.createElement('div');
    div.className = 'year-range-info';
    div.innerHTML = `
        <h4 style="color: var(--electrolux-blue); margin-bottom: 0.75rem; font-size: 1rem;">${label}</h4>
        <div class="form-grid">
            <div class="form-group">
                <label for="${id}_from" class="form-label">From Date</label>
                <input type="date" id="${id}_from" name="${id}_from" class="form-input">
                <div class="date-info">Auto-calculated based on fiscal year (editable)</div>
            </div>
            <div class="form-group">
                <label for="${id}_to" class="form-label">To Date</label>
                <input type="date" id="${id}_to" name="${id}_to" class="form-input">
                <div class="date-info">Fiscal year end date (editable)</div>
            </div>
        </div>
    `;
    return div;
}

function updateTrialBalanceDates() {
    const migrationFromDate = document.getElementById('migrationFromDate').value;
    const fiscalYear = document.getElementById('fiscalYear').value;
    const years = parseInt(document.getElementById('trialBalanceYears').value);
    
    if (!migrationFromDate || !fiscalYear || !years) return;
    
    let currentDate = new Date(migrationFromDate);
    
    for (let i = 1; i <= years; i++) {
        const fromInput = document.getElementById(`trialBalance_year${i}_from`);
        const toInput = document.getElementById(`trialBalance_year${i}_to`);
        
        if (fromInput && toInput) {
            // Set from date
            fromInput.value = formatDate(currentDate);
            
            // Calculate end date based on full year (365/366 days) from start date
            const endDate = calculateProperFiscalYearEnd(currentDate, fiscalYear);
            toInput.value = formatDate(endDate);
            
            // Move to next year (day after fiscal year end)
            currentDate = new Date(endDate);
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Add event listeners to make dates editable
            addDateChangeListeners(`trialBalance_year${i}`);
        }
    }
}

function updateGLTransactionDates() {
    const years = parseInt(document.getElementById('glTransactionYears').value);
    const trialBalanceYears = parseInt(document.getElementById('trialBalanceYears').value) || 0;
    const fiscalYear = document.getElementById('fiscalYear').value;
    
    if (!years || !fiscalYear) return;
    
    // Start from the last date of trial balance migration
    let startDate;
    if (trialBalanceYears > 0) {
        const lastTrialBalanceToInput = document.getElementById(`trialBalance_year${trialBalanceYears}_to`);
        if (lastTrialBalanceToInput && lastTrialBalanceToInput.value) {
            startDate = new Date(lastTrialBalanceToInput.value);
            startDate.setDate(startDate.getDate() + 1);
        }
    } else {
        const migrationFromDate = document.getElementById('migrationFromDate').value;
        if (migrationFromDate) {
            startDate = new Date(migrationFromDate);
        }
    }
    
    if (!startDate) return;
    
    for (let i = 1; i <= years; i++) {
        const fromInput = document.getElementById(`glTransaction_year${i}_from`);
        const toInput = document.getElementById(`glTransaction_year${i}_to`);
        
        if (fromInput && toInput) {
            // Set from date
            fromInput.value = formatDate(startDate);
            
            // Calculate end date based on full year (365/366 days) from start date
            const endDate = calculateProperFiscalYearEnd(startDate, fiscalYear);
            toInput.value = formatDate(endDate);
            
            // Move to next year (day after fiscal year end)
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() + 1);
            
            // Add event listeners to make dates editable
            addDateChangeListeners(`glTransaction_year${i}`);
        }
    }
}

function calculateProperFiscalYearEnd(startDate, fiscalYear) {
    const start = new Date(startDate);
    
    // Calculate exactly one year (365/366 days) from the start date
    // This ensures we get the full year period, accounting for leap years
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1); // End date is one day before the anniversary
    
    return endDate;
}

function addDateChangeListeners(yearPrefix) {
    const fromInput = document.getElementById(`${yearPrefix}_from`);
    const toInput = document.getElementById(`${yearPrefix}_to`);
    
    if (fromInput && toInput) {
        fromInput.addEventListener('change', function() {
            // When from date changes, auto-calculate to date based on fiscal year
            const fiscalYear = document.getElementById('fiscalYear').value;
            if (this.value && fiscalYear) {
                const newFromDate = new Date(this.value);
                const newToDate = calculateProperFiscalYearEnd(newFromDate, fiscalYear);
                toInput.value = formatDate(newToDate);
            }
        });
        
        toInput.addEventListener('change', function() {
            // Allow manual override of to date
            // No automatic recalculation when to date is manually changed
        });
    }
}

function updateDateRanges() {
    updateTrialBalanceDates();
    updateGLTransactionDates();
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function handleSave(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    
    // Add year details
    clientData.trialBalanceDetails = getYearDetails('trialBalance');
    clientData.glTransactionDetails = getYearDetails('glTransaction');
    
    // Save to localStorage (in a real app, this would be sent to a server)
    saveClientData(clientData);
    
    showNotification('Client data saved successfully!');
    
    // Optionally clear form
    if (confirm('Data saved successfully! Would you like to create another client?')) {
        e.target.reset();
        document.getElementById('trialBalanceDetails').classList.add('hidden');
        document.getElementById('glTransactionDetails').classList.add('hidden');
    }
}

function handleSaveAndUpdateTracker(e) {
    e.preventDefault();
    
    const form = document.getElementById('clientForm');
    const formData = new FormData(form);
    const clientData = Object.fromEntries(formData.entries());
    
    if (!validateForm(clientData)) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }
    
    // Add year details
    clientData.trialBalanceDetails = getYearDetails('trialBalance');
    clientData.glTransactionDetails = getYearDetails('glTransaction');
    
    // Save data
    saveClientData(clientData);
    
    // Redirect to project status page
    showNotification('Client saved! Redirecting to Project Status...', 'success');
    setTimeout(() => {
        window.location.href = 'project-status.html?edit=true&client=' + encodeURIComponent(clientData.clientName);
    }, 1500);
}

function handleSaveAndPreCheck(e) {
    // This button is disabled as requested
    showNotification('Pre-checking feature will be available soon!', 'info');
}

function getYearDetails(type) {
    const details = [];
    const yearsCount = parseInt(document.getElementById(`${type}Years`).value) || 0;
    
    for (let i = 1; i <= yearsCount; i++) {
        const fromInput = document.getElementById(`${type}_year${i}_from`);
        const toInput = document.getElementById(`${type}_year${i}_to`);
        
        if (fromInput && toInput) {
            details.push({
                year: i,
                fromDate: fromInput.value,
                toDate: toInput.value
            });
        }
    }
    
    return details;
}

function validateForm(data) {
    const requiredFields = ['clientName', 'noOfEntities', 'goLiveDate', 'legacySystemName', 'accessAvailable', 'fiscalYear', 'migrationFromDate', 'migrationToDate', 'trialBalanceYears', 'glTransactionYears'];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            return false;
        }
    }
    
    return true;
}

function saveClientData(clientData) {
    // Get existing clients
    const existingClients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    
    if (isUpdateMode && currentClient) {
        // Update existing client
        clientData.id = currentClient.id;
        clientData.createdAt = currentClient.createdAt;
        clientData.updatedAt = new Date().toISOString();
        clientData.status = currentClient.status || {
            openingBalanceInitiate: 'Yet to start',
            trialBalanceMigration: 'Yet to start',
            glTransactionMigration: 'Yet to start',
            validation: 'Yet to start',
            openItems: 'Yet to start'
        };
        
        // Find and replace the existing client
        const clientIndex = existingClients.findIndex(c => c.id === currentClient.id);
        if (clientIndex !== -1) {
            existingClients[clientIndex] = clientData;
        }
    } else {
        // Create new client
        clientData.id = Date.now().toString();
        clientData.createdAt = new Date().toISOString();
        clientData.status = {
            openingBalanceInitiate: 'Yet to start',
            trialBalanceMigration: 'Yet to start',
            glTransactionMigration: 'Yet to start',
            validation: 'Yet to start',
            openItems: 'Yet to start'
        };
        
        // Add to array
        existingClients.push(clientData);
    }
    
    // Save back to localStorage
    localStorage.setItem('intacctClients', JSON.stringify(existingClients));
    
    // Update statistics
    updateProjectStats();
}

function updateProjectStats() {
    const clients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    
    const stats = {
        total: clients.length,
        completed: 0,
        inProgress: 0,
        hold: 0,
        yetToStart: 0
    };
    
    clients.forEach(client => {
        const statuses = Object.values(client.status || {});
        const completedCount = statuses.filter(s => s === 'Completed').length;
        const inProgressCount = statuses.filter(s => s === 'In Progress').length;
        const holdCount = statuses.filter(s => s === 'Hold').length;
        
        if (completedCount === statuses.length) {
            stats.completed++;
        } else if (inProgressCount > 0) {
            stats.inProgress++;
        } else if (holdCount > 0) {
            stats.hold++;
        } else {
            stats.yetToStart++;
        }
    });
    
    // Save stats
    localStorage.setItem('projectStats', JSON.stringify(stats));
}

function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const colors = {
        success: 'var(--success-color)',
        error: 'var(--danger-color)',
        info: 'var(--info-color)',
        warning: 'var(--warning-color)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

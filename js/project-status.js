// Project Status Page JavaScript

let currentClient = null;
let isEditMode = false;
let originalStatus = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeProjectStatus();
});

function initializeProjectStatus() {
    loadClientList();
    setupEventListeners();
    checkUrlParameters();
}

function setupEventListeners() {
    const clientSelect = document.getElementById('clientSelect');
    const updateTrackerBtn = document.getElementById('updateTrackerBtn');
    const saveChanges = document.getElementById('saveChanges');
    const cancelChanges = document.getElementById('cancelChanges');
    
    clientSelect.addEventListener('change', handleClientSelection);
    updateTrackerBtn.addEventListener('click', enableEditMode);
    saveChanges.addEventListener('click', saveTrackerChanges);
    cancelChanges.addEventListener('click', cancelEditMode);
}

function loadClientList() {
    const clients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    const clientSelect = document.getElementById('clientSelect');
    
    // Clear existing options (except the first one)
    clientSelect.innerHTML = '<option value="">Choose a client...</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.clientName;
        clientSelect.appendChild(option);
    });
}

function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('id');
    const editMode = urlParams.get('edit') === 'true';
    
    if (clientId) {
        const clientSelect = document.getElementById('clientSelect');
        clientSelect.value = clientId;
        handleClientSelection();
        
        if (editMode) {
            setTimeout(() => {
                enableEditMode();
            }, 100);
        }
    }
}

function handleClientSelection() {
    const clientSelect = document.getElementById('clientSelect');
    const clientId = clientSelect.value;
    
    if (!clientId) {
        hideClientInfo();
        return;
    }
    
    const clients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    currentClient = clients.find(c => c.id === clientId);
    
    if (currentClient) {
        showClientInfo();
        populateClientInfo();
        populateTrackerStatus();
    }
}

function showClientInfo() {
    const clientInfoSection = document.getElementById('clientInfoSection');
    const updateTrackerBtn = document.getElementById('updateTrackerBtn');
    
    clientInfoSection.classList.remove('hidden');
    updateTrackerBtn.style.display = 'inline-flex';
}

function hideClientInfo() {
    const clientInfoSection = document.getElementById('clientInfoSection');
    const updateTrackerBtn = document.getElementById('updateTrackerBtn');
    const actionButtons = document.getElementById('actionButtons');
    
    clientInfoSection.classList.add('hidden');
    updateTrackerBtn.style.display = 'none';
    actionButtons.style.display = 'none';
    
    currentClient = null;
    isEditMode = false;
}

function populateClientInfo() {
    const clientInfoGrid = document.getElementById('clientInfoGrid');
    const goLiveDate = new Date(currentClient.goLiveDate).toLocaleDateString();
    const migrationFromDate = new Date(currentClient.migrationFromDate).toLocaleDateString();
    const migrationToDate = new Date(currentClient.migrationToDate).toLocaleDateString();
    
    clientInfoGrid.innerHTML = `
        <div class="info-item">
            <span class="info-label">Client Name</span>
            <span class="info-value">${currentClient.clientName}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Number of Entities</span>
            <span class="info-value">${currentClient.noOfEntities}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Go Live Date</span>
            <span class="info-value">${goLiveDate}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Legacy System</span>
            <span class="info-value">${currentClient.legacySystemName}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Access Available</span>
            <span class="info-value">${currentClient.accessAvailable === 'yes' ? '✅ Yes' : '❌ No'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Fiscal Year</span>
            <span class="info-value">${formatFiscalYear(currentClient.fiscalYear)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Migration Period</span>
            <span class="info-value">${migrationFromDate} - ${migrationToDate}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Trial Balance Years</span>
            <span class="info-value">${currentClient.trialBalanceYears}</span>
        </div>
        <div class="info-item">
            <span class="info-label">GL Transaction Years</span>
            <span class="info-value">${currentClient.glTransactionYears}</span>
        </div>
    `;
}

function formatFiscalYear(fiscalYear) {
    const fiscalYearMap = {
        'jan-dec': 'January to December',
        'feb-jan': 'February to January',
        'mar-feb': 'March to February',
        'apr-mar': 'April to March',
        'may-apr': 'May to April',
        'jun-may': 'June to May',
        'jul-jun': 'July to June',
        'aug-jul': 'August to July',
        'sep-aug': 'September to August',
        'oct-sep': 'October to September',
        'nov-oct': 'November to October',
        'dec-nov': 'December to November'
    };
    
    return fiscalYearMap[fiscalYear] || fiscalYear;
}

function populateTrackerStatus() {
    const trackerGrid = document.getElementById('trackerGrid');
    const status = currentClient.status || {};
    
    const trackerItems = [
        { key: 'openingBalanceInitiate', label: 'Opening Balance Initiate', icon: '💰' },
        { key: 'trialBalanceMigration', label: 'Trial Balance Migration', icon: '📊' },
        { key: 'glTransactionMigration', label: 'GL Transaction Migration', icon: '💾' },
        { key: 'validation', label: 'Validation', icon: '✅' },
        { key: 'openItems', label: 'Open Items', icon: '📋' }
    ];
    
    trackerGrid.innerHTML = '';
    
    trackerItems.forEach(item => {
        const trackerItem = document.createElement('div');
        trackerItem.className = 'tracker-item';
        
        const currentStatus = status[item.key] || 'Yet to start';
        
        trackerItem.innerHTML = `
            <div class="tracker-title">${item.icon} ${item.label}</div>
            <div class="status-display" id="status-${item.key}">
                <span class="status-badge ${getStatusClass(currentStatus)}">${currentStatus}</span>
            </div>
            <select class="status-selector hidden" id="select-${item.key}" data-key="${item.key}">
                <option value="Yet to start" ${currentStatus === 'Yet to start' ? 'selected' : ''}>Yet to start</option>
                <option value="In Progress" ${currentStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Hold" ${currentStatus === 'Hold' ? 'selected' : ''}>Hold</option>
                <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
        `;
        
        trackerGrid.appendChild(trackerItem);
    });
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'status-completed';
        case 'in progress':
            return 'status-in-progress';
        case 'hold':
            return 'status-hold';
        case 'yet to start':
        default:
            return 'status-yet-to-start';
    }
}

function enableEditMode() {
    isEditMode = true;
    originalStatus = { ...currentClient.status };
    
    // Hide status displays and show selectors
    const statusDisplays = document.querySelectorAll('.status-display');
    const statusSelectors = document.querySelectorAll('.status-selector');
    
    statusDisplays.forEach(display => display.classList.add('hidden'));
    statusSelectors.forEach(selector => selector.classList.remove('hidden'));
    
    // Show action buttons
    const actionButtons = document.getElementById('actionButtons');
    const updateTrackerBtn = document.getElementById('updateTrackerBtn');
    
    actionButtons.style.display = 'flex';
    updateTrackerBtn.style.display = 'none';
    
    showNotification('Edit mode enabled. Update the status and save changes.', 'info');
}

function cancelEditMode() {
    isEditMode = false;
    
    // Restore original status
    if (originalStatus) {
        currentClient.status = { ...originalStatus };
    }
    
    // Hide selectors and show status displays
    const statusDisplays = document.querySelectorAll('.status-display');
    const statusSelectors = document.querySelectorAll('.status-selector');
    
    statusDisplays.forEach(display => display.classList.remove('hidden'));
    statusSelectors.forEach(selector => selector.classList.add('hidden'));
    
    // Hide action buttons
    const actionButtons = document.getElementById('actionButtons');
    const updateTrackerBtn = document.getElementById('updateTrackerBtn');
    
    actionButtons.style.display = 'none';
    updateTrackerBtn.style.display = 'inline-flex';
    
    // Repopulate with original status
    populateTrackerStatus();
    
    showNotification('Changes cancelled.', 'info');
}

function saveTrackerChanges() {
    // Collect new status values
    const statusSelectors = document.querySelectorAll('.status-selector');
    const newStatus = {};
    
    statusSelectors.forEach(selector => {
        const key = selector.getAttribute('data-key');
        newStatus[key] = selector.value;
    });
    
    // Update current client
    currentClient.status = newStatus;
    
    // Save to localStorage
    const allClients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    const clientIndex = allClients.findIndex(c => c.id === currentClient.id);
    
    if (clientIndex !== -1) {
        allClients[clientIndex] = currentClient;
        localStorage.setItem('intacctClients', JSON.stringify(allClients));
        
        // Update project statistics
        updateProjectStats();
        
        // Exit edit mode
        isEditMode = false;
        
        // Hide selectors and show status displays
        const statusDisplays = document.querySelectorAll('.status-display');
        const statusSelectors = document.querySelectorAll('.status-selector');
        
        statusDisplays.forEach(display => display.classList.remove('hidden'));
        statusSelectors.forEach(selector => selector.classList.add('hidden'));
        
        // Hide action buttons
        const actionButtons = document.getElementById('actionButtons');
        const updateTrackerBtn = document.getElementById('updateTrackerBtn');
        
        actionButtons.style.display = 'none';
        updateTrackerBtn.style.display = 'inline-flex';
        
        // Repopulate with new status
        populateTrackerStatus();
        
        showNotification('Project status updated successfully!', 'success');
    } else {
        showNotification('Error saving changes. Please try again.', 'error');
    }
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

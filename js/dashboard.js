// Dashboard Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    loadClientData();
    setupEventListeners();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchClients');
    const statusFilter = document.getElementById('statusFilter');
    
    searchInput.addEventListener('input', filterClients);
    statusFilter.addEventListener('change', filterClients);
}

function loadClientData() {
    const clients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    
    if (clients.length === 0) {
        showEmptyState();
        return;
    }
    
    populateClientsTable(clients);
}

function populateClientsTable(clients) {
    const tableBody = document.getElementById('clientsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (clients.length === 0) {
        showEmptyState();
        return;
    }
    
    emptyState.classList.add('hidden');
    tableBody.innerHTML = '';
    
    clients.forEach(client => {
        const row = createClientRow(client);
        tableBody.appendChild(row);
    });
}

function createClientRow(client) {
    const row = document.createElement('tr');
    
    // Format go live date
    const goLiveDate = new Date(client.goLiveDate).toLocaleDateString();
    
    row.innerHTML = `
        <td><strong>${client.clientName}</strong></td>
        <td>${client.noOfEntities}</td>
        <td>${goLiveDate}</td>
        <td>${client.legacySystemName}</td>
        <td>${client.accessAvailable === 'yes' ? '✅ Yes' : '❌ No'}</td>
        <td>${createStatusBadge(client.status?.openingBalanceInitiate || 'Yet to start')}</td>
        <td>${createStatusBadge(client.status?.trialBalanceMigration || 'Yet to start')}</td>
        <td>${createStatusBadge(client.status?.glTransactionMigration || 'Yet to start')}</td>
        <td>${createStatusBadge(client.status?.validation || 'Yet to start')}</td>
        <td>${createStatusBadge(client.status?.openItems || 'Yet to start')}</td>
        <td>
            <div class="action-buttons">
                <button onclick="viewClient('${client.id}')" class="btn btn-secondary btn-small">👁️ View</button>
                <button onclick="updateClient('${client.id}')" class="btn btn-primary btn-small">✏️ Update</button>
                <button onclick="deleteClient('${client.id}', '${client.clientName}')" class="btn btn-danger btn-small">🗑️ Delete</button>
            </div>
        </td>
    `;
    
    return row;
}

function createStatusBadge(status) {
    const statusClass = getStatusClass(status);
    return `<span class="status-badge ${statusClass}">${status}</span>`;
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

function filterClients() {
    const searchTerm = document.getElementById('searchClients').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const allClients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    
    let filteredClients = allClients.filter(client => {
        const matchesSearch = client.clientName.toLowerCase().includes(searchTerm) ||
                             client.legacySystemName.toLowerCase().includes(searchTerm);
        
        let matchesStatus = true;
        if (statusFilter) {
            const statuses = Object.values(client.status || {});
            const hasStatus = statuses.some(s => s === statusFilter);
            
            if (statusFilter === 'Completed') {
                matchesStatus = statuses.every(s => s === 'Completed');
            } else {
                matchesStatus = hasStatus;
            }
        }
        
        return matchesSearch && matchesStatus;
    });
    
    populateClientsTable(filteredClients);
}

function showEmptyState() {
    const tableContainer = document.querySelector('.table-container');
    const emptyState = document.getElementById('emptyState');
    
    tableContainer.style.display = 'none';
    emptyState.classList.remove('hidden');
}

function editClient(clientId) {
    // Redirect to project status page in edit mode
    window.location.href = `project-status.html?edit=true&id=${clientId}`;
}

function updateClient(clientId) {
    // Redirect to create client page with client data for update
    window.location.href = `create-client.html?update=true&id=${clientId}`;
}

function viewClient(clientId) {
    // Redirect to project status page in view mode
    window.location.href = `project-status.html?id=${clientId}`;
}

function deleteClient(clientId, clientName) {
    showDeleteModal(clientId, clientName);
}

function showDeleteModal(clientId, clientName) {
    // Create modal HTML
    const modalHtml = `
        <div id="deleteModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">🗑️ Delete Client</h3>
                    <button class="close" onclick="closeDeleteModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="warning-text">
                        ⚠️ WARNING: This action cannot be undone!
                    </div>
                    <p>You are about to delete the client: <strong>${clientName}</strong></p>
                    <p>This will permanently remove all associated data including project status, migration details, and tracking information.</p>
                    
                    <div class="password-input-group">
                        <label for="deletePassword" class="form-label">Enter password to confirm deletion:</label>
                        <input type="password" id="deletePassword" class="password-input" placeholder="Enter password">
                        <div id="passwordError" class="error-message" style="color: var(--danger-color); margin-top: 0.5rem; display: none;">
                            ❌ Incorrect password. Please try again.
                        </div>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button onclick="closeDeleteModal()" class="btn btn-secondary">Cancel</button>
                    <button onclick="confirmDelete('${clientId}')" class="btn btn-danger">🗑️ Delete Client</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'block';
    
    // Focus on password input
    setTimeout(() => {
        document.getElementById('deletePassword').focus();
    }, 100);
    
    // Handle Enter key in password field
    document.getElementById('deletePassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmDelete(clientId);
        }
    });
    
    // Close modal on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDeleteModal();
        }
    });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function confirmDelete(clientId) {
    const passwordInput = document.getElementById('deletePassword');
    const passwordError = document.getElementById('passwordError');
    const enteredPassword = passwordInput.value;
    
    // Check password
    if (enteredPassword !== 'ADMIN') {
        passwordError.style.display = 'block';
        passwordInput.style.borderColor = 'var(--danger-color)';
        passwordInput.focus();
        
        // Clear error after 3 seconds
        setTimeout(() => {
            passwordError.style.display = 'none';
            passwordInput.style.borderColor = 'var(--gray-300)';
        }, 3000);
        
        return;
    }
    
    // Password is correct, proceed with deletion
    const allClients = JSON.parse(localStorage.getItem('intacctClients') || '[]');
    const updatedClients = allClients.filter(client => client.id !== clientId);
    
    // Save updated clients list
    localStorage.setItem('intacctClients', JSON.stringify(updatedClients));
    
    // Update project statistics
    updateProjectStats();
    
    // Close modal
    closeDeleteModal();
    
    // Show success notification
    showNotification('Client deleted successfully!', 'success');
    
    // Reload the client data
    loadClientData();
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

// Global functions for button clicks
window.editClient = editClient;
window.updateClient = updateClient;
window.viewClient = viewClient;
window.deleteClient = deleteClient;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;

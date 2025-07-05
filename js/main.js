// Modern Intacct Implementation App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeNavigation();
    initializeAnimations();
    initializeHomePage();
    updateStatsDisplay();
});

// Navigation functionality
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const submenus = document.querySelectorAll('.submenu');
    
    // Add click event listeners to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const submenuId = this.getAttribute('data-submenu');
            const submenu = document.getElementById(submenuId);
            const isActive = this.classList.contains('active');
            
            // Close all other submenus
            closeAllSubmenus();
            
            // Toggle current submenu
            if (!isActive && submenu) {
                this.classList.add('active');
                submenu.classList.add('show');
            }
        });
    });
    
    // Close submenus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item')) {
            closeAllSubmenus();
        }
    });
    
    // Handle submenu link clicks
    const submenuLinks = document.querySelectorAll('.submenu a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Handle inactive links
            if (this.classList.contains('inactive-link')) {
                e.preventDefault();
                showNotification('This feature is currently inactive', 'info');
                closeAllSubmenus();
                return;
            }
            
            // Handle different link types
            if (href === '#create-client') {
                e.preventDefault();
                window.location.href = 'pages/create-client.html';
            } else if (href === '#project-status') {
                e.preventDefault();
                window.location.href = 'pages/project-status.html';
            } else if (href.startsWith('#')) {
                e.preventDefault();
                // Handle anchor links (for future functionality)
                showNotification(`Navigating to: ${this.textContent}`);
                closeAllSubmenus();
            } else if (href.endsWith('.html')) {
                // Handle page navigation - let it proceed normally
                closeAllSubmenus();
            } else if (href.startsWith('http')) {
                // Handle external links - let them open in new tab
                closeAllSubmenus();
            } else {
                e.preventDefault();
                // Show notification for other links
                showNotification(`Feature "${this.textContent}" coming soon!`);
                closeAllSubmenus();
            }
        });
    });
}

// Close all submenus
function closeAllSubmenus() {
    const navButtons = document.querySelectorAll('.nav-button');
    const submenus = document.querySelectorAll('.submenu');
    
    navButtons.forEach(button => button.classList.remove('active'));
    submenus.forEach(submenu => submenu.classList.remove('show'));
}

// Initialize animations
function initializeAnimations() {
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    if (cards.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Initialize home page specific functionality
function initializeHomePage() {
    // Only run on home page
    if (!document.getElementById('projectChart')) return;
    
    // Initialize chart
    initializeChart();
    
    // Update stats periodically
    setInterval(updateStatsDisplay, 30000); // Update every 30 seconds
}

// Update statistics display
function updateStatsDisplay() {
    const stats = JSON.parse(localStorage.getItem('projectStats') || '{"total": 15, "completed": 8, "inProgress": 4, "hold": 2, "yetToStart": 1}');
    
    // Update stat cards if they exist
    const totalElement = document.getElementById('totalProjects');
    const completedElement = document.getElementById('completedProjects');
    const inProgressElement = document.getElementById('inProgressProjects');
    const holdElement = document.getElementById('holdProjects');
    const yetToStartElement = document.getElementById('yetToStartProjects');
    
    if (totalElement) totalElement.textContent = stats.total;
    if (completedElement) completedElement.textContent = stats.completed;
    if (inProgressElement) inProgressElement.textContent = stats.inProgress;
    if (holdElement) holdElement.textContent = stats.hold;
    if (yetToStartElement) yetToStartElement.textContent = stats.yetToStart;
    
    // Update chart if it exists
    if (window.projectChart) {
        updateChart(stats);
    }
}

// Initialize chart
function initializeChart() {
    const canvas = document.getElementById('projectChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const stats = JSON.parse(localStorage.getItem('projectStats') || '{"total": 15, "completed": 8, "inProgress": 4, "hold": 2, "yetToStart": 1}');
    
    // Create a simple donut chart
    window.projectChart = new SimpleDonutChart(ctx, {
        data: [
            { label: 'Completed', value: stats.completed, color: '#28a745' },
            { label: 'In Progress', value: stats.inProgress, color: '#17a2b8' },
            { label: 'On Hold', value: stats.hold, color: '#ffc107' },
            { label: 'Yet to Start', value: stats.yetToStart, color: '#adb5bd' }
        ]
    });
    
    window.projectChart.draw();
}

// Simple Donut Chart Implementation
class SimpleDonutChart {
    constructor(ctx, options) {
        this.ctx = ctx;
        this.data = options.data;
        this.centerX = ctx.canvas.width / 2;
        this.centerY = ctx.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 20;
        this.innerRadius = this.radius * 0.6;
    }
    
    draw() {
        const total = this.data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2; // Start from top
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw segments
        this.data.forEach(item => {
            if (item.value > 0) {
                const segmentAngle = (item.value / total) * 2 * Math.PI;
                
                // Draw segment
                this.ctx.beginPath();
                this.ctx.arc(this.centerX, this.centerY, this.radius, currentAngle, currentAngle + segmentAngle);
                this.ctx.arc(this.centerX, this.centerY, this.innerRadius, currentAngle + segmentAngle, currentAngle, true);
                this.ctx.closePath();
                this.ctx.fillStyle = item.color;
                this.ctx.fill();
                
                currentAngle += segmentAngle;
            }
        });
        
        // Draw center text
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(total.toString(), this.centerX, this.centerY - 10);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Total Projects', this.centerX, this.centerY + 15);
        
        // Draw legend
        this.drawLegend();
    }
    
    drawLegend() {
        const legendX = this.centerX + this.radius + 30;
        const legendY = this.centerY - (this.data.length * 25) / 2;
        
        this.data.forEach((item, index) => {
            const y = legendY + index * 25;
            
            // Draw color box
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(legendX, y - 8, 15, 15);
            
            // Draw text
            this.ctx.fillStyle = '#333';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${item.label}: ${item.value}`, legendX + 20, y);
        });
    }
    
    update(newData) {
        this.data = newData;
        this.draw();
    }
}

// Update chart with new data
function updateChart(stats) {
    if (!window.projectChart) return;
    
    const newData = [
        { label: 'Completed', value: stats.completed, color: '#28a745' },
        { label: 'In Progress', value: stats.inProgress, color: '#17a2b8' },
        { label: 'On Hold', value: stats.hold, color: '#ffc107' },
        { label: 'Yet to Start', value: stats.yetToStart, color: '#adb5bd' }
    ];
    
    window.projectChart.update(newData);
}

// Show notification function
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

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAllSubmenus();
    }
});

// Add smooth scrolling for anchor links
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Initialize default project stats if not present
function initializeDefaultStats() {
    if (!localStorage.getItem('projectStats')) {
        const defaultStats = {
            total: 15,
            completed: 8,
            inProgress: 4,
            hold: 2,
            yetToStart: 1
        };
        localStorage.setItem('projectStats', JSON.stringify(defaultStats));
    }
}

// Initialize default stats on load
initializeDefaultStats();
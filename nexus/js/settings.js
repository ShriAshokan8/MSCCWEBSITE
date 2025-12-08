/**
 * Settings Page JavaScript
 * MSC Initiative - Nexus Portal
 */

let currentUser = null;
let allRoles = [];
let allUsers = [];
let allLogs = [];
let rolesLogs = [];
let filesLogs = [];

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Require admin authentication
        await requireAdmin();
        currentUser = await getCurrentUser();
        
        // Load data
        await loadSystemStats();
        await loadRolesSummary();
        await loadActivityLogs();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup user info
        setupUserInfo();
        
    } catch (error) {
        console.error('Error initializing settings page:', error);
    }
});

/**
 * Load system statistics
 */
async function loadSystemStats() {
    try {
        // Load users
        allUsers = await getAllUsers();
        document.getElementById('totalUsers').textContent = allUsers.length;
        
        // Load roles
        allRoles = await getAllRoles();
        document.getElementById('totalRoles').textContent = allRoles.length;
        
        // Load logs
        allLogs = await getActivityLogs('all', 1000);
        document.getElementById('totalLogs').textContent = allLogs.length;
        
        // Try to get file count from Supabase
        try {
            const files = await listFiles('');
            document.getElementById('totalFiles').textContent = countFiles(files);
        } catch (error) {
            console.error('Error loading file count:', error);
            document.getElementById('totalFiles').textContent = 'N/A';
        }
        
    } catch (error) {
        console.error('Error loading system stats:', error);
    }
}

/**
 * Count files recursively
 */
function countFiles(items, count = 0) {
    items.forEach(item => {
        if (item.metadata) {
            count++;
        }
    });
    return count;
}

/**
 * Load roles summary
 */
async function loadRolesSummary() {
    const rolesSummary = document.getElementById('rolesSummary');
    
    if (allRoles.length === 0) {
        rolesSummary.innerHTML = '<p class="text-muted">No roles configured.</p>';
        return;
    }
    
    rolesSummary.innerHTML = '';
    
    allRoles.forEach(role => {
        const userCount = allUsers.filter(user => 
            user.roles && user.roles.includes(role.name)
        ).length;
        
        const item = document.createElement('div');
        item.className = 'role-summary-item';
        item.innerHTML = `
            <div class="role-summary-info">
                <div class="role-summary-name">${role.name}</div>
                <div class="role-summary-meta">${userCount} user${userCount !== 1 ? 's' : ''} • ${role.isAdmin ? 'Admin' : 'Standard'}</div>
            </div>
            ${role.isAdmin ? '<span class="role-summary-badge">ADMIN</span>' : ''}
        `;
        rolesSummary.appendChild(item);
    });
}

/**
 * Load activity logs
 */
async function loadActivityLogs() {
    try {
        // Get all logs
        allLogs = await getActivityLogs('all', 100);
        displayActivityLogs('allActivityLog', allLogs);
        
        // Get roles logs
        rolesLogs = await getActivityLogs('roles', 100);
        displayActivityLogs('rolesActivityLog', rolesLogs);
        
        // Get files logs
        filesLogs = await getActivityLogs('files', 100);
        displayActivityLogs('filesActivityLog', filesLogs);
        
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

/**
 * Display activity logs
 */
function displayActivityLogs(containerId, logs) {
    const container = document.getElementById(containerId);
    
    if (logs.length === 0) {
        container.innerHTML = '<p class="text-muted">No activity logs found.</p>';
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const timestamp = log.timestamp ? log.timestamp.toDate() : new Date();
        const typeBadge = log.type ? `<span class="activity-type-badge">${log.type}</span>` : '';
        
        return `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-action">
                        ${log.action || 'Unknown action'}
                        ${typeBadge}
                    </span>
                    <span class="activity-time">${formatTimestamp(timestamp)}</span>
                </div>
                <div class="activity-details">
                    ${log.details || log.fileName || ''}
                    ${log.userName ? ` • by ${log.userName}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Format timestamp
 */
function formatTimestamp(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // User dropdown
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });
    
    // User actions
    document.getElementById('signOut').addEventListener('click', signOut);
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });
}

/**
 * Setup user info in top bar
 */
async function setupUserInfo() {
    const userDoc = await getCurrentUserDoc();
    if (userDoc) {
        const userAvatar = document.getElementById('userAvatar');
        const initials = userDoc.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userAvatar.textContent = initials;
    }
}

/**
 * Switch tab
 */
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'Tab');
    });
}

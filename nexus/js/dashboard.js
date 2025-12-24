/**
 * Dashboard Page JavaScript
 * MSC Initiative - Nexus Portal
 */

let currentUser = null;
let currentUserDoc = null;
let isAdminUser = false;

// Initialize dashboard on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Require authentication
        currentUser = await requireAuth();
        
        // Get user document
        currentUserDoc = await getCurrentUserDoc();
        if (!currentUserDoc) {
            alert('User profile not found. Please contact an administrator.');
            await signOut();
            return;
        }
        
        // Check if user is admin
        isAdminUser = await isAdmin();
        
        // Load dashboard data
        loadUserInfo();
        loadRoles();
        showAdminElements();
        loadRecentFiles();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});

/**
 * Load user information
 */
function loadUserInfo() {
    // Set welcome message
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    
    welcomeTitle.textContent = `Welcome, ${currentUserDoc.fullName}`;
    welcomeSubtitle.textContent = currentUserDoc.primaryEmail;
    
    // Set user avatar
    const userAvatar = document.getElementById('userAvatar');
    const initials = currentUserDoc.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    userAvatar.textContent = initials;
}

/**
 * Load and display user roles
 */
function loadRoles() {
    const rolesChips = document.getElementById('rolesChips');
    rolesChips.innerHTML = '';
    
    if (!currentUserDoc.roles || currentUserDoc.roles.length === 0) {
        rolesChips.innerHTML = '<p class="text-muted">No roles assigned</p>';
        return;
    }
    
    currentUserDoc.roles.forEach(role => {
        const chip = document.createElement('div');
        chip.className = 'chip chip-orange';
        chip.textContent = role;
        rolesChips.appendChild(chip);
    });
}

/**
 * Show/hide admin-only elements
 */
function showAdminElements() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        if (isAdminUser) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

/**
 * Load recent files from Firestore
 */
async function loadRecentFiles() {
    const recentFilesList = document.getElementById('recentFilesList');
    
    try {
        // Try to get recent file activities from systemLogs
        const logsSnapshot = await db.collection('systemLogs')
            .where('type', '==', 'files')
            .where('userId', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        if (logsSnapshot.empty) {
            recentFilesList.innerHTML = '<p class="text-muted">No recent files</p>';
            return;
        }
        
        recentFilesList.innerHTML = '';
        
        logsSnapshot.forEach(doc => {
            const log = doc.data();
            const fileItem = createFileItem(log);
            recentFilesList.appendChild(fileItem);
        });
        
    } catch (error) {
        console.error('Error loading recent files:', error);
        recentFilesList.innerHTML = '<p class="text-muted">Unable to load recent files</p>';
    }
}

/**
 * Create file item element
 */
function createFileItem(log) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const icon = getFileIcon(log.fileName);
    
    item.innerHTML = `
        <div class="file-icon">${icon}</div>
        <div class="file-info">
            <div class="file-name">${log.fileName}</div>
            <div class="file-meta">${log.action} • ${formatTimestamp(log.timestamp)}</div>
        </div>
    `;
    
    return item;
}

/**
 * Get file icon based on file name
 */
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        ppt: '📊',
        pptx: '📊',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️',
        zip: '🗜️',
        rar: '🗜️'
    };
    
    return iconMap[ext] || '📄';
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // User dropdown toggle
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });
    
    // View Profile
    document.getElementById('viewProfile').addEventListener('click', () => {
        alert('Profile view coming soon!');
    });
    
    // Add Email
    document.getElementById('addEmail').addEventListener('click', () => {
        openAddEmailModal();
    });
    
    // Sign Out
    document.getElementById('signOut').addEventListener('click', async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        }
    });
    
    // Add Email Modal
    document.getElementById('closeAddEmailModal').addEventListener('click', closeAddEmailModal);
    document.getElementById('cancelAddEmail').addEventListener('click', closeAddEmailModal);
    document.getElementById('submitAddEmail').addEventListener('click', handleAddEmail);
}

/**
 * Open add email modal
 */
function openAddEmailModal() {
    document.getElementById('addEmailModal').classList.add('active');
    document.getElementById('newEmail').value = '';
    document.getElementById('emailAlertContainer').innerHTML = '';
}

/**
 * Close add email modal
 */
function closeAddEmailModal() {
    document.getElementById('addEmailModal').classList.remove('active');
}

/**
 * Handle add email submission
 */
async function handleAddEmail() {
    const newEmail = document.getElementById('newEmail').value.trim();
    const alertContainer = document.getElementById('emailAlertContainer');
    const submitButton = document.getElementById('submitAddEmail');
    
    alertContainer.innerHTML = '';
    
    if (!newEmail) {
        showModalAlert('Please enter an email address.', 'error');
        return;
    }
    
    // Check if email already exists
    const allEmails = [currentUserDoc.primaryEmail, ...(currentUserDoc.secondaryEmails || [])];
    if (allEmails.includes(newEmail)) {
        showModalAlert('This email is already associated with your account.', 'error');
        return;
    }
    
    // Disable button
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';
    
    try {
        await addSecondaryEmail(currentUser.uid, newEmail);
        
        showModalAlert('Email added successfully!', 'success');
        
        // Update local user doc
        currentUserDoc.secondaryEmails = currentUserDoc.secondaryEmails || [];
        currentUserDoc.secondaryEmails.push(newEmail);
        
        // Close modal after delay
        setTimeout(() => {
            closeAddEmailModal();
        }, 1500);
        
    } catch (error) {
        console.error('Error adding email:', error);
        showModalAlert(error.message || 'Failed to add email. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Email';
    }
}

/**
 * Show alert in modal
 */
function showModalAlert(message, type) {
    const alertContainer = document.getElementById('emailAlertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
}

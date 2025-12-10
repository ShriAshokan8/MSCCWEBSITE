/**
 * Roles Manager JavaScript
 * MSC Initiative - Nexus Portal
 */

let currentUser = null;
let allRoles = [];
let allUsers = [];
let activityLogs = [];
let editingRoleId = null;

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Require admin authentication
        await requireAdmin();
        currentUser = await getCurrentUser();
        
        // Load data
        await loadRoles();
        await loadUsers();
        await loadActivityLogs();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup user info
        setupUserInfo();
        
        // Initialize default roles if needed
        await initializeDefaultRoles();
        
    } catch (error) {
        console.error('Error initializing roles page:', error);
    }
});

/**
 * Initialize default roles
 */
async function initializeDefaultRoles() {
    const defaultRoles = [
        {
            name: 'Global - Initiative Director',
            description: 'Overall leader of the MSC Initiative with full administrative access',
            isAdmin: true,
            permissions: { manageFiles: true, manageRoles: true, viewLogs: true, manageUsers: true }
        },
        {
            name: 'Global - Deputy Initiative Director',
            description: 'Second in command with full administrative access',
            isAdmin: true,
            permissions: { manageFiles: true, manageRoles: true, viewLogs: true, manageUsers: true }
        },
        {
            name: 'HAPU - School Lead',
            description: 'Leader of the HAPU school program',
            isAdmin: false,
            permissions: { manageFiles: false, manageRoles: false, viewLogs: false, manageUsers: false }
        },
        {
            name: 'HAPU - Deputy School Lead',
            description: 'Deputy leader of the HAPU school program',
            isAdmin: false,
            permissions: { manageFiles: false, manageRoles: false, viewLogs: false, manageUsers: false }
        },
        {
            name: 'HAPU - Core Team',
            description: 'Core team member in HAPU program',
            isAdmin: false,
            permissions: { manageFiles: false, manageRoles: false, viewLogs: false, manageUsers: false }
        },
        {
            name: 'HAPU - Support Team',
            description: 'Support team member in HAPU program',
            isAdmin: false,
            permissions: { manageFiles: false, manageRoles: false, viewLogs: false, manageUsers: false }
        },
        {
            name: 'HAPU - Staff',
            description: 'Staff member in HAPU program',
            isAdmin: false,
            permissions: { manageFiles: false, manageRoles: false, viewLogs: false, manageUsers: false }
        },
        {
            name: 'HAPU - Staff Coordinator',
            description: 'Coordinator for HAPU staff members',
            isAdmin: false,
            permissions: { manageFiles: false, manageRoles: false, viewLogs: false, manageUsers: false }
        }
    ];
    
    // Check if roles already exist
    if (allRoles.length === 0) {
        console.log('Initializing default roles...');
        
        for (const roleData of defaultRoles) {
            try {
                // Check if role exists
                const existingRole = await db.collection('roles')
                    .where('name', '==', roleData.name)
                    .get();
                
                if (existingRole.empty) {
                    await db.collection('roles').add({
                        ...roleData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Created role: ${roleData.name}`);
                }
            } catch (error) {
                console.error(`Error creating role ${roleData.name}:`, error);
            }
        }
        
        // Reload roles
        await loadRoles();
    }
}

/**
 * Load all roles
 */
async function loadRoles() {
    try {
        allRoles = await getAllRoles();
        displayRoles();
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

/**
 * Display roles
 */
function displayRoles() {
    const rolesList = document.getElementById('rolesList');
    
    if (allRoles.length === 0) {
        rolesList.innerHTML = '<p class="text-muted">No roles found. Create one to get started.</p>';
        return;
    }
    
    rolesList.innerHTML = '';
    
    allRoles.forEach(role => {
        const roleCard = createRoleCard(role);
        rolesList.appendChild(roleCard);
    });
}

/**
 * Create role card element
 */
function createRoleCard(role) {
    const card = document.createElement('div');
    card.className = 'role-card';
    
    const permissions = role.permissions || {};
    const permissionsList = Object.entries(permissions)
        .filter(([key, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    
    const userCount = allUsers.filter(user => 
        user.roles && user.roles.includes(role.name)
    ).length;
    
    card.innerHTML = `
        <div class="role-header">
            <div class="role-info">
                <h3 class="role-name">
                    ${role.name}
                    ${role.isAdmin ? '<span class="role-badge">ADMIN</span>' : ''}
                </h3>
                <p class="role-description">${role.description || 'No description'}</p>
                <p class="role-user-count">${userCount} user${userCount !== 1 ? 's' : ''}</p>
                ${permissionsList.length > 0 ? `
                    <div class="role-permissions">
                        ${permissionsList.map(p => `<span class="permission-chip">${p}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
        <div class="role-actions">
            <button class="btn btn-sm btn-secondary" onclick="editRole('${role.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="confirmDeleteRole('${role.id}', '${role.name}')">Delete</button>
        </div>
    `;
    
    return card;
}

/**
 * Load all users
 */
async function loadUsers() {
    try {
        allUsers = await getAllUsers();
        displayUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

/**
 * Display users
 */
function displayUsers(filteredUsers = null) {
    const usersList = document.getElementById('usersList');
    const users = filteredUsers || allUsers;
    
    if (users.length === 0) {
        usersList.innerHTML = '<p class="text-muted">No users found.</p>';
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = createUserCard(user);
        usersList.appendChild(userCard);
    });
}

/**
 * Create user card element
 */
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.onclick = () => showUserDetails(user);
    
    const initials = (user.fullName || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    card.innerHTML = `
        <div class="user-avatar-large">${initials}</div>
        <div class="user-info-block">
            <div class="user-name">${user.fullName || 'Unknown'}</div>
            <div class="user-email">${user.primaryEmail}</div>
            <div class="user-roles">
                ${(user.roles || []).map(role => 
                    `<span class="chip">${role}</span>`
                ).join('')}
                ${!user.roles || user.roles.length === 0 ? '<span class="text-muted">No roles</span>' : ''}
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Load activity logs
 */
async function loadActivityLogs() {
    try {
        activityLogs = await getActivityLogs('roles', 50);
        displayActivityLogs();
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

/**
 * Display activity logs
 */
function displayActivityLogs() {
    const activityLog = document.getElementById('activityLog');
    
    if (activityLogs.length === 0) {
        activityLog.innerHTML = '<p class="text-muted">No activity logs found.</p>';
        return;
    }
    
    activityLog.innerHTML = activityLogs.map(log => {
        const timestamp = log.timestamp ? log.timestamp.toDate() : new Date();
        return `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-action">${log.action || 'Unknown action'}</span>
                    <span class="activity-time">${formatTimestamp(timestamp)}</span>
                </div>
                <div class="activity-details">${log.details || ''}</div>
            </div>
        `;
    }).join('');
}

/**
 * Format timestamp
 */
function formatTimestamp(date) {
    return date.toLocaleString();
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
    
    // Create role button
    document.getElementById('createRoleBtn').addEventListener('click', openCreateRoleModal);
    
    // Role modal
    document.getElementById('closeRoleModal').addEventListener('click', closeRoleModal);
    document.getElementById('cancelRoleModal').addEventListener('click', closeRoleModal);
    document.getElementById('submitRole').addEventListener('click', handleSubmitRole);
    
    // User modal
    document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
    document.getElementById('closeUserDetailsModal').addEventListener('click', closeUserModal);
    
    // User search
    document.getElementById('userSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query === '') {
            displayUsers();
        } else {
            const filtered = allUsers.filter(user => 
                user.fullName?.toLowerCase().includes(query) ||
                user.primaryEmail?.toLowerCase().includes(query)
            );
            displayUsers(filtered);
        }
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

/**
 * Open create role modal
 */
function openCreateRoleModal() {
    editingRoleId = null;
    document.getElementById('roleModalTitle').textContent = 'Create Role';
    document.getElementById('roleName').value = '';
    document.getElementById('roleDescription').value = '';
    document.getElementById('roleIsAdmin').checked = false;
    document.querySelectorAll('input[name="permission"]').forEach(cb => cb.checked = false);
    document.getElementById('roleAlertContainer').innerHTML = '';
    document.getElementById('roleModal').classList.add('active');
}

/**
 * Edit role
 */
window.editRole = function(roleId) {
    const role = allRoles.find(r => r.id === roleId);
    if (!role) return;
    
    editingRoleId = roleId;
    document.getElementById('roleModalTitle').textContent = 'Edit Role';
    document.getElementById('roleName').value = role.name;
    document.getElementById('roleDescription').value = role.description || '';
    document.getElementById('roleIsAdmin').checked = role.isAdmin || false;
    
    // Set permissions
    const permissions = role.permissions || {};
    document.querySelectorAll('input[name="permission"]').forEach(cb => {
        cb.checked = permissions[cb.value] || false;
    });
    
    document.getElementById('roleAlertContainer').innerHTML = '';
    document.getElementById('roleModal').classList.add('active');
};

/**
 * Close role modal
 */
function closeRoleModal() {
    document.getElementById('roleModal').classList.remove('active');
}

/**
 * Handle submit role
 */
async function handleSubmitRole() {
    const name = document.getElementById('roleName').value.trim();
    const description = document.getElementById('roleDescription').value.trim();
    const isAdmin = document.getElementById('roleIsAdmin').checked;
    
    const permissions = {};
    document.querySelectorAll('input[name="permission"]').forEach(cb => {
        permissions[cb.value] = cb.checked;
    });
    
    if (!name) {
        showRoleAlert('Please enter a role name.', 'error');
        return;
    }
    
    const submitButton = document.getElementById('submitRole');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    
    try {
        if (editingRoleId) {
            // Update existing role
            await updateRole(editingRoleId, { name, description, isAdmin, permissions });
            showRoleAlert('Role updated successfully!', 'success');
        } else {
            // Create new role
            await createRole({ name, description, isAdmin, permissions });
            showRoleAlert('Role created successfully!', 'success');
        }
        
        await loadRoles();
        
        setTimeout(() => {
            closeRoleModal();
        }, 1000);
        
    } catch (error) {
        console.error('Error saving role:', error);
        showRoleAlert(error.message || 'Failed to save role.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Role';
    }
}

/**
 * Confirm delete role
 */
window.confirmDeleteRole = function(roleId, roleName) {
    if (confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
        deleteRoleById(roleId);
    }
};

/**
 * Delete role
 */
async function deleteRoleById(roleId) {
    try {
        await deleteRole(roleId);
        await loadRoles();
        alert('Role deleted successfully.');
    } catch (error) {
        console.error('Error deleting role:', error);
        alert('Failed to delete role: ' + error.message);
    }
}

/**
 * Show user details
 */
function showUserDetails(user) {
    const userDetails = document.getElementById('userDetails');
    
    const allEmails = [
        { email: user.primaryEmail, isPrimary: true },
        ...(user.secondaryEmails || []).map(email => ({ email, isPrimary: false }))
    ];
    
    userDetails.innerHTML = `
        <div class="user-detail-section">
            <h4 class="detail-title">User Information</h4>
            <p><strong>Name:</strong> ${user.fullName}</p>
            <p><strong>User ID:</strong> ${user.id}</p>
        </div>
        
        <div class="user-detail-section">
            <h4 class="detail-title">Email Addresses</h4>
            <div class="email-list">
                ${allEmails.map(e => `
                    <div class="email-item">
                        <span class="email-address">${e.email}</span>
                        ${e.isPrimary ? '<span class="email-badge">Primary</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="user-detail-section">
            <h4 class="detail-title">Current Roles</h4>
            <div class="roles-chips">
                ${(user.roles || []).map(role => 
                    `<span class="chip chip-orange">${role}</span>`
                ).join('')}
                ${!user.roles || user.roles.length === 0 ? '<span class="text-muted">No roles assigned</span>' : ''}
            </div>
        </div>
        
        <div class="user-detail-section">
            <h4 class="detail-title">Manage Roles</h4>
            <div class="role-assignment">
                <div class="role-select-group">
                    <select id="roleToAssign" class="form-input">
                        <option value="">Select a role...</option>
                        ${allRoles.map(role => 
                            `<option value="${role.name}">${role.name}</option>`
                        ).join('')}
                    </select>
                    <button class="btn btn-primary" onclick="assignRole('${user.id}')">Assign</button>
                </div>
                <div class="role-select-group">
                    <select id="roleToRemove" class="form-input">
                        <option value="">Select a role to remove...</option>
                        ${(user.roles || []).map(role => 
                            `<option value="${role}">${role}</option>`
                        ).join('')}
                    </select>
                    <button class="btn btn-danger" onclick="removeRole('${user.id}')">Remove</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('userModal').classList.add('active');
}

/**
 * Assign role to user
 */
window.assignRole = async function(userId) {
    const roleSelect = document.getElementById('roleToAssign');
    const roleName = roleSelect.value;
    
    if (!roleName) {
        alert('Please select a role.');
        return;
    }
    
    try {
        await assignUserRole(userId, roleName);
        await loadUsers();
        alert('Role assigned successfully.');
        closeUserModal();
    } catch (error) {
        console.error('Error assigning role:', error);
        alert('Failed to assign role: ' + error.message);
    }
};

/**
 * Remove role from user
 */
window.removeRole = async function(userId) {
    const roleSelect = document.getElementById('roleToRemove');
    const roleName = roleSelect.value;
    
    if (!roleName) {
        alert('Please select a role to remove.');
        return;
    }
    
    try {
        await removeUserRole(userId, roleName);
        await loadUsers();
        alert('Role removed successfully.');
        closeUserModal();
    } catch (error) {
        console.error('Error removing role:', error);
        alert('Failed to remove role: ' + error.message);
    }
};

/**
 * Close user modal
 */
function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

/**
 * Show alert in role modal
 */
function showRoleAlert(message, type) {
    const alertContainer = document.getElementById('roleAlertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
}

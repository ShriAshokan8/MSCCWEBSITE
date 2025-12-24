/**
 * Files Manager JavaScript
 * MSC Initiative - Nexus Portal
 */

let currentUser = null;
let currentUserDoc = null;
let isAdminUser = false;
let currentPath = '';
let selectedFiles = [];

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Require authentication
        currentUser = await requireAuth();
        currentUserDoc = await getCurrentUserDoc();
        isAdminUser = await isAdmin();
        
        // Setup UI based on permissions
        setupPermissions();
        
        // Load files
        await loadFiles(currentPath);
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup user info
        setupUserInfo();
        
    } catch (error) {
        console.error('Error initializing files page:', error);
    }
});

/**
 * Setup permissions-based UI
 */
function setupPermissions() {
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
 * Setup user info
 */
async function setupUserInfo() {
    if (currentUserDoc) {
        const userAvatar = document.getElementById('userAvatar');
        const initials = currentUserDoc.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userAvatar.textContent = initials;
    }
}

/**
 * Load files for current path
 */
async function loadFiles(path) {
    const filesGrid = document.getElementById('filesGrid');
    filesGrid.innerHTML = '<div class="spinner"></div>';
    
    try {
        const files = await listFiles(path);
        displayFiles(files);
        updateBreadcrumb(path);
    } catch (error) {
        console.error('Error loading files:', error);
        filesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p class="empty-state-text">Error loading files. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Display files in grid
 */
function displayFiles(files) {
    const filesGrid = document.getElementById('filesGrid');
    
    if (files.length === 0) {
        filesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <p class="empty-state-text">This folder is empty</p>
            </div>
        `;
        return;
    }
    
    filesGrid.innerHTML = '';
    
    // Sort: folders first, then files
    const folders = files.filter(f => !f.metadata);
    const regularFiles = files.filter(f => f.metadata);
    
    [...folders, ...regularFiles].forEach(file => {
        const fileItem = createFileItem(file);
        filesGrid.appendChild(fileItem);
    });
}

/**
 * Create file item element
 */
function createFileItem(file) {
    const isFolder = !file.metadata;
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const icon = isFolder ? '📁' : getFileIcon(file.name);
    const size = file.metadata ? formatFileSize(file.metadata.size) : '';
    
    item.innerHTML = `
        <div class="file-item-icon">${icon}</div>
        <div class="file-item-name">${file.name}</div>
        ${size ? `<div class="file-item-meta">${size}</div>` : ''}
    `;
    
    if (isFolder) {
        item.onclick = () => navigateToFolder(file.name);
    } else {
        item.onclick = () => previewFile(file);
    }
    
    // Add actions for admins
    if (isAdminUser) {
        const actions = document.createElement('div');
        actions.className = 'file-item-actions';
        actions.innerHTML = `
            <button class="file-action-btn" onclick="event.stopPropagation(); renameItem('${file.name}', ${isFolder})">Rename</button>
            <button class="file-action-btn danger" onclick="event.stopPropagation(); confirmDelete('${file.name}', ${isFolder})">Delete</button>
        `;
        item.appendChild(actions);
    }
    
    return item;
}

/**
 * Get file icon based on extension
 */
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
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
        svg: '🖼️',
        mp4: '🎥',
        mov: '🎥',
        avi: '🎥',
        mp3: '🎵',
        wav: '🎵',
        zip: '🗜️',
        rar: '🗜️',
        txt: '📝',
        md: '📝'
    };
    return iconMap[ext] || '📄';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Navigate to folder
 */
function navigateToFolder(folderName) {
    currentPath = currentPath ? `${currentPath}${folderName}/` : `${folderName}/`;
    loadFiles(currentPath);
}

/**
 * Update breadcrumb
 */
function updateBreadcrumb(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';
    
    // Root
    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item';
    rootItem.textContent = 'Root';
    rootItem.dataset.path = '';
    rootItem.onclick = () => navigateToBreadcrumb('');
    breadcrumb.appendChild(rootItem);
    
    // Path segments
    if (path) {
        const segments = path.split('/').filter(s => s);
        let accPath = '';
        
        segments.forEach((segment, index) => {
            accPath += segment + '/';
            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = segment;
            item.dataset.path = accPath;
            item.onclick = () => navigateToBreadcrumb(accPath);
            
            if (index === segments.length - 1) {
                item.classList.add('active');
            }
            
            breadcrumb.appendChild(item);
        });
    } else {
        rootItem.classList.add('active');
    }
}

/**
 * Navigate via breadcrumb
 */
function navigateToBreadcrumb(path) {
    currentPath = path;
    loadFiles(currentPath);
}

/**
 * Preview file
 */
function previewFile(file) {
    const filePath = currentPath + file.name;
    const publicUrl = getPublicUrl(filePath);
    
    // For images, open in new tab
    const ext = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
        window.open(publicUrl, '_blank');
    } else if (ext === 'pdf') {
        window.open(publicUrl, '_blank');
    } else {
        // Download file
        const link = document.createElement('a');
        link.href = publicUrl;
        link.download = file.name;
        link.click();
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Mobile menu
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
    
    document.getElementById('signOut').addEventListener('click', signOut);
    
    // Upload file button
    if (isAdminUser) {
        document.getElementById('uploadFileBtn').addEventListener('click', openUploadModal);
        document.getElementById('createFolderBtn').addEventListener('click', openFolderModal);
    }
    
    // Upload modal
    document.getElementById('closeUploadModal').addEventListener('click', closeUploadModal);
    document.getElementById('cancelUpload').addEventListener('click', closeUploadModal);
    document.getElementById('startUpload').addEventListener('click', handleUpload);
    
    // Upload area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Folder modal
    document.getElementById('closeFolderModal').addEventListener('click', closeFolderModal);
    document.getElementById('cancelFolder').addEventListener('click', closeFolderModal);
    document.getElementById('createFolder').addEventListener('click', handleCreateFolder);
}

/**
 * Open upload modal
 */
function openUploadModal() {
    selectedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('startUpload').disabled = true;
    document.getElementById('uploadAlertContainer').innerHTML = '';
    document.getElementById('uploadModal').classList.add('active');
}

/**
 * Close upload modal
 */
function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

/**
 * Handle file select
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = files;
    displaySelectedFiles();
}

/**
 * Display selected files
 */
function displaySelectedFiles() {
    const fileList = document.getElementById('fileList');
    const startButton = document.getElementById('startUpload');
    
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        startButton.disabled = true;
        return;
    }
    
    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-list-item">
            <span class="file-list-name">${file.name}</span>
            <button class="file-list-remove" onclick="removeSelectedFile(${index})">×</button>
        </div>
    `).join('');
    
    startButton.disabled = false;
}

/**
 * Remove selected file
 */
window.removeSelectedFile = function(index) {
    selectedFiles.splice(index, 1);
    displaySelectedFiles();
};

/**
 * Handle upload
 */
async function handleUpload() {
    if (selectedFiles.length === 0) return;
    
    const startButton = document.getElementById('startUpload');
    const alertContainer = document.getElementById('uploadAlertContainer');
    
    startButton.disabled = true;
    startButton.textContent = 'Uploading...';
    alertContainer.innerHTML = '';
    
    try {
        for (const file of selectedFiles) {
            const filePath = currentPath + file.name;
            await uploadFile(filePath, file);
            
            // Log activity
            await logFileActivity({
                action: 'Uploaded',
                fileName: file.name,
                filePath: filePath,
                userId: currentUser.uid,
                userName: currentUserDoc.fullName
            });
        }
        
        showUploadAlert('Files uploaded successfully!', 'success');
        
        // Reload files
        await loadFiles(currentPath);
        
        setTimeout(() => {
            closeUploadModal();
        }, 1500);
        
    } catch (error) {
        console.error('Error uploading files:', error);
        showUploadAlert('Error uploading files: ' + error.message, 'error');
    } finally {
        startButton.disabled = false;
        startButton.textContent = 'Upload';
    }
}

/**
 * Show upload alert
 */
function showUploadAlert(message, type) {
    const alertContainer = document.getElementById('uploadAlertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    alertContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

/**
 * Open folder modal
 */
function openFolderModal() {
    document.getElementById('folderName').value = '';
    document.getElementById('folderAlertContainer').innerHTML = '';
    document.getElementById('folderModal').classList.add('active');
}

/**
 * Close folder modal
 */
function closeFolderModal() {
    document.getElementById('folderModal').classList.remove('active');
}

/**
 * Handle create folder
 */
async function handleCreateFolder() {
    const folderName = document.getElementById('folderName').value.trim();
    const alertContainer = document.getElementById('folderAlertContainer');
    const createButton = document.getElementById('createFolder');
    
    if (!folderName) {
        alertContainer.innerHTML = '<div class="alert alert-error">Please enter a folder name.</div>';
        return;
    }
    
    createButton.disabled = true;
    createButton.textContent = 'Creating...';
    
    try {
        const folderPath = currentPath + folderName + '/';
        await createFolder(folderPath);
        
        // Log activity
        await logFileActivity({
            action: 'Created folder',
            fileName: folderName,
            filePath: folderPath,
            userId: currentUser.uid,
            userName: currentUserDoc.fullName
        });
        
        alertContainer.innerHTML = '<div class="alert alert-success">Folder created successfully!</div>';
        
        // Reload files
        await loadFiles(currentPath);
        
        setTimeout(() => {
            closeFolderModal();
        }, 1000);
        
    } catch (error) {
        console.error('Error creating folder:', error);
        alertContainer.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
    } finally {
        createButton.disabled = false;
        createButton.textContent = 'Create';
    }
}

/**
 * Rename item
 */
window.renameItem = async function(itemName, isFolder) {
    const newName = prompt(`Rename ${isFolder ? 'folder' : 'file'}:`, itemName);
    if (!newName || newName === itemName) return;
    
    try {
        const oldPath = currentPath + itemName;
        const newPath = currentPath + newName;
        
        await renameFile(oldPath, newPath);
        
        await logFileActivity({
            action: 'Renamed',
            fileName: `${itemName} → ${newName}`,
            filePath: newPath,
            userId: currentUser.uid,
            userName: currentUserDoc.fullName
        });
        
        await loadFiles(currentPath);
        alert('Renamed successfully!');
        
    } catch (error) {
        console.error('Error renaming:', error);
        alert('Error renaming: ' + error.message);
    }
};

/**
 * Confirm delete
 */
window.confirmDelete = function(itemName, isFolder) {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        deleteItem(itemName, isFolder);
    }
};

/**
 * Delete item
 */
async function deleteItem(itemName, isFolder) {
    try {
        const itemPath = currentPath + itemName;
        
        if (isFolder) {
            await deleteFolder(itemPath + '/');
        } else {
            await deleteFile(itemPath);
        }
        
        await logFileActivity({
            action: 'Deleted',
            fileName: itemName,
            filePath: itemPath,
            userId: currentUser.uid,
            userName: currentUserDoc.fullName
        });
        
        await loadFiles(currentPath);
        alert('Deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting: ' + error.message);
    }
}

/**
 * Handle drag over
 */
window.handleDragOver = function(e) {
    e.preventDefault();
    if (!isAdminUser) return;
    
    const filesGrid = document.getElementById('filesGrid');
    filesGrid.classList.add('drag-over');
    document.getElementById('dropZone').classList.add('active');
};

/**
 * Handle drag leave
 */
window.handleDragLeave = function(e) {
    const filesGrid = document.getElementById('filesGrid');
    filesGrid.classList.remove('drag-over');
    document.getElementById('dropZone').classList.remove('active');
};

/**
 * Handle drop
 */
window.handleDrop = async function(e) {
    e.preventDefault();
    if (!isAdminUser) return;
    
    const filesGrid = document.getElementById('filesGrid');
    filesGrid.classList.remove('drag-over');
    document.getElementById('dropZone').classList.remove('active');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Upload dropped files
    try {
        for (const file of files) {
            const filePath = currentPath + file.name;
            await uploadFile(filePath, file);
            
            await logFileActivity({
                action: 'Uploaded',
                fileName: file.name,
                filePath: filePath,
                userId: currentUser.uid,
                userName: currentUserDoc.fullName
            });
        }
        
        await loadFiles(currentPath);
        alert('Files uploaded successfully!');
        
    } catch (error) {
        console.error('Error uploading dropped files:', error);
        alert('Error uploading files: ' + error.message);
    }
};

/**
 * Supabase Configuration and Storage Helpers for Nexus Portal
 * MSC Initiative Staff Portal
 */

// Supabase Configuration from environment variables
const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
const SUPABASE_KEY = window.ENV?.SUPABASE_KEY || '';
const BUCKET_NAME = 'msc-nexus';

// Validate Supabase configuration
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase configuration error: Missing required configuration');
    console.error('Missing:', 
        !SUPABASE_URL ? 'SUPABASE_URL' : '', 
        !SUPABASE_KEY ? 'SUPABASE_KEY' : ''
    );
    console.error('Please ensure environment variables are properly set in your deployment configuration.');
}

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.error('Error initializing Supabase:', error);
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('This error may be due to missing configuration. Check that all environment variables are set.');
    }
}

/**
 * List files and folders in a given path
 * @param {string} path - The path to list (e.g., '', 'folder1/', 'folder1/subfolder/')
 * @returns {Promise<Array>}
 */
async function listFiles(path = '') {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(path, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
}

/**
 * Create a new folder
 * @param {string} folderPath - The full path including folder name (e.g., 'folder1/', 'folder1/subfolder/')
 * @returns {Promise<Object>}
 */
async function createFolder(folderPath) {
    try {
        // Create a placeholder file to establish the folder
        const placeholderPath = `${folderPath}/.placeholder`;
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(placeholderPath, new Blob([''], { type: 'text/plain' }));
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

/**
 * Upload a file
 * @param {string} path - The full path including filename
 * @param {File} file - The file object to upload
 * @returns {Promise<Object>}
 */
async function uploadFile(path, file) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

/**
 * Delete a file or folder
 * @param {string} path - The path to delete
 * @returns {Promise<Object>}
 */
async function deleteFile(path) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path]);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * Delete a folder and all its contents
 * @param {string} folderPath - The folder path to delete
 * @returns {Promise<void>}
 */
async function deleteFolder(folderPath) {
    try {
        // List all files in the folder
        const files = await listFiles(folderPath);
        
        // Build array of file paths to delete
        const filePaths = files.map(file => `${folderPath}${file.name}`);
        
        if (filePaths.length > 0) {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove(filePaths);
            
            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
    }
}

/**
 * Rename/move a file
 * @param {string} oldPath - The current path
 * @param {string} newPath - The new path
 * @returns {Promise<Object>}
 */
async function renameFile(oldPath, newPath) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .move(oldPath, newPath);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error renaming file:', error);
        throw error;
    }
}

/**
 * Get public URL for a file
 * @param {string} path - The file path
 * @returns {string}
 */
function getPublicUrl(path) {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);
    
    return data.publicUrl;
}

/**
 * Download a file
 * @param {string} path - The file path
 * @returns {Promise<Blob>}
 */
async function downloadFile(path) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(path);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

/**
 * Get file metadata
 * @param {string} path - The file path
 * @returns {Promise<Object>}
 */
async function getFileMetadata(path) {
    try {
        // Extract folder path and filename
        const pathParts = path.split('/');
        const filename = pathParts.pop();
        const folderPath = pathParts.join('/') + (pathParts.length > 0 ? '/' : '');
        
        const files = await listFiles(folderPath);
        const file = files.find(f => f.name === filename);
        
        return file || null;
    } catch (error) {
        console.error('Error getting file metadata:', error);
        throw error;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        supabase,
        listFiles,
        createFolder,
        uploadFile,
        deleteFile,
        deleteFolder,
        renameFile,
        getPublicUrl,
        downloadFile,
        getFileMetadata
    };
}

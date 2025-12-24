/**
 * Login Page JavaScript
 * MSC Initiative - Nexus Portal
 */

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    if (user) {
        window.location.href = '/nexus/dashboard.html';
    }
});

// Form submission handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');
    const alertContainer = document.getElementById('alertContainer');
    
    // Clear previous alerts
    alertContainer.innerHTML = '';
    
    // Disable button and show spinner
    loginButton.disabled = true;
    buttonText.textContent = 'Signing in...';
    buttonSpinner.classList.remove('hidden');
    
    try {
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user document exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('User profile not found. Please contact an administrator.');
        }
        
        // Show success message
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/nexus/dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'An error occurred during login. Please try again.';
        
        // Handle specific error codes
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed login attempts. Please try again later.';
                break;
        }
        
        showAlert(errorMessage, 'error');
        
        // Re-enable button
        loginButton.disabled = false;
        buttonText.textContent = 'Sign In';
        buttonSpinner.classList.add('hidden');
    }
});

/**
 * Display alert message
 * @param {string} message - The message to display
 * @param {string} type - The alert type ('success' or 'error')
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
}

/**
 * Signup Page JavaScript
 * MSC Initiative - Nexus Portal
 */

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    if (user) {
        window.location.href = '/nexus/dashboard.html';
    }
});

// Add email button handler
document.getElementById('addEmailButton').addEventListener('click', () => {
    const container = document.getElementById('secondaryEmailsContainer');
    const emailRow = document.createElement('div');
    emailRow.className = 'email-input-row';
    
    emailRow.innerHTML = `
        <input 
            type="email" 
            class="form-input secondary-email" 
            placeholder="additional.email@example.com"
        >
        <button type="button" class="btn-remove-email">Remove</button>
    `;
    
    container.appendChild(emailRow);
    
    // Add remove button handler
    emailRow.querySelector('.btn-remove-email').addEventListener('click', () => {
        emailRow.remove();
    });
});

// Form submission handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const primaryEmail = document.getElementById('primaryEmail').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    
    // Get secondary emails
    const secondaryEmailInputs = document.querySelectorAll('.secondary-email');
    const secondaryEmails = Array.from(secondaryEmailInputs)
        .map(input => input.value.trim())
        .filter(email => email !== '');
    
    const signupButton = document.getElementById('signupButton');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');
    const alertContainer = document.getElementById('alertContainer');
    
    // Clear previous alerts
    alertContainer.innerHTML = '';
    
    // Validate form
    if (!fullName || !primaryEmail || !password || !role) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    // Check for duplicate emails
    const allEmails = [primaryEmail, ...secondaryEmails];
    const uniqueEmails = new Set(allEmails);
    if (allEmails.length !== uniqueEmails.size) {
        showAlert('Duplicate email addresses are not allowed.', 'error');
        return;
    }
    
    // Disable button and show spinner
    signupButton.disabled = true;
    buttonText.textContent = 'Creating account...';
    buttonSpinner.classList.remove('hidden');
    
    try {
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(primaryEmail, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            fullName: fullName,
            primaryEmail: primaryEmail,
            secondaryEmails: secondaryEmails,
            roles: [role], // Array of roles
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update display name in Firebase Auth
        await user.updateProfile({
            displayName: fullName
        });
        
        // Show success message
        showAlert('Account created successfully! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/nexus/dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'An error occurred during signup. Please try again.';
        
        // Handle specific error codes
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled. Please contact an administrator.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password.';
                break;
        }
        
        showAlert(errorMessage, 'error');
        
        // Re-enable button
        signupButton.disabled = false;
        buttonText.textContent = 'Create Account';
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
    
    // Scroll to top to show alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

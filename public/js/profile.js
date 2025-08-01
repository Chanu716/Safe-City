// profile.js - User profile management functionality

// Load user profile data
window.loadUserProfile = async function() {
    try {
        const response = await authenticatedFetch('/api/auth/me'); // Will be prefixed automatically
        
        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Populate form fields
            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('location').value = user.location || '';
            document.getElementById('bio').value = user.profile?.bio || '';
            if (user.preferences) {
                document.getElementById('alertRadius').value = user.preferences.alertRadius || 1000;
                document.getElementById('alertRadiusValue').textContent = user.preferences.alertRadius || 1000;
            }
            
        } else {
            throw new Error('Failed to load profile');
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile data. Please try again.', 'danger');
    }
}

// Update user profile
async function updateProfile(formData) {
    try {
        showLoading('profile-submit-btn', 'Updating...');
        
        const response = await authenticatedFetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
            if (response.ok) {
                showAlert('Profile updated successfully!', 'success');
                
                // Update local storage with new user data
                const currentUser = getCurrentUser();
                const updatedUser = { ...currentUser, ...data.user };
                localStorage.setItem('safecity_user', JSON.stringify(updatedUser));
                
            } else {
                if (data.details && Array.isArray(data.details)) {
                    showAlert(data.details.join('<br>'), 'danger');
                } else {
                    showAlert(data.error || 'Failed to update profile', 'danger');
                }
            }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert(error.message, 'danger');
    } finally {
        hideLoading('profile-submit-btn', '💾 Update Profile');
    }
}

// Update alert radius only
async function updateAlertRadius(value) {
    try {
        const response = await authenticatedFetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ preferences: { alertRadius: value } })
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Alert radius updated!', 'success');
        } else {
            throw new Error(data.error || 'Failed to update alert radius');
        }
    } catch (error) {
        console.error('Error updating alert radius:', error);
        showAlert(error.message, 'danger');
    }
}

// Change password
window.changePassword = async function(passwordData) {
    try {
        showLoading('password-submit-btn', 'Changing...');
        const response = await authenticatedFetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Password changed successfully!', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
            document.getElementById('password-strength-profile').textContent = '';
            document.getElementById('password-match-profile').textContent = '';
            closeModal('change-password-modal');
        } else {
            throw new Error(data.error || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert(error.message, 'danger');
    } finally {
        hideLoading('password-submit-btn', '🔒 Change Password');
    }
}

// Password strength checker for profile page
window.checkPasswordStrengthProfile = function() {
    const password = document.getElementById('newPassword').value;
    const strengthDiv = document.getElementById('password-strength-profile');
    let strength = 0;
    let feedback = '';
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    // Determine strength level
    if (password.length === 0) {
        feedback = '';
        strengthDiv.className = 'password-strength';
    } else if (strength < 3) {
        feedback = 'Weak - Add more characters and variety';
        strengthDiv.className = 'password-strength weak';
    } else if (strength < 5) {
        feedback = 'Medium - Good but could be stronger';
        strengthDiv.className = 'password-strength medium';
    } else {
        feedback = 'Strong - Great password!';
        strengthDiv.className = 'password-strength strong';
    }
    strengthDiv.textContent = feedback;
}


// Password match checker for profile page
window.checkPasswordMatchProfile = function() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const matchDiv = document.getElementById('password-match-profile');
    
    if (!matchDiv) return;
    
    if (confirmPassword.length === 0) {
        matchDiv.textContent = '';
        matchDiv.className = 'password-match';
    } else if (password === confirmPassword) {
        matchDiv.textContent = '✓ Passwords match';
        matchDiv.className = 'password-match match';
    } else {
        matchDiv.textContent = '✗ Passwords do not match';
        matchDiv.className = 'password-match no-match';
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Profile form handler
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const profileData = Object.fromEntries(formData.entries());
            await updateProfile(profileData);
        });
    }
    // Alert radius change handler
    const alertRadius = document.getElementById('alertRadius');
    if (alertRadius) {
        alertRadius.addEventListener('input', function() {
            document.getElementById('alertRadiusValue').textContent = this.value;
        });
        alertRadius.addEventListener('change', function() {
            updateAlertRadius(this.value);
        });
    }
    // Change password button handler
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            document.getElementById('change-password-modal').style.display = 'block';
        });
    }
    // Password modal form handler
    const passwordFormModal = document.getElementById('password-form-modal');
    if (passwordFormModal) {
        passwordFormModal.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const passwordData = Object.fromEntries(formData.entries());
            if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
                showAlert('Please fill in all password fields.', 'warning');
                return;
            }
            if (passwordData.newPassword !== passwordData.confirmNewPassword) {
                showAlert('New passwords do not match.', 'warning');
                return;
            }
            if (passwordData.newPassword.length < 8) {
                showAlert('New password must be at least 8 characters long.', 'warning');
                return;
            }
            await changePassword(passwordData);
        });
    }
});

// Helper function to show alerts in profile page
function showAlert(message, type) {
    const statusDiv = document.getElementById('auth-status');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    // Auto-remove after 5 seconds for non-success messages
    if (type !== 'success') {
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

function showLoading(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.innerHTML = `<span class="loading"></span> ${text}`;
        button.disabled = true;
    }
}

function hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

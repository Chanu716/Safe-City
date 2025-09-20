// auth.js - Authentication functionality for SafeCity

// Authentication state management
var currentUser = null;
var authToken = null;

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('safecity_token');
    const user = localStorage.getItem('safecity_user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Set authentication data
function setAuthData(user, token) {
    currentUser = user;
    authToken = token;
    localStorage.setItem('safecity_user', JSON.stringify(user));
    localStorage.setItem('safecity_token', token);
}

// Clear authentication data
function clearAuthData() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('safecity_user');
    localStorage.removeItem('safecity_token');
}

// Sign up functionality
async function signUp(userData) {
    try {
        showLoading('signup-btn', 'Creating Account...');
        
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000/api/auth/signup'
            : 'https://safe-city-8gxz.onrender.com/api/auth/signup';
            
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        if (response.ok) {
            showAlert('Account created successfully! Please check your email for verification.', 'success');
            // Auto-login after successful signup
            if (data.token && data.user) {
                setAuthData(data.user, data.token);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } else {
            if (data.details && Array.isArray(data.details)) {
                showAlert(data.details.join('<br>'), 'danger');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                showAlert(data.error || 'Failed to create account', 'danger');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showAlert(error.message, 'danger');
    } finally {
        hideLoading('signup-btn', '🚀 Create Account');
    }
}

// Login functionality
async function login(credentials) {
    try {
        showLoading('login-btn', 'Signing In...');
        
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000/api/auth/login'
            : 'https://safe-city-8gxz.onrender.com/api/auth/login';
            
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            setAuthData(data.user, data.token);
            showAlert('Welcome back! Redirecting to dashboard...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            throw new Error(data.error || 'Invalid credentials');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message, 'danger');
    } finally {
        hideLoading('login-btn', '🔑 Sign In');
    }
}

// Logout functionality
async function logout() {
    try {
        // Call backend logout endpoint
        if (authToken) {
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3000/api/auth/logout'
                : 'https://safe-city-8gxz.onrender.com/api/auth/logout';
                
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
        
        clearAuthData();
        showAlert('You have been logged out successfully.', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('Logout error:', error);
        clearAuthData();
        window.location.href = 'login.html';
    }
}

// Password strength checker
function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthDiv = document.getElementById('password-strength');
    
    if (!strengthDiv) return;
    
    let strength = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
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

// Password match checker
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchDiv = document.getElementById('password-match');
    
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

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        toggle.textContent = '🙈';
    } else {
        field.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Signup form handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const userData = Object.fromEntries(formData.entries());
            
            // Add consent data
            userData.consent = {
                dataCollection: userData.dataCollectionConsent === 'on',
                dataProcessing: userData.dataProcessingConsent === 'on',
                marketing: userData.marketingConsent === 'on'
            };
            
            // Remove checkbox values from main userData object
            delete userData.dataCollectionConsent;
            delete userData.dataProcessingConsent;
            delete userData.marketingConsent;
            
            // Validate form
            if (!validateSignupForm(userData)) {
                return;
            }
            
            await signUp(userData);
        });
    }
    
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const credentials = Object.fromEntries(formData.entries());
            
            // Validate form
            if (!validateLoginForm(credentials)) {
                return;
            }
            
            await login(credentials);
        });
    }
});

// Form validation
function validateSignupForm(data) {
    // Check required fields
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
        showAlert('Please fill in all required fields.', 'danger');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showAlert('Please enter a valid email address.', 'danger');
        return false;
    }
    
    // Password validation
    if (data.password.length < 8) {
        showAlert('Password must be at least 8 characters long.', 'danger');
        return false;
    }
    
    if (data.password !== data.confirmPassword) {
        showAlert('Passwords do not match.', 'danger');
        return false;
    }
    
    // Consent validation
    if (!data.consent.dataCollection) {
        showAlert('You must consent to data collection to create an account.', 'danger');
        return false;
    }
    
    if (!data.consent.dataProcessing) {
        showAlert('You must consent to data processing to create an account.', 'danger');
        return false;
    }
    
    return true;
}

function validateLoginForm(data) {
    if (!data.email || !data.password) {
        showAlert('Please enter both email and password.', 'danger');
        return false;
    }
    
    return true;
}


// Utility functions
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

// API request helper with authentication
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('safecity_token');
    
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    
    // If relative API path, prefix with backend URL
    const apiPrefix = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000'
        : 'https://safe-city-8gxz.onrender.com';
    const fullUrl = url.startsWith('/api/') ? apiPrefix + url : url;
    const response = await fetch(fullUrl, options);
    
    // Handle token expiration
    if (response.status === 401) {
        clearAuthData();
        window.location.href = 'login.html';
        return;
    }
    
    return response;
}

// Update navigation based on auth status
function updateNavigation() {
    const navLinks = document.querySelector('.nav-links') || document.getElementById('navMenu');
    if (!navLinks) return;
    
    // Get current page for highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    if (isLoggedIn()) {
        // User is logged in - show user menu
        const user = getCurrentUser();
        const navItems = [];
        
        // Add navigation items based on current page (exclude current page from nav)
        if (currentPage !== 'dashboard.html') {
            navItems.push('<li><a href="dashboard.html">🏠 Dashboard</a></li>');
        }
        if (currentPage !== 'index.html') {
            navItems.push('<li><a href="index.html">📍 Report Incident</a></li>');
        }
        if (currentPage !== 'safety.html') {
            navItems.push('<li><a href="safety.html">🔍 Analyze Safety</a></li>');
        }
        
        // Add admin link for admin and moderator users
        if (user.role && (user.role === 'admin' || user.role === 'moderator')) {
            const adminClass = currentPage === 'admin.html' ? ' class="active"' : '';
            navItems.push(`<li><a href="admin.html"${adminClass}>🔧 Admin</a></li>`);
        }
        
        // Add user menu
        navItems.push(`
            <li class="user-menu">
                <a href="#" onclick="toggleUserMenu()">👤 ${user.firstName || user.email}</a>
                <div class="user-dropdown" id="user-dropdown">
                    <a href="profile.html">👤 Profile</a>
                    <a href="#" onclick="logout()">🚪 Logout</a>
                </div>
            </li>
        `);
        
        navLinks.innerHTML = navItems.join('');
    } else {
        // User is not logged in - only show Sign Up in navigation
        const navItems = [];
        
        if (currentPage !== 'dashboard.html') {
            navItems.push('<li><a href="dashboard.html">Dashboard</a></li>');
        }
        if (currentPage !== 'signup.html') {
            navItems.push('<li><a href="signup.html">Sign Up</a></li>');
        }
        if (currentPage !== 'login.html') {
            navItems.push('<li><a href="login.html">Login</a></li>');
        }
        
        navLinks.innerHTML = navItems.join('');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('user-dropdown');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    
    // Check authentication status for protected pages
    const protectedPages = ['index.html', 'safety.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        // If a user lands on a protected page directly, show a message and a login link.
        // This stops the automatic redirect that was interfering with the dashboard pop-up.
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: sans-serif;">
                    <h1>Access Denied</h1>
                    <p>You must be logged in to view this page.</p>
                    <a href="login.html" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Go to Login</a>
                </div>
            `;
        }
    }
    
    // Add login prompt to page content if not logged in
    addLoginPromptToPage();


});

// Add login prompt to page content when user is not logged in
function addLoginPromptToPage() {
    if (isLoggedIn()) return;
    
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // Don't add login prompt to login or signup pages
    if (currentPage === 'login.html' || currentPage === 'signup.html') return;
    
    // Look for a container to add the login prompt
    const container = document.querySelector('.container') || document.querySelector('.dashboard') || document.querySelector('main') || document.body;
    
    if (container) {
        // Create login prompt element
        const loginPrompt = document.createElement('div');
        loginPrompt.className = 'login-prompt';
        loginPrompt.innerHTML = `
            <div class="login-prompt-content">
                <p>Already have an account? <a href="login.html" class="login-link">Login here</a></p>
            </div>
        `;
        
        // Add to the end of the container
        container.appendChild(loginPrompt);
    }
}

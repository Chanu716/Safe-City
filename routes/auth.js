// routes/auth.js - Authentication routes

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in Node.js module
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// JWT secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'safecity_development_secret_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            phone,
            location,
            newsletter
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: 'Please provide all required fields: firstName, lastName, email, password'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                error: 'An account with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone: phone?.trim(),
            location: location?.trim(),
            preferences: {
                newsletter: newsletter === 'on' || newsletter === true
            }
        });

        // Generate verification token
        const verificationToken = user.generateVerificationToken();

        // Save user
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        // Remove sensitive data from response
        const userResponse = user.toJSON();

        // In a real application, you would send verification email here
        console.log(`Verification token for ${email}: ${verificationToken}`);

        res.status(201).json({
            message: 'Account created successfully',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        res.status(500).json({
            error: 'Failed to create account. Please try again.'
        });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Please provide email and password'
            });
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                error: 'Account temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }

        // Check if account is banned
        if (user.isBanned) {
            return res.status(403).json({
                error: 'Account has been banned. Please contact support.'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Account is deactivated. Please contact support.'
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            await user.handleFailedLogin();
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Handle successful login
        await user.handleSuccessfulLogin();

        // Generate JWT token with extended expiry if remember me is checked
        const tokenExpiry = remember ? '30d' : JWT_EXPIRE;
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: tokenExpiry });

        // Remove sensitive data from response
        const userResponse = user.toJSON();

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed. Please try again.'
        });
    }
});

// POST /api/auth/logout - Logout user
router.post('/logout', auth, async (req, res) => {
    try {
        // In a more sophisticated system, you might blacklist the token
        res.json({
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed'
        });
    }
});

// GET /api/auth/me - Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get user profile'
        });
    }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            phone,
            location,
            bio,
            preferences
        } = req.body;

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Update allowed fields
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phone !== undefined) user.phone = phone?.trim();
        if (location !== undefined) user.location = location?.trim();
        if (bio !== undefined) user.profile.bio = bio?.trim();
        
        if (preferences) {
            user.preferences = {
                ...user.preferences,
                ...preferences
            };
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                error: 'Please provide current password, new password, and confirmation'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: 'New passwords do not match'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters long'
            });
        }

        const user = await User.findById(req.user.userId).select('+password');
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                error: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Failed to change password'
        });
    }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Please provide email address'
            });
        }

        const user = await User.findByEmail(email);
        
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // In a real application, you would send reset email here
        console.log(`Password reset token for ${email}: ${resetToken}`);

        res.json({
            message: 'If an account with that email exists, a password reset link has been sent'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Failed to process password reset request'
        });
    }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                error: 'Please provide reset token, new password, and confirmation'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Password reset token is invalid or has expired'
            });
        }

        // Update password and clear reset fields
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            message: 'Password reset successful. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Failed to reset password'
        });
    }
});

// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'Verification token is required'
            });
        }

        const user = await User.findOne({ verificationToken: token });
        
        if (!user) {
            return res.status(400).json({
                error: 'Invalid verification token'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            error: 'Failed to verify email'
        });
    }
});

// GET /api/auth/stats - Get authentication statistics (admin only)
router.get('/stats', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied. Admin privileges required.'
            });
        }

        const stats = await User.getStats();
        
        res.json({
            stats: stats[0] || {
                totalUsers: 0,
                verifiedUsers: 0,
                activeUsers: 0,
                averagePoints: 0
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics'
        });
    }
});

// Delete account
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        // TODO: In a real application, you might want to:
        // 1. Archive user data instead of permanently deleting
        // 2. Delete associated data (reports, etc.)
        // 3. Send confirmation email
        // 4. Add cooling-off period
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        res.json({
            message: 'Account deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            error: 'Failed to delete account'
        });
    }
});

module.exports = router;

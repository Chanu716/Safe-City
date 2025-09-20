// models/User.js - User model for authentication

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't include password in queries by default
    },
    
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    verificationToken: {
        type: String,
        select: false
    },
    
    resetPasswordToken: {
        type: String,
        select: false
    },
    
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    
    // OTP for password reset
    resetOTP: {
        type: String,
        select: false
    },
    
    resetOTPExpires: {
        type: Date,
        select: false
    },
    
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        newsletter: {
            type: Boolean,
            default: false
        },
        alertRadius: {
            type: Number,
            default: 1000, // meters
            min: 100,
            max: 10000
        }
    },
    
    profile: {
        avatar: String,
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        points: {
            type: Number,
            default: 0
        },
        reportsCount: {
            type: Number,
            default: 0
        },
        joinedDate: {
            type: Date,
            default: Date.now
        }
    },
    
    lastLogin: {
        type: Date
    },
    
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    lockUntil: {
        type: Date
    },
    
    // Social login providers
    googleId: String,
    facebookId: String,
    
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    
    isBanned: {
        type: Boolean,
        default: false
    },
    
    banReason: String,
    banExpires: Date,
    
    // Privacy and consent fields for production use
    consent: {
        dataCollection: {
            type: Boolean,
            required: true,
            default: false
        },
        dataProcessing: {
            type: Boolean,
            required: true,
            default: false
        },
        marketing: {
            type: Boolean,
            default: false
        },
        consentDate: {
            type: Date,
            default: Date.now
        },
        consentVersion: {
            type: String,
            default: '1.0'
        }
    },
    
    // Data retention and anonymization
    dataRetention: {
        requestedDeletion: {
            type: Boolean,
            default: false
        },
        deletionRequestDate: Date,
        deletionScheduledDate: Date,
        anonymized: {
            type: Boolean,
            default: false
        },
        anonymizedDate: Date
    }
    
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ location: 'text' });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
    // Increment login attempts
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }
    
    return this.save();
};

// Instance method to handle successful login
userSchema.methods.handleSuccessfulLogin = async function() {
    // Reset login attempts and lock
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = new Date();
    
    return this.save();
};

// Instance method to generate verification token
userSchema.methods.generateVerificationToken = function() {
    const crypto = require('crypto');
    this.verificationToken = crypto.randomBytes(32).toString('hex');
    return this.verificationToken;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const crypto = require('crypto');
    this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return this.resetPasswordToken;
};

// Instance method to generate password reset OTP
userSchema.methods.generatePasswordResetOTP = function() {
    // Generate 6-digit OTP
    this.resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return this.resetOTP;
};

// Instance method to verify password reset OTP
userSchema.methods.verifyPasswordResetOTP = function(otp) {
    return this.resetOTP === otp && this.resetOTPExpires > Date.now();
};

// Instance method to add points for user actions
userSchema.methods.addPoints = async function(points, reason) {
    this.profile.points += points;
    
    // Could log the point transaction here
    console.log(`User ${this.email} earned ${points} points for: ${reason}`);
    
    return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
    return this.find({ isActive: true, isBanned: false });
};

// Static method to get user statistics
userSchema.statics.getStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                verifiedUsers: {
                    $sum: { $cond: ['$isVerified', 1, 0] }
                },
                activeUsers: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                averagePoints: { $avg: '$profile.points' }
            }
        }
    ]);
};

// Instance method to anonymize user data (GDPR compliance)
userSchema.methods.anonymizeData = async function() {
    this.firstName = 'Anonymous';
    this.lastName = 'User';
    this.email = `anonymized_${this._id}@deleted.local`;
    this.phone = undefined;
    this.location = undefined;
    this.profile.bio = undefined;
    this.profile.avatar = undefined;
    this.dataRetention.anonymized = true;
    this.dataRetention.anonymizedDate = new Date();
    
    return this.save();
};

// Instance method to request account deletion
userSchema.methods.requestDeletion = async function() {
    this.dataRetention.requestedDeletion = true;
    this.dataRetention.deletionRequestDate = new Date();
    this.dataRetention.deletionScheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    this.isActive = false;
    
    return this.save();
};

// Instance method to export user data (GDPR compliance)
userSchema.methods.exportData = function() {
    const userData = this.toJSON();
    
    // Remove sensitive fields from export
    delete userData.password;
    delete userData.verificationToken;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;
    delete userData.loginAttempts;
    delete userData.lockUntil;
    
    return {
        userData,
        exportDate: new Date(),
        exportFormat: 'JSON'
    };
};

// Transform function to clean up output
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

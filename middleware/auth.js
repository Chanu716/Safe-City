// middleware/auth.js - Authentication middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'safecity_development_secret_key_change_in_production';

const auth = async (req, res, next) => {
    try {
        console.log('🔐 Auth middleware - checking token for:', req.path);
        
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No valid authorization header:', authHeader);
            return res.status(401).json({
                error: 'Access denied. No valid token provided.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        console.log('🔍 Token received:', token.substring(0, 20) + '...');
        
        try {
            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ Token decoded successfully, userId:', decoded.userId);
            
            // Get user from database
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                console.log('❌ User not found in database for userId:', decoded.userId);
                return res.status(401).json({
                    error: 'Access denied. User not found.'
                });
            }
            
            console.log('✅ User found:', user.email, 'isActive:', user.isActive, 'isBanned:', user.isBanned);

            // Check if user is active
            if (!user.isActive) {
                return res.status(403).json({
                    error: 'Access denied. Account is deactivated.'
                });
            }

            // Check if user is banned
            if (user.isBanned) {
                return res.status(403).json({
                    error: 'Access denied. Account is banned.'
                });
            }

            // Add user info to request
            req.user = {
                userId: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            };
            
            next();
            
        } catch (jwtError) {
            console.log('❌ JWT Error:', jwtError.name, jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Access denied. Token has expired.'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Access denied. Invalid token.'
                });
            } else {
                throw jwtError;
            }
        }
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (user && user.isActive && !user.isBanned) {
                req.user = {
                    userId: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                };
            } else {
                req.user = null;
            }
            
        } catch (jwtError) {
            // Invalid or expired token, continue without authentication
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        req.user = null;
        next();
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied. Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient privileges.'
            });
        }

        next();
    };
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Access denied. Authentication required.'
        });
    }

    if (!req.user.isVerified) {
        return res.status(403).json({
            error: 'Access denied. Please verify your email address first.'
        });
    }

    next();
};

module.exports = {
    auth,
    optionalAuth,
    authorize,
    requireVerification
};

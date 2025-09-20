// middleware/security.js - Security utilities and input validation

const { validationResult, body, param, query } = require('express-validator');

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        // Remove potential XSS attempts
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/style\s*=/gi, '')
            .trim();
    };

    const sanitizeObject = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Common validation rules
const validationRules = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    
    password: body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters'),
    
    name: (field) => body(field)
        .isLength({ min: 1, max: 50 })
        .withMessage(`${field} must be between 1 and 50 characters`)
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`),
    
    phone: body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please enter a valid phone number'),
    
    mongoId: (field) => param(field)
        .isMongoId()
        .withMessage(`Invalid ${field} format`),
    
    location: body('location')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Location must be less than 200 characters'),
    
    incidentType: body('type')
        .isIn(['theft', 'assault', 'vandalism', 'harassment', 'suspicious_activity', 'accident', 'fire', 'medical_emergency', 'other'])
        .withMessage('Invalid incident type'),
    
    severity: body('severity')
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid severity level'),
    
    description: body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    
    coordinates: [
        body('location.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90'),
        body('location.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180')
    ]
};

// Rate limiting for sensitive operations
const createStrictLimiter = (windowMs, max, message) => {
    const rateLimit = require('express-rate-limit');
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting in development
            return process.env.NODE_ENV === 'development';
        }
    });
};

module.exports = {
    sanitizeInput,
    handleValidationErrors,
    validationRules,
    createStrictLimiter
};
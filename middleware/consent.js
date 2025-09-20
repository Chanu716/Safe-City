// middleware/consent.js - Consent validation middleware

const User = require('../models/User');

// Middleware to check if user has given required consent
const requireConsent = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Check if user has given required consent
        if (!user.consent.dataCollection || !user.consent.dataProcessing) {
            return res.status(403).json({
                error: 'Data collection and processing consent is required',
                consentRequired: {
                    dataCollection: !user.consent.dataCollection,
                    dataProcessing: !user.consent.dataProcessing
                }
            });
        }

        next();
    } catch (error) {
        console.error('Consent middleware error:', error);
        res.status(500).json({
            error: 'Failed to verify consent'
        });
    }
};

// Middleware to validate consent data in request
const validateConsentData = (req, res, next) => {
    const { consent } = req.body;
    
    if (!consent) {
        return res.status(400).json({
            error: 'Consent information is required'
        });
    }

    if (typeof consent.dataCollection !== 'boolean' || 
        typeof consent.dataProcessing !== 'boolean') {
        return res.status(400).json({
            error: 'Invalid consent data. dataCollection and dataProcessing must be boolean values'
        });
    }

    // For production use, both must be true
    if (!consent.dataCollection || !consent.dataProcessing) {
        return res.status(400).json({
            error: 'Both data collection and processing consent are required for using this service'
        });
    }

    next();
};

// Middleware to check if user account is scheduled for deletion
const checkDeletionStatus = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        const user = await User.findById(req.user.userId);
        
        if (user && user.dataRetention.requestedDeletion) {
            return res.status(403).json({
                error: 'Account is scheduled for deletion. Please contact support to reactivate.',
                deletionScheduled: user.dataRetention.deletionScheduledDate
            });
        }

        next();
    } catch (error) {
        console.error('Deletion status check error:', error);
        next(); // Don't block on error
    }
};

module.exports = {
    requireConsent,
    validateConsentData,
    checkDeletionStatus
};
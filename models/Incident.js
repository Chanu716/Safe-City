// models/Incident.js - Mongoose schema for incident data

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Theft', 'Harassment', 'Violence', 'Vandalism', 'Suspicious Activity', 'Other'],
            message: 'Invalid category. Must be one of: Theft, Harassment, Violence, Vandalism, Suspicious Activity, Other'
        }
    },
    
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
    },
    
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
    },
    
    // GeoJSON location field for geospatial queries
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Optional fields for future enhancements
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    
    status: {
        type: String,
        enum: ['Reported', 'Investigating', 'Resolved', 'Closed'],
        default: 'Reported'
    },
    
    // For tracking updates
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // For potential user system in the future
    reporterId: {
        type: String,
        default: 'anonymous'
    },
    
    // For verification purposes
    verified: {
        type: Boolean,
        default: false
    },
    
    // Additional metadata
    metadata: {
        userAgent: String,
        ipAddress: String,
        source: {
            type: String,
            default: 'web'
        }
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'incidents'
});

// Create indexes for better query performance
incidentSchema.index({ timestamp: -1 }); // For sorting by most recent
incidentSchema.index({ category: 1 }); // For filtering by category
incidentSchema.index({ latitude: 1, longitude: 1 }); // For geospatial queries
incidentSchema.index({ status: 1 }); // For filtering by status

// Create a 2dsphere index for geospatial queries
incidentSchema.index({ location: '2dsphere' });

// Pre-save middleware to set location coordinates from lat/lng
incidentSchema.pre('save', function(next) {
    if (this.latitude !== undefined && this.longitude !== undefined) {
        this.location = {
            type: 'Point',
            coordinates: [this.longitude, this.latitude]
        };
    }
    this.updatedAt = new Date();
    next();
});

// Instance method to calculate distance from a given point
incidentSchema.methods.distanceFrom = function(lat, lng) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat * Math.PI/180;
    const φ2 = this.latitude * Math.PI/180;
    const Δφ = (this.latitude - lat) * Math.PI/180;
    const Δλ = (this.longitude - lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
};

// Static method to find incidents within radius
incidentSchema.statics.findWithinRadius = function(lat, lng, radius) {
    return this.find().then(incidents => {
        return incidents.filter(incident => {
            const distance = incident.distanceFrom(lat, lng);
            return distance <= radius;
        });
    });
};

// Static method to get recent incidents
incidentSchema.statics.findRecent = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ timestamp: { $gte: cutoffDate } }).sort({ timestamp: -1 });
};

// Static method to get statistics by category
incidentSchema.statics.getCategoryStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                latest: { $max: '$timestamp' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Pre-update middleware
incidentSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
    this.set({ updatedAt: new Date() });
    next();
});

// Virtual for formatted timestamp
incidentSchema.virtual('formattedTimestamp').get(function() {
    return this.timestamp.toLocaleString();
});

// Virtual for time ago
incidentSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diffMs = now - this.timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
});

// Transform function to clean up output
incidentSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Incident = mongoose.model('Incident', incidentSchema);

module.exports = Incident;

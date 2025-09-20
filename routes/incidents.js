// routes/incidents.js - Backend API routes for incident management

const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const { auth, optionalAuth } = require('../middleware/auth');
const { requireConsent, checkDeletionStatus } = require('../middleware/consent');

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// GET /api/incidents - Get all incidents (only approved ones for public)
router.get('/', optionalAuth, async (req, res) => {
    try {
        // Only show approved incidents to non-admin users
        let query = { 'moderation.status': 'approved' };
        
        // If user is admin or moderator, show all incidents
        if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
            query = {};
        }
        
        const incidents = await Incident.find(query)
            .sort({ timestamp: -1 })
            .limit(100) // Limit to last 100 incidents
            .populate('reporter.userId', 'firstName lastName', null, { strictPopulate: false });
        
        res.json(incidents);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

// POST /api/incidents - Create new incident (requires authentication and consent)
router.post('/', auth, requireConsent, checkDeletionStatus, async (req, res) => {
    try {
        console.log('📝 Report submission attempt:', {
            body: req.body,
            user: req.user,
            headers: req.headers
        });
        
        const { title, category, description, latitude, longitude, anonymous = false } = req.body;
        
        // Validate required fields
        if (!title || !category || !description || !latitude || !longitude) {
            console.log('❌ Missing required fields:', { title, category, description, latitude, longitude });
            return res.status(400).json({ 
                error: 'Missing required fields: title, category, description, latitude, longitude' 
            });
        }
        
        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ 
                error: 'Invalid coordinates' 
            });
        }
        
        // Create new incident with enhanced fields
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);
        
        console.log('💾 Creating incident with coordinates:', {
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            location: [parsedLongitude, parsedLatitude]
        });
        
        const incidentData = {
            title: title.trim(),
            category,
            description: description.trim(),
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            // GeoJSON location field for geospatial queries
            location: {
                type: 'Point',
                coordinates: [parsedLongitude, parsedLatitude] // Note: GeoJSON uses [longitude, latitude] order
            },
            timestamp: new Date(),
            reporter: {
                userId: anonymous ? undefined : req.user.userId,
                anonymous: anonymous,
                consented: true // Since requireConsent middleware passed
            },
            metadata: {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                source: 'web'
            }
        };
        
        console.log('📝 Incident data before creation:', JSON.stringify(incidentData, null, 2));
        
        const incident = new Incident(incidentData);
        
        const savedIncident = await incident.save();
        
        // Increment user's report count if not anonymous
        if (!anonymous && req.user) {
            const User = require('../models/User');
            await User.findByIdAndUpdate(req.user.userId, {
                $inc: { 'profile.reportsCount': 1, 'profile.points': 10 }
            });
        }
        
        res.status(201).json({
            message: 'Incident reported successfully. It will be reviewed before being published.',
            incident: {
                id: savedIncident._id,
                title: savedIncident.title,
                category: savedIncident.category,
                timestamp: savedIncident.timestamp,
                status: savedIncident.moderation.status
            }
        });
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({ error: 'Failed to create incident' });
    }
});

// GET /api/incidents/nearby - Get incidents near a location
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 1000 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ 
                error: 'Missing required parameters: lat, lng' 
            });
        }
        
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const searchRadius = parseFloat(radius);
        
        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ 
                error: 'Invalid coordinates' 
            });
        }
        
        // Get only approved incidents (in a real app, you'd use geospatial queries)
        const allIncidents = await Incident.find({ 'moderation.status': 'approved' }).sort({ timestamp: -1 });
        
        // Filter incidents within radius
        const nearbyIncidents = allIncidents.filter(incident => {
            const distance = calculateDistance(
                latitude, longitude,
                incident.latitude, incident.longitude
            );
            return distance <= searchRadius;
        });
        
        res.json(nearbyIncidents);
        
    } catch (error) {
        console.error('Error fetching nearby incidents:', error);
        res.status(500).json({ error: 'Failed to fetch nearby incidents' });
    }
});

// GET /api/incidents/recent - Get recent incidents near a location
router.get('/recent', async (req, res) => {
    try {
        const { lat, lng, radius = 1000, since } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ 
                error: 'Missing required parameters: lat, lng' 
            });
        }
        
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const searchRadius = parseFloat(radius);
        
        // Default to last 5 minutes if no 'since' parameter
        const sinceDate = since ? new Date(since) : new Date(Date.now() - 5 * 60 * 1000);
        
        // Get recent approved incidents
        const recentIncidents = await Incident.find({
            timestamp: { $gte: sinceDate },
            'moderation.status': 'approved'
        }).sort({ timestamp: -1 });
        
        // Filter incidents within radius
        const nearbyRecentIncidents = recentIncidents.filter(incident => {
            const distance = calculateDistance(
                latitude, longitude,
                incident.latitude, incident.longitude
            );
            return distance <= searchRadius;
        });
        
        res.json(nearbyRecentIncidents);
        
    } catch (error) {
        console.error('Error fetching recent incidents:', error);
        res.status(500).json({ error: 'Failed to fetch recent incidents' });
    }
});

// GET /api/incidents/:id - Get specific incident
router.get('/:id', async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        
        res.json(incident);
        
    } catch (error) {
        console.error('Error fetching incident:', error);
        res.status(500).json({ error: 'Failed to fetch incident' });
    }
});

// PUT /api/incidents/:id - Update incident (for admin purposes)
router.put('/:id', async (req, res) => {
    try {
        const { title, category, description } = req.body;
        
        const updatedIncident = await Incident.findByIdAndUpdate(
            req.params.id,
            {
                title: title?.trim(),
                category,
                description: description?.trim(),
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedIncident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        
        res.json({
            message: 'Incident updated successfully',
            incident: updatedIncident
        });
        
    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({ error: 'Failed to update incident' });
    }
});

// DELETE /api/incidents/:id - Delete incident (for admin purposes)
router.delete('/:id', async (req, res) => {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);
        
        if (!deletedIncident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        
        res.json({
            message: 'Incident deleted successfully',
            incident: deletedIncident
        });
        
    } catch (error) {
        console.error('Error deleting incident:', error);
        res.status(500).json({ error: 'Failed to delete incident' });
    }
});

// GET /api/incidents/stats/summary - Get statistics summary
router.get('/stats/summary', async (req, res) => {
    try {
        const totalIncidents = await Incident.countDocuments();
        
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentIncidents = await Incident.countDocuments({
            timestamp: { $gte: last24Hours }
        });
        
        const categoryStats = await Incident.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        res.json({
            totalIncidents,
            recentIncidents,
            categoryStats
        });
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;

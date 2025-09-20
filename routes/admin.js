// routes/admin.js - Admin and moderation routes

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Incident = require('../models/Incident');

// Middleware to ensure admin/moderator role
const requireModerator = authorize('admin', 'moderator');
const requireAdmin = authorize('admin');

// GET /api/admin/incidents/pending - Get incidents pending moderation
router.get('/incidents/pending', auth, requireModerator, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const incidents = await Incident.findPendingModeration()
            .populate('reporter.userId', 'firstName lastName email')
            .skip(skip)
            .limit(limit);

        const total = await Incident.countDocuments({ 'moderation.status': 'pending' });

        res.json({
            incidents,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Get pending incidents error:', error);
        res.status(500).json({
            error: 'Failed to retrieve pending incidents'
        });
    }
});

// POST /api/admin/incidents/:id/approve - Approve an incident
router.post('/incidents/:id/approve', auth, requireModerator, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const incident = await Incident.findById(id);
        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found'
            });
        }

        await incident.approve(req.user.userId, notes);

        res.json({
            message: 'Incident approved successfully',
            incident
        });

    } catch (error) {
        console.error('Approve incident error:', error);
        res.status(500).json({
            error: 'Failed to approve incident'
        });
    }
});

// POST /api/admin/incidents/:id/reject - Reject an incident
router.post('/incidents/:id/reject', auth, requireModerator, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                error: 'Rejection reason is required'
            });
        }

        const incident = await Incident.findById(id);
        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found'
            });
        }

        await incident.reject(req.user.userId, reason);

        res.json({
            message: 'Incident rejected successfully',
            incident
        });

    } catch (error) {
        console.error('Reject incident error:', error);
        res.status(500).json({
            error: 'Failed to reject incident'
        });
    }
});

// POST /api/admin/incidents/:id/flag - Flag an incident
router.post('/incidents/:id/flag', auth, requireModerator, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                error: 'Flag reason is required'
            });
        }

        const incident = await Incident.findById(id);
        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found'
            });
        }

        incident.moderation.status = 'flagged';
        incident.moderation.moderatedBy = req.user.userId;
        incident.moderation.moderatedAt = new Date();
        incident.moderation.flaggedReason = reason;

        await incident.save();

        res.json({
            message: 'Incident flagged successfully',
            incident
        });

    } catch (error) {
        console.error('Flag incident error:', error);
        res.status(500).json({
            error: 'Failed to flag incident'
        });
    }
});

// GET /api/admin/users - Get users (admin only)
router.get('/users', auth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; //pagination
        const skip = (page - 1) * limit;
        const search = req.query.search;

        let query = {};
        if (search) {
            query = {
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Failed to retrieve users'
        });
    }
});

// POST /api/admin/users/:id/ban - Ban a user (admin only)
router.post('/users/:id/ban', auth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, duration } = req.body; // duration in days

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                error: 'Ban reason is required'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Don't allow banning other admins
        if (user.role === 'admin') {
            return res.status(403).json({
                error: 'Cannot ban admin users'
            });
        }

        user.isBanned = true;
        user.banReason = reason;
        user.isActive = false;
        
        if (duration && duration > 0) {
            user.banExpires = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        }

        await user.save();

        res.json({
            message: 'User banned successfully',
            user: {
                id: user._id,
                email: user.email,
                isBanned: user.isBanned,
                banReason: user.banReason,
                banExpires: user.banExpires
            }
        });

    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({
            error: 'Failed to ban user'
        });
    }
});

// POST /api/admin/users/:id/unban - Unban a user (admin only)
router.post('/users/:id/unban', auth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        user.isBanned = false;
        user.banReason = undefined;
        user.banExpires = undefined;
        user.isActive = true;

        await user.save();

        res.json({
            message: 'User unbanned successfully',
            user: {
                id: user._id,
                email: user.email,
                isBanned: user.isBanned,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Unban user error:', error);
        res.status(500).json({
            error: 'Failed to unban user'
        });
    }
});

// PUT /api/admin/users/:id/role - Update user role (admin only)
router.put('/users/:id/role', auth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['user', 'moderator', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be: user, moderator, or admin'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Don't allow users to change their own role
        if (user._id.toString() === req.user.userId) {
            return res.status(403).json({
                error: 'Cannot change your own role'
            });
        }

        const oldRole = user.role || 'user';
        user.role = role;
        await user.save();

        res.json({
            message: `User role updated from ${oldRole} to ${role}`,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            error: 'Failed to update user role'
        });
    }
});

// POST /api/admin/grant-admin - Grant admin privileges to specific emails (super admin only)
router.post('/grant-admin', auth, requireAdmin, async (req, res) => {
    try {
        const adminEmails = [
            'karrichanikya@gmail.com',
            'charmiseera07@gmail.com'
        ];

        const results = [];

        for (const email of adminEmails) {
            try {
                const user = await User.findOne({ email: email.toLowerCase() });
                
                if (!user) {
                    results.push({
                        email,
                        success: false,
                        message: 'User not found - make sure they have created an account first'
                    });
                    continue;
                }

                const oldRole = user.role || 'user';
                user.role = 'admin';
                await user.save();

                results.push({
                    email,
                    success: true,
                    message: `Role updated from ${oldRole} to admin`,
                    user: {
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        role: user.role
                    }
                });

            } catch (userError) {
                results.push({
                    email,
                    success: false,
                    message: userError.message
                });
            }
        }

        res.json({
            message: 'Admin privilege granting completed',
            results
        });

    } catch (error) {
        console.error('Grant admin error:', error);
        res.status(500).json({
            error: 'Failed to grant admin privileges'
        });
    }
});

// GET /api/admin/stats - Get admin statistics
router.get('/stats', auth, requireModerator, async (req, res) => {
    try {
        // Get incident statistics
        const incidentStats = await Incident.aggregate([
            {
                $group: {
                    _id: '$moderation.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const userStats = await User.getStats();
        
        // Get category statistics
        const categoryStats = await Incident.getCategoryStats();

        // Get recent activity
        const recentIncidents = await Incident.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('reporter.userId', 'firstName lastName');

        res.json({
            incidents: {
                byStatus: incidentStats,
                byCategory: categoryStats,
                recent: recentIncidents
            },
            users: userStats[0] || {
                totalUsers: 0,
                verifiedUsers: 0,
                activeUsers: 0,
                averagePoints: 0
            }
        });

    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics'
        });
    }
});

// GET /api/admin/incidents/recent - Get recent incidents for admin dashboard
router.get('/incidents/recent', auth, requireModerator, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get recent incidents sorted by creation date
        const incidents = await Incident.find()
            .populate('reporter.userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title category location timestamp moderation createdAt reporter status severity');

        // Format the response for admin dashboard
        const formattedIncidents = incidents.map(incident => ({
            _id: incident._id,
            title: incident.title,
            category: incident.category,
            location: incident.location,
            timestamp: incident.timestamp,
            createdAt: incident.createdAt,
            status: incident.moderation?.status || incident.status || 'Reported',
            severity: incident.severity || 'Medium',
            reporter: {
                name: incident.reporter?.userId ? 
                    `${incident.reporter.userId.firstName} ${incident.reporter.userId.lastName}` : 
                    'Anonymous',
                email: incident.reporter?.userId?.email || 'N/A'
            }
        }));

        res.json({
            success: true,
            incidents: formattedIncidents,
            total: formattedIncidents.length
        });

    } catch (error) {
        console.error('Get recent incidents error:', error);
        res.status(500).json({
            error: 'Failed to retrieve recent incidents'
        });
    }
});



module.exports = router;
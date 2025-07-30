// app.js - Express server for SafeCity application

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Import routes
const incidentRoutes = require('./routes/incidents');
const authRoutes = require('./routes/auth');

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Route for homepage - serve dashboard.html (must be before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB connection
const connectDB = async () => {
    try {
        // Directly use the provided MongoDB Atlas connection string
        const mongoURI = 'mongodb+srv://charmiseera07:abcd1234@safe.4vwtcfb.mongodb.net/?retryWrites=true&w=majority&appName=Safe';
        // For production, consider using environment variables for credentials
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas');
        // Create indexes for better performance
        const Incident = require('./models/Incident');
        await Incident.createIndexes();
        console.log('📊 Database indexes created');
    } catch (error) {
        console.error('❌ MongoDB Atlas connection error:', error);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Endpoint to provide Google API key to frontend
app.get('/api/google-api-key', (req, res) => {
    // In production, restrict access and do not expose sensitive keys directly
    res.json({
        apiKey: 'AIzaSyC2xQm4wEp_G-7J5Nr3HEO58kMBy56BcWE'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'SafeCity API',
        version: '1.0.0',
        description: 'Real-time incident reporting and safety analysis API',
        endpoints: {
            'GET /api/health': 'Health check',
            'GET /api/incidents': 'Get all incidents',
            'POST /api/incidents': 'Create new incident',
            'GET /api/incidents/nearby': 'Get incidents near location (params: lat, lng, radius)',
            'GET /api/incidents/recent': 'Get recent incidents near location (params: lat, lng, radius, since)',
            'GET /api/incidents/:id': 'Get specific incident',
            'GET /api/incidents/stats/summary': 'Get incident statistics'
        }
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/safety', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'safety.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: 'Validation Error',
            details: errors
        });
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

// 404 handler for other routes
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 SafeCity server running on port ${PORT}`);
    console.log(`📱 Dashboard: http://localhost:${PORT}`);
    console.log(`🚨 Report incidents: http://localhost:${PORT}/report`);
    console.log(`🔍 Safety analysis: http://localhost:${PORT}/safety`);
    console.log(`📡 API docs: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    
    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
    
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

module.exports = app;

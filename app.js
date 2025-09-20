// app.js - Express server for SafeCity application

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes
const incidentRoutes = require('./routes/incidents');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Import security middleware
const { sanitizeInput } = require('./middleware/security');

// Security middleware - Apply first
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://maps.googleapis.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'none'"],
            childSrc: ["'none'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false, // Needed for Google Maps
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting - More user-friendly limits
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs (increased from 100)
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // limit each IP to 25 auth requests per windowMs (increased from 10)
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(301, `https://${req.header('host')}${req.url}`);
        }
        next();
    });
}

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow localhost for development
        if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            return callback(null, true);
        }
        // Allow any Vercel subdomain
        if (/^https:\/\/([a-zA-Z0-9-]+)\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        // Allow file:// protocol for local development
        if (origin === null || origin === 'null') {
            return callback(null, true);
        }
        // Log blocked origins for debugging
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json({ 
    limit: '1mb', // Reduced from 10mb for security
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '1mb' // Reduced from 10mb for security
}));

// Additional security headers (helmet already covers most, but these are extra)
app.use((req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Additional security headers
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Secure cookies in production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Set-Cookie', 'HttpOnly;Secure;SameSite=strict');
    }
    
    next();
});

// Route for homepage - serve dashboard.html (must be before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Input sanitization middleware - apply globally
app.use(sanitizeInput);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB connection with serverless-friendly error handling
const connectDB = async () => {
    try {
        // Use MongoDB Atlas connection string from environment variable
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            console.log('💡 Please set MONGODB_URI in your Vercel environment variables');
            return false;
        }
        
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Already connected to MongoDB');
            return true;
        }
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 second timeout for serverless
            maxPoolSize: 10, // Maintain up to 10 socket connections
            bufferCommands: false, // Disable mongoose buffering
            bufferMaxEntries: 0 // Disable mongoose buffering
        });
        console.log('✅ Connected to MongoDB Atlas');
        
        // Create indexes for better performance with error handling
        try {
            const Incident = require('./models/Incident');
            await Incident.createIndexes();
            console.log('📊 Database indexes created');
        } catch (indexError) {
            // Handle index conflicts gracefully
            if (indexError.code === 85) { // IndexOptionsConflict
                console.log('⚠️  Index conflict detected. This is usually not critical for application functionality.');
            } else {
                console.log('⚠️  Index creation warning:', indexError.message);
            }
            // Don't exit the process, let the app continue running
        }
        return true;
    } catch (error) {
        console.error('❌ MongoDB Atlas connection error:', error.message);
        // Don't exit in serverless environment, just log the error
        return false;
    }
};

// Initialize database connection (don't wait for it to avoid blocking)
let dbConnectionPromise = connectDB();

// Middleware to ensure database connection before handling requests
app.use(async (req, res, next) => {
    try {
        const isConnected = await dbConnectionPromise;
        if (!isConnected && mongoose.connection.readyState !== 1) {
            // Try to reconnect
            dbConnectionPromise = connectDB();
            const reconnected = await dbConnectionPromise;
            if (!reconnected) {
                return res.status(503).json({
                    error: 'Database connection unavailable. Please try again later.',
                    status: 'service_unavailable'
                });
            }
        }
        next();
    } catch (error) {
        console.error('Database connection middleware error:', error);
        res.status(503).json({
            error: 'Database connection error. Please try again later.',
            status: 'connection_error'
        });
    }
});

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
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

// Export the Express app for serverless deployment
module.exports = app;

// Start server only if not in serverless environment
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`🚀 SafeCity server running on port ${PORT}`);
        console.log(`📱 Dashboard: http://localhost:${PORT}`);
        console.log(`🚨 Report incidents: http://localhost:${PORT}/report`);
        console.log(`🔍 Safety analysis: http://localhost:${PORT}/safety`);
        console.log(`📡 API docs: http://localhost:${PORT}/api`);
    });

    // Handle server errors in local development
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

    // Graceful shutdown for local development
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
}

# SafeCity Setup Guide

Complete setup instructions for deploying and running the SafeCity application.

## 📋 Prerequisites

- **Node.js** (version 14 or higher)
- **MongoDB Atlas** account or local MongoDB instance
- **Google Maps API** key
- **Email service** (Gmail recommended for notifications)
- **Vercel account** (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Safe-City
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database Configuration (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecity?retryWrites=true&w=majority

# JWT Configuration (REQUIRED - Change in production)
JWT_SECRET=your_super_secure_jwt_secret_key_min_32_characters_long
JWT_EXPIRE=7d

# Google Maps API (REQUIRED)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration (REQUIRED for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Application Settings
NODE_ENV=development
PORT=3000
APP_NAME=SafeCity
APP_URL=http://localhost:3000
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 🔧 Detailed Configuration

### MongoDB Setup

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create a database user with read/write permissions
   - Whitelist your IP address

2. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

### Google Maps API Setup

1. **Enable APIs**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API

2. **Create API Key**:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - **Important**: Restrict your API key to your domain in production

3. **API Key Restrictions (Production)**:
   ```
   HTTP referrers:
   - https://your-domain.vercel.app/*
   - https://your-custom-domain.com/*
   ```

### Email Configuration

1. **Gmail Setup** (Recommended):
   - Enable 2-factor authentication on your Gmail account
   - Generate an "App Password":
     - Go to Google Account Settings
     - Security → 2-Step Verification → App passwords
     - Select "Mail" and generate password
   - Use this app password in `EMAIL_PASS`

2. **Alternative Email Providers**:
   ```bash
   # For Outlook/Hotmail
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   
   # For Yahoo
   EMAIL_HOST=smtp.mail.yahoo.com
   EMAIL_PORT=587
   ```

## 🚀 Production Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Environment Variables**:
   In Vercel dashboard, go to Project Settings → Environment Variables and add:
   ```
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_secure_production_jwt_secret
   GOOGLE_MAPS_API_KEY=your_restricted_api_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   APP_URL=https://your-domain.vercel.app
   ```

### Security Configuration

The application includes comprehensive security features:

- **Security Headers**: Content Security Policy, HSTS, X-Frame-Options
- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: Prevents XSS attacks
- **HTTPS Enforcement**: Automatic redirect in production
- **CORS Protection**: Restricted origins

## 📊 Admin Setup

### Create Admin User

1. **Run the grant admin script**:
   ```bash
   npm run grant-admin
   ```

2. **Follow the prompts** to enter email address

3. **Admin Features**:
   - Incident moderation (approve/reject/flag)
   - User management (ban/unban users)
   - Analytics and reporting
   - System monitoring

### Admin Dashboard Access

- Login with admin credentials
- Admin features automatically available in the interface
- Access admin-only endpoints via `/api/admin/*`

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run lint
```

### Manual Testing

1. **Test Registration**: Create a new user account
2. **Test Login**: Login with created credentials
3. **Test Incident Reporting**: Submit a new incident
4. **Test Email**: Try password reset functionality
5. **Test Maps**: Verify location selection works
6. **Test Admin**: Login as admin and moderate incidents

## 🛠️ Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Build for production
npm start

# Initialize/reset database
npm run init-db

# Grant admin privileges to user
npm run grant-admin

# Update user consent (GDPR compliance)
npm run update-consent

# Code formatting
npm run format

# Linting
npm run lint
```

## 📁 Project Structure

```
Safe-City/
├── app.js                 # Main application server
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment config
├── .env                  # Environment variables (create this)
├── middleware/           # Custom middleware
│   ├── auth.js          # Authentication middleware
│   ├── consent.js       # GDPR consent middleware
│   └── security.js      # Security utilities
├── models/              # Database models
│   ├── User.js         # User model
│   └── Incident.js     # Incident model
├── routes/              # API routes
│   ├── auth.js         # Authentication routes
│   ├── incidents.js    # Incident management
│   └── admin.js        # Admin functionality
├── public/              # Static files
│   ├── *.html          # Frontend pages
│   ├── css/style.css   # Styles
│   └── js/             # Frontend JavaScript
├── scripts/             # Utility scripts
│   └── init-db.js      # Database initialization
└── tests/               # Test files
    └── *.test.js       # Test suites
```

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**:
   - Check your `MONGODB_URI` format
   - Ensure IP is whitelisted in MongoDB Atlas
   - Verify database user credentials

2. **Google Maps Not Loading**:
   - Check API key is correct
   - Verify APIs are enabled in Google Cloud Console
   - Check browser console for errors

3. **Email Not Working**:
   - Verify Gmail app password is correct
   - Check email credentials in `.env`
   - Ensure 2FA is enabled on Gmail account

4. **Rate Limiting Issues**:
   - Current limits: 200 requests per 15 minutes
   - Authentication: 20 login attempts per 15 minutes
   - Contact admin if legitimate usage is blocked

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

Check logs in browser console and terminal for detailed error messages.

## 📞 Support

- **Documentation**: Check this SETUP.md for comprehensive guidance
- **Issues**: Create GitHub issues for bugs or feature requests
- **Security**: Report security issues privately to administrators

---

**Need help?** Follow this guide step by step, and you'll have SafeCity running smoothly!
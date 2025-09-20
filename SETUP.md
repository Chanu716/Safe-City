# 🛠️ SafeCity Setup Guide

This comprehensive guide will walk you through setting up the SafeCity application with all required services and configurations.

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB Atlas account** - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **Google Cloud Platform account** - [Sign up here](https://cloud.google.com/)
- **Gmail account** - For email services

---

## 🚀 Quick Setup

### 1. Clone and Install
```bash
git clone https://github.com/Chanu716/Safe-City.git
cd Safe-City
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your actual credentials (see sections below)
```

### 3. Database Setup
```bash
npm run init-db
```

### 4. Start Application
```bash
npm start
```

---

## 🗄️ MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project (e.g., "SafeCity")

### Step 2: Create Database Cluster
1. Click **"Build a Database"**
2. Choose **"M0 Sandbox"** (Free tier)
3. Select your preferred **Cloud Provider & Region**
4. Name your cluster (e.g., "safe-city-cluster")
5. Click **"Create Cluster"**

### Step 3: Create Database User
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create username and secure password
5. Set **Database User Privileges** to **"Read and write to any database"**
6. Click **"Add User"**

### Step 4: Configure Network Access
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0) for development
4. For production, add your server's specific IP address
5. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `safecity`

**Example Connection String:**
```
mongodb+srv://username:password@cluster.mongodb.net/safecity
```

### Step 6: Update Environment Variable
Add to your `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecity
```

---

## 🗺️ Google Maps API Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Select a project"** → **"New Project"**
4. Enter project name (e.g., "SafeCity Maps")
5. Click **"Create"**

### Step 2: Enable Required APIs
1. Go to **"APIs & Services"** → **"Library"**
2. Search and enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Geolocation API**

### Step 3: Create API Key
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key
4. Click **"Restrict Key"** (recommended)

### Step 4: Restrict API Key (Security Best Practice)
1. Under **"Application restrictions"**:
   - Choose **"HTTP referrers (web sites)"**
   - Add your domains:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     ```

2. Under **"API restrictions"**:
   - Choose **"Restrict key"**
   - Select the APIs you enabled above

3. Click **"Save"**

### Step 5: Create Map ID (For Advanced Markers)
1. Go to **"Maps"** → **"Map Management"**
2. Click **"Create New Map ID"**
3. Choose **"JavaScript"** as map type
4. Enter name (e.g., "SafeCity Map")
5. Choose **"Vector"** map type for modern styling
6. Click **"Save"**
7. Copy the Map ID

### Step 6: Update Environment Variables
Add to your `.env` file:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_MAPS_MAP_ID=your_map_id_here
```

### Step 7: Test Maps Integration
1. Start your application: `npm start`
2. Go to `http://localhost:3000/index.html` (Incident Reporting)
3. Verify the map loads and location selection works
4. Test the search/autocomplete functionality

---

## 📧 Gmail Email Service Setup

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **"2-Step Verification"** if not already enabled
3. Follow the setup process with your phone number

### Step 2: Generate App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **"2-Step Verification"**
3. Scroll down to **"App passwords"**
4. Click **"App passwords"**
5. Select **"Mail"** and **"Other (Custom name)"**
6. Enter "SafeCity Application"
7. Click **"Generate"**
8. Copy the 16-character app password (no spaces)

### Step 3: Update Environment Variables
Add to your `.env` file:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

### Step 4: Test Email Functionality
1. Create a test account on your application
2. Use the **"Forgot Password"** feature
3. Check if you receive the OTP email
4. Verify the email formatting and content

**Troubleshooting Email Issues:**
- Ensure 2FA is enabled on your Gmail account
- Use App Password, not your regular Gmail password
- Check spam folder for test emails
- Verify EMAIL_USER matches the account that generated the App Password

---

## 🔐 JWT and Security Configuration

### Step 1: Generate JWT Secret
Generate a secure random string for JWT signing:
```bash
# On Windows PowerShell:
[System.Web.Security.Membership]::GeneratePassword(64, 10)

# Or use online generator: https://randomkeygen.com/
```

### Step 2: Configure Security Settings
Add to your `.env` file:
```env
JWT_SECRET=your_super_secure_64_character_random_string
JWT_EXPIRE=7d
NODE_ENV=development
PORT=3000
```

---

## 📝 Complete .env File Template

Create a `.env` file in your project root with these variables:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecity

# Authentication & Security
JWT_SECRET=your_super_secure_64_character_random_string
JWT_EXPIRE=7d

# Email Service (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_MAPS_MAP_ID=your_map_id_here

# Application Settings
NODE_ENV=development
PORT=3000
```

---

## 🚀 First Run Setup

### Step 1: Initialize Database
```bash
npm run init-db
```
This command will:
- Connect to your MongoDB database
- Create required indexes for optimal performance
- Set up geospatial indexes for location-based queries

### Step 2: Start the Application
```bash
npm start
```

### Step 3: Create Your First Account
1. Open `http://localhost:3000/signup.html`
2. Register with your email address
3. Create a strong password

### Step 4: Grant Admin Privileges
```bash
# Replace with your email address
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User');
  const user = await User.findOneAndUpdate(
    { email: 'your-email@example.com' },
    { role: 'admin' },
    { new: true }
  );
  if (user) {
    console.log('✅ Admin privileges granted to:', user.email);
  } else {
    console.log('❌ User not found. Please check the email address.');
  }
  mongoose.disconnect();
}).catch(console.error);
"
```

### Step 5: Verify Setup
Test these key features:
- ✅ **Login/Registration**: `http://localhost:3000/login.html`
- ✅ **Incident Reporting**: `http://localhost:3000/index.html`
- ✅ **Safety Analysis**: `http://localhost:3000/safety.html`
- ✅ **Admin Dashboard**: `http://localhost:3000/admin.html`
- ✅ **Forgot Password**: Test OTP email delivery

---

## 🔧 Development vs Production Configuration

### Development Setup
```env
NODE_ENV=development
PORT=3000
# Use localhost for MongoDB if running locally
# MONGODB_URI=mongodb://localhost:27017/safecity
```

### Production Setup
```env
NODE_ENV=production
PORT=3000
# Use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecity
# Add production domain to Google Maps API restrictions
# Use strong JWT secrets (64+ characters)
```

---

## 🚨 Troubleshooting Common Issues

### MongoDB Connection Issues
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));
"
```

### Google Maps Not Loading
1. Check browser console for API key errors
2. Verify API key restrictions allow your domain
3. Ensure required APIs are enabled in Google Cloud Console
4. Check API usage quotas and billing

### Email Not Sending
1. Verify 2FA is enabled on Gmail account
2. Use App Password, not regular password
3. Check EMAIL_USER matches the App Password generator account
4. Test with a simple email first

### Application Won't Start
1. Check all environment variables are set
2. Run `npm install` to ensure all dependencies
3. Verify Node.js version (v14+)
4. Check port 3000 is available: `netstat -ano | findstr :3000`

### Admin Access Issues
1. Verify user account exists in database
2. Check user role is set to 'admin'
3. Clear browser cache and cookies
4. Test login with admin credentials

---

## 📚 Additional Resources

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **Google Maps JavaScript API**: https://developers.google.com/maps/documentation/javascript
- **Gmail App Passwords**: https://support.google.com/mail/answer/185833
- **Node.js Environment Variables**: https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs

---

## 🆘 Getting Help

If you encounter issues during setup:

1. **Check Application Logs**: Look for error messages in your terminal
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test Individual Components**: Test MongoDB, Google Maps, and Email separately
4. **Review Documentation**: Check the specific service documentation for troubleshooting

**Support Contact**: charmiseera07@gmail.com | Phone: 9182789929

---

**🎉 Congratulations! Your SafeCity application should now be fully configured and ready to use.**

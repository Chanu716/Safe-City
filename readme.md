# 🛡️ SafeCity – Community Safety Platform

SafeCity is a comprehensive full-stack web application designed for **real-time incident reporting**, **location-based safety analysis**, **community moderation**, and **intelligent safety alerts**. Built to empower communities through data-driven safety awareness and collaborative incident management.

> ✅ Production-ready platform with advanced authentication, admin moderation, email notifications, and Google Maps integration.

---

## 🌟 Key Features

### 🔐 **Advanced Authentication System**
- **Secure Login/Registration** with bcrypt password hashing
- **Forgot Password** with OTP email verification
- **Account Security** with automatic lockout after failed attempts
- **JWT-based** session management
- **GDPR Compliant** data consent management

### 👥 **Admin & Moderation System**
- **Role-based Access Control** (Admin, Moderator, User)
- **Incident Moderation** - Approve, reject, or flag reports
- **User Management** - Ban/unban users, role assignments
- **Real-time Dashboard** with comprehensive statistics
- **Recent Activity Monitoring**

### 🚨 **Smart Incident Reporting**
- **Interactive Map Selection** with Google Maps integration
- **GPS Location Detection** for precise incident reporting
- **Category-based Classification** (Theft, Harassment, Emergency, etc.)
- **Anonymous Reporting** option
- **Photo Upload Support** (optional)
- **Automatic Timestamp & Geolocation**

### 🛡️ **Intelligent Safety Analysis**
- **Real-time Safety Zones** (Red/Yellow/Green indicators)
- **Location-based Risk Assessment** using historical data
- **Interactive Safety Map** with incident visualization
- **Distance-based Incident Filtering**
- **Safety Level Calculations** based on recent incidents

### 🔔 **Real-Time Alert System**
- **Live Danger Alerts** within customizable radius
- **30-second Auto-refresh** for new incidents
- **Proximity-based Notifications**
- **Emergency Alert Broadcasting**

### 📧 **Email Notification System**
- **OTP Verification** for password reset
- **Beautiful HTML Email Templates**
- **Gmail Integration** with App Passwords
- **Welcome & Safety Notifications**

## 🌐 Application Pages

| Page | Purpose | Features |
|------|---------|----------|
| `dashboard.html` | Main hub & navigation | User dashboard, quick access to all features |
| `login.html` | User authentication | Login, forgot password with OTP |
| `signup.html` | User registration | Account creation with GDPR consent |
| `index.html` | Incident reporting | Interactive map, form submission, GPS detection |
| `safety.html` | Safety analysis | Real-time safety map, incident visualization |
| `admin.html` | Admin dashboard | Moderation tools, user management, statistics |
| `profile.html` | User profile | Account settings, data management |
| `privacy.html` | Privacy policy | GDPR compliance, data usage information |

---


## �️ Complete Setup Guide

For detailed setup instructions including Google Maps API, MongoDB Atlas, Gmail integration, and all required configurations, see our comprehensive setup guide:

**📖 [SETUP.md](./SETUP.md) - Complete Configuration Guide**

This guide covers:
- 🗄️ MongoDB Atlas database setup
- 🗺️ Google Maps API configuration  
- 📧 Gmail email service setup
- 🔐 JWT and security configuration
- 🚀 First-time application setup
- 🔧 Development vs Production settings
- 🚨 Troubleshooting common issues

### 📌 Dashboard Page (`dashboard.html`)
- Entry point of the app
- Navigation to:
  - 🚨 Report Incident
  - 🔍 Analyze Area Safety
- Shows logged-in user name (optional)

---

### 👥 User Authentication (`login.html`, `signup.html`)
- User Registration (`signup.html`)
  - Email, username, password
  - Stores hashed password using bcrypt
- User Login (`login.html`)
  - Verifies credentials and starts session
- Session-based or JWT-based login system
- Required to report incidents or access safety data
- Basic auth middleware in backend protects routes

---

### 🚨 Incident Reporting (`index.html`)
- Users can report incidents by:
  - Using **live GPS location**
  - Or manually selecting location on a map
- Fields:
  - Title
  - Category (e.g., Theft, Harassment)
  - Description
- Auto-stores:
  - Latitude, Longitude
  - Timestamp
  - Reporting User ID

---

### 🛡️ Safety & History Analysis (`safety.html`)
- Interactive **Google Map**
- Click on location:
  - View recent incidents
  - Check **safety level**:
    - 🟥 Red – High danger
    - 🟨 Yellow – Alert zone
    - 🟩 Green – Safe zone

---

### 🔔 Real-Time Danger Alerts
- Uses browser geolocation to detect user position
- Every 30 seconds:
  - Checks if new incident occurred within 1km
  - Shows on-screen alert with details

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Google Cloud Platform account (for Maps API)
- Gmail account (for email services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chanu716/Safe-City.git
   cd Safe-City
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Database Setup**
   ```bash
   npm run init-db
   ```

5. **Start the application**
   ```bash
   npm start
   # or
   node app.js
   ```

6. **Access the application**
   - Main Dashboard: `http://localhost:3000`
   - Report Incident: `http://localhost:3000/index.html`
   - Safety Analysis: `http://localhost:3000/safety.html`

### Admin Setup

1. **Create your account** through the signup page
2. **Grant admin privileges** - See [SETUP.md](./SETUP.md) for detailed instructions
3. **Access admin dashboard** at `http://localhost:3000/admin.html`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecity

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRE=7d

# Email Services (for forgot password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_MAP_ID=your-map-id

# Application
NODE_ENV=development
PORT=3000
```

### Detailed Service Configuration

For step-by-step instructions on configuring all external services:

**📖 [SETUP.md](./SETUP.md) - Complete Setup Guide**

Includes detailed instructions for:
- **Google Maps API**: Enable APIs, create keys, set restrictions, configure Map IDs
- **Gmail Integration**: 2FA setup, App Password generation, email testing
- **MongoDB Atlas**: Account creation, cluster setup, user management, network configuration
- **Security Configuration**: JWT secrets, environment variables, production settings

## 🔄 Database Migration & Maintenance

```bash
# Resolve database index conflicts
npm run init-db
```

**For detailed setup and configuration**: [SETUP.md](./SETUP.md)  
**For database migration instructions**: [MIGRATION.md](./MIGRATION.md)

---

## 🧠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Google Maps JavaScript API |
| **Backend** | Node.js, Express.js, RESTful APIs |
| **Authentication** | JWT, bcrypt, OTP email verification |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Email Services** | Nodemailer, Gmail SMTP |
| **Security** | HTTPS, CORS, Input validation, Rate limiting |
| **Maps & Location** | Google Maps API, Places API, Geolocation API |
| **Real-time Features** | Server-Sent Events, WebSocket-ready architecture |

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │    Database     │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • Auth Routes   │◄──►│ • User Records  │
│ • Report Form   │    │ • Incident API  │    │ • Incidents     │
│ • Safety Map    │    │ • Admin Panel   │    │ • Moderation    │
│ • Admin Panel   │    │ • Email Service │    │ • Sessions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │              ┌─────────────────┐              
         └─────────────►│  External APIs  │              
                        │                 │              
                        │ • Google Maps   │              
                        │ • Gmail SMTP    │              
                        │ • Geolocation   │              
                        └─────────────────┘              
```

## 🛡️ Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **Account Protection**: Automatic lockout after failed login attempts
- **JWT Security**: Secure token-based authentication
- **Input Validation**: Server-side validation for all user inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **GDPR Compliance**: User consent management and data export
- **Admin Protection**: Role-based access control
- **API Security**: Rate limiting and request validation

---

## 📁 Project Structure

```
Safe-City/
├── 📁 public/                    # Frontend assets
│   ├── 📁 css/
│   │   └── style.css            # Global styles and responsive design
│   ├── 📁 js/
│   │   ├── auth.js              # Authentication frontend logic
│   │   ├── profile.js           # User profile management
│   │   ├── report.js            # Incident reporting functionality
│   │   ├── safety.js            # Safety analysis and real-time alerts
│   │   ├── admin-dashboard.js   # Admin panel functionality
│   │   └── maps-config.js       # Google Maps configuration
│   ├── dashboard.html           # Main dashboard
│   ├── index.html               # Incident reporting page
│   ├── login.html               # Login with forgot password
│   ├── signup.html              # Registration with GDPR consent
│   ├── safety.html              # Safety analysis and maps
│   ├── admin.html               # Admin moderation panel
│   ├── profile.html             # User profile management
│   ├── privacy.html             # Privacy policy and GDPR compliance
│   └── security.html            # Security information
├── 📁 routes/                    # API routes
│   ├── auth.js                  # Authentication & user management
│   ├── incidents.js             # Incident CRUD operations
│   └── admin.js                 # Admin panel APIs
├── 📁 models/                    # Database schemas
│   ├── User.js                  # User model with roles & security
│   └── Incident.js              # Incident model with moderation
├── 📁 middleware/                # Express middleware
│   ├── auth.js                  # JWT authentication
│   └── consent.js               # GDPR compliance middleware
├── 📁 utils/                     # Utility modules
│   └── emailService.js          # Email sending functionality
├── 📁 scripts/                   # Database initialization scripts
│   └── init-db.js               # Database setup and migration
├── 📁 tests/                     # Test files
│   └── migration.test.js        # Database migration tests
├── 📄 app.js                     # Express server setup
├── 📄 .env.example               # Environment template
├── 📄 SETUP.md                   # Complete setup guide
├── 📄 MIGRATION.md               # Database migration guide
└── 📄 README.md                  # This file
```

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password` - Reset password with OTP

### Incidents
- `GET /api/incidents` - Get approved incidents
- `POST /api/incidents` - Report new incident
- `GET /api/incidents/nearby` - Get incidents near location
- `GET /api/incidents/recent` - Get recent incidents for alerts

### Admin Panel
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/incidents/pending` - Pending moderation
- `POST /api/admin/incidents/:id/approve` - Approve incident
- `POST /api/admin/incidents/:id/reject` - Reject incident
- `GET /api/admin/users` - User management
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unlock` - Unlock account

## 🎯 Future Enhancements

- 📱 **Mobile App** with React Native
- 🔔 **Push Notifications** for real-time alerts
- 🤖 **AI-powered** incident categorization
- 📊 **Advanced Analytics** dashboard
- 🌐 **Multi-language** support
- 🔗 **Social Media** integration
- 📸 **Image Upload** for incident reports
- 🚨 **Emergency Services** integration
- 🗺️ **Offline Map** support
- 📈 **Predictive Safety** modeling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email charmiseera07@gmail.com or call 9182789929.

---

**Built with ❤️ for safer communities**
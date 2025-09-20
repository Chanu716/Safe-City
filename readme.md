# 🛡️ SafeCity – Community Safety Platform

A comprehensive community safety platform with **real-time incident reporting**, **safety analysis**, **admin moderation**, and **intelligent alerts**. Empowering communities through data-driven safety awareness and collaborative incident management.

> ✅ **Production-ready** with advanced security, authentication, and Google Maps integration.

---

## 🚀 **Quick Start**

```bash
# Clone and install
git clone <your-repo-url>
cd Safe-City
npm install

# Setup environment (see SETUP.md for details)
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run init-db

# Start development server
npm run dev
```

**📖 [Complete Setup Guide →](SETUP.md)**

---

## ⭐ **Key Features**

### 🔐 **Secure Authentication**
- JWT-based login/registration with bcrypt hashing
- Password reset with email OTP verification
- User-friendly rate limiting (no account lockouts)
- GDPR compliant data consent management

### 👥 **Admin Moderation**
- Incident approval/rejection system
- User management (ban/unban users)
- Real-time analytics dashboard
- Role-based access control

### 🚨 **Smart Incident Reporting**
- Interactive Google Maps location selection
- GPS auto-detection for precise reporting
- Categorized incident types (theft, harassment, emergency, etc.)
- Anonymous reporting options

### 🛡️ **Safety Analysis**
- Real-time safety zone visualization (Red/Yellow/Green)
- Location-based risk assessment using historical data
- Interactive safety maps with incident clustering
- Distance-based filtering and alerts

### 🔔 **Real-Time Alerts**
- Live danger notifications within customizable radius
- Auto-refreshing incident feed (30-second intervals)
- Emergency alert broadcasting
- Proximity-based safety warnings

### 📧 **Email Notifications**
- OTP verification for password reset
- HTML email templates with Gmail integration
- Welcome and safety notifications

## 🌐 **Application Pages**

| Page | Purpose | Key Features |
|------|---------|-------------|
| **Dashboard** | Main navigation hub | User dashboard, quick access to all features |
| **Login/Signup** | User authentication | Secure login, registration with GDPR consent |
| **Report Incident** | Incident reporting | Interactive map, GPS detection, categorization |
| **Safety Analysis** | Risk assessment | Real-time safety zones, incident visualization |
| **Admin Panel** | Moderation tools | Incident approval, user management, analytics |
| **Profile** | User settings | Account management, data privacy controls |

---

## � **Setup & Deployment**

**🔧 [Complete Setup Guide →](SETUP.md)** - Everything you need to get SafeCity running!

The setup guide includes:
- ⚡ **Quick Start** - Get running in 5 minutes
- 🔧 **Environment Configuration** - MongoDB, Google Maps, Email setup
- 🚀 **Production Deployment** - Vercel deployment with security
- 👨‍💼 **Admin Setup** - Creating admin users and permissions
- 🧪 **Testing** - How to test all features
- 🛠️ **Troubleshooting** - Common issues and solutions
---

## 🧠 **Tech Stack**

| Layer | Technologies |
|-------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Google Maps API |
| **Backend** | Node.js, Express.js, RESTful APIs |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | JWT, bcrypt, OTP email verification |
| **Security** | Helmet.js, Rate limiting, Input sanitization, HTTPS |
| **Email** | Nodemailer, Gmail SMTP |
| **Maps** | Google Maps API, Places API, Geolocation |

## 🛡️ **Security Features**

- **🔐 Secure Authentication**: JWT tokens, bcrypt password hashing
- **🛡️ Security Headers**: Content Security Policy, HSTS, XSS protection
- **🚦 Rate Limiting**: User-friendly limits (20 login attempts per 15 minutes)
- **🧹 Input Sanitization**: XSS prevention, data validation
- **🔒 HTTPS Enforcement**: Automatic redirect in production
- **📝 GDPR Compliance**: User consent management and data export

## 📁 **Project Structure**

```
Safe-City/
├── � app.js                    # Main server application
├── � package.json              # Dependencies and scripts
├── � SETUP.md                  # Complete setup guide
├── 📁 public/                   # Frontend files
│   ├── dashboard.html           # Main dashboard
│   ├── index.html               # Incident reporting
│   ├── safety.html              # Safety analysis
│   ├── login.html & signup.html # Authentication
│   └── css/ & js/               # Styles and scripts
├── 📁 routes/                   # API endpoints
│   ├── auth.js                  # Authentication
│   ├── incidents.js             # Incident management
│   └── admin.js                 # Admin operations
├── 📁 models/                   # Database schemas
│   ├── User.js                  # User model
│   └── Incident.js              # Incident model
├── 📁 middleware/               # Security & auth middleware
└── 📁 scripts/                  # Utility scripts
│   ├── update-user-consent.js   # GDPR consent updates
│   └── README.md                # Scripts documentation
├── 📁 tests/                     # Test files
│   └── migration.test.js        # Database migration tests
├── 📄 app.js                     # Express server setup
├── 📄 unlock-account.js          # Account unlock utility
├── 📄 .env.example               # Environment template
├── 📄 MIGRATION.md               # Database migration guide
├── 📄 MAPS_SETUP.md              # Google Maps setup guide
├── 📄 SETUP_EMAIL.md             # Email configuration guide
└── 📄 README.md                  # This file
```

## 🔍 **API Overview**

| Category | Key Endpoints |
|----------|---------------|
| **Authentication** | `/api/auth/signup`, `/api/auth/login`, `/api/auth/forgot-password` |
| **Incidents** | `/api/incidents`, `/api/incidents/nearby`, `/api/incidents/recent` |
| **Admin** | `/api/admin/stats`, `/api/admin/incidents/pending`, `/api/admin/users` |

*See [SETUP.md](SETUP.md) for complete API documentation.*

---

## 🎯 **Future Enhancements**

- 📱 Mobile app with React Native
- 🔔 Push notifications for real-time alerts
- 🤖 AI-powered incident categorization
- 📊 Advanced analytics dashboard
- 📸 Image upload for incident reports
- 🚨 Emergency services integration

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 **Support**

For support, email **charmiseera07@gmail.com** or call **9182789929**.

---

**🛡️ Built with ❤️ for safer communities**

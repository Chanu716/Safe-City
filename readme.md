# 🛡️ SafeCity – Real-Time Incident Reporting & Safety Analysis Web App

SafeCity is a full-stack web application built for real-time **incident reporting**, **location-based safety analysis**, **user authentication**, and **live danger alerts**. It empowers communities to stay informed, report unsafe events, and check the safety level of places before visiting.

> ✅ Built using MongoDB, Node.js, Express, HTML, CSS, and JavaScript.

---

## 🌐 Live Pages

| Page | Purpose |
|------|---------|
| `dashboard.html` | Main landing page with navigation |
| `login.html` / `signup.html` | User login and registration |
| `index.html` | Report incidents (form + map input) |
| `safety.html` | Check area safety, view history, and get alerts |

---


## 🚦 Google Maps API Key Setup

This project uses Google Maps for location selection and autocomplete. You must create your own Google Maps API key:

1. Go to https://console.cloud.google.com/
2. Create a new project (or use an existing one).
3. Enable the Google Maps JavaScript API and Places API.
4. Create an API key and restrict it to your domain (recommended).
5. Add your API key to a `.env` file in the project root:

   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

**Never commit your API key to public repositories.**

The app will load the key from `.env` and inject it into the frontend.

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

## 🔄 Database Migration

If you encounter index conflicts during development or deployment, SafeCity includes automated migration tools:

```bash
# Resolve database index conflicts
npm run init-db

# Or use the alternative command
npm run reset-indexes
```

For detailed migration instructions, see [MIGRATION.md](./MIGRATION.md).

---

## 🧠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, CSS, JavaScript, Google Maps JS API |
| Backend | Node.js, Express.js |
| Auth | Express Sessions or JWT, bcrypt for password hashing |
| Database | MongoDB (Mongoose ODM) |
| Tools | Geolocation API, Haversine formula for distance calc |

---

## 🗂️ Folder Structure


```safecity/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js       # Handles login/signup frontend logic
│   │   ├── profile.js    # Manages user profile updates
│   │   ├── report.js     # Logic for incident reporting
│   │   └── safety.js     # Handles safety analysis and map
│   ├── dashboard.html  # Main navigation
│   ├── index.html      # Incident reporting page
│   ├── login.html      # Login form
│   ├── profile.html    # User profile page
│   ├── safety.html     # Safety map and alerts
│   └── signup.html     # Registration form
├── routes/
│   ├── auth.js         # API routes for login/signup/logout
│   └── incidents.js  # API routes for reports
├── models/
│   ├── Incident.js   # Mongoose schema for reports
│   └── User.js       # Mongoose schema for users
├── middleware/
│ └── auth.js # Auth protection middleware
├── app.js # Express server setup
├── .env # MongoDB URI and secrets
└── README.md```

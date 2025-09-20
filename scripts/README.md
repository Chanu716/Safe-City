# SafeCity Admin Scripts

This directory contains utility scripts for managing the SafeCity application.

## Prerequisites

Before running any scripts, ensure you have:

1. **Environment Variables Set**: Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your-mongodb-connection-string
   ```

2. **Dependencies Installed**: 
   ```bash
   npm install
   ```

## Available Scripts

### 1. Grant Admin Privileges (`grant-admin.js`)

Grants admin privileges to specific email addresses.

**Usage:**
```bash
node scripts/grant-admin.js
```

**What it does:**
- Connects to MongoDB using environment variables
- Grants admin role to predefined email addresses
- Shows summary of changes made

**Security Note:** This script only works if the users have already created accounts.

### 2. Unlock Account (`../unlock-account.js`)

Unlocks a temporarily locked user account.

**Usage:**
```bash
node unlock-account.js <email>
```

**Example:**
```bash
node unlock-account.js user@example.com
```

**What it does:**
- Resets login attempts to 0
- Removes account lock
- Shows account status

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit credentials** to version control
2. **Always use environment variables** for sensitive data
3. **Restrict access** to these scripts in production
4. **Monitor usage** of admin scripts
5. **Use secure connections** to database

## Environment Setup

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecity

# Email (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Troubleshooting

**"MONGODB_URI environment variable is required"**
- Set the MONGODB_URI in your .env file
- Ensure .env file is in the root directory
- Restart your terminal/command prompt

**"User not found"**
- Make sure the user has created an account first
- Check the email address is correct
- Verify database connection

## Production Usage

In production environments:
1. Use a secure method to run these scripts
2. Log all admin operations
3. Restrict access to authorized personnel only
4. Use database user with minimal required permissions
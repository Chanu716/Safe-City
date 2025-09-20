# 📧 Quick Email Setup Guide

## To receive OTP emails for forgot password:

### 1. Get Gmail App Password
1. Go to [Google Account](https://myaccount.google.com/) → Security
2. Enable "2-Step Verification" (if not already enabled)
3. Click "App passwords"
4. Select "Mail" → "Other (Custom name)" → type "SafeCity"
5. Copy the 16-character password (example: `abcd efgh ijkl mnop`)

### 2. Update .env File
1. Open `.env` file in the root directory
2. Find this line: `EMAIL_PASSWORD=your-gmail-app-password-here`
3. Replace `your-gmail-app-password-here` with your app password
4. Remove any spaces from the password
5. Save the file

### 3. Restart Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
node app.js
```

### 4. Test
1. Go to http://localhost:3000/login.html
2. Click "Forgot Password?"
3. Enter your email: karrichanikya@gmail.com
4. Check your Gmail inbox for the OTP!

## Status Check
- ✅ Forgot password feature is working
- ✅ OTP generation is working (check console for codes)
- ⚠️ Email sending needs Gmail App Password setup
- ✅ All APIs are functional

Once you complete step 2 above, you'll receive actual emails instead of just console logs!
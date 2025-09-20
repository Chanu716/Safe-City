# Email Setup Instructions for SafeCity Forgot Password

## Quick Setup (For Testing)

To enable email sending for the forgot password feature, you have two options:

### Option 1: Environment Variables (Recommended)
1. Create a `.env` file in the root directory
2. Add these lines:
```
EMAIL_USER=karrichanikya@gmail.com
EMAIL_PASSWORD=your-gmail-app-password-here
```

### Option 2: Gmail App Password Setup
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an "App Password" for SafeCity
4. Use this app password instead of your regular Gmail password

## Testing the Feature

1. Open http://localhost:3000/login.html
2. Click "🔐 Forgot Password?"
3. Enter your email address
4. Check your email for the 6-digit OTP code
5. Enter the OTP to verify
6. Set your new password

## Email Configuration Notes

- The system will work without email setup, but OTPs will only be logged to console
- Check the server console for OTP codes if email isn't configured
- For production, consider using services like SendGrid, AWS SES, or Mailgun

## Current Status
✅ Forgot password UI added to login page
✅ OTP generation and verification backend APIs
✅ Email service with beautiful HTML templates
✅ Complete frontend JavaScript workflow
✅ 3-step process: Email → OTP → Reset Password

The forgot password system is fully functional!
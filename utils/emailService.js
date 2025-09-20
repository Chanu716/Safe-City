// utils/emailService.js - Email service for sending OTPs and notifications

const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    // For development, we'll use Gmail. In production, use a proper email service
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'karrichanikya@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password-here' // Use App Password for Gmail
    }
};

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service configuration error:', error.message);
        console.log('📝 To fix this:');
        console.log('1. Set EMAIL_USER and EMAIL_PASSWORD environment variables');
        console.log('2. For Gmail, use App Password instead of regular password');
        console.log('3. Enable 2-factor authentication and generate App Password');
    } else {
        console.log('✅ Email service ready');
    }
});

// Send OTP email
const sendOTPEmail = async (email, otp, firstName = '') => {
    try {
        const mailOptions = {
            from: {
                name: 'SafeCity',
                address: process.env.EMAIL_USER || 'karrichanikya@gmail.com'
            },
            to: email,
            subject: '🔐 SafeCity - Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4CAF50; margin: 0;">🛡️ SafeCity</h1>
                        <p style="color: #666; margin: 5px 0;">Community Safety Platform</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #4CAF50;">
                        <h2 style="color: #333; margin: 0 0 20px 0;">Password Reset Request</h2>
                        
                        ${firstName ? `<p>Hi <strong>${firstName}</strong>,</p>` : '<p>Hello,</p>'}
                        
                        <p>We received a request to reset your SafeCity account password. Use the verification code below to proceed:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #fff; display: inline-block; padding: 20px 30px; border-radius: 8px; border: 2px solid #4CAF50; font-size: 32px; font-weight: bold; color: #333; letter-spacing: 8px;">
                                ${otp}
                            </div>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul style="color: #666;">
                            <li>This code will expire in <strong>10 minutes</strong></li>
                            <li>Don't share this code with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            If you have any questions, contact us at: 
                            <strong>karrichanikya@gmail.com</strong> or <strong>9182789929</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: #999; font-size: 12px;">
                            This email was sent by SafeCity. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully to:', email);
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message);
        return { success: false, error: error.message };
    }
};

// Send welcome email (optional, for future use)
const sendWelcomeEmail = async (email, firstName) => {
    try {
        const mailOptions = {
            from: {
                name: 'SafeCity',
                address: process.env.EMAIL_USER || 'karrichanikya@gmail.com'
            },
            to: email,
            subject: '🎉 Welcome to SafeCity!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4CAF50; margin: 0;">🛡️ SafeCity</h1>
                        <p style="color: #666; margin: 5px 0;">Community Safety Platform</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #4CAF50;">
                        <h2 style="color: #333; margin: 0 0 20px 0;">Welcome to SafeCity!</h2>
                        
                        <p>Hi <strong>${firstName}</strong>,</p>
                        
                        <p>Thank you for joining SafeCity! You're now part of a community dedicated to making our neighborhoods safer.</p>
                        
                        <div style="margin: 30px 0;">
                            <h3 style="color: #4CAF50;">What you can do:</h3>
                            <ul style="color: #666;">
                                <li>🚨 Report incidents in your area</li>
                                <li>🔍 Analyze safety data for locations</li>
                                <li>📊 View community safety insights</li>
                                <li>🔔 Get real-time safety alerts</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:3000/dashboard.html" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Start Using SafeCity
                        </a>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully to:', email);
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail
};
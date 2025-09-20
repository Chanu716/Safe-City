// unlock-account.js - Utility script to unlock a temporarily locked account

const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection (using the same connection string as the app)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://karrichanikya:Karrichani2005@cluster0.m3hgp.mongodb.net/safecity';

async function unlockAccount(email) {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find the user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('❌ User not found with email:', email);
            return;
        }

        // Check if account is locked
        if (!user.isLocked) {
            console.log('ℹ️ Account is not currently locked for:', email);
            console.log(`   Login attempts: ${user.loginAttempts}`);
            return;
        }

        // Unlock the account
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        console.log('🔓 Account successfully unlocked for:', email);
        console.log(`   Previous lock until: ${new Date(user.lockUntil)}`);
        console.log(`   Previous login attempts: ${user.loginAttempts}`);

    } catch (error) {
        console.error('❌ Error unlocking account:', error.message);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('📡 MongoDB connection closed');
    }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.log('Usage: node unlock-account.js <email>');
    console.log('Example: node unlock-account.js karrichanikya@gmail.com');
    process.exit(1);
}

// Run the unlock function
unlockAccount(email);
// Script to grant admin privileges to specific users
// Usage: node scripts/grant-admin.js

const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration
const ADMIN_EMAILS = [
    'karrichanikya@gmail.com',
    'charmiseera07@gmail.com'
];

// Get MongoDB URI from environment or use fallback
const MONGODB_URI = process.env.MONGODB_URI || 
    process.env.DATABASE_URL || 
    process.env.MONGODB_URI ||
    'mongodb+srv://chanuk716:chanusafe@cluster0.4jftu.mongodb.net/safecity?retryWrites=true&w=majority';

async function grantAdminPrivileges() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log(`\n🔧 Granting admin privileges to ${ADMIN_EMAILS.length} users...`);

        for (const email of ADMIN_EMAILS) {
            try {
                console.log(`\n👤 Processing: ${email}`);
                
                const user = await User.findOne({ email: email.toLowerCase() });
                
                if (!user) {
                    console.log(`   ❌ User not found: ${email}`);
                    console.log(`   💡 Make sure the user has created an account first`);
                    continue;
                }

                const oldRole = user.role || 'user';
                user.role = 'admin';
                await user.save();

                console.log(`   ✅ Success: ${user.firstName} ${user.lastName} (${email})`);
                console.log(`   📈 Role updated: ${oldRole} → admin`);

            } catch (userError) {
                console.log(`   ❌ Error processing ${email}:`, userError.message);
            }
        }

        console.log('\n🎉 Admin privilege granting completed!');
        console.log('\n📋 Summary:');
        
        // Get final status of all users
        for (const email of ADMIN_EMAILS) {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                console.log(`   • ${email}: ${user.role || 'user'} ${user.role === 'admin' ? '✅' : '❌'}`);
            } else {
                console.log(`   • ${email}: not found ❌`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        console.log('\n🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Disconnected');
        process.exit(0);
    }
}

// Run the script
if (require.main === module) {
    grantAdminPrivileges();
}

module.exports = grantAdminPrivileges;
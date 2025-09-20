// scripts/update-user-consent.js - Update existing users with consent
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function updateUserConsent() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find users without consent
        const usersWithoutConsent = await User.find({
            $or: [
                { 'consent.dataCollection': { $ne: true } },
                { 'consent.dataProcessing': { $ne: true } },
                { consent: { $exists: false } }
            ]
        });

        console.log(`📊 Found ${usersWithoutConsent.length} users without proper consent`);

        if (usersWithoutConsent.length > 0) {
            // Update all users to have consent
            const result = await User.updateMany(
                {
                    $or: [
                        { 'consent.dataCollection': { $ne: true } },
                        { 'consent.dataProcessing': { $ne: true } },
                        { consent: { $exists: false } }
                    ]
                },
                {
                    $set: {
                        'consent.dataCollection': true,
                        'consent.dataProcessing': true,
                        'consent.consentDate': new Date(),
                        'consent.consentVersion': '1.0'
                    }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} users with consent`);
        } else {
            console.log('✅ All users already have proper consent');
        }

    } catch (error) {
        console.error('❌ Error updating user consent:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the script
updateUserConsent();
// scripts/init-db.js - Database initialization script to handle index conflicts

const mongoose = require('mongoose');
require('dotenv').config();

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MongoDB connection string not found in environment variables');
        }

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB Atlas');

        // Get the incidents collection
        const db = mongoose.connection.db;
        const collection = db.collection('incidents');

        // Check existing indexes
        const existingIndexes = await collection.indexes();
        console.log('📋 Existing indexes:', existingIndexes.map(idx => idx.name));

        // Drop conflicting location indexes if they exist
        const locationIndexNames = existingIndexes
            .filter(idx => idx.key && (idx.key.location || idx.name.includes('location')))
            .map(idx => idx.name);

        for (const indexName of locationIndexNames) {
            if (indexName !== '_id_') { // Don't drop the default _id index
                try {
                    await collection.dropIndex(indexName);
                    console.log(`🗑️  Dropped conflicting index: ${indexName}`);
                } catch (error) {
                    console.log(`⚠️  Could not drop index ${indexName}:`, error.message);
                }
            }
        }

        // Import the Incident model which will create the correct indexes
        const Incident = require('../models/Incident');
        
        // Ensure indexes are created with the correct configuration
        await Incident.createIndexes();
        console.log('📊 Database indexes created successfully');

        // Verify the new indexes
        const newIndexes = await collection.indexes();
        console.log('✅ Current indexes:', newIndexes.map(idx => idx.name));

        console.log('🎉 Database initialization completed successfully');
        console.log('');
        console.log('✅ Migration Summary:');
        console.log(`   • MongoDB connection: successful`);
        console.log(`   • Conflicting indexes removed: ${locationIndexNames.length}`);
        console.log(`   • New indexes created: ${newIndexes.length}`);
        console.log(`   • Database ready for application use`);

    } catch (error) {
        console.error('❌ Database initialization error:', error);
        console.log('');
        console.log('🔧 Troubleshooting tips:');
        console.log('   • Check your MONGODB_URI in .env file');
        console.log('   • Ensure MongoDB cluster is accessible');
        console.log('   • Verify database user has proper permissions');
        console.log('   • See MIGRATION.md for detailed instructions');
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = initializeDatabase;

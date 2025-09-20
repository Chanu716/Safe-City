const initializeDatabase = require('../scripts/init-db');

// Mock mongoose to avoid real database connections during tests
jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(true),
    connection: {
        db: {
            collection: jest.fn(() => ({
                indexes: jest.fn().mockResolvedValue([
                    { name: '_id_', key: { _id: 1 } },
                    { name: 'location_2dsphere', key: { location: '2dsphere' } }
                ]),
                dropIndex: jest.fn().mockResolvedValue(true)
            }))
        },
        close: jest.fn().mockResolvedValue(true)
    }
}));

// Mock the Incident model
jest.mock('../models/Incident', () => ({
    createIndexes: jest.fn().mockResolvedValue(true)
}));

// Mock dotenv
jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Mock process.env
process.env.MONGODB_URI = 'mongodb://test-uri';

describe('Database Migration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should export initializeDatabase function', () => {
        expect(typeof initializeDatabase).toBe('function');
    });

    test('should handle missing MongoDB URI', async () => {
        const originalUri = process.env.MONGODB_URI;
        delete process.env.MONGODB_URI;

        await expect(initializeDatabase()).rejects.toThrow('MongoDB connection string not found');

        process.env.MONGODB_URI = originalUri;
    });

    test('should complete migration successfully with valid environment', async () => {
        // Mock console methods to avoid noise in tests
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await expect(initializeDatabase()).resolves.toBeUndefined();
        
        consoleSpy.mockRestore();
    });

    test('should handle connection errors gracefully', async () => {
        const mongoose = require('mongoose');
        mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));

        await expect(initializeDatabase()).rejects.toThrow('Connection failed');
    });
});

describe('Migration Script Package.json Scripts', () => {
    const packageJson = require('../package.json');

    test('should have init-db script defined', () => {
        expect(packageJson.scripts['init-db']).toBe('node scripts/init-db.js');
    });

    test('should have reset-indexes script defined', () => {
        expect(packageJson.scripts['reset-indexes']).toBe('node scripts/init-db.js');
    });
});
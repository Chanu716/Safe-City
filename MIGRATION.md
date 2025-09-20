# SafeCity Database Migration Guide

This document describes the database migration process for SafeCity, particularly for handling MongoDB index conflicts during schema evolution.

## Overview

SafeCity uses MongoDB with geospatial indexing for location-based incident data. When the database schema evolves, particularly around location indexing, conflicts can occur that prevent the application from starting properly.

## When to Run Migration

Run the migration script when you encounter:

- **IndexOptionsConflict errors** (MongoDB error code 85)
- **Geospatial index conflicts** related to the `location` field
- **Application startup issues** mentioning index problems

The application will show this message when migration is needed:
```
⚠️  Index conflict detected. This is usually not critical for application functionality.
💡 To resolve: Run the database initialization script: node scripts/init-db.js
```

## Migration Process

### Automatic Migration (Recommended)

Use the npm scripts for easy migration:

```bash
# Initialize database and resolve index conflicts
npm run init-db

# Alternative command (same functionality)
npm run reset-indexes
```

### Manual Migration

If you need more control, run the script directly:

```bash
node scripts/init-db.js
```

### What the Migration Does

1. **Connects to MongoDB** using the `MONGODB_URI` environment variable
2. **Identifies conflicting indexes** on the `incidents` collection
3. **Safely drops problematic indexes** (preserves `_id` index)
4. **Recreates indexes** with correct configuration from the Incident model
5. **Verifies index creation** and reports status

## Migration Script Features

- ✅ **Safe operation**: Never drops the primary `_id` index
- ✅ **Error handling**: Graceful handling of missing indexes
- ✅ **Logging**: Detailed progress and error reporting
- ✅ **Verification**: Confirms new indexes after creation
- ✅ **Connection cleanup**: Properly closes database connections

## Environment Requirements

Ensure your `.env` file contains:

```env
MONGODB_URI=your_mongodb_connection_string
```

## Troubleshooting

### Connection Issues

If you see "MongoDB connection string not found":
- Check your `.env` file exists in the project root
- Verify `MONGODB_URI` is set correctly
- Ensure the MongoDB cluster is accessible

### Index Drop Failures

The script handles cases where indexes can't be dropped:
- Logs warnings but continues execution
- Non-critical for application functionality
- New indexes will still be created properly

### Permission Issues

Ensure your MongoDB user has:
- `readWrite` permissions on the database
- `dbAdmin` permissions for index operations

## Testing

Run the migration tests to verify functionality:

```bash
npm test tests/migration.test.js
```

## Development Notes

### File Structure
- `scripts/init-db.js` - Main migration script
- `models/Incident.js` - Defines correct index configuration
- `app.js` - Handles index conflicts gracefully during startup
- `tests/migration.test.js` - Migration functionality tests

### Index Configuration

The Incident model defines these indexes:
- `{ timestamp: -1 }` - For sorting by most recent
- `{ category: 1 }` - For filtering by category  
- `{ latitude: 1, longitude: 1 }` - For geospatial queries
- `{ status: 1 }` - For filtering by status
- `{ location: '2dsphere' }` - For geospatial operations

### Error Codes

- **Code 85**: IndexOptionsConflict - Different index options for same field
- **Connection errors**: Network or authentication issues
- **Drop errors**: Usually non-critical, often due to missing indexes

## Production Deployment

For production deployments:

1. **Run migration during maintenance window**
2. **Test on staging environment first**
3. **Monitor application logs** after deployment
4. **Have rollback plan ready** (database backup)

```bash
# Production migration example
NODE_ENV=production npm run init-db
```

## Backup Recommendations

Before running migration in production:

```bash
# Create MongoDB backup (adjust for your setup)
mongodump --uri="your_mongodb_uri" --out backup_$(date +%Y%m%d_%H%M%S)
```

The migration is designed to be safe and non-destructive, but backups are always recommended for production systems.
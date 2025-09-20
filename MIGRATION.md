# 🗃️ SafeCity Database Migration Guide

This document provides comprehensive guidance for SafeCity database migrations, schema updates, and troubleshooting common deployment issues.

## 📋 Current Schema Version: v2.0

**Last Updated**: September 2025  
**Major Changes**: Admin moderation system, OTP authentication, geospatial optimization

## 🎯 Overview

SafeCity employs MongoDB with advanced features:
- **Geospatial indexing** for location-based queries
- **Moderation workflow** with status tracking  
- **User authentication** with JWT and OTP
- **Role-based access control** (User, Moderator, Admin)

Schema evolution can cause conflicts, particularly with geospatial indexes during development and deployment.

## 🚨 When to Run Migration

### Immediate Migration Required
Run migration when encountering:

- **IndexOptionsConflict errors** (MongoDB error code 85)
- **Geospatial index conflicts** on `location` field
- **Application startup failures** with index-related errors
- **Deployment issues** on new environments

### Application Warning Signs
```bash
⚠️  Index conflict detected. This is usually not critical for application functionality.
💡 To resolve: Run the database initialization script: node scripts/init-db.js
```

### Production Deployment
**Always run migration** when:
- Deploying to new environments (Render, Heroku, AWS)
- Switching between development and production databases
- After major schema updates or application updates

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

For direct control over the migration process:

```bash
# Verify prerequisites
node --version  # Ensure Node.js v14+
npm list mongoose  # Confirm MongoDB driver is installed

# Run migration directly
node scripts/init-db.js
```

### 📊 What the Migration Does

**Phase 1: Connection & Analysis**
1. **Connects to MongoDB** using `MONGODB_URI` environment variable
2. **Analyzes existing schema** across `incidents` and `users` collections
3. **Identifies index conflicts** that prevent optimal geospatial queries

**Phase 2: Index Optimization** 
4. **Safely drops problematic indexes** (preserves critical `_id` indexes)
5. **Recreates optimized indexes** with current schema requirements:
   - **Geospatial**: `location` field for radius-based incident queries
   - **Performance**: `status`, `createdAt`, `email` fields for filtering
   - **Security**: Compound indexes for authentication workflows

**Phase 3: Validation**
6. **Verifies index creation** and validates query performance
7. **Reports migration status** with detailed success/error information

## 🛡️ Migration Script Features

### Safety Guarantees
- ✅ **Data Protection**: Never modifies or deletes application data
- ✅ **Safe Operations**: Preserves critical `_id` indexes and essential data
- ✅ **Rollback Safety**: Index recreation is atomic and reversible

### Reliability Features  
- ✅ **Error Handling**: Graceful recovery from network/database issues
- ✅ **Detailed Logging**: Comprehensive progress and diagnostic reporting
- ✅ **Verification**: Multi-stage validation of index creation success
- ✅ **Clean Shutdown**: Proper connection cleanup and resource management

### Production Ready
- ✅ **Environment Aware**: Adapts to development/staging/production settings
- ✅ **Performance Optimized**: Creates indexes for maximum query efficiency
- ✅ **Zero Downtime**: Migration runs alongside active application instances

## Environment Requirements

Ensure your `.env` file contains:

```env
MONGODB_URI=your_mongodb_connection_string
```

## Troubleshooting

### 🔗 Connection Issues

**Error**: `MongoDB connection string not found`
```bash
# Solutions:
1. Verify .env file exists in project root
2. Check MONGODB_URI format:
   - Local: mongodb://localhost:27017/safecity
   - Cloud: mongodb+srv://user:pass@cluster.mongodb.net/safecity
3. Test connection: mongo "your_connection_string"
```

**Error**: `Connection timeout` or `Network error`
```bash
# Solutions:
1. Check MongoDB service status
2. Verify network connectivity and firewall settings
3. For MongoDB Atlas: Whitelist your IP address
4. Increase connection timeout in environment settings
```

### 📂 Index Management Issues

**Warning**: `Cannot drop index` 
- **Behavior**: Script logs warning but continues safely
- **Impact**: No data loss, existing indexes remain functional
- **Resolution**: Manual index cleanup may be needed in production

**Error**: `Index creation failed`
```bash
# Diagnostic steps:
1. Check collection permissions
2. Verify schema compatibility
3. Monitor disk space on MongoDB server
4. Review MongoDB server logs for detailed errors
```
- Non-critical for application functionality
- New indexes will still be created properly

### 🔐 Permission Issues

**Error**: `Insufficient permissions` or `Authorization failed`

Required MongoDB permissions:
```javascript
// Minimum required roles for migration user
{
  "role": "readWrite",
  "db": "safecity"  // Your database name
},
{
  "role": "dbAdmin", 
  "db": "safecity"   // For index operations
}
```

**Setup Commands** (for MongoDB administrators):
```javascript
// Create migration user with proper permissions
use safecity
db.createUser({
  user: "migration_user",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "safecity" },
    { role: "dbAdmin", db: "safecity" }
  ]
})
```

## ✅ Testing & Validation

### Automated Migration Tests
```bash
# Run comprehensive migration tests
npm test tests/migration.test.js

# Test specific scenarios
npm run test:migration:indexes
npm run test:migration:connection
```

### Manual Validation
```bash
# Verify indexes after migration
mongo your_database_uri --eval "db.incidents.getIndexes()"

# Test geospatial query performance
mongo your_database_uri --eval "
  db.incidents.find({
    location: {
      \$near: {
        \$geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
        \$maxDistance: 1000
      }
    }
  }).explain('executionStats')
"
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

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] **Staging validation**: Test migration on staging environment
- [ ] **Backup creation**: Full database backup completed
- [ ] **Maintenance window**: Migration scheduled during low traffic
- [ ] **Rollback plan**: Database restore procedure verified
- [ ] **Monitoring setup**: Application logs and metrics ready

### Production Migration Process
```bash
# 1. Create timestamped backup
mongodump --uri="$MONGODB_URI" --out "backup_$(date +%Y%m%d_%H%M%S)"

# 2. Run migration with production settings
NODE_ENV=production npm run init-db

# 3. Verify application startup
npm start &
sleep 10

# 4. Test critical endpoints
curl http://localhost:3000/api/incidents/nearby?lat=40.7128&lng=-74.006&radius=1000
curl http://localhost:3000/api/admin/stats
```

### Cloud Platform Deployments

**Render.com**:
```bash
# Build command includes migration
npm install && npm run init-db

# Start command
npm start
```

**Heroku**:
```bash
# Run migration as release phase
echo "release: npm run init-db" >> Procfile

# Or manual migration
heroku run npm run init-db
```

**Railway/AWS/Digital Ocean**:
```bash
# Include in deployment script
npm run init-db && npm start
```

## 💾 Backup & Recovery

### Automated Backup Creation
```bash
# Daily backup script (add to cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out "backups/safecity_$DATE"
find backups/ -type d -mtime +7 -exec rm -rf {} \;  # Keep 7 days
```

### Migration Rollback Procedure
```bash
# If migration issues occur:
# 1. Stop application
pm2 stop safecity

# 2. Restore from backup
mongorestore --uri="$MONGODB_URI" --drop backup_YYYYMMDD_HHMMSS/

# 3. Restart application
pm2 start safecity
```

## 📊 Post-Migration Monitoring

### Key Metrics to Watch
- **Query Performance**: Geospatial queries should execute in <100ms
- **Index Usage**: Monitor `executionStats` for proper index utilization
- **Memory Usage**: New indexes may slightly increase memory footprint
- **Application Errors**: Watch for any index-related startup issues

### Health Check Queries
```javascript
// Verify geospatial index performance
db.incidents.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-74.006, 40.7128] },
      $maxDistance: 1000
    }
  }
}).explain("executionStats")

// Check index utilization
db.incidents.aggregate([
  { $indexStats: {} }
])
```

---

## 📞 Support & Maintenance

For migration issues or questions:
1. Check application logs for detailed error messages
2. Review MongoDB server logs for database-specific issues
3. Consult the troubleshooting section above
4. Test migration on development environment first

**Migration is designed to be safe, non-destructive, and production-ready.** 
Regular backups and staging environment testing provide additional safety layers.
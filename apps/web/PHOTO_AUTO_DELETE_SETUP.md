# Auto Photo Deletion System Setup

This document describes the automatic photo deletion system that removes photos after 2 weeks.

## System Overview

The auto-deletion system consists of:

1. **Database Schema**: Added `expires_at` field to the `photos` table
2. **Photo Creation Logic**: Automatically sets expiration date (14 days from upload)
3. **Cleanup API Endpoint**: Removes expired photos from storage and database
4. **Cron Job Integration**: Scheduled execution of cleanup operations

## Files Modified/Created

- `apps/web/prisma/schema.prisma` - Added `expiresAt` field to Photo model
- `apps/web/src/app/api/photos/save/route.ts` - Updated to set expiration date
- `apps/web/src/app/api/cron/cleanup-expired-photos/route.ts` - New cleanup endpoint
- `apps/web/supabase/migrations/20240921_add_photo_expiration.sql` - Database migration

## Setup Instructions

### 1. Apply Database Migration

Run the SQL migration in your Supabase SQL editor:

```sql
-- Add expires_at column to photos table for automatic deletion after 2 weeks
ALTER TABLE photos
ADD COLUMN expires_at TIMESTAMPTZ;

-- Add index for efficient cleanup queries
CREATE INDEX idx_photos_expires_at ON photos(expires_at) WHERE expires_at IS NOT NULL;

-- Update existing photos to expire 2 weeks from their creation date
UPDATE photos
SET expires_at = created_at + INTERVAL '14 days'
WHERE expires_at IS NULL;
```

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Cron secret for photo cleanup
CRON_SECRET=your_super_secret_key_for_cron_here_123
```

Make sure you also have:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Cron Job Setup

Set up a cron job or scheduled task to call the cleanup endpoint daily:

**Option A: External Cron Service (Recommended)**
- Use services like cron-job.org, EasyCron, or Vercel Cron
- Schedule: Daily at midnight
- URL: `POST https://yourdomain.com/api/cron/cleanup-expired-photos`
- Headers: `Authorization: Bearer your_super_secret_key_for_cron_here_123`

**Option B: Server Cron (if self-hosting)**
```bash
# Add to crontab (crontab -e)
0 0 * * * curl -X POST https://yourdomain.com/api/cron/cleanup-expired-photos -H "Authorization: Bearer your_super_secret_key_for_cron_here_123"
```

## How It Works

1. **Photo Upload**: When photos are uploaded via `/api/photos/save`, they automatically get an `expiresAt` timestamp set to 14 days from creation.

2. **Daily Cleanup**: The cron job calls `/api/cron/cleanup-expired-photos` which:
   - Finds all photos where `expiresAt <= current time`
   - Deletes the files from Supabase storage
   - Removes the database records

3. **Security**: The cleanup endpoint requires a bearer token to prevent unauthorized access.

## Testing

Test the cleanup endpoint manually:

```bash
# Test unauthorized access (should return 401)
curl -X POST http://localhost:3000/api/cron/cleanup-expired-photos \
  -H "Authorization: Bearer wrong_key"

# Test authorized access (should work)
curl -X POST http://localhost:3000/api/cron/cleanup-expired-photos \
  -H "Authorization: Bearer your_super_secret_key_for_cron_here_123"
```

## Monitoring

The cleanup endpoint returns a JSON response with statistics:

```json
{
  "success": true,
  "deletedCount": 25,
  "failedCount": 0,
  "totalExpired": 25
}
```

Monitor these responses to ensure the system is working correctly.

## Notes

- Photos are deleted permanently and cannot be recovered
- The system handles both file deletion from Supabase storage and database cleanup
- If file deletion fails, the database record is retained for retry in the next cleanup
- Existing photos are automatically assigned expiration dates when the migration runs
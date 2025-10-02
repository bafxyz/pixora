-- Add performance indexes for frequently queried fields

-- Index for photographer email lookups
CREATE INDEX IF NOT EXISTS idx_photographer_email ON photographers(email);

-- Index for studio_id in photographers table
CREATE INDEX IF NOT EXISTS idx_photographer_studio_id ON photographers(studio_id);

-- Index for photo_session_id in photos table
CREATE INDEX IF NOT EXISTS idx_photos_photo_session_id ON photos(photo_session_id);

-- Index for photographer_id in photos table
CREATE INDEX IF NOT EXISTS idx_photos_photographer_id ON photos(photographer_id);

-- Index for studio_id in photos table
CREATE INDEX IF NOT EXISTS idx_photos_studio_id ON photos(studio_id);

-- Index for expires_at in photos table for cleanup queries
CREATE INDEX IF NOT EXISTS idx_photos_expires_at ON photos(expires_at);

-- Index for studio_id in photo_sessions table
CREATE INDEX IF NOT EXISTS idx_photo_sessions_studio_id ON photo_sessions(studio_id);

-- Index for photographer_id in photo_sessions table
CREATE INDEX IF NOT EXISTS idx_photo_sessions_photographer_id ON photo_sessions(photographer_id);

-- Composite index for photos by studio and expiration (for cleanup)
CREATE INDEX IF NOT EXISTS idx_photos_studio_expires ON photos(studio_id, expires_at);

-- Composite index for photo sessions by studio and photographer
CREATE INDEX IF NOT EXISTS idx_photo_sessions_studio_photographer ON photo_sessions(studio_id, photographer_id);

-- Index for created_at timestamps for ordering queries
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_created_at ON photo_sessions(created_at);
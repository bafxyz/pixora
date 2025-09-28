-- Add expires_at column to photos table for automatic deletion after 2 weeks
ALTER TABLE photos
ADD COLUMN expires_at TIMESTAMPTZ;

-- Add index for efficient cleanup queries
CREATE INDEX idx_photos_expires_at ON photos(expires_at) WHERE expires_at IS NOT NULL;

-- Update existing photos to expire 2 weeks from their creation date
UPDATE photos
SET expires_at = created_at + INTERVAL '14 days'
WHERE expires_at IS NULL;
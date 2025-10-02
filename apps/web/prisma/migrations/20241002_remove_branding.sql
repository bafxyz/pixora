-- Remove branding columns from studios and photographers tables
ALTER TABLE "studios" DROP COLUMN IF EXISTS "branding";
ALTER TABLE "photographers" DROP COLUMN IF EXISTS "branding";

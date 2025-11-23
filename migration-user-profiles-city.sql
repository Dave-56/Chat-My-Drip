-- Migration: Change location_country to location_city in user_profiles table
-- Run this in Supabase SQL Editor

-- Add location_city column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS location_city TEXT;

-- Migrate existing data (if any) - copy country to city
UPDATE user_profiles 
SET location_city = location_country 
WHERE location_city IS NULL AND location_country IS NOT NULL;

-- Optional: Remove location_country column after migration
-- ALTER TABLE user_profiles DROP COLUMN location_country;


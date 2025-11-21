-- Delete all fits and collections - start fresh
-- Run this in your Supabase SQL Editor

-- Delete your outfits and collections
DELETE FROM collections WHERE user_id = auth.uid();
DELETE FROM outfits WHERE user_id = auth.uid();

-- Note: If you have images stored in Supabase Storage, you may also want to delete them:
-- Go to Storage > outfits bucket > Delete files manually
-- Or use the Storage API to delete programmatically


-- ==========================================
-- VERIFY DATABASE SETUP
-- ==========================================
-- Run this to check if your tables were created successfully

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'products', 'posts', 'site_content', 'analytics')
ORDER BY table_name;

-- If the above returns 5 rows, your tables are created!
-- If it returns 0 rows, the tables don't exist yet.

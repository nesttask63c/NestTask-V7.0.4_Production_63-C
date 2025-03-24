-- Add office_room column to the teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS office_room TEXT;

-- Example data migration (uncomment after adding the column)
-- UPDATE teachers SET office_room = 'Room 101' WHERE name LIKE '%Chair%';
-- UPDATE teachers SET office_room = 'Room 201' WHERE department = 'CSE';
-- UPDATE teachers SET office_room = 'Room 301' WHERE department = 'EEE';

-- Instructions:
-- 1. Run this script using your database client or Supabase interface.
-- 2. The column will be added with NULL values initially.
-- 3. You can manually update existing teachers with their office room information.
-- 4. The example data migration statements can be customized and uncommented as needed. 
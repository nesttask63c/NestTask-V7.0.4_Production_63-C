# Database Update Scripts

This directory contains scripts for updating the database schema and data.

## Adding courseName to Routine Slots

To add the `courseName` field to the `routine_slots` table and populate it with data from the related courses, follow these steps:

### 1. Run the Migration Script

This will add the `course_name` column to the `routine_slots` table:

```bash
# Navigate to the project root
cd /path/to/project

# Install dependencies if needed
npm install

# Run the migration script
node src/scripts/run_migration.js
```

### 2. Populate Existing Slots with Course Names

After adding the column, populate it with data from related courses:

```bash
# Navigate to the project root
cd /path/to/project

# Run the population script
node src/scripts/populate_course_names.js
```

## Adding Direct Name Fields to Routine Slots

### 1. Add `courseName` and `teacherName` Fields to the Table

These fields store the course and teacher names directly in the routine_slots table:

```sql
-- Add course_name column
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS course_name TEXT;
COMMENT ON COLUMN routine_slots.course_name IS 'Direct course name for display purposes';

-- Add teacher_name column
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS teacher_name TEXT;
COMMENT ON COLUMN routine_slots.teacher_name IS 'Direct teacher name for display purposes';
```

### 2. Populate Existing Records

Update existing slots with data from related tables:

```sql
-- Update course names
UPDATE routine_slots 
SET course_name = courses.name
FROM courses
WHERE routine_slots.course_id = courses.id 
  AND (routine_slots.course_name IS NULL OR routine_slots.course_name = '');

-- Update teacher names
UPDATE routine_slots 
SET teacher_name = teachers.name
FROM teachers
WHERE routine_slots.teacher_id = teachers.id 
  AND (routine_slots.teacher_name IS NULL OR routine_slots.teacher_name = '');
```

## Verifying the Changes

After running the scripts, you can verify that:

1. The `course_name` column has been added to the `routine_slots` table
2. Existing slots with course relationships have been populated with the correct course names
3. The routine cards in the UI now display the course names

## Troubleshooting

If you encounter any issues:

- Check the console output for error messages
- Ensure your database credentials in `.env` are correct
- Verify that the Supabase service/anon key has the necessary permissions
- Check that your `courses` table contains the expected data

## Manual SQL Commands

If needed, you can run these SQL commands directly in your database:

```sql
-- Add the column
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS course_name TEXT;

-- Update existing slots
UPDATE routine_slots 
SET course_name = courses.name
FROM courses
WHERE routine_slots.course_id = courses.id AND routine_slots.course_name IS NULL;
``` 
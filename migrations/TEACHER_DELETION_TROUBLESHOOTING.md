# Teacher Deletion Troubleshooting Guide

If you're experiencing issues deleting teachers from the system, follow this troubleshooting guide to identify and resolve the problem.

## Common Issues

1. **Foreign Key Constraints**: The most common reason for deletion failures is that the teacher is still referenced by other records in the database.

2. **UI/State Issues**: Sometimes the UI doesn't properly refresh after a delete operation, making it appear that the deletion failed.

3. **Permission Issues**: The user might not have sufficient database permissions to perform delete operations.

## Step 1: Run Diagnostic Query

Run the diagnostic query in the `diagnose_teacher_delete_issues.sql` file using your database client or Supabase SQL Editor. This will identify potential issues.

## Step 2: Fix Database References

If the diagnostic shows that teachers are being referenced in the `courses` table (via `teacher_id` column):

1. Use the `fix_foreign_key_issue.sql` script to resolve this issue:
   - Open the script in your database client
   - Run the SELECT query to identify affected teachers
   - Uncomment and modify the appropriate UPDATE statement with the specific teacher ID
   - Run the script

## Step 3: Check Application Logs

Enable console logging in your browser's developer tools (F12) to see detailed error messages when attempting to delete a teacher.

## Step 4: Force Delete

If all else fails, you can manually delete the records in this order:

```sql
-- 1. First delete all course-teacher associations
DELETE FROM teacher_courses WHERE teacher_id = 'TEACHER_ID_HERE';

-- 2. Make sure all courses referencing this teacher are updated
UPDATE courses SET teacher_id = NULL WHERE teacher_id = 'TEACHER_ID_HERE';

-- 3. Delete the teacher
DELETE FROM teachers WHERE id = 'TEACHER_ID_HERE';
```

## Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Foreign key constraint fails" | Teacher is referenced in another table | Use the fix_foreign_key_issue.sql script |
| "Not found" | Teacher already deleted or ID incorrect | Refresh the teacher list and try again |
| "Permission denied" | Insufficient database privileges | Contact your database administrator |
| "Network error" | Connection issue | Check your internet connection |

## Prevention

To prevent this issue in the future:

1. Use the teacher_courses junction table for all course-teacher associations instead of direct references
2. Remove the teacher_id column from the courses table if not needed
3. Always use the application's UI for managing teacher-course relationships

## Getting Help

If you've tried these steps and still cannot delete a teacher, please collect the following information and contact support:

1. The exact error message from the console
2. The teacher ID that cannot be deleted
3. The output of the diagnostic script
4. Any recent changes to the database structure 
# Database Migrations

This directory contains SQL migration scripts to apply schema changes to the database.

## Available Migrations

- `add_office_room_field.sql`: Adds the `office_room` field to the `teachers` table

## How to Apply Migrations

### Using Supabase UI

1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the migration file you want to apply
6. Run the query

### Using Database Client

If you're using a database client like pgAdmin, DBeaver, or similar:

1. Connect to your Supabase PostgreSQL database
2. Open a new SQL query window
3. Copy and paste the contents of the migration file you want to apply
4. Execute the query

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push --db-url <YOUR_POSTGRES_URL>
```

## Important Notes

- Always back up your database before applying migrations
- Test migrations in a development environment before applying to production
- Some migrations may include commented examples that you can customize for your data 
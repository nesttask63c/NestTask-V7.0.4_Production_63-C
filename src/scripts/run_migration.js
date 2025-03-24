require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const runMigration = async () => {
  try {
    // Get the migration file path from command line args or use default
    const migrationFile = process.argv[2] || 'add_coursename_to_routine_slots.sql';
    const migrationPath = path.join(__dirname, '../db/migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`Running migration: ${migrationFile}`);
    console.log('SQL to execute:');
    console.log(sql);
    
    // Execute the SQL using Supabase's raw SQL function
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error running migration:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
};

runMigration(); 
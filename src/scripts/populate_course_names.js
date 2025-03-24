require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateCourseNames() {
  try {
    console.log('Starting to populate course names in routine slots...');
    
    // 1. Get all routine slots with course_id but without course_name
    const { data: slots, error: slotsError } = await supabase
      .from('routine_slots')
      .select('id, course_id, course_name')
      .is('course_name', null)
      .not('course_id', 'is', null);
    
    if (slotsError) {
      throw slotsError;
    }
    
    console.log(`Found ${slots.length} slots that need course names.`);
    
    if (slots.length === 0) {
      console.log('No slots need updating.');
      return;
    }
    
    // 2. Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, name');
    
    if (coursesError) {
      throw coursesError;
    }
    
    console.log(`Retrieved ${courses.length} courses for reference.`);
    
    // 3. Create a map of course IDs to names for quick lookup
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course.id] = course.name;
    });
    
    // 4. Update each slot with the course name
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const slot of slots) {
      if (!courseMap[slot.course_id]) {
        console.warn(`Course not found for ID: ${slot.course_id}, skipping slot ${slot.id}`);
        continue;
      }
      
      const { error: updateError } = await supabase
        .from('routine_slots')
        .update({ course_name: courseMap[slot.course_id] })
        .eq('id', slot.id);
      
      if (updateError) {
        console.error(`Error updating slot ${slot.id}:`, updateError);
        errorCount++;
      } else {
        updatedCount++;
        console.log(`Updated slot ${slot.id} with course name: ${courseMap[slot.course_id]}`);
      }
    }
    
    console.log('\nPopulation summary:');
    console.log(`- Total slots processed: ${slots.length}`);
    console.log(`- Successfully updated: ${updatedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error populating course names:', error);
  }
}

// Run the function
populateCourseNames()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 
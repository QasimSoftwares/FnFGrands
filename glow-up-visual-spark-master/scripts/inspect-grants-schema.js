const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectGrantsTable() {
  try {
    // Get the table structure
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'grants')
      .order('ordinal_position');

    if (error) throw error;

    console.log('Grants Table Schema:');
    console.log('-------------------');
    console.table(columns);

  } catch (error) {
    console.error('Error inspecting grants table:', error);
    process.exit(1);
  }
}

inspectGrantsTable();

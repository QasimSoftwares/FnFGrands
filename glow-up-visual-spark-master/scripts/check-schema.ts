import { createClient } from '@/lib/supabase/server';

async function checkSchema() {
  const supabase = createClient();
  
  try {
    // Check if we can connect to the database
    console.log('Checking database connection...');
    const { data: version, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('Error connecting to database:', versionError);
      return;
    }
    
    console.log('Database version:', version);
    
    // List all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('\nTables in public schema:');
      console.table(tables);
    }
    
    // Check if grants table exists
    console.log('\nChecking grants table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'grants');
    
    if (columnsError) {
      console.error('Error getting grants table structure:', columnsError);
    } else {
      console.log('\nGrants table columns:');
      console.table(columns);
    }
    
    // Check RLS policies
    console.log('\nChecking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policy')
      .select('*')
      .eq('schemaname', 'public');
    
    if (policiesError) {
      console.error('Error getting RLS policies:', policiesError);
    } else {
      console.log('\nRLS policies:');
      console.table(policies);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema();

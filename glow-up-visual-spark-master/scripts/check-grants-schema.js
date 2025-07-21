const { createClient } = require('../src/lib/supabase/client');

async function checkGrantsSchema() {
  console.log('Connecting to Supabase...');
  const supabase = createClient();
  
  try {
    // Get table information
    const { data: columns, error } = await supabase
      .rpc('get_table_info', { table_name: 'grants' });
    
    if (error) {
      console.error('Error fetching table info:', error);
      return;
    }
    
    console.log('\n=== Grants Table Schema ===');
    console.table(columns);
    
    // Check for required columns
    const requiredColumns = [
      'name', 'donor', 'type', 'category', 'amount', 'status',
      'applied_date', 'deadline', 'user_id', 'organization_id'
    ];
    
    const missingColumns = requiredColumns.filter(col => 
      !columns.some(c => c.column_name === col)
    );
    
    if (missingColumns.length > 0) {
      console.error('\n❌ Missing required columns:', missingColumns);
      console.log('\nRun this SQL to add missing columns:');
      missingColumns.forEach(col => {
        console.log(`ALTER TABLE grants ADD COLUMN ${col} ${getColumnType(col)};`);
      });
    } else {
      console.log('\n✅ All required columns exist');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

function getColumnType(columnName) {
  const types = {
    'name': 'TEXT NOT NULL',
    'donor': 'TEXT NOT NULL',
    'type': 'TEXT NOT NULL',
    'category': 'TEXT NOT NULL',
    'amount': 'NUMERIC(12, 2) NOT NULL',
    'status': 'TEXT NOT NULL',
    'applied_date': 'TIMESTAMP WITH TIME ZONE NOT NULL',
    'deadline': 'TIMESTAMP WITH TIME ZONE NOT NULL',
    'user_id': 'UUID NOT NULL REFERENCES auth.users(id)',
    'organization_id': 'TEXT NOT NULL'
  };
  
  return types[columnName] || 'TEXT';
}

// Run the check
checkGrantsSchema();

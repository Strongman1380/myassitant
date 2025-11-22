import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('Testing Supabase connection...');

  // 1. Try to select
  console.log('1. Selecting from memories...');
  const { data: selectData, error: selectError } = await supabase
    .from('memories')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('❌ Select Error:', selectError);
  } else {
    console.log('✅ Select Success. Count:', selectData.length);
    if (selectData.length > 0) {
        console.log('Sample memory:', selectData[0]);
    }
  }

  // 2. Try to insert
  console.log('\n2. Inserting test memory...');
  const testMemory = {
    content: 'Test memory from script',
    raw_input: 'Test input',
    category: 'general',
    is_active: true
  };

  const { data: insertData, error: insertError } = await supabase
    .from('memories')
    .insert([testMemory])
    .select();

  if (insertError) {
    console.error('❌ Insert Error:', insertError);
  } else {
    console.log('✅ Insert Success:', insertData);
    
    // Clean up
    if (insertData && insertData[0]?.id) {
        console.log('\n3. Cleaning up test memory...');
        const { error: deleteError } = await supabase
            .from('memories')
            .delete()
            .eq('id', insertData[0].id);
            
        if (deleteError) console.error('❌ Delete Error:', deleteError);
        else console.log('✅ Cleanup Success');
    }
  }
}

testSupabase();

// Quick test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfjsfkspoglmvptuqkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmanNma3Nwb2dsbXZwdHVxa29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzODQsImV4cCI6MjA4NjA3NDM4NH0.K416SGJutC1u4Ly4WWh0LHK6icbapXDGYX3wFInTbZQ';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');

    // Test connection
    const { data, error } = await supabase.from('site_content').select('id').limit(1);

    if (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('Error details:', error);
    } else {
        console.log('✅ Connection test successful!');
        console.log('Data:', data);
    }
} catch (err) {
    console.error('❌ Error creating client or testing connection:', err);
}

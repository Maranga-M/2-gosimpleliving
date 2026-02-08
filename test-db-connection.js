
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dldsyczovljulozeeilk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZHN5Y3pvdmxqdWxvemVlaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjc5NDIsImV4cCI6MjA4NDk0Mzk0Mn0.L-T3_Rrqs9qMV43PZzwZsKudnQcY7VVQNzMkQr3dqXk';

async function testConnection() {
    console.log('Testing connection to Supabase...');
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('site_content').select('id').limit(1);

        if (error) {
            console.error('Connection failed:', error.message);
        } else {
            console.log('Connection successful!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

testConnection();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfjsfkspoglmvptuqkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmanNma3Nwb2dsbXZwdHVxa29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzODQsImV4cCI6MjA4NjA3NDM4NH0.K416SGJutC1u4Ly4WWh0LHK6icbapXDGYX3wFInTbZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
    console.log('🔍 Checking for admin user...');

    const email = 'bernardmaranga4@gmail.com';

    // Check profiles table (publicly readable via RLS usually)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('❌ Error querying profiles:', error);
    } else if (profiles && profiles.length > 0) {
        console.log('✅ Admin user FOUND in profiles table:', profiles[0]);
    } else {
        console.log('❌ Admin user NOT FOUND in profiles table.');
        console.log('   (This is likely why login fails if the app expects a profile)');
    }
}

checkAdmin();

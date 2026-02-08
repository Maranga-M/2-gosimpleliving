
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfjsfkspoglmvptuqkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmanNma3Nwb2dsbXZwdHVxa29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzODQsImV4cCI6MjA4NjA3NDM4NH0.K416SGJutC1u4Ly4WWh0LHK6icbapXDGYX3wFInTbZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('🔐 Testing Admin Login...');
    const email = 'bernardmaranga4@gmail.com';
    const password = 'gmumbi1234567890';

    console.log(`Attempting login for: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login FAILED:', error);
        console.error('Error message:', error.message);
    } else {
        console.log('✅ Login SUCCESS!');
        console.log('User ID:', data.user.id);

        // Now try to fetch the profile like the app does
        console.log('🔍 Fetching profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile fetch FAILED:', profileError);
        } else {
            console.log('✅ Profile fetch SUCCESS:', profile);
        }
    }
}

testLogin();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfjsfkspoglmvptuqkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmanNma3Nwb2dsbXZwdHVxa29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzODQsImV4cCI6MjA4NjA3NDM4NH0.K416SGJutC1u4Ly4WWh0LHK6icbapXDGYX3wFInTbZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('🔍 Verifying database tables...');

    // 1. Check site_content
    const { data: content, error: contentError } = await supabase.from('site_content').select('id').limit(1);
    if (contentError) console.error('❌ site_content table: MISSING or ERROR', contentError.message);
    else console.log('✅ site_content table: OK');

    // 2. Check products
    const { data: products, error: productsError } = await supabase.from('products').select('id').limit(1);
    if (productsError) console.error('❌ products table: MISSING or ERROR', productsError.message);
    else console.log('✅ products table: OK');

    // 3. Check posts
    const { data: posts, error: postsError } = await supabase.from('posts').select('id').limit(1);
    if (postsError) console.error('❌ posts table: MISSING or ERROR', postsError.message);
    else console.log('✅ posts table: OK');

    // 4. Check profiles (needs auth usually, but RLS might allow read)
    // We'll try to select, might fail if RLS is strict, but "relation does not exist" is different from "permission denied"
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').limit(1);

    if (profilesError) {
        if (profilesError.message.includes('permission denied')) {
            console.log('✅ profiles table: EXISTS (Permission Denied - expected for anon)');
        } else {
            console.error('❌ profiles table: MISSING or ERROR', profilesError.message);
        }
    } else {
        console.log('✅ profiles table: OK');
    }

    // 5. Check analytics
    const { error: analyticsError } = await supabase.from('analytics').select('id').limit(1);
    if (analyticsError) console.error('❌ analytics table: MISSING or ERROR', analyticsError.message);
    else console.log('✅ analytics table: OK');

}

verifyTables();

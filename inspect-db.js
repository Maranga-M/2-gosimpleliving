import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfjsfkspoglmvptuqkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmanNma3Nwb2dsbXZwdHVxa29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzODQsImV4cCI6MjA4NjA3NDM4NH0.K416SGJutC1u4Ly4WWh0LHK6icbapXDGYX3wFInTbZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: products } = await supabase.from('products').select('id, name').limit(1);
    const { data: posts } = await supabase.from('posts').select('id, slug').limit(1);
    console.log('Products:', products);
    console.log('Posts:', posts);
}

inspect();

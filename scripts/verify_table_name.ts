
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('Verifying table names...');

    // Custom check for 'posts'
    const { data: postsData, error: postsError } = await supabase.from('posts').select('count').limit(1);

    // Custom check for 'blog_posts'
    const { data: blogPostsData, error: blogPostsError } = await supabase.from('blog_posts').select('count').limit(1);

    console.log('--- Results ---');
    console.log(`'posts' table check: ${postsError ? 'FAILED (' + postsError.message + ')' : 'SUCCESS'}`);
    console.log(`'blog_posts' table check: ${blogPostsError ? 'FAILED (' + blogPostsError.message + ')' : 'SUCCESS'}`);

    if (!postsError) {
        // Double check schema of 'posts'
        const { error: heroError } = await supabase.from('posts').select('hero_image_url').limit(1);
        console.log(`'posts' has 'hero_image_url' column: ${heroError ? 'NO (' + heroError.message + ')' : 'YES'}`);

        const { error: compError } = await supabase.from('posts').select('comparison_tables').limit(1);
        console.log(`'posts' has 'comparison_tables' column: ${!compError ? 'YES' : 'NO'}`);
    }
}

verifyTables().catch(console.error);

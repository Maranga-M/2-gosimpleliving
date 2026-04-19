import * as dotenv from 'dotenv';
dotenv.config();

console.log('Testing Supabase Connection...');
console.log('URL:', process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);

// Need to import after dotenv config
import { supabase } from '../supabase/config';

async function testConnection() {
    if (!supabase) {
        console.error('Supabase client is null!');
        return;
    }

    try {
        console.log('Fetching products...');
        const { data: products, error: pError } = await supabase.from('products').select('*').limit(1);
        if (pError) console.error('Products Error:', pError);
        else console.log('Products OK:', products?.length);

        console.log('Fetching site_content...');
        const { data: content, error: cError } = await supabase.from('site_content').select('*').limit(1);
        if (cError) console.error('Site Content Error:', cError);
        else console.log('Site Content OK:', content?.length);

        console.log('Fetching posts...');
        const { data: posts, error: poError } = await supabase.from('posts').select('*').limit(1);
        if (poError) console.error('Posts Error:', poError);
        else console.log('Posts OK:', posts?.length);

    } catch (e) {
        console.error('Exception entirely:', e);
    }
}

testConnection();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log("Testing Supabase Connection...");
console.log("URL:", supabaseUrl ? "Defined" : "MISSING");
console.log("Key:", supabaseKey ? "Defined" : "MISSING");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log("Fetching site_content...");
        const start = Date.now();
        const { data, error } = await supabase.from('site_content').select('*').limit(1);
        const end = Date.now();
        console.log(`Fetch took ${end - start}ms`);

        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Connection Successful! Data:", data);
        }
    } catch (e) {
        console.error("Unexpected Error:", e);
    }
}

testConnection();

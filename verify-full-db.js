
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://yfjsfkspoglmvptuqkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmanNma3Nwb2dsbXZwdHVxa29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzODQsImV4cCI6MjA4NjA3NDM4NH0.K416SGJutC1u4Ly4WWh0LHK6icbapXDGYX3wFInTbZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    const results = [];
    console.log('🔍 Verifying database tables...');

    const tables = ['site_content', 'products', 'posts', 'profiles', 'analytics'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                results.push({ table, status: 'ERROR', message: error.message, code: error.code });
                console.error(`❌ ${table} table:`, error.message);
            } else {
                results.push({ table, status: 'OK', data: data?.[0] || 'EMPTY' });
                console.log(`✅ ${table} table: OK`);
            }
        } catch (e) {
            results.push({ table, status: 'EXCEPTION', message: e.message });
            console.error(`💥 ${table} exception:`, e.message);
        }
    }

    fs.writeFileSync('diagnostic_results.json', JSON.stringify(results, null, 2));
    console.log('✅ Diagnostics complete. Results saved to diagnostic_results.json');
}

verifyTables();

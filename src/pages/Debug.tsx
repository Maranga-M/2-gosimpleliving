
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/config';

export default function DebugPage() {
    const [status, setStatus] = useState<any>({ loading: true });
    const [envVars, setEnvVars] = useState<any>({});

    useEffect(() => {
        // Check Env Vars (Masked)
        const checkEnv = (key: string) => {
            const val = import.meta.env[key] || "UNDEFINED";
            if (!val || val === "UNDEFINED") return "MISSING";
            return val.substring(0, 10) + "...";
        };

        setEnvVars({
            VITE_SUPABASE_URL: checkEnv('VITE_SUPABASE_URL'),
            VITE_SUPABASE_ANON_KEY: checkEnv('VITE_SUPABASE_ANON_KEY'),
            NEXT_PUBLIC_SUPABASE_URL: checkEnv('NEXT_PUBLIC_SUPABASE_URL'),
            NEXT_PUBLIC_SUPABASE_ANON_KEY: checkEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
            MODE: import.meta.env.MODE,
            BASE_URL: import.meta.env.BASE_URL
        });

        // Test Connection
        async function testConn() {
            try {
                const { data, error } = await supabase.from('site_content').select('id').limit(1);
                setStatus({ success: !error, error: error?.message, data });
            } catch (e: any) {
                setStatus({ success: false, error: e.message });
            }
        }
        testConn();
    }, []);

    return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
            <h1>Vercel Debugger</h1>
            <h2>Environment Variables</h2>
            <pre>{JSON.stringify(envVars, null, 2)}</pre>

            <h2>Connection Test</h2>
            <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>
    );
}

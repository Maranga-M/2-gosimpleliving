const fs = require('fs');
let c = fs.readFileSync('supabase/service.ts', 'utf8');

// Aggressive cleanup
c = c.replace(/const cached = getFromCache\(CACHE_KEYS\.[a-zA-Z]+\);[\s\S]*?if \(cached\) \{[\s\S]*?return cached;\s*\}/g, '');
c = c.replace(/saveToCache\(CACHE_KEYS\.[a-zA-Z]+,\s*[a-zA-Z_]+\);/g, '');
c = c.replace(/const result = await withRetry\(async \(\) => \{([\s\S]*?)\}(?:,\s*\d+)?\);/g, 'const result = await (async () => {})();');
c = c.replace(/localStorage\.removeItem\(CACHE_KEYS\.[a-zA-Z]+\);/g, '');

fs.writeFileSync('supabase/service.ts', c);

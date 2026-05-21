import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that reads verification meta tags from a JSON config file
 * and injects them into index.html at build time.
 * 
 * This solves the SPA crawler problem: Pinterest, Google, and Bing
 * verification bots don't execute JavaScript, so meta tags injected
 * by React are invisible to them. This plugin bakes them into the
 * static HTML during `vite build`.
 * 
 * Config file: meta-tags.json (project root)
 * Format:
 * {
 *   "p:domain_verify": "your-pinterest-code",
 *   "google-site-verification": "your-google-code",
 *   "msvalidate.01": "your-bing-code",
 *   "facebook-domain-verification": "your-facebook-code"
 * }
 */
export default function metaInjectPlugin(): Plugin {
  return {
    name: 'vite-meta-inject',
    transformIndexHtml(html) {
      const configPath = path.resolve(__dirname, '..', 'meta-tags.json');

      let tags: Record<string, string> = {};
      try {
        if (fs.existsSync(configPath)) {
          tags = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
      } catch {
        // If file doesn't exist or is invalid, skip injection
        return html;
      }

      const metaStrings = Object.entries(tags)
        .filter(([, value]) => value && value.trim().length > 0)
        .map(([name, content]) => {
          // If user pasted a full <meta> tag, extract just the content value
          const contentMatch = content.match(/content=["']([^"']+)["']/);
          const cleanContent = contentMatch ? contentMatch[1] : content.trim();
          return `    <meta name="${name}" content="${cleanContent}" />`;
        })
        .join('\n');

      if (!metaStrings) return html;

      // Inject right before </head>
      return html.replace('</head>', `\n    <!-- Site Verification Meta Tags -->\n${metaStrings}\n  </head>`);
    },
  };
}

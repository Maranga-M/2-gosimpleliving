import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ComparisonTable as ComparisonTableType } from '../types';
import { ComparisonTable } from './ComparisonTable';

import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    tables?: ComparisonTableType[];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, tables }) => {
    // Ensure content is a string
    const safeContent = content || '';

    // Ensure tables is an array (handle null from DB)
    const safeTables = tables || [];

    // Check if content is HTML (from TipTap editor)
    const isHTML = safeContent.trim().startsWith('<') || safeContent.includes('<p>') || safeContent.includes('<h') || safeContent.includes('<ul') || safeContent.includes('<ol') || safeContent.includes('<blockquote');

    // Split content by the shortcode {{table:ID}}
    // The regex captures the ID so we can identify it
    const parts = safeContent.split(/{{table:(.*?)}}/g);

    return (
        <div className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 leading-relaxed">
            {parts.map((part, index) => {
                const table = safeTables.find(t => t.id === part);

                if (table && index % 2 === 1) {
                    return (
                        <div key={`table-${table.id}-${index}`} className="not-prose my-8">
                            <ComparisonTable table={table} />
                        </div>
                    );
                }

                if (index % 2 === 1) {
                    return null;
                }

                if (!part.trim()) return null;

                // If content is HTML from TipTap, render with matching editor styles
                if (isHTML) {
                    return (
                        <React.Fragment key={index}>
                            <div
                                className="blog-content"
                                dangerouslySetInnerHTML={{ __html: part }}
                            />
                            <style dangerouslySetInnerHTML={{ __html: `
                                .blog-content h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: #0f172a; }
                                .dark .blog-content h1 { color: #f1f5f9; }
                                .blog-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #0f172a; }
                                .dark .blog-content h2 { color: #f1f5f9; }
                                .blog-content h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #0f172a; }
                                .dark .blog-content h3 { color: #f1f5f9; }
                                .blog-content p { margin-bottom: 1rem; line-height: 1.7; color: #334155; }
                                .dark .blog-content p { color: #cbd5e1; }
                                .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                                .blog-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                                .blog-content li { margin-bottom: 0.35rem; line-height: 1.6; color: #475569; }
                                .dark .blog-content li { color: #94a3b8; }
                                .blog-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; font-style: italic; margin-bottom: 1rem; color: #64748b; }
                                .dark .blog-content blockquote { border-left-color: #334155; color: #94a3b8; }
                                .blog-content code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
                                .dark .blog-content code { background: #1e293b; }
                                .blog-content pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
                                .blog-content pre code { background: transparent; padding: 0; color: #e2e8f0; }
                                .blog-content a { color: #2563eb; text-decoration: underline; }
                                .dark .blog-content a { color: #60a5fa; }
                                .blog-content img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
                                .blog-content hr { border-color: #e2e8f0; margin: 1.5rem 0; }
                                .dark .blog-content hr { border-color: #334155; }
                                .blog-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                                .blog-content th, .blog-content td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
                                .dark .blog-content th, .dark .blog-content td { border-color: #334155; }
                                .blog-content th { background: #f8fafc; font-weight: 600; }
                                .dark .blog-content th { background: #1e293b; }
                            `}} />
                        </React.Fragment>
                    );
                }

                // Otherwise render as markdown
                return (
                    <ReactMarkdown
                        key={index}
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                    >
                        {part}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
};

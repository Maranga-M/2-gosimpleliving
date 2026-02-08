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

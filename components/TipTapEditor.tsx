import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';
import {
    Bold, Italic, Underline as UnderlineIcon,
    Heading1, Heading2, List, ListOrdered,
    Link as LinkIcon, Link2, Quote,
    Undo, Redo, Eraser, Strikethrough,
    AlignCenter, AlignLeft, AlignRight, Minus,
    Palette, Highlighter
} from 'lucide-react';

interface TipTapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    onOpenLinkPicker?: (editor: any) => void;
    minHeight?: string;
    comparisonTables?: any[];
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
    value,
    onChange,
    placeholder = 'Start writing...',
    className = '',
    label,
    onOpenLinkPicker,
    minHeight = '300px',
    comparisonTables
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer',
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
            Markdown.configure({
                html: true, // Enable HTML for color spans
                tightLists: true,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            // Use the markdown extension to get markdown output
            const markdown = (editor.storage as any)?.markdown?.getMarkdown?.() || '';
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 min-h-[${minHeight}]`,
                style: `min-height: ${minHeight};`,
            },
        },
    });

    // Update editor content if value changed externally (e.g. AI generation)
    useEffect(() => {
        if (editor && value !== (editor.storage as any)?.markdown?.getMarkdown?.()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return <div className="p-4 border rounded-lg animate-pulse bg-slate-50 italic text-slate-400">Loading editor...</div>;
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        disabled = false,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-md transition-all ${isActive
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/50 ${className}`}>
            {label && (
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strike-through"
                >
                    <Strikethrough size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                <div className="flex items-center gap-0.5 px-1 group relative">
                    <ToolbarButton
                        onClick={() => { }}
                        isActive={editor.isActive('textStyle', { color: editor.getAttributes('textStyle').color })}
                        title="Text Color"
                    >
                        <Palette size={18} style={{ color: editor.getAttributes('textStyle').color }} />
                    </ToolbarButton>
                    <div className="hidden group-hover:flex absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 flex-wrap gap-1 w-32">
                        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#0f172a'].map(color => (
                            <button
                                key={color}
                                onClick={() => editor.chain().focus().setColor(color).run()}
                                className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        <button
                            onClick={() => editor.chain().focus().unsetColor().run()}
                            className="w-full text-[10px] font-bold py-1 bg-slate-100 dark:bg-slate-700 rounded"
                        >Reset</button>
                    </div>
                </div>

                <div className="flex items-center gap-0.5 px-1 group relative">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        isActive={editor.isActive('highlight')}
                        title="Highlight"
                    >
                        <Highlighter size={18} />
                    </ToolbarButton>
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                <ToolbarButton
                    onClick={() => {
                        const url = prompt('Enter URL:');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    isActive={editor.isActive('link')}
                    title="External Link"
                >
                    <LinkIcon size={18} />
                </ToolbarButton>

                {onOpenLinkPicker && (
                    <ToolbarButton
                        onClick={() => {
                            onOpenLinkPicker(editor);
                        }}
                        title="Internal Link"
                    >
                        <Link2 size={18} className="text-amber-500" />
                    </ToolbarButton>
                )}

                <div className="flex-grow" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >
                    <Minus size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                    title="Clear Formatting"
                >
                    <Eraser size={18} />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <div className="bg-white dark:bg-slate-900/50">
                <EditorContent editor={editor} />
            </div>

            {/* Footer / Stats */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <div>
                    {((editor.storage as any)?.markdown?.getMarkdown?.() || '').length} chars | {((editor.storage as any)?.markdown?.getMarkdown?.() || '').split(/\s+/).filter(Boolean).length} words
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Rich Text Active</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #94a3b8;
                    pointer-events: none;
                    height: 0;
                }
                .tiptap {
                    outline: none !important;
                    min-height: inherit;
                }
                /* Manual Prose Fallback */
                .tiptap h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; }
                .tiptap h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; }
                .tiptap h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                .tiptap p { margin-bottom: 1rem; line-height: 1.6; }
                .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                .tiptap blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; font-style: italic; margin-bottom: 1rem; }
                .dark .tiptap blockquote { border-left-color: #334155; }
                .tiptap code { background: #f1f5f9; padding: 0.2rem 0.4rem; rounded: 0.25rem; font-family: monospace; }
                .dark .tiptap code { background: #1e293b; }
            `}} />
        </div>
    );
};

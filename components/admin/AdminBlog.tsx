
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Copy, FileText, Sparkles, Loader2, Wand2, Search, ArrowLeft, Image as ImageIcon, Link as LinkIcon, List, TrendingUp } from 'lucide-react';
import { BlogPost, Product, Role } from '../../types';
import { Button } from '../Button';
import { MediaManager } from '../MediaManager';
import { TipTapEditor } from '../TipTapEditor';
import { ComparisonTableBuilder } from '../ComparisonTableBuilder';
import { generateBlogPost } from '../../services/geminiService';
import toast from 'react-hot-toast';

interface AdminBlogProps {
    blogPosts: BlogPost[];
    products: Product[];
    onAddBlogPost: (post: BlogPost) => void;
    onUpdateBlogPost: (post: BlogPost) => void;
    onDeleteBlogPost: (id: string) => void;
    onDuplicateBlogPost: (id: string) => void;
    currentUserRole: Role;
    currentUserName?: string;
    initialPostState: BlogPost;
    handleOpenLinkPicker: (type: string, editor: any) => void;
}

export const AdminBlog: React.FC<AdminBlogProps> = ({
    blogPosts,
    products,
    onAddBlogPost,
    onUpdateBlogPost,
    onDeleteBlogPost,
    onDuplicateBlogPost,
    currentUserRole,
    currentUserName,
    initialPostState,
    handleOpenLinkPicker
}) => {
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [isGeneratingPost, setIsGeneratingPost] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const startAddPost = () => {
        setEditingPost({ ...initialPostState, id: `b-${Date.now()}` });
    };

    const startEditPost = (post: BlogPost) => {
        setEditingPost({ ...post });
    };

    const handleCancelEditPost = () => {
        setEditingPost(null);
    };

    const handlePostFormChange = (field: keyof BlogPost, value: any) => {
        if (editingPost) {
            setEditingPost({ ...editingPost, [field]: value });
        }
    };

    const handleToggleProductLink = (productId: string) => {
        if (!editingPost) return;
        const currentLinks = editingPost.linkedProductIds;
        const newLinks = currentLinks.includes(productId)
            ? currentLinks.filter(id => id !== productId)
            : [...currentLinks, productId];
        handlePostFormChange('linkedProductIds', newLinks);
    };

    const handleSavePost = (status: 'draft' | 'published') => {
        if (!editingPost || !editingPost.title) {
            toast.error("Post title is required.");
            return;
        }
        const finalPost = { ...editingPost, status };
        if (blogPosts.some(p => p.id === finalPost.id)) {
            onUpdateBlogPost(finalPost);
        } else {
            onAddBlogPost(finalPost);
        }
        setEditingPost(null);
    };

    const handleGeneratePostContent = async () => {
        if (!editingPost?.title) {
            toast.error("Please enter a title first.");
            return;
        }
        setIsGeneratingPost(true);
        try {
            const result = await generateBlogPost(editingPost.title, products);
            setEditingPost(prev => prev ? ({ ...prev, ...result }) : null);
            toast.success("AI Content Generated!");
        } catch (e) {
            toast.error("Failed to generate content.");
        } finally {
            setIsGeneratingPost(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-bold">Published</span>;
            case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 font-bold">Pending</span>;
            default: return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold">Draft</span>;
        }
    };

    const filteredPosts = blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-300">
            {editingPost ? (
                // FORM VIEW
                <div>
                    <button onClick={handleCancelEditPost} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6"><ArrowLeft size={14} /> Back to Posts</button>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{(editingPost.id && blogPosts.some(p => p.id === editingPost.id)) ? 'Edit Post' : 'Create New Post'}</h2>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label><input type="text" value={editingPost.title} onChange={e => handlePostFormChange('title', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Author</label><input type="text" value={editingPost.author} onChange={e => handlePostFormChange('author', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Publish Date</label><input type="date" value={editingPost.date} onChange={e => handlePostFormChange('date', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" /></div>
                            
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Featured Image</label>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <MediaManager
                                        currentImageUrl={editingPost.image}
                                        onImageSelect={(url) => handlePostFormChange('image', url)}
                                    />
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-semibold text-slate-500 mb-2">Or enter URL manually</label>
                                        <input
                                            type="text"
                                            value={editingPost.image}
                                            onChange={e => handlePostFormChange('image', e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Excerpt</label><textarea value={editingPost.excerpt} onChange={e => handlePostFormChange('excerpt', e.target.value)} className="w-full h-24 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none dark:text-white" /></div>

                            {/* SEO Metadata Section */}
                            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                                    <TrendingUp size={16} /> SEO Optimization
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                            Meta Title <span className="text-slate-400">({(editingPost.metaTitle || '').length}/60)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editingPost.metaTitle || ''}
                                            onChange={e => handlePostFormChange('metaTitle', e.target.value)}
                                            maxLength={60}
                                            placeholder="SEO title for search engines"
                                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                            Focus Keyword
                                        </label>
                                        <input
                                            type="text"
                                            value={editingPost.focusKeyword || ''}
                                            onChange={e => handlePostFormChange('focusKeyword', e.target.value)}
                                            placeholder="Primary keyword to rank for"
                                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Meta Description <span className="text-slate-400">({(editingPost.metaDescription || '').length}/160)</span>
                                    </label>
                                    <textarea
                                        value={editingPost.metaDescription || ''}
                                        onChange={e => handlePostFormChange('metaDescription', e.target.value)}
                                        maxLength={160}
                                        rows={2}
                                        placeholder="Brief description for search results (160 chars max)"
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm dark:text-white resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Meta Keywords <span className="text-slate-400">(comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingPost.metaKeywords || ''}
                                        onChange={e => handlePostFormChange('metaKeywords', e.target.value)}
                                        placeholder="keyword1, keyword2, keyword3"
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Content (Markdown)</label>
                                <TipTapEditor
                                    key={`blog-content-${editingPost.id}`}
                                    value={editingPost.content}
                                    onChange={val => handlePostFormChange('content', val)}
                                    onOpenLinkPicker={(editor) => handleOpenLinkPicker('tiptap', editor)}
                                    comparisonTables={editingPost.comparisonTables || []}
                                    minHeight="400px"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Hero Image */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><ImageIcon size={18} className="text-blue-500" /> Hero Banner Image</h3>
                                <MediaManager currentImageUrl={editingPost.heroImageUrl || ''} onImageSelect={(url) => handlePostFormChange('heroImageUrl', url)} />
                                <p className="mt-2 text-[10px] text-slate-400 italic">Optional large banner image (displays above regular image).</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Sparkles size={18} className="text-purple-500" /> AI Tools</h3>
                                <Button onClick={handleGeneratePostContent} disabled={isGeneratingPost} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                    {isGeneratingPost ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="mr-2" />}
                                    {isGeneratingPost ? 'Generating...' : 'AI Generate Content'}
                                </Button>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><LinkIcon size={18} className="text-blue-500" /> Link Products</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {products.map(p => (
                                        <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                                            <input type="checkbox" checked={editingPost.linkedProductIds.includes(p.id)} onChange={() => handleToggleProductLink(p.id)} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                                            <img src={p.image} className="w-8 h-8 rounded-md object-cover" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{p.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Comparison Tables Builder */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><List size={18} className="text-teal-500" /> Comparison Tables</h3>
                                <ComparisonTableBuilder
                                    tables={editingPost.comparisonTables || []}
                                    products={products}
                                    onChange={(tables) => handlePostFormChange('comparisonTables', tables)}
                                />
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Save size={18} className="text-green-500" /> Actions</h3>
                                <div className="flex flex-col gap-3">
                                    <Button variant="outline" onClick={() => handleSavePost('draft')}>Save Draft</Button>
                                    {currentUserRole === 'admin' && <Button onClick={() => handleSavePost('published')}>Publish</Button>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // LIST VIEW
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search blog posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
                            />
                        </div>
                        <Button size="sm" onClick={startAddPost} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"><Plus size={16} /> Create New Post</Button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Title & Author</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredPosts.map(post => (
                                        <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                                            <td className="px-6 py-4"><div className="font-bold text-slate-900 dark:text-white">{post.title}</div><div className="text-xs text-slate-500">{post.author}</div></td>
                                            <td className="px-6 py-4">{post.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {post.status === 'draft' && currentUserRole === 'admin' && (
                                                        <Button size="sm" variant="ghost" onClick={() => onUpdateBlogPost({ ...post, status: 'published' })} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Publish</Button>
                                                    )}
                                                    {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
                                                        <button onClick={() => onDuplicateBlogPost(post.id)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Duplicate"><Copy size={18} /></button>
                                                    )}
                                                    <button onClick={() => startEditPost(post)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={18} /></button>
                                                    <button
                                                        onClick={() => onDeleteBlogPost(post.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPosts.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                No blog posts found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

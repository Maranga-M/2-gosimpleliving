
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, TrendingUp, Sparkles, Loader2, List, Globe, Palette, Calendar, RefreshCw, Users as UsersIcon, Settings, Database, Shield, Wand2, Megaphone, Trash, Tag, Search, Copy, ArrowLeft, Wifi, WifiOff, PackagePlus, Eye, LinkIcon, CloudUpload, FileText, AlertTriangle, Package, ExternalLink, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product, SiteContent, BlogPost, CustomPage, Role, ThemeColor, Season, SocialPlatform } from '../types';
import { AFFILIATE_THEMES } from '../themeConfig';
import { connectionManager, ConnectionStatus } from '../services/connectionManager';
import { Button } from './Button';
import { generateSiteContent, fetchProductFromWeb, generateBlogPost, generateCustomPage } from '../services/geminiService';
import { validateProduct } from '../src/utils/validators';
import { MediaManager } from './MediaManager';
import { ComparisonTableBuilder } from './ComparisonTableBuilder';
import { dbService } from '../services/database';
import { PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT } from '../constants';
import { UserManagement } from './UserManagement';
import { AdminSettings } from './AdminSettings';
import { StarRating } from './StarRating';
import { LinkPickerModal } from './LinkPickerModal';
import { TipTapEditor } from './TipTapEditor';
import { AdminOffers } from './AdminOffers';
import { AffiliateConfigTab } from './AffiliateConfigTab';




interface AdminDashboardProps {
    products: Product[];
    blogPosts: BlogPost[];
    categories: string[];
    liveSiteContent: SiteContent;
    currentUserRole: Role;
    currentUserName?: string;
    onAddProduct: (product: Product) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onDuplicateProduct: (id: string) => void;
    onStartPreview: (draftContent: SiteContent) => void;
    onUpdateSiteContent?: (content: SiteContent) => void;
    onSaveChanges?: (content: SiteContent) => Promise<void>;
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
    onAddBlogPost: (post: BlogPost) => void;
    onUpdateBlogPost: (post: BlogPost) => void;
    onDeleteBlogPost: (id: string) => void;
    onDuplicateBlogPost: (id: string) => void;
    initialTab?: 'products' | 'content' | 'theme' | 'users' | 'config';
    dbStatus: ConnectionStatus;
    isUsingFallback: boolean;
    onRefresh?: () => Promise<void>;
    lastError?: string | null;
    onSeed?: (products: Product[], posts: BlogPost[], content: SiteContent) => Promise<void>;
}

interface ProductRowProps {
    product: Product;
    currentUserRole: Role;
    onDuplicate: (id: string) => void;
    onEdit: (product: Product) => void;
    onDelete: (id: string, title: string) => void;
    getStatusBadge: (status: string) => React.ReactNode;
}

const ProductRow = React.memo(({ product, currentUserRole, onDuplicate, onEdit, onDelete, getStatusBadge }: ProductRowProps) => {
    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src={product.image} alt={product.title} loading="lazy" className="w-10 h-10 rounded-md object-cover bg-white" />
                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-xs">{product.title}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">${product.price.toFixed(2)}</td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                    {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
                        <button onClick={() => onDuplicate(product.id)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Duplicate"><Copy size={18} /></button>
                    )}
                    <button onClick={() => onEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={18} /></button>
                    <button
                        onClick={() => onDelete(product.id, product.title)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

// New Custom Confirmation Modal to solve INP issues
interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-8">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white border-none">Confirm Delete</Button>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    products,
    blogPosts,
    categories,
    liveSiteContent,
    currentUserRole,
    currentUserName = 'Admin',
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct,
    onDuplicateProduct,
    onStartPreview,
    onAddCategory,
    onDeleteCategory,
    onAddBlogPost,
    onUpdateBlogPost,
    onDeleteBlogPost,
    onDuplicateBlogPost,
    initialTab = 'products',
    onUpdateSiteContent: _onUpdateSiteContent,
    onSaveChanges,
    dbStatus,
    isUsingFallback,
    onRefresh,
    onSeed,
    lastError
}) => {
    const [activeTab, setActiveTab] = useState<'products' | 'content' | 'theme' | 'users' | 'config' | 'settings' | 'pages' | 'offers' | 'affiliate-config'>(initialTab as any);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'product' | 'post' | 'page' | 'all-products', title: string, message: string } | null>(null);

    // Page state
    const [editingPage, setEditingPage] = useState<Partial<CustomPage> | null>(null);
    const [isGeneratingPage, setIsGeneratingPage] = useState(false);
    const linkPickerTargetRef = useRef<any>(null);


    // Link picker state
    const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
    const [linkPickerTarget, setLinkPickerTarget] = useState<{
        type: 'textarea' | 'tiptap',
        target: React.RefObject<HTMLTextAreaElement | null> | any
    } | null>(null);


    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const initialFormState: Product = {
        id: '',
        title: '',
        category: categories[1] || 'Electronics',
        price: 0,
        rating: 0,
        reviews: 0,
        image: '',
        description: '',
        features: [],
        affiliateLink: '#',
        localReviews: [],
        clicks: 0,
        status: 'draft',
        isBestSeller: false,
        additionalAffiliateLinks: []
    };
    const [formData, setFormData] = useState<Product>(initialFormState);

    // --- Theme/Content State ---
    const [draftContent, setDraftContent] = useState<SiteContent>(liveSiteContent);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Blog State ---
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [isGeneratingPost, setIsGeneratingPost] = useState(false);

    // --- Connection Diagnostics State ---
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
    const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);

    const handleTestConnection = async () => {
        setDiagnosticsLoading(true);
        setShowDiagnostics(true);
        try {
            const result = await dbService.testConnectionDetailed();
            setDiagnosticsResult(result);
            if (result.success) {
                toast.success('Connection test passed!');
            } else {
                toast.error('Connection test failed');
            }
        } catch (e: any) {
            setDiagnosticsResult({
                success: false,
                errorType: 'unknown',
                errorMessage: e?.message || 'Failed to run diagnostics'
            });
        } finally {
            setDiagnosticsLoading(false);
        }
    };

    const initialPostState: BlogPost = {
        id: '',
        title: '',
        excerpt: '',
        content: '',
        author: currentUserName,
        date: new Date().toLocaleDateString('en-CA'),
        image: 'https://picsum.photos/id/101/800/400',
        status: 'draft',
        linkedProductIds: []
    };

    const startAddPost = () => {
        setEditingPost({ ...initialPostState, id: `b-${Date.now()}` });
    };

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        // Clear all editing states to prevent leakage between sections
        setEditingPost(null);
        setEditingPage(null);
        setEditingId(null);
        setIsAdding(false);
        setIsBulkImporting(false);
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


    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;

        if (deleteConfirm.type === 'product') {
            onDeleteProduct(deleteConfirm.id);
            toast.success(`Product deleted.`);
        } else if (deleteConfirm.type === 'post') {
            onDeleteBlogPost(deleteConfirm.id);
            toast.success(`Blog post deleted.`);
        } else if (deleteConfirm.type === 'page') {
            const currentPages = liveSiteContent.customPages || [];
            const newPages = currentPages.filter(p => p.id !== deleteConfirm.id);
            const updatedContent = { ...liveSiteContent, customPages: newPages };

            // Update local state first
            _onUpdateSiteContent?.(updatedContent);

            // Then persist to database
            if (onSaveChanges) {
                try {
                    await onSaveChanges(updatedContent);
                    toast.success("Custom page deleted and synced to database!");
                } catch (e: any) {
                    toast.error("Page deleted locally, but failed to sync to database.");
                }
            } else {
                toast.success("Custom page deleted.");
            }
        } else if (deleteConfirm.type === 'all-products') {
            products.forEach(p => onDeleteProduct(p.id));
            toast.success("Full catalogue deleted.");
        }
        setDeleteConfirm(null);
    };

    const handleDeletePostInternal = (id: string, title: string) => {
        setDeleteConfirm({ id, type: 'post', title: `Delete blog post "${title}"?`, message: `Are you sure you want to delete the blog post "${title}"? This action cannot be undone.` });
    };

    const handleDeleteProductInternal = (id: string, title: string) => {
        setDeleteConfirm({ id, type: 'product', title: `Delete product "${title}"?`, message: `Are you sure you want to delete the product "${title}"? This action cannot be undone.` });
    };

    const handleDeleteAllProductsInternal = () => {
        setDeleteConfirm({ id: 'all', type: 'all-products', title: 'Delete Full Catalogue?', message: 'Are you sure you want to delete ALL products? This action cannot be undone.' });
    };

    const handleGeneratePostContent = async () => {
        if (!editingPost || !editingPost.title) {
            toast.error("Please provide a title for the blog post first.");
            return;
        }
        setIsGeneratingPost(true);
        try {
            const linkedProducts = products.filter(p => editingPost.linkedProductIds?.includes(p.id));
            const result = await generateBlogPost(editingPost.title, linkedProducts);
            setEditingPost(prev => prev ? {
                ...prev,
                excerpt: result.excerpt || prev.excerpt,
                content: result.content || prev.content,
                image: result.image || prev.image,
            } : null);
        } catch (e) {
            toast.error("Failed to generate blog post content.");
        } finally {
            setIsGeneratingPost(false);
        }
    };

    const handleGeneratePageContent = async () => {
        if (!editingPage || !editingPage.title) {
            toast.error("Please provide a title for the page first.");
            return;
        }
        setIsGeneratingPage(true);
        try {
            const linkedProducts = products.filter(p => editingPage.linkedProductIds?.includes(p.id));
            const result = await generateCustomPage(editingPage.title, linkedProducts, editingPage.seoInput);
            setEditingPage(prev => prev ? {
                ...prev,
                content: result,
            } : null);
            toast.success("SEO Content Generated!");
        } catch (e) {
            toast.error("Failed to generate page content.");
        } finally {
            setIsGeneratingPage(false);
        }
    };

    // --- Custom Pages Handlers ---
    const startAddPage = () => {
        setEditingPage({
            id: Date.now().toString(),
            title: '',
            slug: '',
            content: '',
            seoInput: '',
            status: 'draft',
            linkedProductIds: []
        });
    };

    const startEditPage = (page: CustomPage) => {
        setEditingPage({ ...page });
    };

    const handlePageFormChange = (key: keyof CustomPage, value: any) => {
        if (editingPage) {
            let update = { ...editingPage, [key]: value };
            if (key === 'title' && !editingPage.slug) {
                update.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            }
            setEditingPage(update);
        }
    };


    const handleOpenLinkPicker = (type: 'textarea' | 'tiptap', target: any) => {
        setLinkPickerTarget({ type, target });
        setIsLinkPickerOpen(true);
    };

    const handleSelectLink = (url: string, text: string) => {
        if (!linkPickerTarget) return;

        if (linkPickerTarget.type === 'tiptap') {
            const editor = linkPickerTarget.target;
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            // If text was selected, TipTap handles it. If not, we might want to insert text.
            // For now, tipping-kit handles linking existing selection.
        } else {
            const textarea = linkPickerTarget.target.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentText = textarea.value;
            const selectedText = currentText.substring(start, end) || text;
            const before = currentText.substring(0, start);
            const after = currentText.substring(end);

            const markdownLink = `[${selectedText}](${url})`;
            const newValue = `${before}${markdownLink}${after}`;

            // Update state (we need to know which field this belongs to)
            // This part is a bit tricky now since we don't have the ref comparison easy.
            // But TipTap is used for all main editors now.
            if (editingPost) {
                setEditingPost({ ...editingPost, content: newValue });
            } else if (editingPage) {
                // Determine if it was SEO or Content? 
                // Wait, only SEO uses textarea now if I don't update it.
                // I'll update all to TipTap.
            }

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdownLink.length, start + markdownLink.length);
            }, 0);
        }
        setIsLinkPickerOpen(false);
    };

    const handleTogglePageProductLink = (productId: string) => {
        if (!editingPage) return;
        const currentLinks = editingPage.linkedProductIds || [];
        const newLinks = currentLinks.includes(productId)
            ? currentLinks.filter(id => id !== productId)
            : [...currentLinks, productId];
        setEditingPage({ ...editingPage, linkedProductIds: newLinks });
    };

    const handleSavePage = async () => {
        if (!editingPage || !editingPage.title || !editingPage.slug) {
            toast.error("Title and Slug are required.");
            return;
        }

        const pages = liveSiteContent.customPages || [];
        const pageToSave = editingPage as CustomPage;

        let newPages: CustomPage[];
        const exists = pages.findIndex(p => p.id === pageToSave.id);

        if (exists > -1) {
            newPages = pages.map(p => p.id === pageToSave.id ? pageToSave : p);
        } else {
            newPages = [pageToSave, ...pages];
        }

        const updatedContent = { ...liveSiteContent, customPages: newPages };
        _onUpdateSiteContent?.(updatedContent);

        const save = onSaveChanges;
        if (save) {
            try {
                await save(updatedContent);
                toast.success("Page saved and persisted to cloud!");
            } catch (e) {
                toast.error("Saved locally, but failed to sync to cloud.");
            }
        } else {
            toast.success("Page saved successfully!");
        }

        setEditingPage(null);
    };

    const handleDuplicatePage = (page: CustomPage) => {
        const duplicated: CustomPage = {
            ...page,
            id: Date.now().toString(),
            slug: `${page.slug}-copy`,
            title: `${page.title} (Copy)`,
            status: 'draft'
        };
        const pages = liveSiteContent.customPages || [];
        const newPages = [duplicated, ...pages];
        const updatedContent = { ...liveSiteContent, customPages: newPages };
        _onUpdateSiteContent?.(updatedContent);
        onSaveChanges?.(updatedContent);
        toast.success('Page duplicated successfully!');
    };

    const handleDeletePageInternal = (id: string, title: string) => {
        setDeleteConfirm({
            id,
            type: 'page',
            title: `Delete page "${title}"?`,
            message: `Are you sure you want to delete the page "${title}"? This will remove it from the site.`
        });
    };

    useEffect(() => {
        setDraftContent(liveSiteContent);
    }, [liveSiteContent]);

    const handleBulkImport = async () => {
        const urls = bulkInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length === 0) return;

        setIsImporting(true);
        let successCount = 0;

        for (const url of urls) {
            try {
                const details = await fetchProductFromWeb(url, categories);
                if (details && details.title) {
                    const newProduct: Product = {
                        ...initialFormState,
                        ...details as Product,
                        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        affiliateLink: url.includes('amazon')
                            ? (url.includes('?') ? `${url}&tag=gosimpleliving-20` : `${url}?tag=gosimpleliving-20`)
                            : '#',
                        status: 'draft'
                    };
                    onAddProduct(newProduct);
                    successCount++;
                }
            } catch (e) {
                console.error(`Failed to import ${url}`, e);
            }
        }

        toast.success(`Successfully processed ${successCount} products as drafts!`);
        setIsBulkImporting(false);
        setBulkInput('');
        setIsImporting(false);
    };

    const handleSeedData = async () => {
        if (!confirm("This will synchronize your local catalogue to the live database. Existing items with same IDs will be updated. Continue?")) return;
        setIsSeeding(true);
        try {
            if (onSeed) {
                await onSeed(PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT);
            } else {
                await dbService.seedDatabase(PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT);
            }
            toast.success("Synchronization Complete!");
            if (onRefresh) await onRefresh();
            else window.location.reload();
        } catch (e) {
            toast.error("Sync Failed: Ensure your SQL tables are created in the Config tab.");
        } finally {
            setIsSeeding(false);
        }
    };

    const handleCloudFetch = async () => {
        if (onRefresh) {
            setIsSeeding(true);
            await onRefresh();
            setIsSeeding(false);
        }
    };

    const startEdit = (product: Product) => {
        setFormData({ ...product });
        setEditingId(product.id);
        setIsAdding(false);
        setIsBulkImporting(false);
    };

    const startAdd = () => {
        setFormData({ ...initialFormState, id: Date.now().toString() });
        setIsAdding(true);
        setEditingId(null);
        setIsBulkImporting(false);
    };

    const handleSaveProduct = async (targetStatus: Product['status']) => {
        const finalData = { ...formData, status: targetStatus };
        const validationErrors = validateProduct(finalData);
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        if (isAdding) {
            onAddProduct(finalData);
            setIsAdding(false);
        } else {
            onUpdateProduct(finalData);
            setEditingId(null);
        }
        setFormData(initialFormState);
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        if (categories.includes(newCategoryName)) {
            toast.error("Category already exists.");
            return;
        }
        onAddCategory(newCategoryName);
        setNewCategoryName('');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-bold">Published</span>;
            case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 font-bold">Pending</span>;
            default: return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold">Draft</span>;
        }
    };

    const colorOptions: { id: ThemeColor, bg: string, label: string }[] = [
        { id: 'amber', bg: 'bg-amber-500', label: 'Amber' },
        { id: 'blue', bg: 'bg-blue-600', label: 'Blue' },
        { id: 'rose', bg: 'bg-rose-500', label: 'Rose' },
        { id: 'emerald', bg: 'bg-emerald-500', label: 'Emerald' },
        { id: 'indigo', bg: 'bg-indigo-600', label: 'Indigo' }
    ];

    const seasonOptions: { id: Season, label: string, emoji: string }[] = [
        { id: 'none', label: 'Default', emoji: '🏢' },
        { id: 'christmas', label: 'Christmas', emoji: '🎄' },
        { id: 'halloween', label: 'Halloween', emoji: '🎃' },
        { id: 'valentine', label: 'Valentines', emoji: '💖' },
        { id: 'prime_day', label: 'Prime Day', emoji: '📦' },
        { id: 'newyear', label: 'New Year', emoji: '🎆' }
    ];

    const generateCopy = async () => {
        setIsGenerating(true);
        try {
            const result = await generateSiteContent(draftContent, categories);
            setDraftContent(prev => ({ ...prev, ...result }));
        } catch (e) {
            toast.error("Failed to generate content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSection = async (sectionName: string) => {
        const save = onSaveChanges;
        if (save) {
            try {
                await save(draftContent);
                toast.success(`${sectionName} saved to database!`);
            } catch (e: any) {
                toast.error(`Failed to save ${sectionName}. ${e?.message || 'Check your database connection.'}`);
            }
        }
    };

    const handleSaveAffiliateConfig = async (config: any) => {
        const updatedContent = { ...liveSiteContent, affiliateConfig: config };
        _onUpdateSiteContent?.(updatedContent);
        if (onSaveChanges) {
            await onSaveChanges(updatedContent);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your store's brain and body.</p>
                </div>
                <div className="flex items-center gap-3">
                    {dbStatus === 'loading' || dbStatus === 'reconnecting' ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                            <RefreshCw size={16} className="animate-spin" /> {dbStatus === 'loading' ? 'Syncing...' : 'Reconnecting...'}
                        </div>
                    ) : isUsingFallback ? (
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <WifiOff size={16} /> Local Catalogue
                                </div>
                                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <Button size="sm" onClick={handleTestConnection} disabled={diagnosticsLoading} className="bg-purple-600 hover:bg-purple-700 text-white border-none h-8 text-[10px] gap-1.5">
                                        <Activity size={12} className={diagnosticsLoading ? 'animate-pulse' : ''} /> Test Connection
                                    </Button>
                                    <Button size="sm" onClick={handleCloudFetch} disabled={isSeeding} className="bg-blue-600 hover:bg-blue-700 text-white border-none h-8 text-[10px] gap-1.5">
                                        <RefreshCw size={12} className={isSeeding ? 'animate-spin' : ''} /> Refresh Cloud
                                    </Button>
                                    <Button size="sm" onClick={handleSeedData} disabled={isSeeding} className="bg-amber-600 hover:bg-amber-700 text-white border-none h-8 text-[10px] gap-1.5">
                                        <CloudUpload size={12} /> Sync to DB
                                    </Button>
                                </div>
                            </div>
                            {lastError && <p className="text-[10px] text-red-500 font-medium ml-2">Error: {lastError}</p>}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                                <Wifi size={16} /> Database Live
                            </div>
                            <Button size="sm" onClick={handleTestConnection} variant="ghost" className="h-8 text-[10px]">
                                <Activity size={12} className="mr-1" /> Test
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
                <button onClick={() => handleTabChange('products')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'products' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><List size={16} /> Catalogue</span>{activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                {currentUserRole === 'admin' && (
                    <button onClick={() => handleTabChange('theme')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'theme' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Palette size={16} /> Customizer</span>{activeTab === 'theme' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                )}
                <button onClick={() => handleTabChange('content')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'content' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><FileText size={16} /> Blog</span>{activeTab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => handleTabChange('pages')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'pages' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Globe size={16} /> Pages</span>{activeTab === 'pages' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => handleTabChange('offers')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'offers' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><div className="w-4 h-4 flex items-center justify-center font-bold text-xs">$</div> Offers</span>{activeTab === 'offers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => handleTabChange('affiliate-config')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'affiliate-config' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><LinkIcon size={16} /> Affiliate Config</span>{activeTab === 'affiliate-config' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                {currentUserRole === 'admin' && (
                    <>
                        <button onClick={() => handleTabChange('config')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'config' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><UsersIcon size={16} /> Users</span>{activeTab === 'config' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                        <button onClick={() => handleTabChange('settings')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Settings size={16} /> Settings</span>{activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                    </>
                )}
            </div>

            {activeTab === 'products' && (
                <>
                    {isBulkImporting ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl"><PackagePlus size={24} /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bulk AI Import</h3>
                                        <p className="text-sm text-slate-500">Paste Amazon product URLs or ASINs (one per line).</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsBulkImporting(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                            </div>

                            <textarea
                                value={bulkInput}
                                onChange={(e) => setBulkInput(e.target.value)}
                                placeholder="https://www.amazon.com/dp/B08N5KWB9H&#10;B09G96TFF7"
                                className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500 dark:text-white mb-6 resize-none"
                            />

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsBulkImporting(false)}>Cancel</Button>
                                <Button onClick={handleBulkImport} disabled={isImporting || !bulkInput.trim()} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    {isImporting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                                    Process with AI
                                </Button>
                            </div>
                        </div>
                    ) : isAdding || editingId ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{isAdding ? 'Add New Product' : 'Edit Product'}</h3>
                                    <p className="text-sm text-slate-500">All changes must be saved to appear on the live site.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 mr-4 pr-4 border-r border-slate-200 dark:border-slate-800">
                                        <Button variant="ghost" size="sm" onClick={() => handleSaveProduct('draft')} className="text-xs h-9">Save Draft</Button>
                                        <Button size="sm" onClick={() => handleSaveProduct('published')} className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white">Publish Live</Button>
                                    </div>
                                    <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white">{categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price ($)</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="Current price" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rating</label>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 h-[46px]">
                                                <StarRating rating={formData.rating} interactive onChange={(r) => setFormData({ ...formData, rating: r })} />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formData.rating}</span>
                                            </div>
                                        </div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Review Count</label><input type="number" value={formData.reviews} onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) || 0 })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="0" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Price ($) <span className="text-[10px] font-normal text-slate-400">(Optional)</span></label><input type="number" step="0.01" value={formData.originalPrice || ''} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="Before discount" /></div>
                                        <div className="flex flex-col">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Discount Preview</label>
                                            <div className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center justify-center">
                                                {formData.originalPrice && formData.originalPrice > formData.price ? (
                                                    <span className="font-bold text-green-600 dark:text-green-400">Save {Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)}%</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">No discount</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Regional Pricing UI */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Regional Pricing</label>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                const region = prompt("Enter Region Code (e.g., UK, CA, EU):");
                                                if (region) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        regionalPricing: {
                                                            ...(prev.regionalPricing || {}),
                                                            [region.toUpperCase()]: { price: 0, currency: 'USD' }
                                                        }
                                                    }));
                                                }
                                            }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Region</Button>
                                        </div>
                                        {formData.regionalPricing && Object.entries(formData.regionalPricing).map(([region, data]) => (
                                            <div key={region} className="flex gap-2 mb-2 items-center">
                                                <div className="w-12 text-xs font-bold text-slate-700 dark:text-slate-300">{region}</div>
                                                <input type="number" step="0.01" value={data.price} onChange={(e) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        regionalPricing: {
                                                            ...prev.regionalPricing,
                                                            [region]: { ...data, price: parseFloat(e.target.value) }
                                                        }
                                                    }));
                                                }} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Price" />
                                                <select value={data.currency} onChange={(e) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        regionalPricing: {
                                                            ...prev.regionalPricing,
                                                            [region]: { ...data, currency: e.target.value }
                                                        }
                                                    }));
                                                }} className="w-20 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                                                    <option value="USD">USD</option>
                                                    <option value="GBP">GBP</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="CAD">CAD</option>
                                                </select>
                                                <button onClick={() => {
                                                    const newPricing = { ...formData.regionalPricing };
                                                    delete newPricing[region];
                                                    setFormData({ ...formData, regionalPricing: newPricing });
                                                }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Key Features UI */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Key Features</label>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    features: [...(prev.features || []), 'New Feature']
                                                }));
                                            }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Feature</Button>
                                        </div>

                                        {formData.features && formData.features.length === 0 && (
                                            <p className="text-xs text-slate-400 italic mb-2">No features added yet.</p>
                                        )}

                                        {formData.features && formData.features.map((feature, idx) => (
                                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                                <div className="w-6 text-xs font-bold text-slate-400 select-none text-center">{idx + 1}.</div>
                                                <input type="text" value={feature} onChange={(e) => {
                                                    const newFeatures = [...(formData.features || [])];
                                                    newFeatures[idx] = e.target.value;
                                                    setFormData({ ...formData, features: newFeatures });
                                                }} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Feature description..." />
                                                <button onClick={() => {
                                                    const newFeatures = formData.features.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, features: newFeatures });
                                                }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Affiliate Links UI */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Affiliate Buttons</label>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    additionalAffiliateLinks: [...(prev.additionalAffiliateLinks || []), { label: 'New Store', url: '#', theme: 'default' }]
                                                }));
                                            }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Button</Button>
                                        </div>
                                        <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Affiliate Button</label>
                                            <div className="flex flex-col gap-2">
                                                <input type="text" value={formData.affiliateLink} onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="URL (e.g. https://amazon.com/...)" />
                                                <div className="flex gap-2">
                                                    <input type="text" value={formData.affiliateLinkLabel || ''} onChange={(e) => setFormData({ ...formData, affiliateLinkLabel: e.target.value })} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Label (Default: Buy on Amazon)" />
                                                    <select
                                                        value={formData.affiliateLinkTheme || 'orange'}
                                                        onChange={(e) => setFormData({ ...formData, affiliateLinkTheme: e.target.value as any })}
                                                        className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                                    >
                                                        {Object.entries(AFFILIATE_THEMES).map(([key, theme]) => (
                                                            <option key={key} value={key}>{theme.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {formData.additionalAffiliateLinks && formData.additionalAffiliateLinks.map((link, idx) => (
                                            <div key={idx} className="flex flex-col gap-2 mb-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <div className="flex gap-2">
                                                    <input type="text" value={link.label} onChange={(e) => {
                                                        const newLinks = [...(formData.additionalAffiliateLinks || [])];
                                                        newLinks[idx].label = e.target.value;
                                                        setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                                    }} className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Label (e.g. Target)" />
                                                    <input type="text" value={link.url} onChange={(e) => {
                                                        const newLinks = [...(formData.additionalAffiliateLinks || [])];
                                                        newLinks[idx].url = e.target.value;
                                                        setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                                    }} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="URL" />
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <select
                                                        value={link.theme || 'default'}
                                                        onChange={(e) => {
                                                            const newLinks = [...(formData.additionalAffiliateLinks || [])];
                                                            newLinks[idx].theme = e.target.value as any;
                                                            setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                                        }}
                                                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                                    >
                                                        {Object.entries(AFFILIATE_THEMES).map(([key, theme]) => (
                                                            <option key={key} value={key}>{theme.label}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={() => {
                                                        const newLinks = formData.additionalAffiliateLinks?.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}

                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Product Image</label>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <MediaManager
                                                currentImageUrl={formData.image}
                                                onImageSelect={(url) => setFormData({ ...formData, image: url })}
                                            />
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="block text-xs font-semibold text-slate-500 mb-2">Or enter URL manually</label>
                                                <input
                                                    type="text"
                                                    value={formData.image}
                                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                    placeholder="https://..."
                                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <button
                                            onClick={() => setFormData({ ...formData, isBestSeller: !formData.isBestSeller })}
                                            className={`p-2 rounded-lg border flex items-center gap-2 text-xs font-bold transition-colors ${formData.isBestSeller ? 'bg-yellow-400 border-yellow-500 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                        >
                                            <TrendingUp size={14} /> Best Seller
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none dark:text-white" /></div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Button variant="outline" onClick={() => handleSaveProduct('draft')}>Save Draft</Button>
                                        <Button onClick={() => handleSaveProduct('published')}>Publish Live</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Product List */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Catalogue</h2>
                                    <p className="text-sm text-slate-500">Manage products currently in store.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsBulkImporting(true)} className="gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800/30 dark:text-purple-400">
                                        <PackagePlus size={16} /> AI Import
                                    </Button>
                                    <Button size="sm" onClick={startAdd} className="gap-2">
                                        <Plus size={16} /> Add Single
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Database size={48} className="text-slate-200 mb-2" />
                                                        <p className="font-medium">No products found in Database.</p>
                                                        <Button size="sm" onClick={handleSeedData} disabled={isSeeding}>
                                                            {isSeeding ? <Loader2 size={16} className="animate-spin mr-2" /> : <CloudUpload size={16} className="mr-2" />}
                                                            Sync Local Catalogue Now
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <ProductRow
                                                    key={product.id}
                                                    product={product}
                                                    currentUserRole={currentUserRole}
                                                    onDuplicate={onDuplicateProduct}
                                                    onEdit={startEdit}
                                                    onDelete={handleDeleteProductInternal}
                                                    getStatusBadge={getStatusBadge}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Categories & Actions */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Tag size={18} className="text-amber-500" /> Categories</h3>
                                <div className="space-y-2 mb-4">
                                    {categories.filter(c => c !== 'All').map(cat => (
                                        <div key={cat} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                                            <button onClick={() => onDeleteCategory(cat)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="New category..."
                                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                    />
                                    <button onClick={handleAddCategory} className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"><Plus size={18} /></button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-red-500"><Shield size={18} /> Danger Zone</h3>
                                <p className="text-xs text-slate-500 mb-4">Actions here are irreversible. Be careful.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30"
                                    onClick={handleDeleteAllProductsInternal}
                                >
                                    <Trash2 size={16} className="mr-2" /> Delete Full Catalogue
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            {
                activeTab === 'theme' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Store Customizer</h2>
                                <p className="text-sm text-slate-500">Edit your visual identity and marketing copy.</p>
                            </div>
                            <Button onClick={() => onStartPreview(draftContent)} className="gap-2">
                                <Eye size={18} /> Preview Changes
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Branding & SEO */}
                            <div className="space-y-6 lg:col-span-2">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-blue-500"><Globe size={18} /> Branding</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Logo Text</label><input type="text" value={draftContent.logoText} onChange={(e) => setDraftContent({ ...draftContent, logoText: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Browser Tab Title</label><input type="text" value={draftContent.pageTitle} onChange={(e) => setDraftContent({ ...draftContent, pageTitle: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" /></div>
                                    </div>
                                    <div className="mt-4"><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Announcement Bar</label><input type="text" value={draftContent.announcementBar} onChange={(e) => setDraftContent({ ...draftContent, announcementBar: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" /></div>
                                    <div className="mt-6">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Store Logo Image</label>
                                        <MediaManager
                                            currentImageUrl={draftContent.logoUrl || ''}
                                            onImageSelect={(url) => setDraftContent({ ...draftContent, logoUrl: url })}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 italic">Tip: Use a transparent PNG for best results on dark backgrounds.</p>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button size="sm" onClick={() => handleSaveSection('Branding')} className="gap-2">
                                            <Save size={16} /> Save Branding
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-green-500"><Search size={18} /> SEO & Meta Data</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Meta Description (SEO)</label>
                                            <textarea
                                                value={draftContent.seoDescription}
                                                onChange={(e) => setDraftContent({ ...draftContent, seoDescription: e.target.value })}
                                                placeholder="Brief summary for search results (max 160 chars)..."
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white h-20 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Keywords (Comma separated)</label>
                                            <input
                                                type="text"
                                                value={draftContent.seoKeywords}
                                                onChange={(e) => setDraftContent({ ...draftContent, seoKeywords: e.target.value })}
                                                placeholder="affiliate, store, electronics, reviews..."
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 text-amber-500"><Megaphone size={18} /> Hero Marketing</h3>
                                        <Button size="sm" variant="outline" onClick={generateCopy} disabled={isGenerating} className="gap-2 border-purple-200 text-purple-600 dark:text-purple-400">
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Rewrite
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Headline</label><input type="text" value={draftContent.heroTitle} onChange={(e) => setDraftContent({ ...draftContent, heroTitle: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sub-headline</label><textarea value={draftContent.heroSubtitle} onChange={(e) => setDraftContent({ ...draftContent, heroSubtitle: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white resize-none h-20" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">CTA Button</label><input type="text" value={draftContent.heroButtonText} onChange={(e) => setDraftContent({ ...draftContent, heroButtonText: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" /></div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button size="sm" onClick={() => handleSaveSection('Hero Marketing')} className="gap-2">
                                            <Save size={16} /> Save Marketing
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-purple-500"><ImageIcon size={18} /> Hero Visuals</h3>
                                    <MediaManager currentImageUrl={draftContent.heroImageUrl} onImageSelect={(url) => setDraftContent({ ...draftContent, heroImageUrl: url })} />
                                    <div className="mt-6 flex justify-end">
                                        <Button size="sm" onClick={() => handleSaveSection('Hero Visuals')} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white border-none">
                                            <Save size={16} /> Save Hero Visuals
                                        </Button>
                                    </div>
                                </div>

                                {/* Footer Settings */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-slate-500"><LinkIcon size={18} /> Footer Settings</h3>
                                    <div className="space-y-4">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Copyright Text</label><input type="text" value={draftContent.footerText} onChange={(e) => setDraftContent({ ...draftContent, footerText: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" /></div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase">Footer Links</label>
                                                <Button size="sm" variant="ghost" onClick={() => {
                                                    setDraftContent(prev => ({
                                                        ...prev,
                                                        footerLinks: [...(prev.footerLinks || []), { label: 'New Link', url: '#' }]
                                                    }));
                                                }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Link</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {draftContent.footerLinks?.map((link, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input type="text" value={link.label} onChange={(e) => {
                                                            const newLinks = [...(draftContent.footerLinks || [])];
                                                            newLinks[idx].label = e.target.value;
                                                            setDraftContent({ ...draftContent, footerLinks: newLinks });
                                                        }} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" placeholder="Label" />
                                                        <input type="text" value={link.url} onChange={(e) => {
                                                            const newLinks = [...(draftContent.footerLinks || [])];
                                                            newLinks[idx].url = e.target.value;
                                                            setDraftContent({ ...draftContent, footerLinks: newLinks });
                                                        }} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" placeholder="URL" />
                                                        <button onClick={() => {
                                                            const newLinks = draftContent.footerLinks?.filter((_, i) => i !== idx);
                                                            setDraftContent({ ...draftContent, footerLinks: newLinks });
                                                        }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button size="sm" onClick={() => handleSaveSection('Footer')} className="gap-2">
                                                <Save size={16} /> Save Footer
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Settings */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-indigo-500"><List size={18} /> Navigation Settings</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-white">Show "Pages" Tab</label>
                                                <p className="text-xs text-slate-500 mt-1">Display the Pages navigation link in the menu</p>
                                            </div>
                                            <button
                                                onClick={() => setDraftContent({ ...draftContent, showPagesInNav: !draftContent.showPagesInNav })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draftContent.showPagesInNav !== false ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draftContent.showPagesInNav !== false ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button size="sm" onClick={() => handleSaveSection('Navigation')} className="gap-2">
                                                <Save size={16} /> Save Navigation
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media Links */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-blue-500"><Globe size={18} /> Social Media Links</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Social Profiles</label>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setDraftContent(prev => ({
                                                    ...prev,
                                                    socialLinks: [...(prev.socialLinks || []), { platform: 'twitter', url: '' }]
                                                }));
                                            }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Profile</Button>
                                        </div>
                                        <div className="space-y-2">
                                            {draftContent.socialLinks?.map((link, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <select
                                                        value={link.platform}
                                                        onChange={(e) => {
                                                            const newLinks = [...(draftContent.socialLinks || [])];
                                                            newLinks[idx].platform = e.target.value as SocialPlatform;
                                                            setDraftContent({ ...draftContent, socialLinks: newLinks });
                                                        }}
                                                        className="w-1/3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                    >
                                                        <option value="facebook">Facebook</option>
                                                        <option value="twitter">Twitter</option>
                                                        <option value="instagram">Instagram</option>
                                                        <option value="linkedin">LinkedIn</option>
                                                        <option value="github">GitHub</option>
                                                        <option value="youtube">YouTube</option>
                                                        <option value="tiktok">TikTok</option>
                                                        <option value="pinterest">Pinterest</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={link.url}
                                                        onChange={(e) => {
                                                            const newLinks = [...(draftContent.socialLinks || [])];
                                                            newLinks[idx].url = e.target.value;
                                                            setDraftContent({ ...draftContent, socialLinks: newLinks });
                                                        }}
                                                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                        placeholder="Profile URL (https://...)"
                                                    />
                                                    <button onClick={() => {
                                                        const newLinks = draftContent.socialLinks?.filter((_, i) => i !== idx);
                                                        setDraftContent({ ...draftContent, socialLinks: newLinks });
                                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button size="sm" onClick={() => handleSaveSection('Social Links')} className="gap-2">
                                                <Save size={16} /> Save Social
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Styles */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-rose-500"><Palette size={18} /> Visual Theme</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {colorOptions.map((opt) => (
                                                <button key={opt.id} onClick={() => setDraftContent({ ...draftContent, themeColor: opt.id })} className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${draftContent.themeColor === opt.id ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' : 'border-transparent bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                    <div className={`w-4 h-4 rounded-full ${opt.bg}`} />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-emerald-500"><Calendar size={18} /> Seasonal Overlay</h3>
                                        <div className="space-y-2">
                                            {seasonOptions.map((s) => (
                                                <button key={s.id} onClick={() => setDraftContent({ ...draftContent, season: s.id })} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${draftContent.season === s.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                    <span className="text-sm font-medium">{s.label}</span>
                                                    <span className="text-lg">{s.emoji}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Preview & Publish Actions */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg border-t-4 border-t-amber-500">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" /> Theme Actions</h3>
                                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                            Preview changes live on the site before publishing. Published changes will be visible to all visitors.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => onStartPreview(draftContent)}
                                                className="w-full flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-50"
                                            >
                                                <Eye size={16} /> Live Preview
                                            </Button>
                                            <Button
                                                onClick={() => handleSaveSection('Theme & Visuals')}
                                                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                                            >
                                                <CloudUpload size={16} /> Publish Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {activeTab === 'config' && <UserManagement />}

            {activeTab === 'settings' && (
                <AdminSettings
                    dbStatus={dbStatus}
                    lastError={lastError || null}
                    onRefresh={onRefresh || (async () => { })}
                />
            )}

            {activeTab === 'affiliate-config' && (
                <AffiliateConfigTab
                    config={liveSiteContent.affiliateConfig || {}}
                    onSave={handleSaveAffiliateConfig}
                />
            )
            }

            {
                activeTab === 'pages' && (
                    <div className="animate-in fade-in duration-300">
                        {editingPage ? (
                            // FORM VIEW
                            <div>
                                <button onClick={() => setEditingPage(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6"><ArrowLeft size={14} /> Back to Pages</button>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingPage.title ? 'Edit Page' : 'Create Custom Page'}</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label><input type="text" value={editingPage.title} onChange={e => handlePageFormChange('title', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" placeholder="e.g. Best Travel Gadgets 2024" /></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Slug</label><input type="text" value={editingPage.slug} onChange={e => handlePageFormChange('slug', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" placeholder="e.g. travel-gadgets" /></div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                                SEO Source Material / Ideas <Sparkles size={12} className="text-purple-500" />
                                            </label>
                                            <TipTapEditor
                                                key={`page-seo-${editingPage.id}`}
                                                value={editingPage.seoInput || ''}
                                                onChange={val => handlePageFormChange('seoInput', val)}
                                                onOpenLinkPicker={(editor) => handleOpenLinkPicker('tiptap', editor)}
                                                placeholder="Paste raw notes, product features, or content you want the AI to optimize for SEO..."
                                                minHeight="150px"
                                                className="border-purple-200 dark:border-purple-900/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Final Content (Markdown)</label>
                                            <TipTapEditor
                                                key={`page-content-${editingPage.id}`}
                                                value={editingPage.content || ''}
                                                onChange={val => handlePageFormChange('content', val)}
                                                onOpenLinkPicker={(editor) => handleOpenLinkPicker('tiptap', editor)}
                                                comparisonTables={editingPage.comparisonTables || []}
                                                minHeight="500px"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        {/* Hero Image */}
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><ImageIcon size={18} className="text-blue-500" /> Hero Banner Image</h3>
                                            <MediaManager currentImageUrl={editingPage.heroImageUrl || ''} onImageSelect={(url) => handlePageFormChange('heroImageUrl', url)} />
                                            <p className="mt-2 text-[10px] text-slate-400 italic">Optional full-width banner image for the page.</p>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Sparkles size={18} className="text-purple-500" /> AI Tools</h3>
                                            <Button onClick={handleGeneratePageContent} disabled={isGeneratingPage} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                                {isGeneratingPage ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="mr-2" />}
                                                {isGeneratingPage ? 'Generating...' : 'AI Generate SEO Content'}
                                            </Button>
                                            <p className="mt-2 text-[10px] text-slate-400 italic text-center">Uses Affiliate SEO Vibe Prompt logic</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Package size={18} className="text-amber-500" /> Linked Products</h3>
                                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                                {products.map(p => (
                                                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                                                        <input type="checkbox" checked={editingPage.linkedProductIds?.includes(p.id)} onChange={() => handleTogglePageProductLink(p.id)} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
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
                                                tables={editingPage.comparisonTables || []}
                                                products={products}
                                                onChange={(tables) => handlePageFormChange('comparisonTables', tables)}
                                            />
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Save size={18} className="text-green-500" /> Actions</h3>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-sm text-slate-600 dark:text-slate-400">Status:</label>
                                                    <select value={editingPage.status} onChange={e => handlePageFormChange('status', e.target.value)} className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none dark:text-white">
                                                        <option value="draft">Draft</option>
                                                        <option value="published">Published</option>
                                                    </select>
                                                </div>

                                                {/* Navigation Toggle */}
                                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-2">
                                                    <label className="flex items-center justify-between cursor-pointer">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show in Navigation Menu</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePageFormChange('showInNav', !editingPage.showInNav)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingPage.showInNav ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingPage.showInNav ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </label>
                                                    {editingPage.showInNav && (
                                                        <div className="mt-3">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Menu Order</label>
                                                            <input
                                                                type="number"
                                                                value={editingPage.navOrder || 0}
                                                                onChange={e => handlePageFormChange('navOrder', parseInt(e.target.value) || 0)}
                                                                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                                                placeholder="0 = first, higher = later"
                                                            />
                                                            <p className="text-[10px] text-slate-400 mt-1">Lower numbers appear first in menu</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button onClick={handleSavePage} className="w-full">Save Page</Button>
                                                <Button variant="ghost" onClick={() => setEditingPage(null)} className="text-slate-500">Cancel</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // LIST VIEW
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Landing Pages</h2><p className="text-sm text-slate-500">Create specialized affiliate storefronts.</p></div>
                                    <Button size="sm" onClick={startAddPage} className="gap-2"><Plus size={16} /> New Custom Page</Button>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                            <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Title & Slug</th><th className="px-6 py-4">Linked</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {(liveSiteContent.customPages || [])
                                                .map(page => (
                                                    <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4">{getStatusBadge(page.status)}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900 dark:text-white">{page.title}</div>
                                                            <div className="text-xs text-slate-500 font-mono">/p/{page.slug}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">{page.linkedProductIds?.length || 0} Products</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"><ExternalLink size={18} /></a>
                                                                <button onClick={() => handleDuplicatePage(page)} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg" title="Duplicate"><Copy size={18} /></button>
                                                                <button onClick={() => startEditPage(page)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={18} /></button>
                                                                <button onClick={() => handleDeletePageInternal(page.id, page.title)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {(!liveSiteContent.customPages || liveSiteContent.customPages.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                        No custom pages created yet. Click "New Custom Page" to get started.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                        }
                    </div >
                )
            }

            {
                activeTab === 'content' && (
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
                                    <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content & Blog</h2><p className="text-sm text-slate-500">Manage blog posts and articles.</p></div>
                                    <Button size="sm" onClick={startAddPost} className="gap-2"><Plus size={16} /> Create New Post</Button>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                                <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Title & Author</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {blogPosts
                                                    .map(post => (
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
                                                                        onClick={() => handleDeletePostInternal(post.id, post.title)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {
                activeTab === 'offers' && (
                    <AdminOffers
                        siteContent={liveSiteContent}
                        onUpdateSiteContent={(key, value) => {
                            if (onUpdateSiteContent) {
                                onUpdateSiteContent({ ...liveSiteContent, [key]: value });
                            }
                        }}
                        onSaveChanges={async () => {
                            if (onSaveChanges) {
                                await onSaveChanges(liveSiteContent);
                            }
                        }}
                        themeColor={liveSiteContent.themeColor}
                    />
                )
            }


            {/* Connection Diagnostics Modal */}
            {
                showDiagnostics && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDiagnostics(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${diagnosticsResult?.success ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Connection Diagnostics</h3>
                                        <p className="text-sm text-slate-500">Database health check results</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowDiagnostics(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X size={20} />
                                </button>
                            </div>

                            {diagnosticsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                </div>
                            ) : diagnosticsResult ? (
                                <div className="space-y-4">
                                    {/* Overall Status */}
                                    <div className={`p-4 rounded-xl border ${diagnosticsResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                                        <p className={`font-bold ${diagnosticsResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                            {diagnosticsResult.success ? '✅ Connection Successful' : '❌ Connection Failed'}
                                        </p>
                                        {diagnosticsResult.errorMessage && (
                                            <p className="text-sm mt-2 opacity-90">{diagnosticsResult.errorMessage}</p>
                                        )}
                                    </div>

                                    {/* Error Type */}
                                    {diagnosticsResult.errorType && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Error Category</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {diagnosticsResult.errorType === 'network' && '🌐 Network Error'}
                                                {diagnosticsResult.errorType === 'auth' && '🔐 Authentication Error'}
                                                {diagnosticsResult.errorType === 'schema' && '📋 Schema/Table Error'}
                                                {diagnosticsResult.errorType === 'timeout' && '⏱️ Timeout Error'}
                                                {diagnosticsResult.errorType === 'unknown' && '❓ Unknown Error'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Detailed Checks */}
                                    {diagnosticsResult.details && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detailed Checks</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Database Reachable</span>
                                                    <span className={`text-sm font-bold ${diagnosticsResult.details.canReachDatabase ? 'text-green-600' : 'text-red-600'}`}>
                                                        {diagnosticsResult.details.canReachDatabase ? '✓ Yes' : '✗ No'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Valid Credentials</span>
                                                    <span className={`text-sm font-bold ${diagnosticsResult.details.hasValidCredentials ? 'text-green-600' : 'text-red-600'}`}>
                                                        {diagnosticsResult.details.hasValidCredentials ? '✓ Yes' : '✗ No'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Site Content Table</span>
                                                    <span className={`text-sm font-bold ${diagnosticsResult.details.hasSiteContentTable ? 'text-green-600' : 'text-red-600'}`}>
                                                        {diagnosticsResult.details.hasSiteContentTable ? '✓ Exists' : '✗ Missing'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Products Table</span>
                                                    <span className={`text-sm font-bold ${diagnosticsResult.details.hasProductsTable ? 'text-green-600' : 'text-red-600'}`}>
                                                        {diagnosticsResult.details.hasProductsTable ? '✓ Exists' : '✗ Missing'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Posts Table</span>
                                                    <span className={`text-sm font-bold ${diagnosticsResult.details.hasPostsTable ? 'text-green-600' : 'text-red-600'}`}>
                                                        {diagnosticsResult.details.hasPostsTable ? '✓ Exists' : '✗ Missing'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="ghost" onClick={() => setShowDiagnostics(false)}>Close</Button>
                                        <Button onClick={handleTestConnection} disabled={diagnosticsLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                                            <RefreshCw size={16} className="mr-2" /> Run Again
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            }

            {/* Link Picker Modal */}
            <LinkPickerModal
                isOpen={isLinkPickerOpen}
                onClose={() => setIsLinkPickerOpen(false)}
                onSelectLink={handleSelectLink}
                products={products}
                blogPosts={blogPosts}
                customPages={liveSiteContent.customPages || []}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteConfirm}
                title={deleteConfirm?.title || ''}
                message={deleteConfirm?.message || ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div >
    );
};

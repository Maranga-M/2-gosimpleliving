
import React, { useState, useEffect } from 'react';
import { Product, SiteContent, BlogPost, Role, ThemeColor, CustomPage } from '../types';
import { connectionManager, ConnectionStatus } from '../services/connectionManager';
import { dbService } from '../services/database';
import { PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT } from '../constants';
import toast from 'react-hot-toast';

// Sub-components
import { AdminLayout } from './admin/AdminLayout';
import { AdminProducts } from './admin/AdminProducts';
import { AdminBlog } from './admin/AdminBlog';
import { AdminThemeContent } from './admin/AdminThemeContent';
import { AdminConfig } from './admin/AdminConfig';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminOffers } from './AdminOffers';
import { AffiliateConfigTab } from './AffiliateConfigTab';
import { LinkPickerModal } from './LinkPickerModal';

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
    initialTab?: 'products' | 'content' | 'theme' | 'users' | 'config' | 'pages' | 'offers' | 'affiliate-config' | 'settings';
    dbStatus: ConnectionStatus;
    isUsingFallback: boolean;
    onRefresh?: () => Promise<void>;
    lastError?: string | null;
    onSeed?: (products: Product[], posts: BlogPost[], content: SiteContent) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    products,
    blogPosts,
    categories,
    liveSiteContent,
    currentUserRole,
    currentUserName,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct,
    onDuplicateProduct,
    onStartPreview,
    onUpdateSiteContent: _onUpdateSiteContent,
    onSaveChanges,
    onAddBlogPost,
    onUpdateBlogPost,
    onDeleteBlogPost,
    onDuplicateBlogPost,
    initialTab = 'products',
    dbStatus,
    isUsingFallback,
    onRefresh,
    lastError,
    onSeed
}) => {
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [activeSubTab, setActiveSubTab] = useState<'users' | 'settings'>('users');
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [linkPicker, setLinkPicker] = useState<{ isOpen: boolean, type: string, editor: any }>({ isOpen: false, type: '', editor: null });

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

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

    const initialPostState: BlogPost = {
        id: '',
        title: '',
        excerpt: '',
        content: '',
        author: currentUserName || 'Admin',
        date: new Date().toLocaleDateString('en-CA'),
        image: 'https://picsum.photos/id/101/800/400',
        status: 'draft',
        linkedProductIds: [],
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        focusKeyword: ''
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleTestConnection = async () => {
        setDiagnosticsLoading(true);
        try {
            const result = await dbService.testConnectionDetailed();
            if (result.success) toast.success('Connection test passed!');
            else toast.error('Connection test failed');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to run diagnostics');
        } finally {
            setDiagnosticsLoading(false);
        }
    };

    const handleCloudFetch = async () => {
        if (onRefresh) {
            setIsSeeding(true);
            await onRefresh();
            setIsSeeding(false);
        }
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

    const handleOpenLinkPicker = (type: string, editor: any) => {
        setLinkPicker({ isOpen: true, type, editor });
    };

    const handleSelectLink = (url: string) => {
        if (linkPicker.type === 'tiptap' && linkPicker.editor) {
            linkPicker.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        setLinkPicker({ isOpen: false, type: '', editor: null });
    };

    const handleSaveAffiliateConfig = async (config: any) => {
        const updatedContent = { ...liveSiteContent, affiliateConfig: config };
        _onUpdateSiteContent?.(updatedContent);
        if (onSaveChanges) {
            await onSaveChanges(updatedContent);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'products':
                return (
                    <AdminProducts
                        products={products}
                        categories={categories}
                        onAddProduct={onAddProduct}
                        onUpdateProduct={onUpdateProduct}
                        onDeleteProduct={onDeleteProduct}
                        onDuplicateProduct={onDuplicateProduct}
                        currentUserRole={currentUserRole}
                        initialFormState={initialFormState}
                    />
                );
            case 'analytics':
                return <AdminAnalytics />;
            case 'content':
                return (
                    <AdminBlog
                        blogPosts={blogPosts}
                        products={products}
                        onAddBlogPost={onAddBlogPost}
                        onUpdateBlogPost={onUpdateBlogPost}
                        onDeleteBlogPost={onDeleteBlogPost}
                        onDuplicateBlogPost={onDuplicateBlogPost}
                        currentUserRole={currentUserRole}
                        currentUserName={currentUserName}
                        initialPostState={initialPostState}
                        handleOpenLinkPicker={handleOpenLinkPicker}
                    />
                );
            case 'theme':
                return (
                    <AdminThemeContent
                        liveSiteContent={liveSiteContent}
                        categories={categories}
                        onStartPreview={onStartPreview}
                        onUpdateSiteContent={_onUpdateSiteContent}
                        onSaveChanges={onSaveChanges}
                    />
                );
            case 'config':
            case 'settings':
                return (
                    <AdminConfig
                        dbStatus={dbStatus}
                        isUsingFallback={isUsingFallback}
                        onRefresh={onRefresh}
                        lastError={lastError}
                        onSeed={onSeed}
                        diagnosticsLoading={diagnosticsLoading}
                        handleTestConnection={handleTestConnection}
                        currentUserRole={currentUserRole}
                        activeSubTab={activeSubTab}
                        setActiveSubTab={setActiveSubTab}
                    />
                );
            case 'offers':
                return (
                    <AdminOffers
                        siteContent={liveSiteContent}
                        onUpdateSiteContent={(field, val) => _onUpdateSiteContent?.({ ...liveSiteContent, [field]: val })}
                        onSaveChanges={() => onSaveChanges?.(liveSiteContent) || Promise.resolve()}
                        themeColor={liveSiteContent.themeColor || 'amber' as ThemeColor}
                    />
                );
            case 'affiliate-config':
                return (
                    <AffiliateConfigTab
                        config={liveSiteContent.affiliateConfig || {
                            globalEnabled: true
                        }}
                        onSave={handleSaveAffiliateConfig}
                    />
                );
            default:
                return <div>Tab under construction...</div>;
        }
    };

    return (
        <AdminLayout
            activeTab={activeTab === 'settings' ? 'config' : activeTab}
            onTabChange={handleTabChange}
            dbStatus={dbStatus}
            isUsingFallback={isUsingFallback}
            lastError={lastError}
            currentUserRole={currentUserRole}
            diagnosticsLoading={diagnosticsLoading}
            handleTestConnection={handleTestConnection}
            handleCloudFetch={handleCloudFetch}
            handleSeedData={handleSeedData}
            isSeeding={isSeeding}
        >
            {renderTabContent()}

            <LinkPickerModal
                isOpen={linkPicker.isOpen}
                onClose={() => setLinkPicker({ isOpen: false, type: '', editor: null })}
                onSelectLink={handleSelectLink}
                products={products}
                blogPosts={blogPosts}
            />
        </AdminLayout>
    );
};

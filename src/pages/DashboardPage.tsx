import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AdminDashboard } from '../../components/AdminDashboard';
import { Button } from '../../components/Button';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
    const { auth, products, blog, content, dbStatus, lastError, isUsingFallback, refreshData } = useApp();
    const { user } = auth;

    // Local state for dashboard tab since it's UI state specific to this page
    const [activeTab] = useState<'products' | 'content' | 'theme' | 'users' | 'config'>('products');

    const handleAddCategory = async (name: string) => {
        const categories = content.liveSiteContent.categories || [];
        if (categories.includes(name)) return;

        const updatedContent = {
            ...content.liveSiteContent,
            categories: [...categories, name]
        };

        content.updateSiteContent(updatedContent);
        try {
            await content.saveChanges(updatedContent);
            toast.success(`Category "${name}" added!`);
        } catch (e) {
            toast.error("Failed to save category change.");
        }
    };

    const handleDeleteCategory = async (name: string) => {
        const categories = content.liveSiteContent.categories || [];
        const updatedContent = {
            ...content.liveSiteContent,
            categories: categories.filter(c => c !== name)
        };

        content.updateSiteContent(updatedContent);
        try {
            await content.saveChanges(updatedContent);
            toast.success(`Category "${name}" removed.`);
        } catch (e) {
            toast.error("Failed to remove category.");
        }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-slate-500 mb-6">You do not have permission to view this page.</p>
                <Button onClick={() => window.location.href = '/'}>Go Home</Button>
            </div>
        );
    }

    return (
        <AdminDashboard
            products={products.products}
            blogPosts={blog.blogPosts}
            categories={products.categories}
            liveSiteContent={content.liveSiteContent}
            currentUserRole={user.role}
            currentUserName={user.name}

            // Product Actions
            onAddProduct={products.addProduct}
            onUpdateProduct={products.updateProduct}
            onDeleteProduct={products.deleteProduct}
            onDuplicateProduct={products.duplicateProduct}

            // Site Content Actions
            onStartPreview={content.startPreview}
            onUpdateSiteContent={content.updateSiteContent}
            onSaveChanges={content.saveChanges}

            // Category Actions
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}

            // Blog Actions
            onAddBlogPost={blog.addBlogPost}
            onUpdateBlogPost={blog.updateBlogPost}
            onDeleteBlogPost={blog.deleteBlogPost}
            onDuplicateBlogPost={blog.duplicateBlogPost}

            initialTab={activeTab}
            dbStatus={dbStatus}
            isUsingFallback={isUsingFallback}
            lastError={lastError}
            onRefresh={refreshData}
        />
    );
};

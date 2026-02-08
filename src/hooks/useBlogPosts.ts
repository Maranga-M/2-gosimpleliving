import { useState, useMemo } from 'react';
import { BlogPost } from '../../types';
import { dbService } from '../../services/database';
import toast from 'react-hot-toast';

export const useBlogPosts = () => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

    const publishedBlogPosts = useMemo(() => {
        return blogPosts.filter(b => b.status === 'published');
    }, [blogPosts]);

    const handleAddBlogPost = async (post: BlogPost) => {
        setBlogPosts(prev => [post, ...prev]);
        try { await dbService.createBlogPost(post); } catch (e: any) {
            setBlogPosts(prev => prev.filter(p => p.id !== post.id));
            toast.error(`Persistence Error: Failed to save blog post. ${e?.message || ''}`);
        }
    };

    const handleUpdateBlogPost = async (updatedPost: BlogPost) => {
        const original = blogPosts.find(p => p.id === updatedPost.id);
        setBlogPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        try { await dbService.updateBlogPost(updatedPost); } catch (e: any) {
            if (original) setBlogPosts(prev => prev.map(p => p.id === updatedPost.id ? original : p));
            toast.error(`Persistence Error: Failed to update blog post. ${e?.message || ''}`);
        }
    };

    const handleDeleteBlogPost = async (id: string) => {
        const original = blogPosts.find(p => p.id === id);
        setBlogPosts(prev => prev.filter(p => p.id !== id));
        try {
            await dbService.deleteBlogPost(id);
            toast.success('Blog post deleted successfully!');
        } catch (e: any) {
            console.error('Delete blog post error:', e);
            if (original) setBlogPosts(prev => [original, ...prev]);
            toast.error(`Failed to delete blog post from database: ${e?.message || 'Unknown error'}`);
        }
    };

    const handleDuplicateBlogPost = (postId: string) => {
        const originalPost = blogPosts.find(p => p.id === postId);
        if (!originalPost) return;

        const newPost: BlogPost = {
            ...originalPost,
            id: `b-${Date.now()}`,
            title: `[COPY] ${originalPost.title}`,
            status: 'draft',
        };

        handleAddBlogPost(newPost);
    };

    return {
        blogPosts,
        setBlogPosts,
        publishedBlogPosts,
        addBlogPost: handleAddBlogPost,
        updateBlogPost: handleUpdateBlogPost,
        deleteBlogPost: handleDeleteBlogPost,
        duplicateBlogPost: handleDuplicateBlogPost
    };
};

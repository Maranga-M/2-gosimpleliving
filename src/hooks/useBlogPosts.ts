import { useState, useMemo, useTransition } from 'react';
import { BlogPost } from '../../types';
import { dbService } from '../../services/database';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export const useBlogPosts = (initialData: BlogPost[] = [], userRole?: string, setIsLoginModalOpen?: (open: boolean) => void) => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialData);
    const [isPending, startTransition] = useTransition();

    const filteredPosts = useMemo(() => {
        // Admin/Editor sees ALL, guests/users see published only
        if (userRole === 'admin' || userRole === 'editor') {
            return blogPosts;
        }
        return blogPosts.filter(b => b.status === 'published');
    }, [blogPosts, userRole]);

    const ensureAuth = (): boolean => {
        if (!userRole || (userRole !== 'admin' && userRole !== 'editor')) {
            if (setIsLoginModalOpen) {
                setIsLoginModalOpen(true);
                toast("Please sign in as an Editor to make changes.", { icon: '🔐' });
            } else {
                toast.error("You do not have permission to make changes.");
            }
            return false;
        }
        return true;
    };

    const handleAddBlogPost = async (post: BlogPost) => {
        if (!ensureAuth()) return;

        startTransition(() => {
            setBlogPosts(prev => [post, ...prev]);
        });
        try {
            await dbService.createBlogPost(post);
        } catch (e: any) {
            startTransition(() => {
                setBlogPosts(prev => prev.filter(p => p.id !== post.id));
            });
            toast.error(`Persistence Error: Failed to save blog post. ${e?.message || ''}`);
        }
    };

    const handleUpdateBlogPost = async (updatedPost: BlogPost) => {
        if (!ensureAuth()) return;

        const original = blogPosts.find(p => p.id === updatedPost.id);
        startTransition(() => {
            setBlogPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        });
        try {
            await dbService.updateBlogPost(updatedPost);
        } catch (e: any) {
            if (original) {
                startTransition(() => {
                    setBlogPosts(prev => prev.map(p => p.id === updatedPost.id ? original : p));
                });
            }
            toast.error(`Persistence Error: Failed to update blog post. ${e?.message || ''}`);
        }
    };

    const handleDeleteBlogPost = async (id: string) => {
        if (!ensureAuth()) return;

        const original = blogPosts.find(p => p.id === id);
        startTransition(() => {
            setBlogPosts(prev => prev.filter(p => p.id !== id));
        });
        try {
            await dbService.deleteBlogPost(id);
            toast.success('Blog post deleted successfully!');
        } catch (e: any) {
            console.error('Delete blog post error:', e);
            if (original) {
                startTransition(() => {
                    setBlogPosts(prev => [original, ...prev]);
                });
            }
            toast.error(`Failed to delete blog post from database: ${e?.message || 'Unknown error'}`);
        }
    };

    const handleDuplicateBlogPost = (postId: string) => {
        if (!ensureAuth()) return;

        const originalPost = blogPosts.find(p => p.id === postId);
        if (!originalPost) return;

        const newPost: BlogPost = {
            ...originalPost,
            id: uuidv4(),
            title: `${originalPost.title} (Copy)`,
            slug: '', // Clear slug so DB trigger can generate a new one
            status: 'draft',
            heroImageUrl: '', // Clear hero image if it was specific
        };

        handleAddBlogPost(newPost);
    };

    return {
        blogPosts,
        setBlogPosts,
        publishedBlogPosts: filteredPosts,
        isUpdatingBlog: isPending,
        addBlogPost: handleAddBlogPost,
        updateBlogPost: handleUpdateBlogPost,
        deleteBlogPost: handleDeleteBlogPost,
        duplicateBlogPost: handleDuplicateBlogPost
    };
};

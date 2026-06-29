import { useState, useMemo, useTransition } from 'react';
import { Product, SortOption, Review } from '../../types';
import { dbService } from '../../services/database';
import { AnalyticsService } from '../../services/analytics';
import toast from 'react-hot-toast';

import { ConnectionStatus } from '../../services/connectionManager';

export const useProducts = (_dbStatus: ConnectionStatus, _userRole?: string, initialCategories: string[] = [], initialData: Product[] = []) => {
    const [products, setProducts] = useState<Product[]>(initialData);
    const [isPending, startTransition] = useTransition();

    // Categories merged from master list + actual products in DB
    const categories = useMemo(() => {
        const productCategories = Array.from(new Set(products.map(p => p.category)));
        const combined = Array.from(new Set([...initialCategories, ...productCategories]));
        const sorted = combined.filter(c => c && c !== 'All').sort();
        return ['All', ...sorted];
    }, [products, initialCategories]);

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('featured');
    const [showSalesOnly, setShowSalesOnly] = useState(false);

    // Smart Collection State
    const [smartCollectionFilter, setSmartCollectionFilter] = useState<string[] | null>(null);
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

    // Initial Load Logic usually handled by parent or a useData hook, 
    // but we need CRUD methods here.
    // For now, we will expose setProducts to allow initial data loading.

    const filteredProducts = useMemo(() => {
        let result = products;

        // Admin sees all, users see published only
        // Actually App.tsx filtered by 'published' for everyone in the main view.
        // We will expose a base filter logic effectively.
        // Adapt logic: In the main grid we only show published.

        result = result.filter(p => p.status === 'published');

        if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
        if (smartCollectionFilter) result = result.filter(p => smartCollectionFilter.includes(p.id));
        if (showSalesOnly) result = result.filter(p => p.originalPrice != null && p.originalPrice > p.price);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        return [...result].sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'rating': return b.rating - a.rating;
                default: return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
            }
        });
    }, [products, selectedCategory, searchQuery, sortBy, smartCollectionFilter, showSalesOnly]);

    // --- Actions ---

    const handleAddProduct = async (newProduct: Product) => {
        startTransition(() => {
            setProducts(prev => [newProduct, ...prev]);
        });
        try { await dbService.createProduct(newProduct); } catch (e: any) {
            console.error('[v0] handleAddProduct error:', e);
            startTransition(() => {
                setProducts(prev => prev.filter(p => p.id !== newProduct.id));
            });
            const errorMsg = e?.message || "Unknown error occurred";
            const displayMsg = errorMsg.includes('RLS') || errorMsg.includes('policy') 
                ? "Permission denied: You don't have permission to add products. Please ensure you're logged in as an admin or editor."
                : `Failed to save product: ${errorMsg}`;
            toast.error(displayMsg);
        }
    };

    const handleUpdateProduct = async (updatedProduct: Product) => {
        const original = products.find(p => p.id === updatedProduct.id);
        startTransition(() => {
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        });
        try { await dbService.updateProduct(updatedProduct); } catch (e: any) {
            console.error('[v0] handleUpdateProduct error:', e);
            if (original) {
                startTransition(() => {
                    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? original : p));
                });
            }
            const errorMsg = e?.message || "Unknown error occurred";
            const displayMsg = errorMsg.includes('RLS') || errorMsg.includes('policy') 
                ? "Permission denied: You don't have permission to update products. Please ensure you're logged in as an admin or editor."
                : `Failed to update product: ${errorMsg}`;
            toast.error(displayMsg);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        const original = products.find(p => p.id === id);
        startTransition(() => {
            setProducts(prev => prev.filter(p => p.id !== id));
        });
        try { await dbService.deleteProduct(id); } catch (e: any) {
            console.error('[v0] handleDeleteProduct error:', e);
            if (original) {
                startTransition(() => {
                    setProducts(prev => [original, ...prev]);
                });
            }
            const errorMsg = e?.message || "Unknown error occurred";
            const displayMsg = errorMsg.includes('RLS') || errorMsg.includes('policy') 
                ? "Permission denied: You don't have permission to delete products. Please ensure you're logged in as an admin or editor."
                : `Failed to delete product: ${errorMsg}`;
            toast.error(displayMsg);
        }
    };

    const handleDuplicateProduct = (productId: string) => {
        const originalProduct = products.find(p => p.id === productId);
        if (!originalProduct) return;

        const newProduct: Product = {
            ...originalProduct,
            id: `p-${Date.now()}`,
            title: `[COPY] ${originalProduct.title}`,
            status: 'draft',
            clicks: 0,
            localReviews: [],
            isBestSeller: false,
        };

        handleAddProduct(newProduct);
    };

    const handleAddReview = async (productId: string, review: Review) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const updatedProduct = {
            ...product,
            localReviews: [...(product.localReviews || []), review]
        };

        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));

        try {
            await dbService.updateProduct(updatedProduct);
        } catch (e: any) {
            console.error('[v0] handleAddReview error:', e);
            setProducts(prev => prev.map(p => p.id === productId ? product : p));
            const errorMsg = e?.message || "Unknown error occurred";
            const displayMsg = errorMsg.includes('RLS') || errorMsg.includes('policy') 
                ? "Permission denied: You don't have permission to update products."
                : `Failed to save review: ${errorMsg}`;
            toast.error(displayMsg);
        }
    };

    const trackProductClick = (productId: string) => {
        const product = products.find(p => p.id === productId);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, clicks: (p.clicks || 0) + 1 } : p));
        if (product) AnalyticsService.trackProductClick(productId, product.title, product.price);
    };

    return {
        products,
        setProducts,
        filteredProducts,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        showSalesOnly,
        setShowSalesOnly,
        smartCollectionFilter,
        setSmartCollectionFilter,
        activeCollectionId,
        setActiveCollectionId,
        isUpdatingCatalogue: isPending,

        // Actions
        addProduct: handleAddProduct,
        updateProduct: handleUpdateProduct,
        deleteProduct: handleDeleteProduct,
        duplicateProduct: handleDuplicateProduct,
        addReview: handleAddReview,
        trackProductClick
    };
};

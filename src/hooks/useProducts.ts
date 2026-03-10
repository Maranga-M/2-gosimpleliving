import { useState, useMemo, useTransition } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, SortOption, Review } from '../../types';
import { dbService } from '../../services/database';
import { AnalyticsService } from '../../services/analytics';
import toast from 'react-hot-toast';

import { ConnectionStatus } from '../../services/connectionManager';

export const useProducts = (_dbStatus: ConnectionStatus, userRole?: string, initialCategories: string[] = [], initialData: Product[] = [], setIsLoginModalOpen?: (open: boolean) => void) => {
    const [products, setProducts] = useState<Product[]>(initialData);
    const [isPending, startTransition] = useTransition();

    // Categories merged from master list + actual products in DB
    const categories = useMemo(() => {
        let visibleProducts = products;
        if (userRole !== 'admin' && userRole !== 'editor') {
            visibleProducts = visibleProducts.filter(p => p.status === 'published');
        }

        const productCategories = Array.from(new Set(visibleProducts.map(p => p.category)));
        const combined = Array.from(new Set([...initialCategories, ...productCategories]));
        const sorted = combined.filter(c => c && c !== 'All').sort();
        return ['All', ...sorted];
    }, [products, initialCategories, userRole]);

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('featured');
    const [showSalesOnly, setShowSalesOnly] = useState(false);

    // Smart Collection State
    const [smartCollectionFilter, setSmartCollectionFilter] = useState<string[] | null>(null);
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

    const filteredProducts = useMemo(() => {
        let result = products;

        // Admin/Editor sees ALL, guests/users see published only
        if (userRole !== 'admin' && userRole !== 'editor') {
            result = result.filter(p => p.status === 'published');
        }

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
    }, [products, selectedCategory, searchQuery, sortBy, smartCollectionFilter, showSalesOnly, userRole]);

    // --- Actions ---

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

    const handleAddProduct = async (newProduct: Product) => {
        if (!ensureAuth()) return;

        startTransition(() => {
            setProducts(prev => [newProduct, ...prev]);
        });
        try { await dbService.createProduct(newProduct); } catch (e) {
            startTransition(() => {
                setProducts(prev => prev.filter(p => p.id !== newProduct.id));
            });
            toast.error("Persistence Error: Failed to save product to database.");
        }
    };

    const handleUpdateProduct = async (updatedProduct: Product) => {
        if (!ensureAuth()) return;

        const original = products.find(p => p.id === updatedProduct.id);
        startTransition(() => {
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        });
        try { await dbService.updateProduct(updatedProduct); } catch (e) {
            if (original) {
                startTransition(() => {
                    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? original : p));
                });
            }
            toast.error("Persistence Error: Failed to update product in database.");
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!ensureAuth()) return;

        const original = products.find(p => p.id === id);
        startTransition(() => {
            setProducts(prev => prev.filter(p => p.id !== id));
        });
        try { await dbService.deleteProduct(id); } catch (e) {
            if (original) {
                startTransition(() => {
                    setProducts(prev => [original, ...prev]);
                });
            }
            toast.error("Persistence Error: Failed to delete product.");
        }
    };

    const handleDuplicateProduct = (productId: string) => {
        if (!ensureAuth()) return;

        const originalProduct = products.find(p => p.id === productId);
        if (!originalProduct) return;

        const newProduct: Product = {
            ...originalProduct,
            id: uuidv4(),
            title: `${originalProduct.title} (Copy)`,
            status: 'draft',
            clicks: 0,
            localReviews: [],
            isBestSeller: false,
        };

        handleAddProduct(newProduct);
    };

    const handleAddReview = async (productId: string, review: Review) => {
        // Reviews can be added by anyone in this implementation (or restricted in RLS)
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const updatedProduct = {
            ...product,
            localReviews: [...(product.localReviews || []), review]
        };

        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));

        try {
            await dbService.updateProduct(updatedProduct);
        } catch (e) {
            setProducts(prev => prev.map(p => p.id === productId ? product : p));
            toast.error("Failed to save review. Ensure your database is connected.");
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

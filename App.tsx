import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Menu, X, LogOut, Heart, LayoutDashboard, AlertTriangle, Moon, Sun, User as UserIcon, Search, Loader2, FileText, ArrowLeft, Sparkles } from 'lucide-react';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { View, Product } from './types';
import { Button } from './components/Button';
import { ChatAssistant } from './components/ChatAssistant';
import { ProductModal } from './components/ProductModal';
import { LoginModal } from './components/LoginModal';
import { Wishlist } from './components/Wishlist';
import { NotificationBell } from './components/NotificationBell';
import { AnalyticsService } from './services/analytics';
import { Toaster } from 'react-hot-toast';
import { AffiliateScripts } from './src/components/AffiliateScripts';
import { Analytics } from '@vercel/analytics/react';
import { lazyWithRetry } from './src/utils/lazyWithRetry';

import { AppProvider, useApp } from './src/contexts/AppContext';
import { HomePage } from './src/pages/HomePage';
import { Footer } from './components/Footer';
import { AdSenseScript } from './src/components/AdSenseScript';

const DashboardPage = lazyWithRetry(() => import('./src/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SettingsPage = lazyWithRetry(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BlogPage = lazyWithRetry(() => import('./components/BlogPage').then(m => ({ default: m.BlogPage })));
const PasswordResetPage = lazyWithRetry(() => import('./src/pages/PasswordResetPage').then(m => ({ default: m.PasswordResetPage })));
const PrivacyPolicyPage = lazyWithRetry(() => import('./src/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const SitemapPage = lazyWithRetry(() => import('./src/pages/SitemapPage').then(m => ({ default: m.SitemapPage })));
const CustomPageRenderer = lazyWithRetry(() => import('./src/pages/CustomPageRenderer').then(m => ({ default: m.CustomPageRenderer })));
const ClickBankLandingPage = lazyWithRetry(() => import('./src/pages/ClickBankLandingPage').then(m => ({ default: m.ClickBankLandingPage })));
const OffersListPage = lazyWithRetry(() => import('./src/pages/OffersListPage').then(m => ({ default: m.OffersListPage })));
const DebugPage = lazyWithRetry(() => import('./src/pages/Debug').then(m => ({ default: m.default })));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { auth, products, blog, content, dbStatus, lastError, isUsingFallback, isDarkMode, toggleDarkMode, notifications, markNotificationRead, clearAllNotifications } = useApp();
  const { user, isLoginModalOpen, setIsLoginModalOpen, signOut, toggleWishlist } = auth;
  const { siteContent, siteLogoUrl } = content;
  const { trackProductClick } = products;

  const [currentView, setCurrentView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('article')) return 'blog';

    const savedView = localStorage.getItem('gsl_current_view') as View;
    const validViews: View[] = ['home', 'dashboard', 'settings', 'wishlist', 'blog', 'pages', 'offers'];
    if (savedView && validViews.includes(savedView)) {
      if (savedView === 'dashboard' && !user) return 'home';
      return savedView;
    }

    return 'home';
  });

  React.useEffect(() => {
    if (currentView) {
      localStorage.setItem('gsl_current_view', currentView);
    }
  }, [currentView]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const location = useLocation();
  const isRouterPath = ['/privacy-policy', '/sitemap', '/password-reset'].includes(location.pathname) || location.pathname.startsWith('/p/') || location.pathname.startsWith('/offers/');

  React.useEffect(() => {
    AnalyticsService.init();

    let virtualPath = '/';
    if (location.pathname !== '/') {
      virtualPath = location.pathname;
    } else {
      virtualPath = `/${currentView === 'home' ? '' : currentView}`;
    }

    AnalyticsService.trackPageView(virtualPath);
    AnalyticsService.checkPendingConversion();

  }, [location.pathname, currentView]);

  React.useEffect(() => {
    if (currentView === 'home' && siteContent?.pageTitle) {
      document.title = siteContent.pageTitle;
    }
  }, [currentView, siteContent?.pageTitle]);

  const getThemeTextClass = () => {
    switch (siteContent.themeColor) {
      case 'blue': return "text-blue-600 dark:text-blue-400";
      case 'rose': return "text-rose-600 dark:text-rose-400";
      case 'emerald': return "text-emerald-600 dark:text-emerald-400";
      case 'indigo': return "text-indigo-600 dark:text-indigo-400";
      default: return "text-amber-600 dark:text-amber-400";
    }
  };

  const onNavigateWithProduct = (viewOrAction: any) => {
    if (typeof viewOrAction === 'string') {
      setCurrentView(viewOrAction as View);
      window.scrollTo(0, 0);
    } else if (viewOrAction && viewOrAction.type === 'open_product') {
      setSelectedProduct(viewOrAction.product);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('home');
    setMobileMenuOpen(false);
  };

  if (dbStatus === 'loading' && products.products.length === 0 && !siteContent.heroTitle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm font-medium text-slate-500">Loading GoSimpleLiving...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-all duration-300`}>

      {/* Admin-only Fallback/Offline Banner */}
      {isUsingFallback && user?.role === 'admin' && (
        <div className="bg-amber-500 text-white py-1.5 px-4 text-[11px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2 shadow-sm z-50">
          <AlertTriangle size={12} /> Admin Alert: {dbStatus === 'offline' ? 'Offline Mode (Using Local Catalogue)' : 'Local Catalogue Active'}
          <button onClick={() => setCurrentView('dashboard')} className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
            Sync to DB
          </button>
        </div>
      )}

      {/* Preview Mode Banner (Admin Only) */}
      {content.isPreviewing && user?.role === 'admin' && (
        <div className="bg-purple-600 text-white py-2 px-4 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-4 shadow-lg sticky top-0 z-[60] animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="animate-pulse" />
            <span>Preview Mode Active: Viewing draft theme changes</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
            >
              Back to Customizer
            </button>
            <button
              onClick={content.exitPreview}
              className="bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
            >
              <X size={14} /> Exit Preview
            </button>
          </div>
        </div>
      )}

      {/* Announcement Bar */}
      {siteContent.announcementBar && (
        <div className={`w-full py-2 px-4 text-center text-sm font-medium text-white shadow-inner ${siteContent.themeColor === 'blue' ? 'bg-blue-600' : siteContent.themeColor === 'rose' ? 'bg-rose-600' : siteContent.themeColor === 'emerald' ? 'bg-emerald-600' : siteContent.themeColor === 'indigo' ? 'bg-indigo-600' : 'bg-slate-900 dark:bg-slate-800'}`}>{siteContent.announcementBar}</div>
      )}

      <AdSenseScript />
      <AffiliateScripts />

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className={`p-2 rounded-xl ${siteContent.themeColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : siteContent.themeColor === 'rose' ? 'bg-rose-100 dark:bg-rose-900/30' : siteContent.themeColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' : siteContent.themeColor === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}><span className="text-xl">🌿</span></div>
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={siteContent.logoText} className="h-8 object-contain" />
              ) : (
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">{siteContent.logoText}</span>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => setCurrentView('home')} className={`text-sm font-medium transition-colors ${currentView === 'home' ? getThemeTextClass() : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{siteContent.uiText.shopNav}</button>
              <button onClick={() => setCurrentView('blog')} className={`text-sm font-medium transition-colors ${currentView === 'blog' ? getThemeTextClass() : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{siteContent.uiText.blogNav}</button>

              {(siteContent.customPages || []).filter(p => p.showInNav && p.status === 'published').sort((a, b) => (a.navOrder || 0) - (b.navOrder || 0)).map(page => (
                <Link key={page.id} to={`/p/${page.slug}`} className="text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">{page.title}</Link>
              ))}

              {siteContent.showOffersInNav && (
                <button onClick={() => setCurrentView('offers')} className={`text-sm font-medium transition-colors ${currentView === 'offers' ? getThemeTextClass() : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Offers</button>
              )}

              {(siteContent.showPagesInNav !== false) && (
                <button onClick={() => setCurrentView('pages')} className={`text-sm font-medium transition-colors ${currentView === 'pages' ? getThemeTextClass() : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{siteContent.uiText?.pagesNav || 'Pages'}</button>
              )}

              <div className="relative group hidden sm:block">
                <input
                  type="text"
                  placeholder={siteContent.uiText.searchPlaceholder}
                  value={products.searchQuery}
                  onChange={(e) => products.setSearchQuery(e.target.value)}
                  className="w-40 sm:w-48 md:w-56 lg:w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-all dark:text-white"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300" size={16} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <NotificationBell notifications={notifications} onMarkRead={markNotificationRead} onClearAll={clearAllNotifications} />
              {auth.isLoading ? (
                <div className="flex items-center px-4">
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                </div>
              ) : user ? (
                <>
                  <button onClick={() => setCurrentView('wishlist')} className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${currentView === 'wishlist' ? 'text-red-500 bg-red-50 dark:bg-red-900/10' : 'text-slate-600 dark:text-slate-400'}`} title="My Wishlist"><Heart size={20} className={currentView === 'wishlist' ? "fill-current" : ""} />{user.wishlist.length > 0 && (<span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>)}</button>
                  {(user.role === 'admin' || user.role === 'editor') && (<button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${currentView === 'dashboard' ? getThemeTextClass() : 'text-slate-600 dark:text-slate-400'}`} title="Dashboard"><LayoutDashboard size={20} /></button>)}
                  <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800"><div className="text-right hidden sm:block"><p className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</p><p className="text-[10px] text-slate-500 uppercase tracking-wide">{user.role}</p></div><button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sign Out"><LogOut size={18} /></button></div>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setIsLoginModalOpen(true)} themeColor={siteContent.themeColor}><UserIcon size={16} className="mr-2" /> Sign In</Button>
              )}
              <button className="md:hidden p-2 text-slate-600 dark:text-slate-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Search..."
              value={products.searchQuery}
              onChange={(e) => products.setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:outline-none"
            />
            <div className="space-y-2">
              <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">{siteContent.uiText.shopNav}</button>
              <button onClick={() => { setCurrentView('blog'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">{siteContent.uiText.blogNav}</button>

              {(siteContent.customPages || []).filter(p => p.showInNav && p.status === 'published').sort((a, b) => (a.navOrder || 0) - (b.navOrder || 0)).map(page => (
                <Link key={page.id} to={`/p/${page.slug}`} onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">{page.title}</Link>
              ))}

              {siteContent.showOffersInNav && (
                <button onClick={() => { setCurrentView('offers'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Offers</button>
              )}

              {(siteContent.showPagesInNav !== false) && (
                <button onClick={() => { setCurrentView('pages'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">{siteContent.uiText.pagesNav}</button>
              )}
              {user && (<button onClick={() => { setCurrentView('wishlist'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">{siteContent.uiText.wishlistTitle}</button>)}
              {user && (user.role === 'admin' || user.role === 'editor') && (<button onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Dashboard</button>)}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {/* Admin-only Diagnostic Status Alert */}
        {lastError && user?.role === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3 shadow-sm">
              <AlertTriangle size={18} className="shrink-0" />
              <div className="flex-grow">
                <p className="font-bold">Admin Alert - DB Status: {dbStatus === 'offline' ? 'Disconnected' : 'Catalogue Sync Needed'}</p>
                <p className="opacity-90 mt-1">{lastError}</p>
                <p className="text-xs mt-2 opacity-75">
                  💡 Tip: Check your Supabase credentials in .env or use the Admin Dashboard to sync data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Views */}
        {!isRouterPath && currentView === 'home' && <HomePage onNavigate={onNavigateWithProduct} />}
        {!isRouterPath && currentView === 'dashboard' && (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {currentView === 'settings' && (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          </ErrorBoundary>
        )}

        {currentView === 'wishlist' && (
          <Wishlist
            products={products.products.filter(p => user?.wishlist?.includes(p.id))}
            onOpenDetails={(p) => setSelectedProduct(p)}
            onRemove={toggleWishlist}
            onGoHome={() => setCurrentView('home')}
            uiText={siteContent.uiText}
            themeColor={siteContent.themeColor}
            affiliateConfig={siteContent.affiliateConfig}
            amazonAssociatesId={siteContent.amazonAssociatesId}
          />
        )}

        {currentView === 'blog' && (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <BlogPage
                posts={blog.publishedBlogPosts}
                products={products.products}
                onOpenProduct={(p: Product) => setSelectedProduct(p)}
                onGoHome={() => setCurrentView('home')}
                onRecordClick={trackProductClick}
                themeColor={siteContent.themeColor}
                affiliateConfig={siteContent.affiliateConfig}
                amazonAssociatesId={siteContent.amazonAssociatesId}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {currentView === 'pages' && (
          <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in duration-500">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">{siteContent.uiText?.pagesNav || 'Pages'}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(siteContent.customPages || []).filter(p => p.status === 'published').map(page => (
                <Link key={page.id} to={`/p/${page.slug}`} className="group bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-start gap-4">
                  <div className={`p-3 rounded-2xl ${siteContent.themeColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : siteContent.themeColor === 'rose' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : siteContent.themeColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : siteContent.themeColor === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:underline mb-2">{page.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">
                      {page.content.replace(/[#*`]/g, '').slice(0, 150)}...
                    </p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    Read Guide <ArrowLeft size={16} className="rotate-180" />
                  </div>
                </Link>
              ))}
            </div>
            {(siteContent.customPages || []).filter(p => p.status === 'published').length === 0 && (
              <div className="text-center py-24 bg-slate-100/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No pages published yet. Check back soon!</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'offers' && (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <OffersListPage />
            </Suspense>
          </ErrorBoundary>
        )}
      </main >

      {/* Footer */}
      {!isRouterPath && currentView === 'home' && <Footer />}
      <Routes>
        <Route path="/privacy-policy" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicyPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/sitemap" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SitemapPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/offers/:slug" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ClickBankLandingPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/p/:slug" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CustomPageRenderer />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/password-reset" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PasswordResetPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/debug" element={
          <Suspense fallback={<PageLoader />}>
            <DebugPage />
          </Suspense>
        } />
      </Routes>

      <ChatAssistant />

      {
        selectedProduct && (
          <ProductModal
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddReview={products.addReview}
            isWishlisted={user?.wishlist?.includes(selectedProduct.id) || false}
            onToggleWishlist={toggleWishlist}
            onRecordClick={trackProductClick}
            themeColor={siteContent.themeColor}
          />
        )
      }

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onNavigateToSettings={() => { setIsLoginModalOpen(false); setCurrentView('settings'); }}
      />
    </div >
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Toaster position="top-right" />
      <Analytics />
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;

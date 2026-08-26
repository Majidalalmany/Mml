import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Globe, 
  Search, 
  ShoppingBag, 
  Star, 
  Filter, 
  SlidersHorizontal, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Zap, 
  Tag, 
  Sliders, 
  Coins, 
  X,
  Package,
  Heart
} from 'lucide-react';
import { 
  GlobalStore, 
  GlobalStoreCategory, 
  GlobalProduct, 
  GlobalStoreConfig, 
  GlobalStoreId,
  AdminUser
} from '../../types';
import { 
  GLOBAL_STORES, 
  GLOBAL_CATEGORIES, 
  getGlobalStoreConfig, 
  saveGlobalStoreConfig, 
  queryGlobalStoreProducts,
  getLocalCart
} from '../../lib/globalStoreService';
import { GlobalProductModal } from './GlobalProductModal';
import { GlobalCartDrawer } from './GlobalCartDrawer';

interface GlobalStoresHubProps {
  currentUser?: AdminUser | null;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  initialStoreId?: GlobalStoreId;
}

export const GlobalStoresHub: React.FC<GlobalStoresHubProps> = ({
  currentUser,
  onShowToast = () => {},
  initialStoreId
}) => {
  // Navigation State
  const [selectedStoreId, setSelectedStoreId] = useState<GlobalStoreId | 'all'>(initialStoreId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<GlobalStoreCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>('');

  // Products Data & Pagination
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPricingConfigOpen, setIsPricingConfigOpen] = useState<boolean>(false);

  // Cart Counter State
  const [cartItemsCount, setCartItemsCount] = useState<number>(() => {
    return getLocalCart().reduce((sum, item) => sum + item.quantity, 0);
  });

  // Config State
  const [pricingConfig, setPricingConfig] = useState<GlobalStoreConfig>(() => getGlobalStoreConfig());

  // Listen for cart changes
  useEffect(() => {
    const handleCartUpdate = () => {
      const cart = getLocalCart();
      setCartItemsCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };
    window.addEventListener('jahez_cart_updated', handleCartUpdate);
    return () => window.removeEventListener('jahez_cart_updated', handleCartUpdate);
  }, []);

  // Active Store Metadata
  const currentStore = useMemo(() => {
    if (selectedStoreId === 'all') return null;
    return GLOBAL_STORES.find(s => s.id === selectedStoreId) || null;
  }, [selectedStoreId]);

  // Fetch / Query Products Stream
  const loadProducts = useCallback((targetPage: number = 1, append: boolean = false) => {
    if (targetPage === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const res = queryGlobalStoreProducts({
        storeId: selectedStoreId,
        category: selectedCategory,
        searchQuery: activeSearchTerm,
        page: targetPage,
        pageSize: 12
      });

      if (append) {
        setProducts(prev => [...prev, ...res.products.filter(p => !prev.some(x => x.id === p.id))]);
      } else {
        setProducts(res.products);
      }

      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
      setPage(targetPage);
    } catch (e) {
      console.error('Error fetching global products:', e);
      onShowToast('حدث خطأ أثناء تحميل منتجات المتاجر العالمية', 'error');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [selectedStoreId, selectedCategory, activeSearchTerm, onShowToast]);

  // Trigger query on filters change
  useEffect(() => {
    loadProducts(1, false);
  }, [selectedStoreId, selectedCategory, activeSearchTerm, loadProducts]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
  };

  // Infinite Scroll Trigger
  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      loadProducts(page + 1, true);
    }
  };

  // Save Pricing Settings
  const handleSavePricingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveGlobalStoreConfig(pricingConfig);
    setPricingConfig(updated);
    setIsPricingConfigOpen(false);
    onShowToast('تم تحديث وحفظ معادلة تسعير المتاجر العالمية بنجاح', 'success');
    // Refresh products list with updated calculated prices
    loadProducts(1, false);
  };

  // Quick Tags
  const quickSearchTags = [
    'فستان أسود سهرة',
    'كمبيوتر محمول Core i7',
    'ساعة يد ذكية AMOLED',
    'سماعات رأس عازلة',
    'حذاء رياضي مبطن',
    'طقم رجالي كاجوال',
    'حقيبة لابتوب ضد السرقة',
    'مجموعة مكياج متكاملة'
  ];

  return (
    <div className="space-y-6 dir-rtl animate-in fade-in" dir="rtl">
      
      {/* Top Main Stores Hub Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-6">
        
        {/* Banner Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  المتاجر العالمية والشحن المباشر لليمن
                </h1>
                <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                  أسعار محلية شاملة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                تسوق مباشرة من كبرى المتاجر العالمية (Amazon • SHEIN • AliExpress) بأسعار محسوبة بالريال اليمني تشمل التوصيل حتى باب بيتك.
              </p>
            </div>
          </div>

          {/* Action buttons (Cart + Pricing Settings) */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Pricing Formula Config Trigger */}
            <button
              onClick={() => setIsPricingConfigOpen(true)}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="تعديل معادلة التسعير وصرف العملة"
            >
              <Coins className="w-4 h-4 text-amber-600" />
              <span>معادلة التسعير: ({pricingConfig.currencyRate} ر.ي/$)</span>
            </button>

            {/* Floating / Header Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer mr-auto md:mr-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>سلة المشتريات</span>
              {cartItemsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 1. Main Stores Hub: Store Selection Cards (Amazon, Shein, AliExpress) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>اختر المتجر العالمي للتصفح:</span>
            </span>

            {selectedStoreId !== 'all' && (
              <button
                onClick={() => {
                  setSelectedStoreId('all');
                  setSelectedCategory('all');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>عرض جميع المتاجر</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GLOBAL_STORES.map((store) => {
              const isSelected = selectedStoreId === store.id;
              return (
                <div
                  key={store.id}
                  onClick={() => {
                    setSelectedStoreId(store.id);
                    setSelectedCategory(store.defaultCategory);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg ring-2 ring-blue-500/50'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-gray-200 shadow-xs hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base">{store.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : store.badgeColor
                          }`}>
                            {store.nameEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs mt-0.5 opacity-80">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold">{store.rating}</span>
                          <span>• توصيل: {store.deliveryDays}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                  </div>

                  <p className={`text-xs mt-3 line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {store.description}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-gray-100/20 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{store.trustedBadge}</span>
                    </span>
                    <span className="underline font-bold">
                      {isSelected ? 'المتجر مفعل حالياً' : 'تصفح منتجات المتجر'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Top Search Bar & Full Results Stream */}
        <div className="space-y-3 pt-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={currentStore ? `ابحث عن أي منتج في ${currentStore.name} (مثال: فستان أسود، لابتوب، ساعة ذكية)...` : "ابحث في ملايين السلع بـ Amazon و SHEIN و AliExpress..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-slate-900 text-sm font-medium border border-gray-200 rounded-2xl pl-24 pr-11 py-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 pointer-events-none" />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute left-24 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="absolute left-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              >
                بحث مباشر
              </button>
            </div>
          </form>

          {/* Quick Search Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <span className="text-slate-400 font-bold shrink-0">أكثر عمليات البحث:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag);
                  setActiveSearchTerm(tag);
                }}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                  activeSearchTerm === tag
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                    : 'bg-white text-slate-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Store Main Page & Default Categories Tabs */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">الأقسام والتصنيفات الافتراضية:</span>
            {activeSearchTerm && (
              <div className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-2">
                <span>نتائج البحث عن: <strong>"{activeSearchTerm}"</strong></span>
                <button onClick={handleClearSearch} className="underline font-bold cursor-pointer">
                  إلغاء
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              جميع الأقسام
            </button>

            {GLOBAL_CATEGORIES.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isCatActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isCatActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Products Stream & Results Grid */}
      <div className="space-y-4">
        
        {/* Results Header Meta */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>المنتجات المعروضة:</span>
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md font-mono text-[11px]">
              {products.length} من أصل {totalCount} صنف
            </span>
            {currentStore && (
              <span className="text-slate-400">في متجر {currentStore.name}</span>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            جميع الأسعار شاملة الشحن والتوصيل لليمن
          </div>
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3 bg-gray-200 rounded-md w-1/2" />
                <div className="h-8 bg-gray-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">لا توجد نتائج مطابقة لبحثك</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                جرب تغيير كلمة البحث أو اختيار قسم آخر من الأقسام الافتراضية بالأعلى.
              </p>
            </div>
            <button
              onClick={() => {
                handleClearSearch();
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const storeMeta = GLOBAL_STORES.find(s => s.id === product.storeId) || GLOBAL_STORES[0];

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    
                    {/* Image Container with Badges */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/70">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />

                      {/* Store Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${storeMeta.badgeColor}`}>
                          {product.storeName}
                        </span>
                      </div>

                      {/* Promotion Badge */}
                      {product.badge && (
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                            {product.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Title */}
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h4>
                    </div>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                      </div>
                      <span>({product.reviewsCount.toLocaleString()})</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-semibold">{storeMeta.deliveryDays}</span>
                    </div>

                  </div>

                  {/* Strictly Calculated Local Price (Hiding Original Price) */}
                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">السعر النهائي الشامل:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-black text-blue-700 font-mono">
                          {product.displayedPrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">ريال</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                      className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border border-blue-200 hover:border-blue-600 cursor-pointer flex items-center gap-1"
                    >
                      <span>تفاصيل</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll / Load More Action */}
        {hasMore && products.length > 0 && (
          <div className="text-center pt-6 pb-4">
            <button
              onClick={handleLoadMore}
              disabled={isFetchingMore}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-slate-800 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-xs hover:border-blue-400 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isFetchingMore ? 'animate-spin' : ''}`} />
              <span>{isFetchingMore ? 'جاري استيراد المزيد من النتائج...' : 'عرض المزيد من المنتجات (المزيد)'}</span>
            </button>
          </div>
        )}

      </div>

      {/* Product Details & Variant Selection Modal */}
      <GlobalProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCart={() => setIsCartOpen(true)}
        onShowToast={onShowToast}
      />

      {/* Cart Drawer */}
      <GlobalCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onShowToast={onShowToast}
      />

      {/* Pricing Formula Config Modal */}
      {isPricingConfigOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl animate-in fade-in" dir="rtl">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">معادلة تسعير المتاجر العالمية</h3>
                  <span className="text-[11px] text-slate-400">إدارة سعر الصرف وهامش الشحن الدولي</span>
                </div>
              </div>

              <button
                onClick={() => setIsPricingConfigOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formula Explanation */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block">المعادلة المعتمدة رياضياً:</span>
              <div className="p-2 bg-white rounded-xl border border-gray-200 font-mono text-[11px] text-blue-700 font-bold dir-ltr text-center">
                Math.ceil(((Original_Price * Rate) + Profit) / 50) * 50
              </div>
              <span className="text-[11px] text-slate-500 block">
                يتم تقريب السعر النهائي تلقائياً لأقرب 50 ريال مع إخفاء سعر المصدر تماماً.
              </span>
            </div>

            <form onSubmit={handleSavePricingConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">سعر صرف الدولار (Currency Rate):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={pricingConfig.currencyRate}
                    onChange={(e) => setPricingConfig({ ...pricingConfig, currencyRate: Number(e.target.value) || 535 })}
                    className="w-full text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">ريال / 1$</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">هامش وتكلفة الشحن الدولي (Shipping Profit):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={pricingConfig.shippingProfit}
                    onChange={(e) => setPricingConfig({ ...pricingConfig, shippingProfit: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">ريال يمني</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPricingConfigOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  حفظ وتطبيق المعادلة
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

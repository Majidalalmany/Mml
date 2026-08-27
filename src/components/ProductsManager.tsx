import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Package, 
  CheckCircle, 
  XCircle, 
  Database, 
  RefreshCw, 
  Tag, 
  Store as StoreIcon, 
  SlidersHorizontal, 
  RotateCcw, 
  Coins, 
  ArrowUpDown,
  X
} from 'lucide-react';
import { Product, Category, Store, AdminUser } from '../types';
import { hasModulePermission } from '../lib/permissions';

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  stores?: Store[];
  isLoading: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleInStock: (product: Product) => void;
  onSeedData: () => void;
  currentUser?: AdminUser | null;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products = [],
  categories = [],
  stores = [],
  isLoading,
  onAddProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onToggleInStock,
  onSeedData,
  currentUser
}) => {
  // Live Multi-Filter Engine State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'discount_first'>('default');
  const [activePricePreset, setActivePricePreset] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canCreate = hasModulePermission(currentUser, 'products', 'create');
  const canEdit = hasModulePermission(currentUser, 'products', 'edit');
  const canDelete = hasModulePermission(currentUser, 'products', 'delete');

  // Build unified Stores lookup list (merging stores array + any embedded store metadata in products)
  const storeOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    // 1. From stores prop
    stores.forEach((st) => {
      if (st.id && st.name) {
        map.set(st.id, { id: st.id, name: st.name });
      }
    });

    // 2. From products storeId/storeName
    products.forEach((p) => {
      if (p.storeId) {
        const existing = map.get(p.storeId);
        map.set(p.storeId, {
          id: p.storeId,
          name: p.storeName || (existing ? existing.name : `متجر ${p.storeId}`)
        });
      } else if (p.storeName) {
        const found = Array.from(map.values()).some(s => s.name === p.storeName);
        if (!found) {
          map.set(p.storeName, { id: p.storeName, name: p.storeName });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [stores, products]);

  // Handle Quick Price Presets
  const handlePricePreset = (presetId: string, min: string, max: string) => {
    setActivePricePreset(presetId);
    setMinPrice(min);
    setMaxPrice(max);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStore('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('all');
    setStockFilter('all');
    setSortBy('default');
    setActivePricePreset('all');
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedStore !== 'all' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    selectedCategory !== 'all' ||
    stockFilter !== 'all' ||
    sortBy !== 'default'
  );

  // Live Simultaneous Multi-Factor Filtering Engine
  const filteredProducts = useMemo(() => {
    const safeProducts = products || [];
    const term = searchTerm.trim().toLowerCase();
    const minP = minPrice.trim() !== '' ? parseFloat(minPrice) : null;
    const maxP = maxPrice.trim() !== '' ? parseFloat(maxPrice) : null;

    const result = safeProducts.filter((item) => {
      // 1. Title / Keyword Search (Matches product name, SKU, description or store name)
      if (term) {
        const matchesName = item.name ? item.name.toLowerCase().includes(term) : false;
        const matchesSku = item.sku ? item.sku.toLowerCase().includes(term) : false;
        const matchesDesc = item.description ? item.description.toLowerCase().includes(term) : false;
        const matchesStoreName = item.storeName ? item.storeName.toLowerCase().includes(term) : false;
        if (!matchesName && !matchesSku && !matchesDesc && !matchesStoreName) {
          return false;
        }
      }

      // 2. Store Filter (Simultaneous store ID or store name check)
      if (selectedStore !== 'all') {
        const storeMatch = 
          item.storeId === selectedStore ||
          item.storeName === selectedStore;
        if (!storeMatch) return false;
      }

      // 3. Price Range Filter (Simultaneous min and max boundary checking)
      const effectivePrice = (item.hasDiscount && item.discountPrice && item.discountPrice > 0)
        ? item.discountPrice
        : (item.price ?? 0);

      if (minP !== null && !isNaN(minP) && effectivePrice < minP) {
        return false;
      }
      if (maxP !== null && !isNaN(maxP) && effectivePrice > maxP) {
        return false;
      }

      // 4. Category Filter
      if (selectedCategory !== 'all') {
        const matchesCat = 
          item.categoryId === selectedCategory ||
          item.categoryName === selectedCategory;
        if (!matchesCat) return false;
      }

      // 5. Stock Availability Filter
      if (stockFilter === 'inStock' && !item.inStock) return false;
      if (stockFilter === 'outOfStock' && item.inStock) return false;

      return true;
    });

    // 6. Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        const pa = (a.hasDiscount && a.discountPrice) ? a.discountPrice : a.price;
        const pb = (b.hasDiscount && b.discountPrice) ? b.discountPrice : b.price;
        return (pa || 0) - (pb || 0);
      });
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        const pa = (a.hasDiscount && a.discountPrice) ? a.discountPrice : a.price;
        const pb = (b.hasDiscount && b.discountPrice) ? b.discountPrice : b.price;
        return (pb || 0) - (pa || 0);
      });
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    } else if (sortBy === 'discount_first') {
      result.sort((a, b) => (b.hasDiscount ? 1 : 0) - (a.hasDiscount ? 1 : 0));
    }

    return result;
  }, [products, searchTerm, selectedStore, minPrice, maxPrice, selectedCategory, stockFilter, sortBy]);

  // Live Metrics Summary
  const metrics = useMemo(() => {
    const total = filteredProducts.length;
    const inStockCount = filteredProducts.filter(p => p.inStock).length;
    const discountedCount = filteredProducts.filter(p => p.hasDiscount && p.discountPrice).length;
    const avgPrice = total > 0 
      ? Math.round(filteredProducts.reduce((sum, p) => sum + ((p.hasDiscount && p.discountPrice) ? p.discountPrice : p.price || 0), 0) / total)
      : 0;

    const uniqueStoresCount = new Set(filteredProducts.map(p => p.storeId || p.storeName).filter(Boolean)).size;

    return { total, inStockCount, discountedCount, avgPrice, uniqueStoresCount };
  }, [filteredProducts]);

  return (
    <div className="space-y-5">
      {/* Page Header & Top Toolbar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">جدول إدارة المنتجات</h2>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold font-sans border border-blue-100">
              {products.length} منتج
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة وتصفية قائمة المنتجات والأسعار والمتاجر المرتبطة بشكل متزامن ولحظي
          </p>
        </div>

        {/* Action Buttons */}
        {canCreate && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onAddProduct}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Filtering Engine Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">محرك الفلترة والبحث اللحظي المتزامن</span>
            {hasActiveFilters && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                فلاتر نشطة
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          )}
        </div>

        {/* Primary Filter Grid: Title, Store, Price Range, Category, Stock & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* 1. Title / Keyword Search (4 cols) */}
          <div className="lg:col-span-4 relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
              1. بحث بالعنوان أو SKU أو الوصف
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اسم المنتج، الرمز، أو التفاصيل..."
                className="w-full pl-8 pr-9 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Store Filter (3 cols) */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <StoreIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>2. المتجر التابع له</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({storeOptions.length} متجر)
              </span>
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">جميع المتاجر (الكل)</option>
              {storeOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Price Range Filter: Min & Max (3 cols) */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-slate-500" />
              <span>3. نطاق السعر (ريال)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="من"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setActivePricePreset('custom');
                  }}
                  className="w-full pl-2 pr-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-sans"
                />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="إلى"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setActivePricePreset('custom');
                  }}
                  className="w-full pl-2 pr-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-sans"
                />
              </div>
            </div>
          </div>

          {/* 4. Sorting Control (2 cols) */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>الترتيب</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="default">الافتراضي (الأحدث)</option>
              <option value="price_asc">السعر: الأقل أولاً</option>
              <option value="price_desc">السعر: الأعلى أولاً</option>
              <option value="name_asc">الاسم (أ - ي)</option>
              <option value="discount_first">العروض والخصومات</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Category, Stock Filter & Quick Price Presets */}
        <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Quick Price Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium shrink-0">اختصارات السعر:</span>
            <button
              onClick={() => handlePricePreset('all', '', '')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activePricePreset === 'all' && minPrice === '' && maxPrice === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => handlePricePreset('under1000', '', '1000')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activePricePreset === 'under1000'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
              }`}
            >
              أقل من 1,000 ريال
            </button>
            <button
              onClick={() => handlePricePreset('1000to3000', '1000', '3000')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activePricePreset === '1000to3000'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
              }`}
            >
              1,000 - 3,000 ريال
            </button>
            <button
              onClick={() => handlePricePreset('3000to7000', '3000', '7000')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activePricePreset === '3000to7000'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
              }`}
            >
              3,000 - 7,000 ريال
            </button>
            <button
              onClick={() => handlePricePreset('over7000', '7000', '')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activePricePreset === 'over7000'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
              }`}
            >
              أكثر من 7,000 ريال
            </button>
          </div>

          {/* Category & Stock Mini Selectors */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">التصنيف: الكل ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Availability */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">التوفر: الكل</option>
              <option value="inStock">المتوفر فقط</option>
              <option value="outOfStock">غير المتوفر فقط</option>
            </select>
          </div>
        </div>

        {/* Active Filters Visual Chips Bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-slate-400 font-semibold">الفلاتر المطبقة حالياً:</span>

            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                <span>بحث: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStore !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                <StoreIcon className="w-3 h-3" />
                <span>متجر: {storeOptions.find(s => s.id === selectedStore)?.name || selectedStore}</span>
                <button onClick={() => setSelectedStore('all')} className="hover:text-emerald-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(minPrice !== '' || maxPrice !== '') && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[11px]">
                <Coins className="w-3 h-3" />
                <span>
                  السعر:{' '}
                  {minPrice !== '' && maxPrice !== ''
                    ? `${minPrice} إلى ${maxPrice} ريال`
                    : minPrice !== ''
                    ? `من ${minPrice} ريال فما فوق`
                    : `حتى ${maxPrice} ريال`}
                </span>
                <button
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setActivePricePreset('all');
                  }}
                  className="hover:text-purple-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                <Tag className="w-3 h-3" />
                <span>تصنيف: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-indigo-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {stockFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]">
                <span>الحالة: {stockFilter === 'inStock' ? 'متوفر' : 'غير متوفر'}</span>
                <button onClick={() => setStockFilter('all')} className="hover:text-amber-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortBy !== 'default' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                <span>ترتيب مخصص</span>
                <button onClick={() => setSortBy('default')} className="hover:text-slate-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Real-time Filter Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">المنتجات المطابقة</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-slate-800 font-sans">{metrics.total}</span>
            <span className="text-[10px] text-slate-400 font-sans">/ {products.length}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">المتاجر المشمولة</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-emerald-600 font-sans">{metrics.uniqueStoresCount}</span>
            <span className="text-[10px] text-slate-400">متجر</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">متوسط السعر المطابق</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-blue-600 font-sans">{metrics.avgPrice.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">ريال</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">المتوفر في المخزن</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-teal-600 font-sans">{metrics.inStockCount}</span>
            <span className="text-[10px] text-slate-400">متوفر</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">جاري المزامنة المباشرة مع Firebase Firestore...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-gray-100">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">لا توجد منتجات مطابقة لخيارات الفلترة</h3>
              <p className="text-xs text-slate-400 mt-1">
                {products.length === 0 
                  ? 'لم يتم إضافة أي منتجات بعد في قاعدة بيانات Firestore.'
                  : 'لم يتم العثور على أي منتج يطابق معايير البحث والفلترة المحددة.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تعيين جميع الفلاتر</span>
              </button>
            )}
            {products.length === 0 && (
              <button
                onClick={onSeedData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>إضافة منتجات تجريبية تلقائياً</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 text-slate-400 uppercase tracking-wider text-[11px] border-b border-gray-100 font-bold">
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">صورة المنتج</th>
                  <th className="p-3.5">اسم المنتج و SKU</th>
                  <th className="p-3.5">المتجر التابع</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">السعر</th>
                  <th className="p-3.5 text-center">التوفر</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product, index) => {
                  // Resolve Store name
                  const storeObj = stores.find(s => s.id === product.storeId);
                  const displayStoreName = storeObj?.name || product.storeName || (product.storeId ? `متجر #${product.storeId.slice(0, 6)}` : 'متجر عام');

                  return (
                    <tr 
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* Index */}
                      <td className="p-3.5 text-center font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Image */}
                      <td className="p-3.5 w-20">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                          <img 
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        </div>
                      </td>

                      {/* Name & SKU */}
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.sku && (
                            <span className="font-mono text-[10px] text-slate-400 bg-gray-100 px-1.5 py-0.2 rounded">
                              {product.sku}
                            </span>
                          )}
                          {product.description && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={product.description}>
                              {product.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Store */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2.5 py-1 rounded-md font-medium max-w-[160px] truncate" title={displayStoreName}>
                          <StoreIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{displayStoreName}</span>
                        </span>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-md font-medium">
                          <Tag className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{product.categoryName || 'غير محدد'}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3.5 font-sans">
                        {product.hasDiscount && product.discountPrice && product.discountPrice < product.price ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-rose-700">
                                {product.discountPrice.toLocaleString()} <span className="text-[10px] font-normal text-rose-500">ريال</span>
                              </span>
                              <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                خصم
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 line-through">
                              {product.price.toLocaleString()} ريال
                            </div>
                          </div>
                        ) : product.originalPrice && product.originalPrice > product.price ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              {product.price.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">ريال</span>
                            </div>
                            <div className="text-[10px] text-slate-400 line-through">
                              {product.originalPrice.toLocaleString()} ريال
                            </div>
                          </div>
                        ) : (
                          <div className="font-bold text-slate-800">
                            {product.price.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">ريال</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Switch */}
                      <td className="p-3.5 text-center">
                        <button
                          disabled={!canEdit}
                          onClick={() => canEdit && onToggleInStock(product)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                            product.inStock 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          } ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          title="انقر لتغيير التوفر المباشر في Firestore"
                        >
                          {product.inStock ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              <span>متوفر</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>غير متوفر</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Eye Button */}
                          <button
                            onClick={() => onViewProduct(product)}
                            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
                            title="معاينة تفاصيل المنتج"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Pencil Button */}
                          {canEdit && (
                            <button
                              onClick={() => onEditProduct(product)}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
                              title="تعديل المنتج"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {canDelete && (
                            deleteConfirmId === product.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                                <button
                                  onClick={() => {
                                    onDeleteProduct(product.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded cursor-pointer"
                                >
                                  حذف
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1 text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(product.id)}
                                className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                title="حذف المنتج من Firestore"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            عرض <span className="font-bold text-slate-800">{filteredProducts.length}</span> من أصل{' '}
            <span className="font-bold text-slate-800">{products.length}</span> منتج في Firestore
            {hasActiveFilters && (
              <span className="mr-2 text-blue-600 font-semibold">
                (تم تطبيق معايير الفلترة اللحظية)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>التحديثات متزامنة لحظياً (Real-time Firestore listeners)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

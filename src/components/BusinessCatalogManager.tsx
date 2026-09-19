import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Store as StoreIcon, 
  Package, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  MapPin, 
  Phone, 
  Clock, 
  Filter, 
  CheckCircle2, 
  XCircle,
  Building2,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { Category, Store, Product, AdminUser } from '../types';
import { StoreDetailPage } from './StoreDetailPage';
import { CascadeDeleteModal } from './CascadeDeleteModal';
import { CategorySkeleton, StoreSkeleton } from './SkeletonLoader';
import { getCategoryImageUrl } from '../lib/categoryUtils';
import { hasModulePermission } from '../lib/permissions';
import { db, collection, query, onSnapshot } from '../lib/firebase';

interface BusinessCatalogManagerProps {
  categories?: Category[];
  stores?: Store[];
  products?: Product[];
  isLoadingCategories?: boolean;
  isLoadingStores?: boolean;
  isLoadingProducts?: boolean;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onToggleCategoryStatus?: (category: Category) => void;
  onAddStore: (initialCategoryId?: string) => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => Promise<void>;
  onToggleStoreStatus?: (store: Store) => void;
  onUpdateStoreSections: (storeId: string, sections: string[]) => void;
  onAddProductForStore: (storeId: string, sectionName: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleProductInStock?: (product: Product) => void;
  currentUser?: AdminUser | null;
  initialCategoryId?: string;
  initialStoreId?: string;
}

export const BusinessCatalogManager: React.FC<BusinessCatalogManagerProps> = ({
  categories: propCategories = [],
  stores: propStores = [],
  products: propProducts = [],
  isLoadingCategories: propIsLoadingCategories = false,
  isLoadingStores: propIsLoadingStores = false,
  isLoadingProducts: propIsLoadingProducts = false,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus,
  onAddStore,
  onEditStore,
  onDeleteStore,
  onToggleStoreStatus,
  onUpdateStoreSections,
  onAddProductForStore,
  onEditProduct,
  onDeleteProduct,
  onToggleProductInStock,
  currentUser,
  initialCategoryId,
  initialStoreId
}) => {
  // Component-level state and listeners for Categories, Stores, and Products
  const [internalCategories, setInternalCategories] = useState<Category[]>(propCategories);
  const [internalStores, setInternalStores] = useState<Store[]>(propStores);
  const [internalProducts, setInternalProducts] = useState<Product[]>(propProducts);
  const [isLocalLoadingCats, setIsLocalLoadingCats] = useState(propCategories.length === 0);
  const [isLocalLoadingStores, setIsLocalLoadingStores] = useState(propStores.length === 0);
  const [isLocalLoadingProducts, setIsLocalLoadingProducts] = useState(propProducts.length === 0);

  useEffect(() => {
    const catsQuery = query(collection(db, 'categories'));
    const unsubCats = onSnapshot(catsQuery, (snapshot) => {
      const list: Category[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setInternalCategories(list);
      setIsLocalLoadingCats(false);
    }, (err) => {
      console.warn('Categories snapshot error in BusinessCatalogManager:', err);
      setIsLocalLoadingCats(false);
    });

    const storesQuery = query(collection(db, 'stores'));
    const unsubStores = onSnapshot(storesQuery, (snapshot) => {
      const list: Store[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Store[];
      setInternalStores(list);
      setIsLocalLoadingStores(false);
    }, (err) => {
      console.warn('Stores snapshot error in BusinessCatalogManager:', err);
      setIsLocalLoadingStores(false);
    });

    const productsQuery = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const list: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setInternalProducts(list);
      setIsLocalLoadingProducts(false);
    }, (err) => {
      console.warn('Products snapshot error in BusinessCatalogManager:', err);
      setIsLocalLoadingProducts(false);
    });

    return () => {
      unsubCats();
      unsubStores();
      unsubProducts();
    };
  }, []);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) setInternalCategories(propCategories);
  }, [propCategories]);

  useEffect(() => {
    if (propStores && propStores.length > 0) setInternalStores(propStores);
  }, [propStores]);

  useEffect(() => {
    if (propProducts && propProducts.length > 0) setInternalProducts(propProducts);
  }, [propProducts]);

  const categories = internalCategories.length > 0 ? internalCategories : propCategories;
  const stores = internalStores.length > 0 ? internalStores : propStores;
  const products = internalProducts.length > 0 ? internalProducts : propProducts;
  const isLoadingCategories = isLocalLoadingCats && categories.length === 0;
  const isLoadingStores = isLocalLoadingStores && stores.length === 0;
  const isLoadingProducts = isLocalLoadingProducts && products.length === 0;
  // Navigation Hierarchy: 'categories' -> 'stores' -> 'products'
  const [currentLevel, setCurrentLevel] = useState<'categories' | 'stores' | 'products'>(() => {
    if (initialStoreId) return 'products';
    if (initialCategoryId) return 'stores';
    return 'categories';
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId || null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(initialStoreId || null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Deletion Modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'category' | 'store';
    item: Category | Store | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: 'category',
    item: null,
    isDeleting: false
  });

  // Permissions
  const canEditCategories = hasModulePermission(currentUser, 'categories', 'edit');
  const canDeleteCategories = hasModulePermission(currentUser, 'categories', 'delete');
  const canCreateCategories = hasModulePermission(currentUser, 'categories', 'create');

  const canEditStores = hasModulePermission(currentUser, 'restaurants', 'edit');
  const canDeleteStores = hasModulePermission(currentUser, 'restaurants', 'delete');
  const canCreateStores = hasModulePermission(currentUser, 'restaurants', 'create');

  // Active Category Object
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Active Store Object
  const selectedStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  // Stores belonging to selected category
  const categoryStores = useMemo(() => {
    if (!selectedCategory) return [];
    return stores.filter(st => {
      const matchId = st.categoryId === selectedCategory.id;
      const matchName = st.categoryName === selectedCategory.name;
      return matchId || matchName;
    });
  }, [stores, selectedCategory]);

  // Filtered Categories for Level 1
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchesSearch = !searchTerm || 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.nameEn && cat.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' ? cat.status === 'active' : cat.status === 'inactive');
      return matchesSearch && matchesStatus;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories, searchTerm, statusFilter]);

  // Filtered Stores for Level 2
  const filteredStores = useMemo(() => {
    return categoryStores.filter(st => {
      const matchesSearch = !searchTerm || 
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (st.address && st.address.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [categoryStores, searchTerm]);

  // Store product counts map
  const storeProductsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      if (p.storeId) {
        map.set(p.storeId, (map.get(p.storeId) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  // Category store & product count map
  const categoryStatsMap = useMemo(() => {
    const map = new Map<string, { storesCount: number; productsCount: number }>();
    categories.forEach(cat => {
      const matchedStores = stores.filter(s => s.categoryId === cat.id || s.categoryName === cat.name);
      const storeIds = new Set(matchedStores.map(s => s.id));
      const matchedProducts = products.filter(p => p.categoryId === cat.id || (p.storeId && storeIds.has(p.storeId)));
      map.set(cat.id, {
        storesCount: matchedStores.length,
        productsCount: matchedProducts.length
      });
    });
    return map;
  }, [categories, stores, products]);

  // Navigation helpers
  const handleSelectCategory = (category: Category) => {
    setSelectedCategoryId(category.id);
    setCurrentLevel('stores');
    setSearchTerm('');
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStoreId(store.id);
    setCurrentLevel('products');
    setSearchTerm('');
  };

  const handleBackToCategories = () => {
    setCurrentLevel('categories');
    setSelectedCategoryId(null);
    setSelectedStoreId(null);
    setSearchTerm('');
  };

  const handleBackToStores = () => {
    setCurrentLevel('stores');
    setSelectedStoreId(null);
    setSearchTerm('');
  };

  // Open Cascade Delete Modal for Category
  const handleOpenDeleteCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    const stats = categoryStatsMap.get(category.id) || { storesCount: 0, productsCount: 0 };
    setDeleteModalState({
      isOpen: true,
      type: 'category',
      item: category,
      isDeleting: false
    });
  };

  // Open Cascade Delete Modal for Store
  const handleOpenDeleteStore = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      type: 'store',
      item: store,
      isDeleting: false
    });
  };

  // Execute Cascade Delete
  const handleConfirmCascadeDelete = async () => {
    if (!deleteModalState.item) return;

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModalState.type === 'category') {
        await onDeleteCategory(deleteModalState.item.id);
        if (selectedCategoryId === deleteModalState.item.id) {
          handleBackToCategories();
        }
      } else {
        await onDeleteStore(deleteModalState.item.id);
        if (selectedStoreId === deleteModalState.item.id) {
          handleBackToStores();
        }
      }
      setDeleteModalState({ isOpen: false, type: 'category', item: null, isDeleting: false });
    } catch (err) {
      console.error('Cascade delete error:', err);
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Affected counts for modal
  const modalAffectedCounts = useMemo(() => {
    if (!deleteModalState.item) return { stores: 0, products: 0 };
    if (deleteModalState.type === 'category') {
      const stats = categoryStatsMap.get(deleteModalState.item.id);
      return {
        stores: stats?.storesCount || 0,
        products: stats?.productsCount || 0
      };
    } else {
      return {
        stores: 1,
        products: storeProductsCountMap.get(deleteModalState.item.id) || 0
      };
    }
  }, [deleteModalState, categoryStatsMap, storeProductsCountMap]);

  return (
    <div className="space-y-6 dir-rtl text-right" dir="rtl">
      
      {/* Top Header & Breadcrumb Path */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Breadcrumb Navigation Trail */}
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 overflow-x-auto py-1">
            <button
              onClick={handleBackToCategories}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentLevel === 'categories' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>إدارة الأنشطة التجارية (الفئات)</span>
            </button>

            {selectedCategory && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <button
                  onClick={handleBackToStores}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentLevel === 'stores' 
                      ? 'bg-blue-50 text-blue-700 font-extrabold' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <StoreIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedCategory.name}</span>
                  <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                    {categoryStores.length} متجر
                  </span>
                </button>
              </>
            )}

            {selectedStore && currentLevel === 'products' && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-extrabold">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedStore.name}</span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                    الأصناف والمنتجات
                  </span>
                </span>
              </>
            )}
          </nav>

          {/* Quick Back Navigation Button */}
          {currentLevel !== 'categories' && (
            <button
              onClick={currentLevel === 'products' ? handleBackToStores : handleBackToCategories}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span>
                {currentLevel === 'products' 
                  ? `العودة لمتاجر (${selectedCategory?.name || 'الفئة'})` 
                  : 'العودة لقائمة الفئات'}
              </span>
            </button>
          )}
        </div>

        {/* Level Title & Action Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {currentLevel === 'categories' && (
                <>
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>الفئات والأنشطة التجارية الرئيسية</span>
                </>
              )}
              {currentLevel === 'stores' && (
                <>
                  <StoreIcon className="w-5 h-5 text-blue-600" />
                  <span>المتاجر التابعة لفئة: {selectedCategory?.name}</span>
                </>
              )}
              {currentLevel === 'products' && (
                <>
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>أصناف ومنتجات متجر: {selectedStore?.name}</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentLevel === 'categories' && 'اختر أي فئة لاستعراض المتاجر التابعة لها، أو أضف فئة جديدة للنظام.'}
              {currentLevel === 'stores' && `تصفح المتاجر المندرجة تحت "${selectedCategory?.name}". انقر على أي متجر لإدارة منتجاته وأسعاره.`}
              {currentLevel === 'products' && `إدارة قائمة الطعام، الأقسام، وحالة التوفر للمتجر المحدد.`}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {currentLevel === 'categories' && canCreateCategories && (
              <button
                onClick={onAddCategory}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فئة جديدة</span>
              </button>
            )}

            {currentLevel === 'stores' && canCreateStores && (
              <button
                onClick={() => onAddStore(selectedCategory?.id)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة متجر في هذه الفئة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: CATEGORIES VIEW                                                  */}
      {/* ========================================================================= */}
      {currentLevel === 'categories' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن اسم فئة أو نشاط..."
                className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold hidden sm:inline">الحالة:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  الكل ({categories.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  النشطة
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'inactive' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  المتوقفة
                </button>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoadingCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">لا توجد فئات مطابقة للبحث</h3>
              <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى أو أضف فئة جديدة للنظام.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map(cat => {
                const stats = categoryStatsMap.get(cat.id) || { storesCount: 0, productsCount: 0 };
                const catImg = getCategoryImageUrl(cat);

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between space-y-4 cursor-pointer relative overflow-hidden"
                  >
                    {/* Top Row: Icon & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                          {catImg ? (
                            <img 
                              src={catImg} 
                              alt={cat.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Layers className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                            {cat.name}
                          </h3>
                          {cat.nameEn && (
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {cat.nameEn}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        cat.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {cat.status === 'active' ? 'نشط' : 'متوقف'}
                      </span>
                    </div>

                    {/* Subtitle / Description */}
                    {cat.subtitle ? (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {cat.subtitle}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {cat.description || 'فئة تجارية وخدمية رئيسية في منصة جاهز.'}
                      </p>
                    )}

                    {/* Stats Pill Box */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block">المتاجر التابعة</span>
                        <span className="font-bold font-mono text-slate-800">{stats.storesCount} متجر</span>
                      </div>
                      <div className="text-center border-r border-slate-200">
                        <span className="text-[10px] text-slate-400 block">الأصناف والمنتجات</span>
                        <span className="font-bold font-mono text-slate-800">{stats.productsCount} صنف</span>
                      </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-[-3px] transition-all cursor-pointer"
                      >
                        <span>استعراض المتاجر ({stats.storesCount})</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canEditCategories && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCategory(cat);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="تعديل الفئة"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {canDeleteCategories && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteCategory(cat, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف متسلسل للفئة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: STORES VIEW (OF SELECTED CATEGORY)                               */}
      {/* ========================================================================= */}
      {currentLevel === 'stores' && selectedCategory && (
        <div className="space-y-4">
          {/* Category Summary Header Card */}
          <div className="bg-gradient-to-l from-slate-900 to-blue-950 p-5 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                {getCategoryImageUrl(selectedCategory) ? (
                  <img 
                    src={getCategoryImageUrl(selectedCategory)} 
                    alt={selectedCategory.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Layers className="w-7 h-7 text-blue-300" />
                )}
              </div>
              <div>
                <span className="text-blue-300 text-[11px] font-bold block">الفئة المحددة حالياً:</span>
                <h3 className="text-lg font-extrabold text-white">{selectedCategory.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-md">
                  {selectedCategory.subtitle || selectedCategory.description || 'استعراض وإدارة كافة المتاجر والفروع التابعة لهذه الفئة.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-center">
                <span className="text-[10px] text-blue-200 block">إجمالي المتاجر</span>
                <span className="text-base font-bold font-mono text-white">{categoryStores.length}</span>
              </div>
            </div>
          </div>

          {/* Search Bar for Stores */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`ابحث عن متجر في ${selectedCategory.name}...`}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <span className="text-xs text-slate-500 font-bold">
              يعرض {filteredStores.length} من أصل {categoryStores.length} متجر
            </span>
          </div>

          {/* Loading Skeletons */}
          {isLoadingStores ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <StoreSkeleton key={i} />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <StoreIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {searchTerm ? 'لا توجد متاجر تطابق البحث' : `لا توجد متاجر مضافة بعد في فئة "${selectedCategory.name}"`}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm ? 'جرب البحث بكلمة أخرى.' : 'ابدأ بإضافة أول متجر أو مطعم تابع لهذه الفئة لتتمكن من إضافة الأصناف وقائمة الأسعار.'}
              </p>
              {canCreateStores && !searchTerm && (
                <button
                  onClick={() => onAddStore(selectedCategory.id)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول متجر هنا</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map(store => {
                const prodCount = storeProductsCountMap.get(store.id) || 0;
                const isOpen = store.status === 'open';

                return (
                  <div
                    key={store.id}
                    onClick={() => handleSelectStore(store)}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    {/* Store Cover Image */}
                    <div className="h-32 bg-slate-100 relative overflow-hidden">
                      {store.coverUrl ? (
                        <img 
                          src={store.coverUrl} 
                          alt={store.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-slate-300">
                          <StoreIcon className="w-10 h-10 text-slate-300" />
                        </div>
                      )}

                      {/* Store Logo Thumbnail */}
                      <div className="absolute bottom-2 right-3 w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-white/60">
                        {store.logoUrl ? (
                          <img 
                            src={store.logoUrl} 
                            alt={store.name} 
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs text-slate-500">
                            {store.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Open / Closed Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                          isOpen 
                            ? 'bg-emerald-500 text-white border-emerald-600' 
                            : 'bg-slate-700 text-white border-slate-800'
                        }`}>
                          {isOpen ? 'مفتوح للطلب' : 'مغلق حالياً'}
                        </span>
                      </div>
                    </div>

                    {/* Store Info Body */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                            {store.name}
                          </h4>
                          {store.activityType && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                              {store.activityType}
                            </span>
                          )}
                        </div>

                        {store.address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        )}

                        {store.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Product Count Pill */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">الأصناف والمنتجات المسجلة:</span>
                        <span className="font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {prodCount} صنف
                        </span>
                      </div>
                    </div>

                    {/* Store Footer Actions */}
                    <div className="px-4 py-3 bg-slate-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectStore(store)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-[-3px] transition-all cursor-pointer"
                      >
                        <span>إدارة الأصناف والمنتجات</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canEditStores && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStore(store);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="تعديل بيانات المتجر"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {canDeleteStores && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteStore(store, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف متسلسل للمتجر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: PRODUCTS VIEW (FOR SELECTED STORE)                               */}
      {/* ========================================================================= */}
      {currentLevel === 'products' && selectedStore && (
        <div>
          <StoreDetailPage
            store={selectedStore}
            products={products}
            categories={categories}
            currentUser={currentUser}
            onBack={handleBackToStores}
            onEditStore={(st) => onEditStore(st)}
            onUpdateStoreSections={onUpdateStoreSections}
            onAddProductForStore={onAddProductForStore}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onToggleProductInStock={onToggleProductInStock}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASCADE DELETION CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      <CascadeDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false, item: null }))}
        onConfirm={handleConfirmCascadeDelete}
        itemType={deleteModalState.type}
        item={deleteModalState.item}
        affectedStoresCount={modalAffectedCounts.stores}
        affectedProductsCount={modalAffectedCounts.products}
        isDeleting={deleteModalState.isDeleting}
      />

    </div>
  );
};

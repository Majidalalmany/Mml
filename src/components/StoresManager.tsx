import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Clock, 
  MapPin, 
  Phone, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Tag,
  RefreshCw,
  Layers,
  Utensils,
  Pill,
  ShoppingBasket,
  Smartphone,
  Flower2,
  Sparkles,
  ChevronLeft,
  Filter,
  Package,
  PlusCircle,
  FolderPlus,
  Upload,
  Globe
} from 'lucide-react';
import { Store, Category, Product, AdminUser } from '../types';
import { getCategoryDefaultLogo, getCategoryImageUrl, findServiceCategory, isStoreInServiceCategory, SERVICE_CATEGORIES, getAllServiceCategories, resolveCategoryIconKey } from '../lib/categoryUtils';
import { hasModulePermission } from '../lib/permissions';
import { getUnifiedStores, getUnifiedProducts } from '../lib/globalStoreService';

interface StoresManagerProps {
  stores: Store[];
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  selectedCategoryFilter?: string;
  onSelectCategoryFilter?: (filter: string) => void;
  isAddServiceTriggered?: boolean;
  onCloseAddServiceTrigger?: () => void;
  onNavigateToCategories?: () => void;
  onNavigateToGlobalCatalog?: (platformOrSlug?: string) => void;
  onAddCategory?: () => void;
  onSaveCategory?: (categoryData: Partial<Category>) => Promise<void> | void;
  onAddStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
  onToggleStatus: (store: Store, newStatus: 'open' | 'closed' | 'maintenance') => void;
  onSelectStore?: (store: Store) => void;
  currentUser?: AdminUser | null;
}

export const StoresManager: React.FC<StoresManagerProps> = ({
  stores = [],
  categories = [],
  products = [],
  isLoading,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onNavigateToCategories,
  onNavigateToGlobalCatalog,
  isAddServiceTriggered,
  onCloseAddServiceTrigger,
  onAddCategory,
  onSaveCategory,
  onAddStore,
  onEditStore,
  onDeleteStore,
  onToggleStatus,
  onSelectStore,
  currentUser
}) => {
  const safeStores = getUnifiedStores(stores || []);
  const safeProducts = getUnifiedProducts(products || []);
  const safeCategories = categories || [];
  const [newServiceType, setNewServiceType] = useState('متاجر عادية');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  // All active categories dynamically unified and deduplicated from categories state
  const allServiceCategories = getAllServiceCategories(safeCategories, safeStores);

  // Find first category that actually has stores
  const firstCategoryWithStores = allServiceCategories.find(cat => 
    safeStores.some(s => isStoreInServiceCategory(s, cat.id, safeCategories))
  ) || allServiceCategories[0];
  const defaultInitialCategory = selectedCategoryFilter || firstCategoryWithStores?.id || 'cat-1';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>(() => selectedCategoryFilter || defaultInitialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);

  const canCreate = hasModulePermission(currentUser, 'restaurants', 'create');
  const canEdit = hasModulePermission(currentUser, 'restaurants', 'edit');
  const canDelete = hasModulePermission(currentUser, 'restaurants', 'delete');

  // Sync with prop when selected from sidebar
  useEffect(() => {
    if (selectedCategoryFilter !== undefined && selectedCategoryFilter !== 'all') {
      setSelectedService(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Sync external add service trigger from sidebar
  useEffect(() => {
    if (isAddServiceTriggered) {
      setIsAddServiceModalOpen(true);
      if (onCloseAddServiceTrigger) onCloseAddServiceTrigger();
    }
  }, [isAddServiceTriggered, onCloseAddServiceTrigger]);

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Tag');

  // Handle local image file upload from device
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewServiceIcon(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding new service activity category
  const handleAddCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newServiceName.trim();
    if (!cleanName) return;

    const uniqueId = `cat-${Date.now()}`;
    const newCategoryData: Category = {
      id: uniqueId,
      name: cleanName,
      label: cleanName,
      serviceName: cleanName,
      icon: newServiceIcon || 'Tag',
      imageUrl: newServiceIcon && newServiceIcon.length > 30 ? newServiceIcon : undefined,
      categoryImageUrl: newServiceIcon && newServiceIcon.length > 30 ? newServiceIcon : undefined,
      serviceType: 'default',
      serviceTypeCategory: 'delivery',
      status: 'active',
      description: newServiceDescription.trim() || undefined,
      order: (safeCategories.length || 0) + 1,
      createdAt: new Date().toISOString()
    };

    // Save directly to localStorage for immediate resilience
    try {
      const saved = JSON.parse(localStorage.getItem('jahez_custom_categories') || '[]');
      const filtered = saved.filter((c: any) => c.name !== cleanName && c.id !== uniqueId);
      filtered.push(newCategoryData);
      localStorage.setItem('jahez_custom_categories', JSON.stringify(filtered));
    } catch (e) {
      console.warn('localStorage save fallback:', e);
    }

    // Call backend / App state handler if available
    if (onSaveCategory) {
      try {
        await onSaveCategory(newCategoryData);
      } catch (saveErr) {
        console.warn('onSaveCategory non-blocking fallback:', saveErr);
      }
    }

    // Force selection immediately to the new category without resetting to first tab
    setSelectedService(uniqueId);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(uniqueId);
    }

    setNewServiceName('');
    setNewServiceIcon('Tag');
    setNewServiceDescription('');
    setIsAddServiceModalOpen(false);
  };

  const activeServiceDef = findServiceCategory(selectedService, safeCategories) || allServiceCategories[0];

  const filteredStores = safeStores.filter(s => {
    const activityName = (s.activityType || s.categoryName || '').toLowerCase();
    const matchesSearch = !searchTerm.trim() || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activityName.includes(searchTerm.toLowerCase());

    const matchesService = isStoreInServiceCategory(s, selectedService, safeCategories);
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesService && matchesStatus;
  });

  const getStoreProductsCount = (storeId: string) => {
    return safeProducts.filter(p => p.storeId === storeId || p.storeName === storeId).length;
  };

  const handleSwitchCategory = (catId: string) => {
    const targetCat = (!catId || catId === 'all') ? defaultInitialCategory : catId;
    setSelectedService(targetCat);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(targetCat);
    }
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    handleSwitchCategory(defaultInitialCategory);
  };

  return (
    <div className="space-y-6">
      {/* 1. Category Page Header & Action Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <img 
                src={getCategoryImageUrl(activeServiceDef, activeServiceDef?.label)} 
                alt={activeServiceDef?.label}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeServiceDef ? activeServiceDef.label : selectedService}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-0.5 rounded-full font-bold font-sans">
              {filteredStores.length} متجر مسجل في هذا القسم
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {activeServiceDef?.description || 'إدارة ومتابعة المتاجر المسجلة في هذا النشاط التجاري وتخصيص كافة أقسامه ومنتجاته'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToCategories && (
            <button
              onClick={onNavigateToCategories}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>صفحة إدارة الفئات والخدمات</span>
            </button>
          )}

          {canCreate && (
            <>
              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>+ إضافة فئة خدمة بالصور</span>
              </button>

              <button
                onClick={onAddStore}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activeServiceDef ? `إضافة متجر جديد في ${activeServiceDef.label}` : 'إضافة متجر جديد'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Horizontal Category Quick Switcher Tabs */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-200">
        <div className="text-[11px] font-bold text-slate-400 mb-2 px-1">
          اختر قسم النشاط التجاري لتصفية المتاجر بدقة:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {allServiceCategories.map((cat) => {
            const count = safeStores.filter(s => isStoreInServiceCategory(s, cat.id, safeCategories)).length;
            const isSelected = isStoreInServiceCategory({ categoryId: selectedService, categoryName: selectedService }, cat.id, safeCategories) || selectedService === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSwitchCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <img 
                  src={getCategoryImageUrl(cat, cat.label)} 
                  alt={cat.label} 
                  className="w-4 h-4 rounded-md object-cover shrink-0 border border-gray-200" 
                  referrerPolicy="no-referrer"
                />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeServiceDef ? `بحث داخل قسم ${activeServiceDef.label} بالاسم أو العنوان...` : "بحث عن متجر بالاسم، النشاط، أو العنوان..."}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(selectedService !== defaultInitialCategory || searchTerm || selectedStatus !== 'all') && (
            <button
              onClick={handleResetFilter}
              className="text-xs text-slate-700 hover:text-blue-700 font-bold bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="إعادة التصفية للقسم الأول الرئيسي"
            >
              <span>إعادة ضبط التصفية</span>
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-gray-50/50 text-slate-700 font-medium"
          >
            <option value="all">كافة الحالات</option>
            <option value="open">مفتوح فقط</option>
            <option value="closed">مغلق فقط</option>
            <option value="maintenance">تحت الصيانة</option>
          </select>
        </div>
      </div>

      {/* 4. Stores Cards List */}
      {isLoading ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-2xl border border-gray-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">جاري تحميل المتاجر والخدمات...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 md:p-12 text-center max-w-xl mx-auto shadow-xs my-4 space-y-6">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-inner mx-auto border border-blue-100">
              {activeServiceDef?.icon || '🏪'}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-1">
              <span>قسم:</span>
              <span className="text-blue-700">{activeServiceDef?.label || (selectedService === 'all' ? 'جميع الأقسام' : selectedService)}</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
              {searchTerm || selectedStatus !== 'all' 
                ? 'لا توجد نتائج تطابق خيارات البحث أو التصفية الحالية'
                : `لم يتم تسجيل أي متجر بعد في ${activeServiceDef ? `قسم "${activeServiceDef.label}"` : 'هذا القسم'}`}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchTerm || selectedStatus !== 'all'
                ? 'جرب تغيير كلمة البحث أو إعادة ضبط حالة التصفية للوصول للمتاجر المطلوبة.'
                : activeServiceDef?.description || 'يمكنك إضافة أول متجر تابع لهذا القسم مباشرة، وتفعيل قائمة منتجاته وأقسامه للعملاء بسهولة.'}
            </p>
          </div>

          {activeServiceDef && activeServiceDef.keywords && activeServiceDef.keywords.length > 0 && !searchTerm && (
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-right max-w-md mx-auto">
              <p className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>أمثلة لأنشطة ومحلات هذا القسم:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeServiceDef.keywords.slice(0, 8).map((kw, idx) => (
                  <span key={idx} className="bg-white text-slate-700 text-[11px] px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs font-medium">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {(searchTerm || selectedStatus !== 'all') ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>إلغاء تصفية البحث والحالة</span>
              </button>
            ) : null}

            <button
              onClick={onAddStore}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeServiceDef ? `+ إضافة أول متجر في ${activeServiceDef.label}` : 'إضافة متجر جديد لهذا القسم'}
              </span>
            </button>

            {selectedService !== 'all' && (
              <button
                onClick={() => handleSwitchCategory('all')}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🌐</span>
                <span>استعراض كافة الأقسام</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStores.map((store) => {
            const prodCount = getStoreProductsCount(store.id);
            const defaultCatLogo = getCategoryDefaultLogo(store.categoryId, store.categoryName, categories);

            return (
              <div 
                key={store.id}
                className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col hover:border-blue-400 transition-all group"
              >
                <div className="relative h-36 bg-slate-900 overflow-hidden">
                  <img 
                    src={store.coverUrl || defaultCatLogo} 
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  
                  <div className="absolute top-3 right-3">
                    <span className={`${store.isGlobalStore ? 'bg-indigo-950/90 border-indigo-400/30' : 'bg-slate-900/90 border-white/20'} backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs border`}>
                      {store.isGlobalStore ? <Globe className="w-3 h-3 text-indigo-400" /> : <Tag className="w-3 h-3 text-amber-400" />}
                      {store.activityType || store.categoryName || (store.isGlobalStore ? 'متجر عالمي' : 'خدمة متجر')}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                      store.status === 'open' 
                        ? 'bg-emerald-500 text-white' 
                        : store.status === 'closed'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                    }`}>
                      {store.status === 'open' ? '🟢 مفتوح' : store.status === 'closed' ? '🔴 مغلق' : '🟡 صيانة'}
                    </span>
                  </div>
                </div>

                <div className="p-5 pt-6 flex-1 flex flex-col justify-between space-y-4">
                  <div 
                    onClick={() => onSelectStore?.(store)}
                    className="cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                          {store.name}
                        </h3>
                        {store.isGlobalStore && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md border border-indigo-200">
                            تسوق دولي
                          </span>
                        )}
                      </div>
                      <span className="text-blue-600 font-bold text-xs shrink-0 flex items-center gap-0.5 group-hover:translate-x-[-2px] transition-transform">
                        <span>دخول للمتجر</span>
                        <span>←</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {store.description || 'متجر معتمد ومسجل في منصة جاهز للتوصيل السريع'}
                    </p>
                  </div>

                  {store.isGlobalStore && (
                    <div className="bg-gradient-to-r from-indigo-50/90 to-blue-50/70 border border-indigo-200/80 p-2.5 rounded-xl text-xs flex items-center justify-between text-indigo-950">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold shrink-0">الشحن والتوريد:</span>
                        <span className="text-[11px] text-indigo-700 font-medium truncate">{store.deliveryDays || '6 - 12 يوم عمل'}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                        {store.trustedBadge || 'ضمان أصلي 100%'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-gray-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>العنوان:</span>
                      </span>
                      <strong className="text-slate-800 truncate max-w-[170px]">{store.address || 'صنعاء'}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>عدد المنتجات والأصناف:</span>
                      </span>
                      <strong className="text-blue-700 font-sans font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {prodCount} أصناف
                      </strong>
                    </div>

                    {store.sections && store.sections.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400 font-bold">الأقسام:</span>
                        {store.sections.slice(0, 3).map((sec, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {store.isGlobalStore ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            if (onNavigateToGlobalCatalog) {
                              onNavigateToGlobalCatalog(store.platform || store.globalSlug || 'amazon');
                            } else {
                              onSelectStore?.(store);
                            }
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Globe className="w-4 h-4" />
                          <span>تصفح كتالوج السلع العالمية ({store.name.split(' ')[0]})</span>
                          <span>←</span>
                        </button>
                        <button
                          onClick={() => onSelectStore?.(store)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          <span>إدارة بيانات المتجر والأقسام</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectStore?.(store)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>صفحة المتجر (إدارة الأقسام والمنتجات)</span>
                        <span>←</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <select
                        disabled={!canEdit}
                        value={store.status}
                        onChange={(e) => canEdit && onToggleStatus(store, e.target.value as 'open' | 'closed' | 'maintenance')}
                        className={`flex-1 px-2.5 py-2 rounded-xl border border-gray-200 text-[11px] font-bold bg-slate-50 text-slate-700 focus:ring-1 focus:ring-blue-500 ${
                          !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="تعديل حالة المتجر (إخفاء/إظهار)"
                      >
                        <option value="open">🟢 مفتوح (ظاهر)</option>
                        <option value="closed">🔴 مغلق (مخفي من الطلبات)</option>
                        <option value="maintenance">🟡 صيانة مؤقتة</option>
                      </select>

                      {canEdit && (
                        <button
                          onClick={() => onEditStore(store)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="تعديل بيانات المتجر"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">تعديل</span>
                        </button>
                      )}

                      {canDelete && (
                        deleteConfirmStoreId === store.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-xl border border-rose-300 animate-in fade-in">
                            <span className="text-[11px] font-bold text-rose-800 shrink-0">تأكيد الحذف النهائي؟</span>
                            <button
                              onClick={() => {
                                onDeleteStore(store.id);
                                setDeleteConfirmStoreId(null);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                            >
                              نعم، حذف
                            </button>
                            <button
                              onClick={() => setDeleteConfirmStoreId(null)}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-slate-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmStoreId(store.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-rose-200"
                            title="حذف المتجر نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">حذف</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal: Add New Custom Service Category */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>إضافة فئة خدمة أو نشاط جديد للمتاجر</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomService} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الخدمة أو النشاط التجاري *
                </label>
                <input 
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="مثال: البهارات والمكسرات، مستلزمات السيارات..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع العرض *
                </label>
                <select
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="متاجر عادية">متاجر عادية</option>
                  <option value="متاجر عامة">متاجر عامة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الوصف التوضيحي
                </label>
                <textarea
                  rows={3}
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="أدخل وصفاً توضيحياً لهذه الفئة..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  صورة الفئة التعبيرية:
                </label>

                {/* File Upload Box */}
                <div className="mb-3">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    {newServiceIcon && newServiceIcon.length > 30 ? (
                      <div className="flex items-center gap-3 p-2">
                        <img 
                          src={newServiceIcon} 
                          alt="المعاينة" 
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-blue-600">تم اختيار الصورة</span>
                          <span className="text-[10px] text-gray-500">اضغط لتغيير الصورة من جهازك</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-xs text-slate-600 font-semibold">اضغط هنا لرفع صورة من جهازك</p>
                        <p className="text-[10px] text-slate-400">PNG, JPG أو WEBP</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  حفظ الفئة الجديدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

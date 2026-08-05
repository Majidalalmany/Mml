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
  FolderPlus
} from 'lucide-react';
import { Store, Category, Product } from '../types';
import { getCategoryDefaultLogo, findServiceCategory, isStoreInServiceCategory, SERVICE_CATEGORIES } from '../lib/categoryUtils';

interface StoresManagerProps {
  stores: Store[];
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  selectedCategoryFilter?: string;
  onSelectCategoryFilter?: (filter: string) => void;
  isAddServiceTriggered?: boolean;
  onCloseAddServiceTrigger?: () => void;
  onAddStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
  onToggleStatus: (store: Store, newStatus: 'open' | 'closed' | 'maintenance') => void;
  onSelectStore?: (store: Store) => void;
}

// Initial Default Services List (فئات الخدمات العامة)
const DEFAULT_SERVICES = [
  { id: 'restaurants', name: 'المطاعم والوجبات السريعة', icon: '🍔', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'pharmacies', name: 'الصيدليات والمستلزمات الطبية', icon: '💊', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'supermarkets', name: 'السوبرماركت والتموينات', icon: '🛒', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'electronics', name: 'الإلكترونيات والهواتف', icon: '📱', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'spices', name: 'البهارات والمكسرات والقهوة', icon: '🌶️', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'flowers', name: 'الورود والهدايا', icon: '🌸', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'sweets', name: 'الحلويات والمخبوزات', icon: '🧁', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'meats', name: 'اللحوم والأسماك الطازجة', icon: '🥩', color: 'bg-red-50 text-red-700 border-red-200' }
];

export const StoresManager: React.FC<StoresManagerProps> = ({
  stores = [],
  categories = [],
  products = [],
  isLoading,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  isAddServiceTriggered,
  onCloseAddServiceTrigger,
  onAddStore,
  onEditStore,
  onDeleteStore,
  onToggleStatus,
  onSelectStore
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);

  // Sync with prop when selected from sidebar
  useEffect(() => {
    if (selectedCategoryFilter !== undefined) {
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

  // Custom Services State (إمكانية إضافة خدمات جديدة يدوياً)
  const [customServices, setCustomServices] = useState(DEFAULT_SERVICES);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('📦');

  const safeStores = stores || [];
  const safeProducts = products || [];

  // Handle adding new service activity category
  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newServ = {
      id: `serv-${Date.now()}`,
      name: newServiceName.trim(),
      icon: newServiceIcon || '📦',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };

    setCustomServices(prev => [...prev, newServ]);
    setSelectedService(newServ.name);
    setNewServiceName('');
    setIsAddServiceModalOpen(false);
  };

  const activeServiceDef = findServiceCategory(selectedService);

  const filteredStores = safeStores.filter(s => {
    const activityName = (s.activityType || s.categoryName || '').toLowerCase();
    const matchesSearch = !searchTerm.trim() || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activityName.includes(searchTerm.toLowerCase());

    const matchesService = isStoreInServiceCategory(s, selectedService);
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesService && matchesStatus;
  });

  const getStoreProductsCount = (storeId: string) => {
    return safeProducts.filter(p => p.storeId === storeId || p.storeName === storeId).length;
  };

  const handleSwitchCategory = (catId: string) => {
    setSelectedService(catId);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(catId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Category Page Header & Action Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{activeServiceDef?.icon || '🏪'}</span>
            <h2 className="text-xl font-bold text-slate-900">
              {activeServiceDef ? activeServiceDef.label : (selectedService === 'all' ? 'دليل كافة المتاجر والخدمات' : selectedService)}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-0.5 rounded-full font-bold">
              {filteredStores.length} متجر مسجل
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {activeServiceDef?.description || 'اختر فئة الخدمة من القائمة لاستعراض متاجرها أو إضافة متجر جديد وتخصيص كافة أقسامه ومنتجاته'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedService !== 'all' && (
            <button
              onClick={() => handleSwitchCategory('all')}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🌐</span>
              <span>عرض كافة الأقسام</span>
            </button>
          )}

          <button
            onClick={() => setIsAddServiceModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>+ إضافة فئة خدمة جديدة</span>
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
        </div>
      </div>

      {/* 2. Horizontal Category Quick Switcher Tabs */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => handleSwitchCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
              selectedService === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>🌐</span>
            <span>كافة المتاجر ({safeStores.length})</span>
          </button>

          {SERVICE_CATEGORIES.map((cat) => {
            const count = safeStores.filter(s => isStoreInServiceCategory(s, cat.id)).length;
            const isSelected = selectedService !== 'all' && isStoreInServiceCategory({ categoryId: selectedService, categoryName: selectedService }, cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => handleSwitchCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{cat.icon}</span>
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
            placeholder={activeServiceDef ? `بحث داخل ${activeServiceDef.label} بالاسم أو العنوان...` : "بحث عن متجر بالاسم، النشاط، أو العنوان..."}
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

        <div className="flex items-center gap-2">
          {selectedService !== 'all' && (
            <button
              onClick={() => handleSwitchCategory('all')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1"
            >
              <span>إلغاء تصفية القسم ({activeServiceDef?.label || selectedService})</span>
              <X className="w-3.5 h-3.5" />
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
          {/* Top Decorative Icon */}
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-inner mx-auto border border-blue-100">
              {activeServiceDef?.icon || '🏪'}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          {/* Main Title & Description */}
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

          {/* Category Keywords/Tip Tag Cloud if available */}
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

          {/* Action Buttons */}
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
                {/* Banner Header */}
                <div className="relative h-36 bg-slate-900 overflow-hidden">
                  <img 
                    src={store.coverUrl || defaultCatLogo} 
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  
                  <div className="absolute top-3 right-3">
                    <span className="bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs border border-white/20">
                      <Tag className="w-3 h-3 text-amber-400" />
                      {store.activityType || store.categoryName || 'خدمة متجر'}
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

                {/* Body Content */}
                <div className="p-5 pt-6 flex-1 flex flex-col justify-between space-y-4">
                  <div 
                    onClick={() => onSelectStore?.(store)}
                    className="cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {store.name}
                      </h3>
                      <span className="text-blue-600 font-bold text-xs shrink-0 flex items-center gap-0.5 group-hover:translate-x-[-2px] transition-transform">
                        <span>دخول للمتجر</span>
                        <span>←</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {store.description || 'متجر معتمد ومسجل في منصة جاهز للتوصيل السريع'}
                    </p>
                  </div>

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

                  {/* Action Buttons: Enter Store, Edit, Toggle Status/Hide, Delete */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => onSelectStore?.(store)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      <span>صفحة المتجر (إدارة الأقسام والمنتجات)</span>
                      <span>←</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Status / Visibility Toggle */}
                      <select
                        value={store.status}
                        onChange={(e) => onToggleStatus(store, e.target.value as 'open' | 'closed' | 'maintenance')}
                        className="flex-1 px-2.5 py-2 rounded-xl border border-gray-200 text-[11px] font-bold bg-slate-50 text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        title="تعديل حالة المتجر (إخفاء/إظهار)"
                      >
                        <option value="open">🟢 مفتوح (ظاهر)</option>
                        <option value="closed">🔴 مغلق (مخفي من الطلبات)</option>
                        <option value="maintenance">🟡 صيانة مؤقتة</option>
                      </select>

                      {/* Edit Store Button */}
                      <button
                        onClick={() => onEditStore(store)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="تعديل بيانات المتجر"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="hidden sm:inline">تعديل</span>
                      </button>

                      {/* Delete Store Button & Confirmation */}
                      {deleteConfirmStoreId === store.id ? (
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal: Add New Custom Service Category (إضافة خدمة جديدة مثل البهارات والمكسرات) */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>إضافة فئة خدمة أو نشاط جديد للمتاجر</span>
              </h3>
              <button 
                onClick={() => setIsAddServiceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomService} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الخدمة أو النشاط التجارية *
                </label>
                <input 
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="مثال: البهارات والمكسرات، مستلزمات السيارات..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الأيقونة أو التعبير الإيموجي الرمزي:
                </label>
                <div className="flex gap-2">
                  {['🌶️', '🥩', '🧁', '💊', '📱', '🛒', '🌸', '☕', '📦', '🛠️'].map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setNewServiceIcon(emo)}
                      className={`text-xl p-2 rounded-xl border ${
                        newServiceIcon === emo ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
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

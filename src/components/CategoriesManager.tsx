import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Layers, 
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Truck,
  Wrench,
  Store as StoreIcon,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';
import { Category, Store, Product, AdminUser } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { 
  getCategoryImageUrl, 
  getCategorySubtitle,
  DEFAULT_CATEGORY_BANNER
} from '../lib/categoryUtils';
import { db, collection, query, onSnapshot } from '../lib/firebase';
import { CascadeDeleteModal } from './CascadeDeleteModal';

interface CategoriesManagerProps {
  categories?: Category[];
  stores?: Store[];
  products?: Product[];
  isLoading?: boolean;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => Promise<void> | void;
  onToggleStatus: (category: Category) => void;
  onSeedData: () => void;
  onNavigateToStores?: (categoryId?: string) => void;
  currentUser?: AdminUser | null;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories: propCategories = [],
  isLoading: propIsLoading = false,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleStatus,
  onSeedData,
  onNavigateToStores,
  currentUser
}) => {
  const [internalCategories, setInternalCategories] = useState<Category[]>(propCategories);
  const [isComponentLoading, setIsComponentLoading] = useState(false);

  // Cascade delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ⚠️ إيقاف استنزاف فايربيس: الاستماع لمجموعة categories فقط دون جلب آلاف المتاجر والمنتجات
  useEffect(() => {
    setIsComponentLoading(true);

    const qCat = query(collection(db, 'categories'));
    const unsubCategories = onSnapshot(
      qCat, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setInternalCategories(list);
        setIsComponentLoading(false);
      }, 
      (error) => {
        console.warn('Categories listener error:', error);
        setIsComponentLoading(false);
      }
    );

    return () => {
      unsubCategories();
    };
  }, []);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) setInternalCategories(propCategories);
  }, [propCategories]);

  const safeCategories = useMemo(() => 
    internalCategories.length > 0 ? internalCategories : propCategories, 
    [internalCategories, propCategories]
  );
  const isLoading = propIsLoading || isComponentLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'delivery' | 'field_service'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const canCreate = hasModulePermission(currentUser?.permissions, currentUser?.role, 'categories', 'create');
  const canEdit = hasModulePermission(currentUser?.permissions, currentUser?.role, 'categories', 'edit');
  const canDelete = hasModulePermission(currentUser?.permissions, currentUser?.role, 'categories', 'delete');

  // Filter categories
  const filteredCategories = safeCategories.filter(c => {
    // 1. Search filter
    const matchesSearch = !searchTerm.trim() ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Service type filter
    const isFieldService = c.serviceTypeCategory === 'field_service' || c.id === 'cat-manfaa' || c.id === 'cat-fazaa';
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'field_service' && isFieldService) ||
      (typeFilter === 'delivery' && !isFieldService);

    // 3. Status filter
    const isActive = c.status ? c.status === 'active' : (c.isActive !== false);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalCategories = safeCategories.length;
  const activeCategories = safeCategories.filter(c => c.status ? c.status === 'active' : (c.isActive !== false)).length;
  const inactiveCategories = totalCategories - activeCategories;
  const deliveryCategories = safeCategories.filter(c => c.serviceTypeCategory !== 'field_service' && c.id !== 'cat-manfaa' && c.id !== 'cat-fazaa').length;
  const fieldServiceCategories = totalCategories - deliveryCategories;

  // Handle confirmed cascade deletion
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(categoryToDelete.id);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error during category deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Top Header & Control Hero */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200/80 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-amber-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    إدارة الفئات وأقسام الخدمات
                  </h1>
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold font-sans">
                    {totalCategories} فئة مسجلة
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  تخصيص كامل للخدمات بصور الأقسام التعبيرية، والبنرات الإعلانية العريضة، وحالة التفعيل والتشغيل
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {onNavigateToStores && (
              <button
                onClick={() => onNavigateToStores()}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer"
              >
                <StoreIcon className="w-4 h-4 text-slate-600" />
                <span>إدارة المتاجر والأفرع</span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={onAddCategory}
                className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all active:scale-98 cursor-pointer hover:shadow-lg"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ إضافة خدمة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">إجمالي الخدمات</span>
              <span className="text-lg font-black text-slate-800 font-sans">{totalCategories}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 block">شغالة ونشطة</span>
              <span className="text-lg font-black text-emerald-800 font-sans">{activeCategories}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 block">خدمات توصيل طلبات</span>
              <span className="text-lg font-black text-blue-800 font-sans">{deliveryCategories}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-700 block">خدمات في الموقع / ميدانية</span>
              <span className="text-lg font-black text-purple-800 font-sans">{fieldServiceCategories}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter and View Mode Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الخدمة، الوصف، أو العنوان الفرعي..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-800"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Service Type Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              الكل ({safeCategories.length})
            </button>
            <button
              onClick={() => setTypeFilter('delivery')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'delivery' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              توصيل ({deliveryCategories})
            </button>
            <button
              onClick={() => setTypeFilter('field_service')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'field_service' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              ميدانية ({fieldServiceCategories})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              نشط ({activeCategories})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'inactive' ? 'bg-white text-slate-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              متوقف ({inactiveCategories})
            </button>
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              title="عرض كبطاقات شبكية"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="عرض كجدول تفصيلي"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Display: Grid or Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-gray-200 shadow-sm">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">جاري تحميل وتحديث أقسام الخدمات...</h3>
          <p className="text-xs text-slate-400 mt-1">يتم جلب بيانات الأنشطة من قاعدة البيانات السحابية</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 border border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
            <ImageIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">لا توجد خدمات مطابقة للتصفية</h3>
            <p className="text-xs text-slate-500 mt-1">
              لم نعثر على أي خدمة أو فئة تطابق معايير البحث المحددة.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            ) : null}

            {canCreate && (
              <button
                onClick={onAddCategory}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة جديدة</span>
              </button>
            )}

            {safeCategories.length === 0 && (
              <button
                onClick={onSeedData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>إضافة البيانات الافتراضية</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= CARDS GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((category) => {
            const catImage = getCategoryImageUrl(category, category.name);
            const catSubtitle = getCategorySubtitle(category, category.name);
            const isServiceActive = category.status ? category.status === 'active' : (category.isActive !== false);
            const isFieldService = category.serviceTypeCategory === 'field_service' || category.id === 'cat-manfaa' || category.id === 'cat-fazaa';
            const bannerImg = category.bannerUrl || category.bannerImageUrl || category.banner_image_url || DEFAULT_CATEGORY_BANNER;

            return (
              <div 
                key={category.id}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isServiceActive 
                    ? 'border-gray-200/90 hover:border-blue-400' 
                    : 'border-slate-200 bg-slate-50/40 opacity-80'
                }`}
              >
                {/* Card Top: Banner & Badges */}
                <div className="relative h-32 w-full bg-slate-900 overflow-hidden shrink-0">
                  <img 
                    src={bannerImg} 
                    alt={category.name} 
                    className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
                      isServiceActive ? 'opacity-85' : 'opacity-40 grayscale'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Top Badges Overlay */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                    {/* Service Type Badge */}
                    {isFieldService ? (
                      <span className="inline-flex items-center gap-1 bg-purple-600/90 backdrop-blur-xs text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                        <Wrench className="w-3 h-3" />
                        <span>خدمة ميدانية</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-600/90 backdrop-blur-xs text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                        <Truck className="w-3 h-3" />
                        <span>توصيل طلبات</span>
                      </span>
                    )}

                    {/* Order Number Badge */}
                    <span className="bg-black/50 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                      #{category.order || 1}
                    </span>
                  </div>

                  {/* CTA Text in Banner Overlay */}
                  <div className="absolute bottom-2 left-3 text-white text-[10px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                    {category.ctaText || 'اطلب الآن'}
                  </div>
                </div>

                {/* Card Body: Representative Image + Titles + Description */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Floating Representative Image + Titles */}
                    <div className="flex items-start gap-3.5 -mt-10 mb-2 relative z-10">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-3 border-white shadow-md shrink-0 flex items-center justify-center">
                        <img 
                          src={catImage} 
                          alt={category.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0 pt-7">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {category.name}
                          </h3>
                        </div>
                        {category.nameEn && (
                          <div className="text-[10px] text-slate-400 font-sans truncate">{category.nameEn}</div>
                        )}
                      </div>
                    </div>

                    {/* Slogan / Subtitle */}
                    {catSubtitle && (
                      <div className="text-xs font-semibold text-blue-700 bg-blue-50/70 px-2.5 py-1 rounded-lg mt-1 mb-2 inline-block">
                        {catSubtitle}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {category.description || 'خدمة متميزة تتيح للعملاء الطلب والتصفح بكل سهولة وسرعة.'}
                    </p>
                  </div>

                  {/* Card Actions & Status (Replaced heavy counters with direct store navigation & read-only status badge) */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    {onNavigateToStores ? (
                      <button
                        onClick={() => onNavigateToStores(category.id)}
                        className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 text-xs py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="استعراض المتاجر التابعة لهذا القسم"
                      >
                        <StoreIcon className="w-3.5 h-3.5" />
                        <span>استعراض المتاجر</span>
                        <ChevronRight className="w-3 h-3 rotate-180" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">قسم خدمات معتمد</span>
                    )}

                    {/* Read-Only Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isServiceActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isServiceActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{isServiceActive ? 'نشط' : 'متوقف'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    {canEdit && (
                      <button
                        onClick={() => onEditCategory(category)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        title="تعديل بيانات وصور الخدمة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    )}

                    {/* Toggle Visibility button */}
                    {canEdit && (
                      <button
                        onClick={() => onToggleStatus(category)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isServiceActive 
                            ? 'bg-gray-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={isServiceActive ? 'إخفاء الخدمة من واجهة التطبيق' : 'إظهار الخدمة في واجهة التطبيق'}
                      >
                        {isServiceActive ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>إخفاء</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>إظهار</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Cascade Delete Button */}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setCategoryToDelete(category);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                        title="حذف هذه الفئة والمتاجر التابعة لها نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  {/* View Stores link */}
                  {onNavigateToStores && (
                    <button
                      onClick={() => onNavigateToStores(category.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <span>المتاجر</span>
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-gray-200 font-bold">
                  <th className="p-4 text-center w-12">#</th>
                  <th className="p-4 w-20">صورة القسم</th>
                  <th className="p-4">اسم الخدمة / النشاط</th>
                  <th className="p-4">الوصف والشعار</th>
                  <th className="p-4 text-center">نوع الخدمة</th>
                  <th className="p-4 text-center">الترتيب</th>
                  <th className="p-4 text-center">المتاجر</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category, index) => {
                  const catImage = getCategoryImageUrl(category, category.name);
                  const catSubtitle = getCategorySubtitle(category, category.name);
                  const isServiceActive = category.status ? category.status === 'active' : (category.isActive !== false);
                  const isFieldService = category.serviceTypeCategory === 'field_service' || category.id === 'cat-manfaa' || category.id === 'cat-fazaa';

                  return (
                    <tr 
                      key={category.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Index */}
                      <td className="p-4 text-center font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Image Thumbnail */}
                      <td className="p-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs shrink-0 flex items-center justify-center">
                          <img 
                            src={catImage} 
                            alt={category.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </td>

                      {/* Arabic Name & English Name */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {category.name}
                        </div>
                        {category.nameEn && (
                          <div className="text-[11px] text-slate-400 font-sans">{category.nameEn}</div>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">ID: {category.id}</span>
                      </td>

                      {/* Subtitle & Description */}
                      <td className="p-4 max-w-xs">
                        {catSubtitle && (
                          <div className="text-xs font-semibold text-blue-700 truncate">
                            {catSubtitle}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {category.description || '—'}
                        </p>
                      </td>

                      {/* Service Type Badge */}
                      <td className="p-4 text-center">
                        {isFieldService ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                            <Wrench className="w-3 h-3" />
                            <span>ميدانية</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                            <Truck className="w-3 h-3" />
                            <span>توصيل طلبات</span>
                          </span>
                        )}
                      </td>

                      {/* Order */}
                      <td className="p-4 text-center font-sans font-bold text-slate-700">
                        <span className="bg-gray-100 text-slate-700 px-2.5 py-1 rounded-md text-xs">
                          #{category.order || 1}
                        </span>
                      </td>

                      {/* Stores Action */}
                      <td className="p-4 text-center font-sans">
                        {onNavigateToStores ? (
                          <button
                            onClick={() => onNavigateToStores(category.id)}
                            className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                            title="استعراض متاجر هذا القسم"
                          >
                            <StoreIcon className="w-3.5 h-3.5" />
                            <span>استعراض المتاجر</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Read-Only Status Badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          isServiceActive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-gray-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isServiceActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isServiceActive ? 'نشط' : 'متوقف'}</span>
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => onEditCategory(category)}
                              className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="تعديل هذا النشاط"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canEdit && (
                            <button
                              onClick={() => onToggleStatus(category)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer ${
                                isServiceActive 
                                  ? 'bg-gray-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isServiceActive ? 'إخفاء الخدمة من واجهة التطبيق' : 'إظهار الخدمة في واجهة التطبيق'}
                            >
                              {isServiceActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => {
                                setCategoryToDelete(category);
                                setIsDeleteModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="حذف هذا النشاط نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-slate-500 flex items-center justify-between">
            <div>
              إجمالي الأنشطة المعروضة: <span className="font-bold text-slate-900">{filteredCategories.length}</span> من أصل <span className="font-bold text-slate-900">{safeCategories.length}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              جميع التعديلات والتبديل تنعكس فورياً على قاعدة البيانات وتطبيق العميل
            </div>
          </div>
        </div>
      )}

      {/* Cascade Delete Confirmation Modal */}
      <CascadeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        itemType="category"
        item={categoryToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

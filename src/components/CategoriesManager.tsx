import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Tag, 
  Edit3, 
  Trash2, 
  X, 
  Layers, 
  UtensilsCrossed, 
  Flame, 
  Pizza, 
  Coffee, 
  Cake, 
  Apple, 
  Beer,
  RefreshCw,
  Database,
  Shirt,
  ShoppingBag,
  Pill,
  Tv,
  Store,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  Eye,
  Sliders,
  ChevronDown,
  Briefcase,
  Footprints,
  Gift,
  Watch,
  Glasses,
  Car,
  Scissors,
  Sparkles
} from 'lucide-react';
import { Category, Product, AdminUser } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { CategoryVectorIcon } from '../lib/categoryUtils';

interface CategoriesManagerProps {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onToggleStatus: (category: Category) => void;
  onSeedData: () => void;
  currentUser?: AdminUser | null;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories = [],
  products = [],
  isLoading,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleStatus,
  onSeedData,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canCreate = hasModulePermission(currentUser, 'categories', 'create');
  const canEdit = hasModulePermission(currentUser, 'categories', 'edit');
  const canDelete = hasModulePermission(currentUser, 'categories', 'delete');

  const safeCategories = categories || [];
  const safeProducts = products || [];

  const filteredCategories = safeCategories.filter(c => 
    !searchTerm.trim() ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nameEn && c.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Count products per category
  const getProductCount = (category: Category) => {
    return safeProducts.filter(p => p.categoryId === category.id || p.categoryName === category.name).length;
  };

  const selectedCategory = safeCategories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">جدول إدارة التصنيفات والأقسام</h2>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold font-sans border border-blue-100">
              {categories.length} تصنيف
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            حدد أي قسم بالنقر عليه لعرض بياناته التفصيلية وأزرار التعديل والحذف في المربع المخصص
          </p>
        </div>

        {/* Add Category Button */}
        {canCreate && (
          <button
            onClick={onAddCategory}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة فئة خدمة / تصنيف جديد</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم التصنيف، الوصف أو الاسم الإنجليزي..."
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-800"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">جاري تحميل التصنيفات...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-gray-100">
              <Tag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">لا توجد تصنيفات</h3>
              <p className="text-xs text-slate-400 mt-1">
                لم نجد أي تصنيف مطابِق في قاعدة البيانات.
              </p>
            </div>
            {categories.length === 0 && (
              <button
                onClick={onSeedData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>إضافة البيانات الأولية</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 text-slate-400 uppercase tracking-wider text-[11px] border-b border-gray-100 font-bold">
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">الأيقونة</th>
                  <th className="p-3.5">اسم التصنيف / الخدمة</th>
                  <th className="p-3.5">الوصف العام</th>
                  <th className="p-3.5 text-center">ترتيب العرض</th>
                  <th className="p-3.5 text-center">عدد المنتجات</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">التحديد والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category, index) => {
                  const count = getProductCount(category);
                  const isSelected = selectedCategoryId === category.id;

                  return (
                    <tr 
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(isSelected ? null : category.id);
                      }}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50/80 font-medium ring-1 ring-blue-400 inset-0' 
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Index */}
                      <td className="p-3.5 text-center font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Icon */}
                      <td className="p-3.5 w-16">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 border border-blue-100 text-blue-600'
                        }`}>
                          <CategoryVectorIcon icon={category.icon} className="w-5 h-5" />
                        </div>
                      </td>

                      {/* Arabic Name & Dynamic Label */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{category.name}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                              محدد
                            </span>
                          )}
                        </div>
                        {category.nameEn && (
                          <div className="text-[11px] text-slate-400 font-sans">{category.nameEn}</div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-3.5 max-w-xs truncate text-xs text-slate-500">
                        {category.description || '—'}
                      </td>

                      {/* Display Order */}
                      <td className="p-3.5 text-center font-sans font-bold text-slate-700">
                        <span className="bg-gray-100 text-slate-700 px-2.5 py-1 rounded-md text-xs">
                          #{category.order}
                        </span>
                      </td>

                      {/* Linked Products Count */}
                      <td className="p-3.5 text-center font-sans">
                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-100 text-xs px-2.5 py-1 rounded-full font-bold">
                          {count} منتجات
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={!canEdit}
                          onClick={() => canEdit && onToggleStatus(category)}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                            category.status === 'active' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                          } ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {category.status === 'active' ? 'نشط (مفعل)' : 'غير نشط'}
                        </button>
                      </td>

                      {/* Action buttons: Only shown when selected/focused */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {isSelected ? (
                          <div className="flex items-center justify-center gap-1.5 animate-in fade-in">
                            {/* Edit button */}
                            {canEdit && (
                              <button
                                onClick={() => onEditCategory(category)}
                                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                title="تعديل هذا القسم"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete button */}
                            {canDelete && (
                              deleteConfirmId === category.id ? (
                                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                                  <button
                                    onClick={() => {
                                      onDeleteCategory(category.id);
                                      setDeleteConfirmId(null);
                                    }}
                                    className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded cursor-pointer"
                                  >
                                    تأكيد
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
                                  onClick={() => setDeleteConfirmId(category.id)}
                                  className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                  title="حذف هذا القسم"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                            انقر للتحديد
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-slate-400 flex items-center justify-between">
          <div>
            إجمالي التصنيفات: <span className="font-bold text-slate-800">{categories.length}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {selectedCategoryId ? 'تم تحديد قسم للمعاينة والإدارة السريعة أدناه' : 'انقر على أي صف لتحديده وإجراء التعديل والحذف'}
          </div>
        </div>
      </div>

      {/* REQUIREMENT: Highlighted, slightly enlarged nested box below main section for selected category */}
      {selectedCategory && (
        <div className="bg-linear-to-br from-blue-50/90 via-white to-slate-50 border-2 border-blue-400/80 rounded-2xl p-5 shadow-md animate-in fade-in slide-in-from-top-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-4">
            <div className="flex items-center gap-3.5">
              {/* Enlarged Icon */}
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <CategoryVectorIcon icon={selectedCategory.icon} className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-md">
                    القسم المحدد حالياً
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedCategory.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {selectedCategory.name}
                </h3>
                {selectedCategory.nameEn && (
                  <span className="text-xs text-slate-500 font-sans block">
                    {selectedCategory.nameEn}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons for the selected category */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <button
                  onClick={() => onEditCategory(selectedCategory)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل هذا القسم</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => onToggleStatus(selectedCategory)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory.status === 'active'
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{selectedCategory.status === 'active' ? 'تعطيل مؤقت' : 'تفعيل النشاط'}</span>
                </button>
              )}

              {canDelete && (
                deleteConfirmId === selectedCategory.id ? (
                  <div className="flex items-center gap-1 bg-red-100 p-1 rounded-xl border border-red-300">
                    <button
                      onClick={() => {
                        onDeleteCategory(selectedCategory.id);
                        setSelectedCategoryId(null);
                        setDeleteConfirmId(null);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      تأكيد الحذف النهائي
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      تراجع
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(selectedCategory.id)}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>حذف القسم</span>
                  </button>
                )
              )}

              <button
                onClick={() => setSelectedCategoryId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                title="إغلاق التحديد"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Grid in the Nested Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-slate-400 block font-medium">الوصف العام:</span>
              <p className="font-bold text-slate-800 mt-1">
                {selectedCategory.description || 'لم يُضف وصف عام لهذا القسم حتى الآن.'}
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-slate-400 block font-medium">المنتجات المرتبطة:</span>
              <p className="font-bold text-blue-700 text-sm mt-1">
                {getProductCount(selectedCategory)} منتجات مسجلة
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-slate-400 block font-medium">ترتيب الظهور:</span>
              <p className="font-bold text-slate-800 text-sm mt-1">
                #{selectedCategory.order} في الواجهات
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-slate-400 block font-medium">حالة التفعيل:</span>
              <div className="mt-1">
                {selectedCategory.status === 'active' ? (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    مفعل وظاهر للعملاء
                  </span>
                ) : (
                  <span className="bg-gray-200 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    معطل ومخفي
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


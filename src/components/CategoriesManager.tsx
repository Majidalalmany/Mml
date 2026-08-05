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
  Database
} from 'lucide-react';
import { Category, Product } from '../types';

interface CategoriesManagerProps {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onToggleStatus: (category: Category) => void;
  onSeedData: () => void;
}

const ICON_MAP: Record<string, any> = {
  UtensilsCrossed,
  Flame,
  Pizza,
  Coffee,
  Cake,
  Apple,
  Beer
};

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories = [],
  products = [],
  isLoading,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleStatus,
  onSeedData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const safeCategories = categories || [];
  const safeProducts = products || [];

  const filteredCategories = safeCategories.filter(c => 
    !searchTerm.trim() ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nameEn && c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Count products per category
  const getProductCount = (category: Category) => {
    return safeProducts.filter(p => p.categoryId === category.id || p.categoryName === category.name).length;
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">جدول إدارة التصنيفات</h2>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold font-sans border border-blue-100">
              {categories.length} تصنيف
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة تصنيفات الأطعمة والمنتجات وترتيب ظهورها في التطبيق
          </p>
        </div>

        {/* Add Category Button */}
        <button
          onClick={onAddCategory}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-all active:scale-98 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>إضافة تصنيف جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم التصنيف (بالعربي أو الإنجليزي)..."
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
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
      </div>

      {/* Categories Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">جاري تحميل التصنيفات من Firestore...</p>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
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
                  <th className="p-3.5">اسم التصنيف</th>
                  <th className="p-3.5">الاسم بالإنجليزية</th>
                  <th className="p-3.5 text-center">ترتيب العرض</th>
                  <th className="p-3.5 text-center">عدد المنتجات</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category, index) => {
                  const IconComp = ICON_MAP[category.icon || 'UtensilsCrossed'] || Tag;
                  const count = getProductCount(category);

                  return (
                    <tr 
                      key={category.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* Index */}
                      <td className="p-3.5 text-center font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Icon */}
                      <td className="p-3.5 w-16">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                          <IconComp className="w-5 h-5" />
                        </div>
                      </td>

                      {/* Arabic Name */}
                      <td className="p-3.5 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </td>

                      {/* English Name */}
                      <td className="p-3.5 font-sans text-slate-400">
                        {category.nameEn || '—'}
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
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onToggleStatus(category)}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                            category.status === 'active' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                          }`}
                        >
                          {category.status === 'active' ? 'نشط (مفعل)' : 'غير نشط'}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit button */}
                          <button
                            onClick={() => onEditCategory(category)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                            title="تعديل التصنيف"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          {deleteConfirmId === category.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                              <button
                                onClick={() => {
                                  onDeleteCategory(category.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded"
                              >
                                تأكيد
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 text-slate-500 hover:text-slate-800 text-[11px]"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(category.id)}
                              className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                              title="حذف التصنيف"
                            >
                              <X className="w-4 h-4" />
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
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-slate-400 flex items-center justify-between">
          <div>
            إجمالي التصنيفات الحالية: <span className="font-bold text-slate-800">{categories.length}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            مخزنة ومعالجة عبر Firestore
          </div>
        </div>
      </div>
    </div>
  );
};

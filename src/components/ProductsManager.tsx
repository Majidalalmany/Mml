import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Package, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  XCircle,
  Database,
  RefreshCw,
  Tag
} from 'lucide-react';
import { Product, Category } from '../types';

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleInStock: (product: Product) => void;
  onSeedData: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products = [],
  categories = [],
  isLoading,
  onAddProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onToggleInStock,
  onSeedData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const safeProducts = products || [];
    return safeProducts.filter((item) => {
      // Search match
      const matchesSearch = 
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category match
      const matchesCategory = 
        selectedCategory === 'all' || 
        item.categoryId === selectedCategory ||
        item.categoryName === selectedCategory;

      // Stock match
      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'inStock' && item.inStock) ||
        (stockFilter === 'outOfStock' && !item.inStock);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

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
            إدارة كافة قائمة المنتجات وأسعارها وحالة توفرها في Firestore
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، رمز SKU أو الوصف..."
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="all">جميع التصنيفات ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="all">حالة التوفر (الكل)</option>
            <option value="inStock">المتوفرة فقط</option>
            <option value="outOfStock">غير المتوفرة فقط</option>
          </select>
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
              <h3 className="text-base font-bold text-slate-800">لا توجد منتجات مطابقة</h3>
              <p className="text-xs text-slate-400 mt-1">
                {products.length === 0 
                  ? 'لم يتم إضافة أي منتجات بعد في قاعدة بيانات Firestore.'
                  : 'جرب تغيير خيارات البحث أو الفلترة لعرض نتائج أكثر.'}
              </p>
            </div>
            {products.length === 0 && (
              <button
                onClick={onSeedData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
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
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">السعر</th>
                  <th className="p-3.5 text-center">التوفر</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product, index) => (
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
                          <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-md font-medium">
                        <Tag className="w-3 h-3 text-blue-500" />
                        {product.categoryName || 'غير محدد'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-3.5 font-sans">
                      <div className="font-bold text-slate-800">
                        {product.price.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">ريال</span>
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[10px] text-slate-300 line-through">
                          {product.originalPrice.toLocaleString()} ريال
                        </div>
                      )}
                    </td>

                    {/* Stock Switch */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onToggleInStock(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                          product.inStock 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
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
                          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                          title="معاينة تفاصيل المنتج"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Pencil Button */}
                        <button
                          onClick={() => onEditProduct(product)}
                          className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                          title="تعديل المنتج"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        {deleteConfirmId === product.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                            <button
                              onClick={() => {
                                onDeleteProduct(product.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded"
                            >
                              حذف
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
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                            title="حذف المنتج من Firestore"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            عرض <span className="font-bold text-slate-800">{filteredProducts.length}</span> من أصل{' '}
            <span className="font-bold text-slate-800">{products.length}</span> منتج في Firestore
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

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Store as StoreIcon, 
  Plus, 
  Tag, 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  Truck, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  ExternalLink,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { Store, Category, Product } from '../types';

interface StoreDetailPageProps {
  store: Store;
  products: Product[];
  categories: Category[];
  onBack: () => void;
  onEditStore: (store: Store) => void;
  onUpdateStoreSections: (storeId: string, updatedSections: string[]) => void;
  onAddProductForStore: (storeId: string, sectionName: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleProductInStock?: (product: Product) => void;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({
  store,
  products = [],
  categories = [],
  onBack,
  onEditStore,
  onUpdateStoreSections,
  onAddProductForStore,
  onEditProduct,
  onDeleteProduct,
  onToggleProductInStock
}) => {
  // Current active section selected by user
  const storeSections = store.sections || ['وجبات رئيسية', 'مقبلات وسلطات', 'مشروبات وعصائر'];
  const [selectedSection, setSelectedSection] = useState<string>(storeSections[0] || 'الكل');

  // New section input state
  const [newSectionInput, setNewSectionInput] = useState('');
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');

  // Section renaming state
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [renamedSectionValue, setRenamedSectionValue] = useState('');
  const [sectionErrorMsg, setSectionErrorMsg] = useState<string | null>(null);

  // Deletion confirm states
  const [deleteConfirmProdId, setDeleteConfirmProdId] = useState<string | null>(null);
  const [deleteConfirmSecName, setDeleteConfirmSecName] = useState<string | null>(null);

  // Products belonging to this store
  const storeProducts = products.filter(
    p => p.storeId === store.id || p.storeName === store.id || p.storeName === store.name
  );

  // Filter products by selected section
  const filteredProducts = storeProducts.filter(p => {
    const matchesSection = selectedSection === 'الكل' || p.sectionName === selectedSection;
    const matchesSearch = !sectionSearchTerm || p.name.toLowerCase().includes(sectionSearchTerm.toLowerCase());
    return matchesSection && matchesSearch;
  });

  // Handler to add a new section manually
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    setSectionErrorMsg(null);
    const trimmed = newSectionInput.trim();
    if (!trimmed) return;
    if (storeSections.includes(trimmed)) {
      setSectionErrorMsg('هذا القسم موجود بالفعل في المتجر!');
      return;
    }
    const updated = [...storeSections, trimmed];
    onUpdateStoreSections(store.id, updated);
    setSelectedSection(trimmed);
    setNewSectionInput('');
  };

  // Handler to rename an existing section
  const handleRenameSection = (oldName: string) => {
    setSectionErrorMsg(null);
    const trimmed = renamedSectionValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSection(null);
      return;
    }
    if (storeSections.includes(trimmed)) {
      setSectionErrorMsg('اسم القسم الجديد موجود بالفعل!');
      return;
    }
    const updated = storeSections.map(s => s === oldName ? trimmed : s);
    onUpdateStoreSections(store.id, updated);
    if (selectedSection === oldName) {
      setSelectedSection(trimmed);
    }
    setEditingSection(null);
  };

  // Handler to delete a section
  const handleDeleteSection = (secToDelete: string) => {
    setSectionErrorMsg(null);
    if (storeSections.length <= 1) {
      setSectionErrorMsg('يجب الإبقاء على قسم واحد على الأقل في المتجر!');
      return;
    }
    const updated = storeSections.filter(s => s !== secToDelete);
    onUpdateStoreSections(store.id, updated);
    if (selectedSection === secToDelete) {
      setSelectedSection(updated[0] || 'الكل');
    }
    setDeleteConfirmSecName(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Breadcrumb Header Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span>العودة لجميع المتاجر</span>
          </button>

          <span className="text-gray-300">/</span>

          <div className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">{store.name}</h1>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {store.activityType || store.categoryName || 'نشاط تجاري'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditStore(store)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل بيانات المتجر والخريطة</span>
          </button>
        </div>
      </div>

      {/* 2. Basic Store Info Header (5 Core Required Fields) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">تفاصيل المتجر / المطعم الأساسية</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              store.status === 'open' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : store.status === 'closed'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {store.status === 'open' ? '🟢 مفتوح للطلبات' : store.status === 'closed' ? '🔴 مغلق حالياً' : '🟡 قيد الصيانة'}
            </span>
          </div>
        </div>

        {/* The 5 Core Required Store Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Field 1: Store Name */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">1. اسم المتجر / المطعم</span>
            <div className="text-sm font-bold text-slate-900 truncate" title={store.name}>
              {store.name}
            </div>
          </div>

          {/* Field 2: Store Logo */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">2. شعار المتجر (Logo)</span>
              <span className="text-xs font-bold text-blue-600 block mt-0.5">شعار معتمد</span>
            </div>
            <img 
              src={store.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80'} 
              alt={store.name}
              className="w-10 h-10 rounded-lg border border-gray-200 object-cover bg-white shrink-0 shadow-2xs"
            />
          </div>

          {/* Field 3: Store Phone Number */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">3. رقم المتجر / الهاتف</span>
            <div className="text-sm font-bold text-slate-900 font-mono flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{store.phone || '77XXXXXXX'}</span>
            </div>
          </div>

          {/* Field 4: Creation Date */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">4. تاريخ الإنشاء</span>
            <div className="text-sm font-bold text-slate-900 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {store.createdAt 
                  ? (typeof store.createdAt === 'string' && store.createdAt.includes('T') ? store.createdAt.split('T')[0] : String(store.createdAt))
                  : '2026-01-15'
                }
              </span>
            </div>
          </div>

          {/* Field 5: Store Location / Address */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 block">5. الموقع (العنوان)</span>
            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1" title={store.address}>
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate">{store.address || 'العنوان الرئيسي'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Product Management Section Title Bar (إدارة إضافة المنتجات) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-300" />
            <span>إدارة إضافة المنتجات لـ ({store.name})</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            أضف المنتجات مباشرةً للمتجر، خصص الأقسام، وعدّل الأسعار والحالة فورياً
          </p>
        </div>

        <button
          onClick={() => onAddProductForStore(store.id, selectedSection === 'الكل' ? (storeSections[0] || 'عام') : selectedSection)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة منتج جديد لهذا المتجر</span>
        </button>
      </div>

      {/* 3. Product Management Section Container */}
      <div className="space-y-6">
          {/* Add Section Form & Section Pills Header */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>إضافة وتنظيم أقسام متجر "{store.name}"</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أضف الأقسام يدوياً (مثال: مقبلات، وجبات رئيسية، مشروبات، إضافات وتوابع) ثم اختر القسم لإضافة وتصفح منتجاته
                </p>
              </div>

              {/* Add section manual form inline */}
              <form onSubmit={handleAddSection} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newSectionInput}
                  onChange={(e) => setNewSectionInput(e.target.value)}
                  placeholder="اسم قسم جديد يدوياً..."
                  className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 bg-slate-50 min-w-[200px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة قسم</span>
                </button>
              </form>
            </div>

            {sectionErrorMsg && (
              <div className="bg-amber-50 text-amber-800 text-xs p-2.5 rounded-xl border border-amber-200 font-bold flex items-center justify-between">
                <span>⚠️ {sectionErrorMsg}</span>
                <button onClick={() => setSectionErrorMsg(null)} className="text-slate-500 hover:text-slate-800 text-xs">✕</button>
              </div>
            )}

            {/* Interactive Section Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setSelectedSection('الكل')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedSection === 'الكل'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>كافة الأقسام</span>
                <span className="bg-white/20 text-xs px-1.5 py-0.2 rounded-md font-mono">{storeProducts.length}</span>
              </button>

              {storeSections.map((secName) => {
                const countInSec = storeProducts.filter(p => p.sectionName === secName).length;
                const isSelected = selectedSection === secName;
                const isEditing = editingSection === secName;

                if (isEditing) {
                  return (
                    <div key={secName} className="flex items-center gap-1 bg-white p-1 rounded-xl border border-blue-400 shadow-xs shrink-0">
                      <input 
                        type="text"
                        value={renamedSectionValue}
                        onChange={(e) => setRenamedSectionValue(e.target.value)}
                        className="px-2 py-1 text-xs font-bold border rounded border-gray-300 w-28"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleRenameSection(secName)}
                        className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded"
                      >
                        حفظ
                      </button>
                      <button 
                        onClick={() => setEditingSection(null)}
                        className="px-2 py-1 bg-gray-200 text-slate-700 text-[10px] font-bold rounded"
                      >
                        إلغاء
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={secName} className="relative group shrink-0 flex items-center">
                    <button
                      onClick={() => setSelectedSection(secName)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                          : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{secName}</span>
                      <span className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-slate-600'
                      }`}>
                        {countInSec}
                      </span>
                    </button>

                    {/* Edit & Delete section buttons on hover */}
                    <div className="absolute -top-1.5 -left-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSection(secName);
                          setRenamedSectionValue(secName);
                        }}
                        className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs text-[10px]"
                        title={`تعديل اسم قسم ${secName}`}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(secName)}
                        className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs text-[10px]"
                        title={`حذف قسم ${secName}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Products Header Bar & Add Product Trigger */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                منتجات قسم: <span className="text-blue-600">{selectedSection}</span>
              </h4>
              <span className="text-xs text-slate-400 font-medium">({filteredProducts.length} صنف)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={sectionSearchTerm}
                  onChange={(e) => setSectionSearchTerm(e.target.value)}
                  placeholder="بحث بهذا القسم..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-gray-50"
                />
              </div>

              <button
                onClick={() => onAddProductForStore(store.id, selectedSection === 'الكل' ? (storeSections[0] || 'عام') : selectedSection)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة منتج بهذا القسم</span>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">لا توجد منتجات في قسم "{selectedSection}"</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                يمكنك الضغط على زر "إضافة منتج بهذا القسم" أدناه لإدخال أول صنف مع الإضافات والتفاصيل المطابقة للمتجر.
              </p>
              <button
                onClick={() => onAddProductForStore(store.id, selectedSection === 'الكل' ? (storeSections[0] || 'عام') : selectedSection)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول منتج للقسم</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all group"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <img 
                        src={prod.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'} 
                        alt={prod.name}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div className="overflow-hidden space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-sm text-slate-900 truncate">{prod.name}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            prod.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {prod.inStock ? 'متوفر' : 'غير متوفر'}
                          </span>
                        </div>

                        <span className="bg-gray-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium inline-block">
                          {prod.sectionName || selectedSection}
                        </span>

                        <p className="text-xs text-slate-500 line-clamp-2">{prod.description || 'لا يوجد وصف متاح'}</p>
                      </div>
                    </div>

                    {/* Pricing & Extras Badges */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">السعر:</span>
                        <span className="text-sm font-bold text-blue-700 font-sans">
                          {prod.price.toLocaleString()} ريال
                        </span>
                      </div>

                      {prod.options && prod.options.length > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold block border border-emerald-100">
                            + {prod.options.length} مجموعات إضافات وصوصات
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-1 flex-wrap">
                    <button
                      onClick={() => onEditProduct(prod)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {onToggleProductInStock && (
                      <button
                        onClick={() => onToggleProductInStock(prod)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          prod.inStock
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                        }`}
                        title={prod.inStock ? 'إخفاء المنتج (تعطيل التوفر)' : 'إظهار المنتج (تفعيل التوفر)'}
                      >
                        {prod.inStock ? 'إخفاء (غير متوفر)' : 'إظهار (متوفر)'}
                      </button>
                    )}

                    {deleteConfirmProdId === prod.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-md border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-700">تأكيد؟</span>
                        <button
                          onClick={() => {
                            onDeleteProduct(prod.id);
                            setDeleteConfirmProdId(null);
                          }}
                          className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          حذف
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProdId(null)}
                          className="px-1.5 py-0.5 bg-gray-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmProdId(prod.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

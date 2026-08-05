import React, { useState, useEffect } from 'react';
import { X, Upload, Package, Check, DollarSign, Image as ImageIcon, Tag, FileText, Barcode, Store as StoreIcon, Layers, Plus, Trash2, Sliders } from 'lucide-react';
import { Product, Category, Store, ProductPriceOption, ProductExtraOption } from '../types';
import { compressImageFile } from '../lib/imageUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  stores?: Store[];
  initialStoreId?: string;
  initialSectionName?: string;
}

const SAMPLE_IMAGES = [
  { name: 'عصير طازج', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80' },
  { name: 'ملابس وأزياء', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80' },
  { name: 'سوبرماركت وغذاء', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80' },
  { name: 'برجر ومطاعم', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { name: 'كيك وحلويات', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
  { name: 'دواء وفيتامين', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
  { name: 'جوال وإلكترونيات', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' }
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  stores = [],
  initialStoreId,
  initialSectionName
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [sectionName, setSectionName] = useState('وجبات رئيسية');
  const [imageUrl, setImageUrl] = useState('');
  const [inStock, setInStock] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [sku, setSku] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');

  // Multi-price state (أسعار متعددة)
  const [pricesList, setPricesList] = useState<ProductPriceOption[]>([]);

  // Options & Extras (الخيارات والإضافات)
  const [extraOptions, setExtraOptions] = useState<ProductExtraOption[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price ?? '');
      setOriginalPrice(product.originalPrice ?? '');
      setCategoryId(product.categoryId || (categories[0]?.id || ''));
      setStoreId(product.storeId || initialStoreId || (stores[0]?.id || ''));
      setSectionName(product.sectionName || initialSectionName || 'وجبات رئيسية');
      setImageUrl(product.imageUrl || '');
      setInStock(product.inStock ?? true);
      setStatus(product.status || 'active');
      setSku(product.sku || '');
      setDiscountPercent(product.discountPercent ?? '');
      setPricesList(product.prices || [
        { name: 'حجم صغير', price: (product.price || 2000) },
        { name: 'حجم وسط', price: (product.price || 2000) + 1000 },
        { name: 'حجم كبير', price: (product.price || 2000) + 2000 }
      ]);
      setExtraOptions(product.options || [
        {
          title: 'نوع الجبنة والصلصة',
          required: false,
          items: [
            { name: 'جبنة شيدر إضافية', extraPrice: 500 },
            { name: 'صلصة حارة جاهز', extraPrice: 200 }
          ]
        }
      ]);
    } else {
      setName('');
      setDescription('');
      setPrice(3500);
      setOriginalPrice(4200);
      setCategoryId(categories[0]?.id || '');
      setStoreId(initialStoreId || (stores[0]?.id || ''));
      setSectionName(initialSectionName || 'وجبات رئيسية');
      setImageUrl(SAMPLE_IMAGES[0].url);
      setInStock(true);
      setStatus('active');
      setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
      setDiscountPercent(15);
      setPricesList([
        { name: 'حجم صغير (250جم)', price: 2500 },
        { name: 'حجم وسط (500جم)', price: 3500 },
        { name: 'حجم عائلي (1 كجم)', price: 6000 }
      ]);
      setExtraOptions([
        {
          title: 'الخيارات والإضافات',
          required: false,
          items: [
            { name: 'جبنة إضافية', extraPrice: 500 },
            { name: 'صلصة حارة', extraPrice: 200 }
          ]
        }
      ]);
    }
    setError('');
  }, [product, categories, stores, isOpen]);

  if (!isOpen) return null;

  // Selected store sections helper
  const currentStoreObj = stores.find(s => s.id === storeId);
  const availableSections = currentStoreObj?.sections && currentStoreObj.sections.length > 0 
    ? currentStoreObj.sections 
    : ['مقبلات', 'وجبات رئيسية', 'مشروبات وعصائر', 'حلويات', 'أدوية وفيامينات', 'أدوات'];

  const addPriceOption = () => {
    setPricesList(prev => [...prev, { name: 'خيار جديد', price: Number(price || 1000) }]);
  };

  const removePriceOption = (idx: number) => {
    setPricesList(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePriceOption = (idx: number, field: 'name' | 'price', val: any) => {
    setPricesList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: field === 'price' ? Number(val) : val };
      return copy;
    });
  };

  const addExtraOption = () => {
    setExtraOptions(prev => [
      ...prev,
      {
        title: 'إضافة جديدة',
        required: false,
        items: [{ name: 'إضافة 1', extraPrice: 300 }]
      }
    ]);
  };

  const removeExtraOption = (idx: number) => {
    setExtraOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم المنتج');
      return;
    }
    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      setError('يرجى إدخال سعر صحيح للمنتج');
      return;
    }

    const selectedCategory = categories.find(c => c.id === categoryId);

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        categoryId: categoryId || (categories[0]?.id || 'default'),
        categoryName: selectedCategory ? selectedCategory.name : 'عام',
        storeId: storeId || undefined,
        storeName: currentStoreObj ? currentStoreObj.name : undefined,
        sectionName: sectionName || 'وجبات رئيسية',
        imageUrl: imageUrl.trim(),
        inStock,
        status,
        sku: sku.trim(),
        prices: pricesList,
        options: extraOptions,
        discountPercent: discountPercent !== '' ? Number(discountPercent) : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ المنتج في Firebase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const compressedDataUrl = await compressImageFile(file, 800, 800, 0.75);
        setImageUrl(compressedDataUrl);
      } catch (err) {
        setError('تعذر ضغط وتحميل الصورة، يرجى اختيار صورة أخرى');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-gray-200 my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-200" />
            <h3 className="text-lg font-bold">
              {product ? 'تعديل بيانات ورسوم المنتج' : 'إضافة صنف / منتج جديد'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                اسم المنتج / الصنف <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: وجبة شاورما عربي دبل / فيتامين سي 1000 ملجم"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                required
              />
            </div>

            {/* Store & Section Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                المتجر / المطعم التابع له
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-700"
              >
                <option value="">عام (كافة الفروع)</option>
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.categoryName})
                  </option>
                ))}
              </select>
            </div>

            {/* Section Inside Store */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                القسم المباشر داخل المنيو (Section)
              </label>
              <select
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-700"
              >
                {availableSections.map((sec, idx) => (
                  <option key={idx} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                التصنيف العام <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-700"
                required
              >
                <option value="" disabled>اختر التصنيف...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                رمز المنتج (SKU / الكود)
              </label>
              <input 
                type="text" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="مثال: PRD-102"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            {/* Default Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                السعر الأساسي (ريال) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="3500"
                min="0"
                step="50"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                required
              />
            </div>

            {/* Original Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                السعر قبل الخصم (اختياري)
              </label>
              <input 
                type="number" 
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="4200"
                min="0"
                step="50"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            {/* Discount Percent */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                نسبة التخفيض والعرض الترويجي (%)
              </label>
              <input 
                type="number" 
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 15%"
                min="0"
                max="100"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            {/* Image Upload & URL */}
            <div className="space-y-2 md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>صورة المنتج (رفع يدوياً أو رابط خارجي)</span>
                </label>
                
                {/* Manual File Picker */}
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة يدوياً من الجهاز</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 items-center">
                {/* Image Preview Box */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden shrink-0 flex items-center justify-center relative group">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Product Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="أدخل رابط صورة المنتج أو اختر من الجهاز أو النموذج..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  
                  <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-0.5 custom-scrollbar">
                    <span className="text-[10px] text-slate-400 shrink-0 font-bold">نماذج سريعة:</span>
                    {SAMPLE_IMAGES.map((img) => (
                      <button
                        key={img.name}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className="text-[10px] bg-white hover:bg-blue-50 hover:text-blue-700 border border-gray-200 px-2 py-0.5 rounded-md shrink-0 transition-colors font-medium"
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                وصف المنتج التفصيلي
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="اكتب وصفاً مختصراً ومكونات الوجبة أو خصائص العلاج أو المنتج..."
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Multi-Price Section (أسعار متعددة للصنف الواحد) */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">الأسعار المتعددة (Multi-Price)</h4>
                <p className="text-[11px] text-slate-400">إضافة أكثر من سعر حسب الحجم أو العبوة (صغير/وسط/كبير، 100جم/500جم)</p>
              </div>
              <button
                type="button"
                onClick={addPriceOption}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة سعر وحجم</span>
              </button>
            </div>

            <div className="space-y-2">
              {pricesList.map((pOpt, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <input 
                    type="text" 
                    value={pOpt.name}
                    onChange={(e) => updatePriceOption(idx, 'name', e.target.value)}
                    placeholder="مثال: حجم كبير"
                    className="flex-1 px-3 py-1.5 rounded border border-gray-200 text-xs bg-white"
                  />
                  <input 
                    type="number" 
                    value={pOpt.price}
                    onChange={(e) => updatePriceOption(idx, 'price', e.target.value)}
                    placeholder="السعر"
                    className="w-28 px-3 py-1.5 rounded border border-gray-200 text-xs bg-white font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => removePriceOption(idx)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Options & Modifiers Section (الخيارات والإضافات) */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">الخيارات والإضافات (Modifiers & Extras)</h4>
                <p className="text-[11px] text-slate-400">ربط الصنف بخيارات إضافية (مثل: صلصات إضافية، جبنة، درجات الحرارة)</p>
              </div>
              <button
                type="button"
                onClick={addExtraOption}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>إضافة قائمة خيارات</span>
              </button>
            </div>

            <div className="space-y-3">
              {extraOptions.map((optGroup, gIdx) => (
                <div key={gIdx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      value={optGroup.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtraOptions(prev => {
                          const copy = [...prev];
                          copy[gIdx].title = val;
                          return copy;
                        });
                      }}
                      className="font-bold text-xs bg-white px-2.5 py-1 rounded border border-gray-200 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraOption(gIdx)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الموديول</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {optGroup.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-2 text-xs">
                        <input 
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtraOptions(prev => {
                              const copy = [...prev];
                              copy[gIdx].items[iIdx].name = val;
                              return copy;
                            });
                          }}
                          placeholder="اسم الإضافة (مثال: جبنة شيدر)"
                          className="flex-1 px-2.5 py-1 rounded border border-gray-200 bg-white"
                        />
                        <input 
                          type="number"
                          value={item.extraPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setExtraOptions(prev => {
                              const copy = [...prev];
                              copy[gIdx].items[iIdx].extraPrice = val;
                              return copy;
                            });
                          }}
                          placeholder="+السعر الإضافي"
                          className="w-28 px-2.5 py-1 rounded border border-gray-200 bg-white font-sans"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Stock & Status Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">توفر المنتج بالمخزون</span>
                <span className="text-[11px] text-slate-400">يظهر للعميل إمكانية الطلب</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">حالة المنتج</span>
                <span className="text-[11px] text-slate-400">تفعيل أو إخفاء المنتج</span>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="text-xs font-bold px-3 py-1.5 rounded-md border border-gray-200 bg-white"
              >
                <option value="active">نشط (مفعل)</option>
                <option value="inactive">غير نشط (مخفي)</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>جاري الحفظ في Firestore...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{product ? 'حفظ التعديلات' : 'إضافة المنتج'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

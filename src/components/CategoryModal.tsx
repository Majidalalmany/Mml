import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Check, 
  UtensilsCrossed, 
  Flame, 
  Coffee, 
  Cake, 
  ShoppingBag, 
  Pill, 
  Sparkles, 
  Tv, 
  BookOpen, 
  Apple, 
  Shirt, 
  Store, 
  FileText,
  Briefcase,
  Footprints,
  Package,
  Gift,
  Watch,
  Glasses,
  Car,
  Scissors,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Category } from '../types';
import { sanitizeText, isDuplicateName, generateSecureId } from '../lib/securityUtils';
import { resolveCategoryIconKey } from '../lib/categoryUtils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>) => Promise<void>;
  category?: Category | null;
  categories?: Category[];
}

const CATEGORY_PRESETS = [
  { name: 'محلات الحقائب والأحذية', nameEn: 'Bags & Footwear', icon: 'Briefcase', serviceType: 'default' as const, description: 'أحدث موديلات الحقائب النسائية والرجالية والأحذية الجلدية والرياضية', coverUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80' },
  { name: 'محلات ملابس وموضة', nameEn: 'Clothing & Fashion', icon: 'Shirt', serviceType: 'clothing' as const, description: 'أحدث صيحات الأزياء والملابس الرجالية والنسائية والأطفال', coverUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80' },
  { name: 'مطاعم ومقاهي', nameEn: 'Restaurants & Cafes', icon: 'UtensilsCrossed', serviceType: 'restaurant' as const, description: 'الوجبات السريعة والمأكولات الشعبية والمشروبات المتنوعة', coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' },
  { name: 'سوبرماركت وبقالة', nameEn: 'Supermarket & Grocery', icon: 'ShoppingBag', serviceType: 'supermarket' as const, description: 'المواد الغذائية والتموينات والاحتياجات المنزلية اليومية', coverUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' },
  { name: 'محلات عصائر ومرطبات', nameEn: 'Juice & Beverage Shops', icon: 'Apple', serviceType: 'restaurant' as const, description: 'محلات العصائر الطبيعية والمشروبات الباردة والساخنة', coverUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
  { name: 'صيدليات ومستلزمات طبية', nameEn: 'Pharmacies & Health', icon: 'Pill', serviceType: 'default' as const, description: 'الأدوية والمستلزمات الطبية ومستحضرات العناية الصحية', coverUrl: 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=800&q=80' },
  { name: 'إلكترونيات وجوالات', nameEn: 'Electronics & Gadgets', icon: 'Tv', serviceType: 'default' as const, description: 'الأجهزة الذكية والملحقات والإلكترونيات المنزلية', coverUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80' },
  { name: 'عطور ومستحضرات تجميل', nameEn: 'Perfumes & Cosmetics', icon: 'Sparkles', serviceType: 'default' as const, description: 'أرقى العطور الشرقية والفرنسية ومستحضرات العناية والجمال', coverUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80' }
];

const AVAILABLE_ICONS = [
  { id: 'Briefcase', label: 'حقائب', Icon: Briefcase },
  { id: 'Footprints', label: 'أحذية', Icon: Footprints },
  { id: 'Shirt', label: 'ملابس', Icon: Shirt },
  { id: 'ShoppingBag', label: 'سوبرماركت', Icon: ShoppingBag },
  { id: 'UtensilsCrossed', label: 'مطاعم', Icon: UtensilsCrossed },
  { id: 'Pill', label: 'صيدليات', Icon: Pill },
  { id: 'Tv', label: 'إلكترونيات', Icon: Tv },
  { id: 'Sparkles', label: 'عطور', Icon: Sparkles },
  { id: 'Gift', label: 'هدايا وزهور', Icon: Gift },
  { id: 'Cake', label: 'مخابز', Icon: Cake },
  { id: 'Apple', label: 'عصائر', Icon: Apple },
  { id: 'Flame', label: 'بهارات', Icon: Flame },
  { id: 'Coffee', label: 'كافيهات', Icon: Coffee },
  { id: 'Watch', label: 'ساعات', Icon: Watch },
  { id: 'Glasses', label: 'بصريات', Icon: Glasses },
  { id: 'Package', label: 'بضائع عامة', Icon: Package },
  { id: 'Car', label: 'سيارات', Icon: Car },
  { id: 'Scissors', label: 'خياطة/تجميل', Icon: Scissors },
  { id: 'Store', label: 'متجر عام', Icon: Store },
  { id: 'Tag', label: 'تصنيف عام (تلقائي)', Icon: Tag }
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  categories = []
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [serviceType, setServiceType] = useState<'default' | 'restaurant' | 'clothing' | 'supermarket'>('default');
  const [coverUrl, setCoverUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || category.serviceName || '');
      setNameEn(category.nameEn || '');
      setDescription(category.description || '');
      setIcon(category.icon || 'Tag');
      setServiceType(category.serviceType || 'default');
      setCoverUrl(category.coverUrl || '');
      setOrder(category.order || 1);
      setStatus(category.status || 'active');
    } else {
      setName('');
      setNameEn('');
      setDescription('');
      setIcon('Tag');
      setServiceType('default'); // Strictly default to generic form for new categories
      setCoverUrl(CATEGORY_PRESETS[0].coverUrl);
      setOrder(1);
      setStatus('active');
    }
    setError('');
  }, [category, isOpen]);

  // Auto icon guess based on name typing if user hasn't explicitly clicked an icon
  const handleNameChange = (val: string) => {
    setName(val);
    setError('');
    if (!category) {
      const lower = val.toLowerCase();
      if (lower.includes('حقائب') || lower.includes('شنط')) {
        setIcon('Briefcase');
        setServiceType('default');
      } else if (lower.includes('أحذية') || lower.includes('جزم') || lower.includes('شوز')) {
        setIcon('Footprints');
        setServiceType('default');
      } else if (lower.includes('عطر') || lower.includes('تجميل') || lower.includes('مكياج')) {
        setIcon('Sparkles');
        setServiceType('default');
      } else if (lower.includes('ملابس') || lower.includes('أزياء') || lower.includes('ثياب')) {
        setIcon('Shirt');
        setServiceType('clothing');
      } else if (lower.includes('سوبر') || lower.includes('بقالة') || lower.includes('تموين')) {
        setIcon('ShoppingBag');
        setServiceType('supermarket');
      } else if (lower.includes('مطعم') || lower.includes('وجبات') || lower.includes('برجر')) {
        setIcon('UtensilsCrossed');
        setServiceType('restaurant');
      } else if (lower.includes('صيدل') || lower.includes('دواء')) {
        setIcon('Pill');
        setServiceType('default');
      } else if (lower.includes('هاتف') || lower.includes('جوال') || lower.includes('إلكترون')) {
        setIcon('Tv');
        setServiceType('default');
      } else if (lower.includes('ساعة') || lower.includes('مجوهرات')) {
        setIcon('Watch');
        setServiceType('default');
      } else if (lower.includes('هدية') || lower.includes('ورد')) {
        setIcon('Gift');
        setServiceType('default');
      }
    }
  };

  if (!isOpen) return null;

  const applyPreset = (preset: typeof CATEGORY_PRESETS[0]) => {
    setName(preset.name);
    setNameEn(preset.nameEn);
    setDescription(preset.description);
    setIcon(preset.icon);
    setServiceType(preset.serviceType);
    setCoverUrl(preset.coverUrl);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (name || '').trim();
    if (!cleanName) {
      setError('يرجى إدخال إسم الفئة أو النشاط التجاري');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const uniqueId = category?.id ? category.id : `cat-${Date.now()}`;
      const finalIcon = icon?.trim() || 'Tag';

      await onSave({
        id: uniqueId,
        name: cleanName,
        label: cleanName,
        serviceName: cleanName,
        nameEn: nameEn?.trim() || undefined,
        description: description?.trim() || `إدارة واستعراض محلات وأنشطة قسم ${cleanName}`,
        icon: finalIcon,
        serviceType: (serviceType as any) || 'default',
        coverUrl: coverUrl?.trim() || undefined,
        order: Number(order) || 1,
        status: status || 'active'
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التصنيف');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {category ? 'تعديل فئة الخدمة أو النشاط' : 'إضافة فئة خدمة أو نشاط جديد للمتجر'}
              </h3>
              <span className="text-[11px] text-blue-100 block">
                تسمية حرة لأي نشاط تجاري مع تعيين النموذج الافتراضي التلقائي
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              نماذج سريعة للاختيار المباشر:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORY_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-bold rounded-lg border border-gray-200 shrink-0 transition-colors cursor-pointer"
                >
                  + {p.name.split(' ')[0] === 'محلات' ? p.name.replace('محلات ', '') : p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Service / Business Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                إسم الخدمة أو النشاط التجاري <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                يقبل أي نشاط (مثال: الحقائب والأحذية)
              </span>
            </div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: محلات الحقائب والأحذية / محلات الأزياء / صيدليات"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold text-slate-900"
              required
              autoFocus
            />
          </div>

          {/* 2. Service Model Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>نموذج إدخال المنتجات المطبق على هذه الفئة</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                الافتراضي: النموذج القياسي العام
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                serviceType === 'default' 
                  ? 'bg-blue-50/80 border-blue-500 shadow-xs' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  value="default" 
                  checked={serviceType === 'default'}
                  onChange={() => setServiceType('default')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">النموذج القياسي الافتراضي</div>
                  <div className="text-[10px] text-slate-500">للحقائب والأحذية، الإلكترونيات، الإكسسوارات، والمنتجات العامة</div>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                serviceType === 'restaurant' 
                  ? 'bg-orange-50/80 border-orange-500 shadow-xs' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  value="restaurant" 
                  checked={serviceType === 'restaurant'}
                  onChange={() => setServiceType('restaurant')}
                  className="mt-0.5 text-orange-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">نموذج المطاعم والمأكولات</div>
                  <div className="text-[10px] text-slate-500">أحجام الوجبات، خيارات الإضافات والمشروبات</div>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                serviceType === 'clothing' 
                  ? 'bg-indigo-50/80 border-indigo-500 shadow-xs' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  value="clothing" 
                  checked={serviceType === 'clothing'}
                  onChange={() => setServiceType('clothing')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">نموذج الملابس والأزياء</div>
                  <div className="text-[10px] text-slate-500">مقاسات الأزياء، الألوان والأقمشة</div>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                serviceType === 'supermarket' 
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-xs' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  value="supermarket" 
                  checked={serviceType === 'supermarket'}
                  onChange={() => setServiceType('supermarket')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">نموذج السوبرماركت والتموينات</div>
                  <div className="text-[10px] text-slate-500">وحدات الوزن والعبوات والمواد الاستهلاكية</div>
                </div>
              </label>
            </div>
          </div>

          {/* 3. General Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>وصف عام للفئة</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="أدخل وصفاً توضيحياً ومختصراً لطبيعة هذه الفئة والخدمات التابعة لها..."
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-800"
            />
          </div>

          {/* Dynamic Label Preview */}
          {name && (
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <span className="text-xs text-blue-900 font-medium">تسمية النشاط المعتمدة:</span>
              <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {name.trim()}
              </span>
            </div>
          )}

          {/* English Name (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              الاسم باللغة الإنجليزية (اختياري)
            </label>
            <input 
              type="text" 
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Example: Bags & Footwear"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
          </div>

          {/* Icon Selector with Default Icon Fallback */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                أيقونة الفئة (أو أيقونة تلقائية افتراضية)
              </label>
              <span className="text-[10px] text-slate-500">
                الأيقونة المحددة: <strong className="text-blue-600">{icon || 'تلقائي (Tag)'}</strong>
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50/50 custom-scrollbar">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.Icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs' 
                        : 'bg-white border-gray-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    <span className="truncate w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              رابط صورة الغلاف (اختياري)
            </label>
            <input 
              type="url" 
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
          </div>

          {/* Status and Order */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                ترتيب العرض
              </label>
              <input 
                type="number" 
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                حالة الفئة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold"
              >
                <option value="active">نشطة (مفعلة)</option>
                <option value="inactive">غير نشطة (معطلة)</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : (category ? 'حفظ التعديلات' : 'إضافة الفئة')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

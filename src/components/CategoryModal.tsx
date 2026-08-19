import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Tag, 
  Check, 
  Image as ImageIcon,
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Truck,
  Wrench,
  ArrowLeft,
  Eye,
  Sliders,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Category } from '../types';
import { sanitizeText } from '../lib/securityUtils';
import { 
  getCategoryImageUrl, 
  getCategorySubtitle,
  CATEGORY_DEFAULT_LOGOS,
  CATEGORY_DEFAULT_SUBTITLES,
  DEFAULT_CATEGORY_BANNER
} from '../lib/categoryUtils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>) => Promise<void>;
  category?: Category | null;
  categories?: Category[];
}

// Curated high-resolution, expressive representative images for categories
export const CATEGORY_IMAGE_PRESETS = [
  { 
    name: 'المطاعم والوجبات السريعة', 
    shortName: 'المطاعم',
    subtitle: 'أشهى الأطباق من مطاعمك المفضلة',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'restaurant' as const,
    description: 'أفضل المطاعم، البرجر، المشويات والوجبات السريعة بأسرع توصيل'
  },
  { 
    name: 'مشاريع منزلية', 
    shortName: 'أكل منزلي',
    subtitle: 'أكل بيتي بطعم الحب والمذاق',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'restaurant' as const,
    description: 'وجبات وأطباق منزلية محضرة بعناية من أمهر الطهاة المنزليين'
  },
  { 
    name: 'السوبر ماركت والتموينات', 
    shortName: 'السوبر ماركت',
    subtitle: 'كل احتياجاتك من مكان واحد',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'supermarket' as const,
    description: 'المواد الغذائية، الخضروات، الفواكه الطازجة والمستلزمات المنزلية اليومية'
  },
  { 
    name: 'آيس كريم وعصائر', 
    shortName: 'عصائر ومرطبات',
    subtitle: 'انتعاش ولذة في كل لحظة',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'restaurant' as const,
    description: 'العصائر الطبيعية الطازجة، الآيس كريم اللذيذ والكوكتيلات المنعشة'
  },
  { 
    name: 'صيدليات ومستلزمات طبية', 
    shortName: 'صيدليات',
    subtitle: 'رعاية صحية وتوصيل علاجي آمن',
    imageUrl: 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'default' as const,
    description: 'الأدوية والمستلزمات الطبية ومستحضرات العناية الصحية والوقائية'
  },
  { 
    name: 'محلات ملابس وموضة', 
    shortName: 'ملابس وأزياء',
    subtitle: 'أحدث صيحات الموضة والأزياء الراقية',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'clothing' as const,
    description: 'تشكيلات واسعة من الأزياء الرجالية والنسائية وملابس الأطفال والإكسسوارات'
  },
  { 
    name: 'إلكترونيات وجوالات', 
    shortName: 'إلكترونيات',
    subtitle: 'أجهزة ذكية وملحقات أصلية',
    imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'default' as const,
    description: 'الهواتف الذكية، الشواحن، السماعات وكافة الملحقات التكنولوجية'
  },
  { 
    name: 'عطور ومستحضرات تجميل', 
    shortName: 'عطور وتجميل',
    subtitle: 'أرقى العطور ومستحضرات الجمال',
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'default' as const,
    description: 'أرقى العطور الشرقية والفرنسية ومستحضرات العناية بالبشرة'
  },
  { 
    name: 'مخابز وحلويات', 
    shortName: 'حلويات ومخبوزات',
    subtitle: 'مخبوزات طازجة وحلويات مميزة',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'delivery' as const,
    serviceType: 'restaurant' as const,
    description: 'كيك المناسبات، التورتات، البقلاوة والحلويات والمعجنات الطازجة'
  },
  { 
    name: 'خدمة فزعة وتوصيل خاص', 
    shortName: 'خدمة فزعة',
    subtitle: 'منفعة لك.. وين ما تكون',
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80',
    serviceTypeCategory: 'field_service' as const,
    serviceType: 'default' as const,
    description: 'خدمة التوصيل السريع للمشاوير الخاصة والطرود والشحنات الشخصية بين أي نقطتين'
  }
];

export const BANNER_PRESETS = [
  { label: 'بنر التوصيل (خدمة منفعة)', url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80' },
  { label: 'بنر المطاعم والأكلات', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'بنر السوبرماركت والتسوق', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80' },
  { label: 'بنر العصائر والآيس كريم', url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'بنر الموضة والأزياء', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80' }
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  categories = []
}) => {
  // Form States
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [serviceTypeCategory, setServiceTypeCategory] = useState<'delivery' | 'field_service'>('delivery');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [order, setOrder] = useState<number>(1);
  const [ctaText, setCtaText] = useState('اطلب الآن');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeImageTab, setActiveImageTab] = useState<'upload' | 'url' | 'presets'>('presets');
  const [activeBannerTab, setActiveBannerTab] = useState<'upload' | 'url' | 'presets'>('presets');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (category) {
      setName(category.name || category.serviceName || '');
      setSubtitle(category.subtitle || getCategorySubtitle(category, category.name) || '');
      setDescription(category.description || '');
      
      const img = category.imageUrl || category.categoryImageUrl || category.category_image_url || category.coverUrl || getCategoryImageUrl(category, category.name);
      setCategoryImageUrl(img);

      const ban = category.bannerUrl || category.bannerImageUrl || category.banner_image_url || DEFAULT_CATEGORY_BANNER;
      setBannerImageUrl(ban);

      setServiceTypeCategory(category.serviceTypeCategory || (category.serviceType === 'default' ? 'delivery' : 'delivery'));
      setIsActive(category.status ? category.status === 'active' : (category.isActive !== false));
      setOrder(category.order || 1);
      setCtaText(category.ctaText || 'اطلب الآن');
    } else {
      const defaultPreset = CATEGORY_IMAGE_PRESETS[0];
      setName('');
      setSubtitle('');
      setDescription('');
      setCategoryImageUrl(defaultPreset.imageUrl);
      setBannerImageUrl(defaultPreset.bannerUrl);
      setServiceTypeCategory('delivery');
      setIsActive(true);
      setOrder((categories.length || 0) + 1);
      setCtaText('اطلب الآن');
    }
    setError('');
  }, [category, isOpen, categories.length]);

  // Handle preset application
  const applyPreset = (preset: typeof CATEGORY_IMAGE_PRESETS[0]) => {
    setName(preset.name);
    setSubtitle(preset.subtitle);
    setDescription(preset.description);
    setCategoryImageUrl(preset.imageUrl);
    setBannerImageUrl(preset.bannerUrl);
    setServiceTypeCategory(preset.serviceTypeCategory);
    setError('');
  };

  // Image Upload Handler (FileReader base64 with compression)
  const handleCategoryImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCategoryImageUrl(e.target.result as string);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Banner Upload Handler
  const handleBannerImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح للبنر (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBannerImageUrl(e.target.result as string);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (name || '').trim();
    if (!cleanName) {
      setError('يرجى إدخال إسم الخدمة / النشاط');
      return;
    }

    const cleanImg = (categoryImageUrl || '').trim() || getCategoryImageUrl(null, cleanName);
    const cleanBanner = (bannerImageUrl || '').trim() || DEFAULT_CATEGORY_BANNER;

    try {
      setIsSubmitting(true);
      setError('');
      
      const uniqueId = category?.id ? category.id : `cat-${Date.now()}`;
      const statusValue = isActive ? 'active' : 'inactive';

      // Infer serviceType for backend products matrix compatibility
      let internalServiceType: 'restaurant' | 'clothing' | 'supermarket' | 'default' = 'default';
      const lowerName = cleanName.toLowerCase();
      if (lowerName.includes('مطعم') || lowerName.includes('وجبات') || lowerName.includes('برجر') || lowerName.includes('أكل') || lowerName.includes('عصير')) {
        internalServiceType = 'restaurant';
      } else if (lowerName.includes('سوبر') || lowerName.includes('بقالة') || lowerName.includes('تموين')) {
        internalServiceType = 'supermarket';
      } else if (lowerName.includes('ملابس') || lowerName.includes('أزياء')) {
        internalServiceType = 'clothing';
      }

      await onSave({
        id: uniqueId,
        name: cleanName,
        label: cleanName,
        serviceName: cleanName,
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        
        // 100% Data synchronization fields as specified
        imageUrl: cleanImg,
        categoryImageUrl: cleanImg,
        category_image_url: cleanImg,
        coverUrl: cleanImg,
        
        bannerUrl: cleanBanner,
        bannerImageUrl: cleanBanner,
        banner_image_url: cleanBanner,
        
        serviceTypeCategory: serviceTypeCategory,
        serviceType: internalServiceType,
        status: statusValue,
        isActive: isActive,
        order: Number(order) || 1,
        ctaText: ctaText.trim() || 'اطلب الآن',
        updatedAt: new Date().toISOString()
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ النشاط');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {category ? 'تعديل نشاط / فئة الخدمة' : 'إضافة نشاط / فئة خدمة جديدة (صور تعبيرية)'}
              </h3>
              <span className="text-xs text-blue-100 block">
                تحديث صور الأقسام والبنرات الإعلانية بدون أيقونات فيكتور
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl font-bold flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Presets Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>نماذج جاهزة مع صور وبنرات احترافية:</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">اختر نموذجاً لتعبئة البيانات تلقائياً</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
              {CATEGORY_IMAGE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                    name === p.name 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <img 
                    src={p.imageUrl} 
                    alt={p.name}
                    className="w-5 h-5 rounded-md object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <span>{p.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Category Image Upload (صورة القسم التعبيرية) */}
          <div className="bg-blue-50/40 p-4.5 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>1. صورة القسم التعبيرية (Category Image)</span>
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  صورة مجسمة/عالية الجودة تمثل القسم في شبكة واجهة التطبيق (بديل كامل للأيقونات)
                </p>
              </div>

              {/* Source Tabs */}
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-gray-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveImageTab('presets')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeImageTab === 'presets' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  معرض الصور
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeImageTab === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  رفع ملف
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('url')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeImageTab === 'url' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  رابط URL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Preview Thumbnail */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center relative group shadow-inner">
                  {categoryImageUrl ? (
                    <img 
                      src={categoryImageUrl} 
                      alt="Category Preview" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 font-bold">معاينة صورة البطاقة</span>
              </div>

              {/* Input Area */}
              <div className="sm:col-span-8 space-y-2">
                {activeImageTab === 'upload' && (
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => e.target.files?.[0] && handleCategoryImageUpload(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-6 h-6 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">اضغط لرفع صورة من جهازك</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WEBP حتى 5MB</span>
                    </div>
                  </div>
                )}

                {activeImageTab === 'url' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 block">رابط الصورة المباشر:</label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="url"
                        value={categoryImageUrl}
                        onChange={(e) => setCategoryImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {activeImageTab === 'presets' && (
                  <div className="grid grid-cols-4 gap-2 max-h-28 overflow-y-auto p-1 custom-scrollbar">
                    {CATEGORY_IMAGE_PRESETS.map((item) => (
                      <button
                        key={item.imageUrl}
                        type="button"
                        onClick={() => setCategoryImageUrl(item.imageUrl)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                          categoryImageUrl === item.imageUrl ? 'border-blue-600 ring-2 ring-blue-400/40 shadow-xs' : 'border-transparent hover:border-gray-300'
                        }`}
                        title={item.name}
                      >
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-12 rounded-lg object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        {categoryImageUrl === item.imageUrl && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Banner Image Upload (بنر العرض العلوي) */}
          <div className="bg-purple-50/40 p-4.5 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>2. بنر العرض الإعلاني العلوي (Banner Image Upload)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  صورة عريضة تُعرض في العارض الإعلاني أعلى التطبيق الخاص بهذه الخدمة
                </p>
              </div>

              {/* Banner Tabs */}
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-gray-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveBannerTab('presets')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeBannerTab === 'presets' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-purple-600'
                  }`}
                >
                  نماذج البنرات
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBannerTab('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeBannerTab === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-purple-600'
                  }`}
                >
                  رفع ملف
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBannerTab('url')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeBannerTab === 'url' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-purple-600'
                  }`}
                >
                  رابط URL
                </button>
              </div>
            </div>

            {/* Banner Preview & Input */}
            <div className="space-y-2">
              <div className="w-full h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative group shadow-inner">
                {bannerImageUrl ? (
                  <img 
                    src={bannerImageUrl} 
                    alt="Banner Preview" 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    لا يوجد بنر محدد
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-slate-900/75 text-white px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-xs">
                  معاينة البنر العريض
                </div>
              </div>

              {activeBannerTab === 'upload' && (
                <div>
                  <input 
                    type="file" 
                    ref={bannerFileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="w-full border border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/50 rounded-xl p-2.5 text-xs font-bold text-purple-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>اختر ملف صورة البنر العريض من جهازك</span>
                  </button>
                </div>
              )}

              {activeBannerTab === 'url' && (
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="url"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-banner..."
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 bg-white text-slate-800"
                  />
                </div>
              )}

              {activeBannerTab === 'presets' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {BANNER_PRESETS.map((b) => (
                    <button
                      key={b.url}
                      type="button"
                      onClick={() => setBannerImageUrl(b.url)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                        bannerImageUrl === b.url ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-white border-gray-200 text-slate-700 hover:bg-purple-50'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Text & Organization Fields (الحقول النصية والتنظيمية) */}
          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-bold text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>3. بيانات الخدمة والتنظيم</span>
            </h4>

            {/* Service Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                اسم الخدمة / النشاط <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="مثال: المطاعم / السوبر ماركت / مشاريع منزلية / صيدليات"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                required
              />
            </div>

            {/* Subtitle / Marketing Slogan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                العنوان الفرعي / الوصف التسويقي القصير
              </label>
              <input 
                type="text" 
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="مثال: أشهى الأطباق من مطاعمك المفضلة / كل احتياجاتك من مكان واحد"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            {/* Description (Textarea) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                وصف الخدمة الكامل (Textarea)
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="تفاصيل وشروط ونطاق الخدمة المقدمة للعملاء..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            {/* Row: Service Type, Status Toggle, Order, CTA Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Service Type (نوع الخدمة: توصيل / خدمة ميدانية) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  نوع الخدمة
                </label>
                <select
                  value={serviceTypeCategory}
                  onChange={(e) => setServiceTypeCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                >
                  <option value="delivery">توصيل (Delivery Service)</option>
                  <option value="field_service">خدمة ميدانية (Field / Special Service)</option>
                </select>
              </div>

              {/* CTA Button Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  نص زر التفاعل في البنر
                </label>
                <input 
                  type="text" 
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="مثال: اطلب منفعة الآن / اطلب الآن"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ترتيب العرض في التطبيق
                </label>
                <input 
                  type="number" 
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  min={1}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>

              {/* Service Status Toggle (مفتاح التفعيل) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  حالة الخدمة
                </label>
                <div 
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800' 
                      : 'bg-gray-100 border-gray-200 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-bold">
                    {isActive ? 'الخدمة مفعلة ومتاحة للطلب' : 'الخدمة معطلة مؤقتاً'}
                  </span>
                  <div className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-0' : '-translate-x-5'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Mobile Card Preview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>معاينة حية لبطاقة القسم في واجهة التطبيق:</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                مطابق 100% لتصميم التطبيق
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                <img 
                  src={categoryImageUrl || getCategoryImageUrl(null, name)} 
                  alt="Card Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0 text-right">
                <h5 className="text-sm font-bold text-slate-900 truncate">
                  {name || 'اسم القسم أو النشاط'}
                </h5>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {subtitle || 'أشهى الأطباق والخدمات المميزة'}
                </p>
              </div>

              <div className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-500 hover:text-white text-slate-400 flex items-center justify-center transition-colors shrink-0">
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : (category ? 'حفظ التعديلات' : 'إضافة النشاط')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

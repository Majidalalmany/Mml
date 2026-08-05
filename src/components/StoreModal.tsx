import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Image as ImageIcon, 
  Clock, 
  Phone, 
  MapPin, 
  Upload, 
  Sparkles, 
  Calendar, 
  Navigation, 
  Link as LinkIcon, 
  CheckCircle2, 
  Loader2, 
  Globe 
} from 'lucide-react';
import { Store as StoreType, Category } from '../types';
import { compressImageFile } from '../lib/imageUtils';
import { getCategoryDefaultLogo, findServiceCategory } from '../lib/categoryUtils';
import { checkDuplicateStorePhone } from '../lib/phoneUtils';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (storeData: Partial<StoreType>) => Promise<void>;
  store?: StoreType | null;
  categories: Category[];
  selectedCategoryFilter?: string;
  stores?: StoreType[];
}



// Utility function to extract latitude and longitude from Google Maps URLs
const extractCoordsFromGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  if (!url) return null;
  try {
    // Pattern 1: @15.3694,44.1910
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }
    // Pattern 2: ?q=15.3694,44.1910 or &ll=15.3694,44.1910
    const qMatch = url.match(/[?&](?:q|ll|loc:)=?(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }
    // Pattern 3: direct coordinates 15.3694, 44.1910
    const plainMatch = url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (plainMatch) {
      return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  store,
  categories,
  selectedCategoryFilter,
  stores = []
}) => {
  // 1. Store Name
  const [name, setName] = useState('');
  
  // 2. Store Phone
  const [phone, setPhone] = useState('');
  
  // 3. Store Logo
  const [logoUrl, setLogoUrl] = useState('');
  
  // 4. Creation Date
  const [createdDate, setCreatedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 5. Working Hours
  const [workingHours, setWorkingHours] = useState('08:00 ص - 11:30 م');
  
  // Return policy permission toggle
  const [allowReturns, setAllowReturns] = useState<boolean>(true);
  
  // 6. Location via GPS or Google Maps Link
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState<number | ''>(15.3694);
  const [longitude, setLongitude] = useState<number | ''>(44.1910);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Internal category state set automatically behind the scenes (No manual UI selector)
  const [categoryId, setCategoryId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setPhone(store.phone || '');
      setLogoUrl(store.logoUrl || '');
      setWorkingHours(store.workingHours || '08:00 ص - 11:30 م');
      setAllowReturns(store.allowReturns ?? true);
      setCategoryId(store.categoryId || '');
      setGoogleMapsUrl(store.googleMapsUrl || '');
      setLatitude(store.latitude ?? 15.3694);
      setLongitude(store.longitude ?? 44.1910);
      
      let dateVal = new Date().toISOString().split('T')[0];
      if (store.createdAt) {
        try {
          if (typeof store.createdAt === 'string') {
            dateVal = store.createdAt.split('T')[0];
          } else if (store.createdAt.toDate) {
            dateVal = store.createdAt.toDate().toISOString().split('T')[0];
          }
        } catch (e) {
          // fallback
        }
      }
      setCreatedDate(dateVal);
    } else {
      setName('');
      setPhone('771234567');
      setLogoUrl('');
      setWorkingHours('08:00 ص - 11:30 م');
      setAllowReturns(true);
      setCreatedDate(new Date().toISOString().split('T')[0]);
      setGoogleMapsUrl('');
      setLatitude(15.3694);
      setLongitude(44.1910);

      // Dynamic Category Context Assignment behind the scenes
      if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
        const servDef = findServiceCategory(selectedCategoryFilter);
        let matchedCat: Category | undefined;
        
        if (servDef) {
          matchedCat = categories.find(c => 
            c.name === servDef.label ||
            c.id === servDef.id ||
            servDef.keywords.some(kw => c.name.toLowerCase().includes(kw))
          );
        } else {
          matchedCat = categories.find(c => 
            c.id === selectedCategoryFilter || 
            c.name.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) ||
            selectedCategoryFilter.toLowerCase().includes(c.name.toLowerCase())
          );
        }

        if (matchedCat) {
          setCategoryId(matchedCat.id);
        } else if (servDef) {
          setCategoryId(servDef.id);
        } else if (categories.length > 0) {
          setCategoryId(categories[0].id);
        } else {
          setCategoryId(selectedCategoryFilter);
        }
      } else if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }

    setError(null);
    setGpsSuccessMsg(null);
    setGpsErrorMsg(null);
  }, [store, isOpen, categories, selectedCategoryFilter]);

  if (!isOpen) return null;

  // Handle Logo Upload
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const compressedDataUrl = await compressImageFile(file, 400, 400, 0.8);
        setLogoUrl(compressedDataUrl);
      } catch (err) {
        setError('تعذر تحميل وضغط الشعار، يرجى اختيار صورة أخرى');
      }
    }
  };

  // Quick 24 Hours Button Handler
  const handleSet24Hours = () => {
    setWorkingHours('24 ساعة / مفتوح طوال اليوم');
  };

  // Automatic Device Geolocation
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGpsErrorMsg('خاصية تحديد الموقع الجغرافي غير مدعومة في جهازك/مستعرضك');
      return;
    }

    setIsLocating(true);
    setGpsErrorMsg(null);
    setGpsSuccessMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setGpsSuccessMsg(`تم تحديد موقعك الحالي بنجاح! (خط العرض: ${lat.toFixed(4)}, خط الطول: ${lng.toFixed(4)})`);
        setGoogleMapsUrl(`https://maps.google.com/?q=${lat},${lng}`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErrorMsg('تم رفض الإذن بالوصول للموقع الجغرافي. يرجى تفعيله في إعدادات المستعرض.');
        } else {
          setGpsErrorMsg('تعذر جلب موقع الجهاز الحالي، يرجى استخدام رابط خرائط جوجل.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Google Maps Link Input Handler with automatic coordinate parsing
  const handleGoogleMapsUrlChange = (urlVal: string) => {
    setGoogleMapsUrl(urlVal);
    const parsed = extractCoordsFromGoogleMapsUrl(urlVal);
    if (parsed) {
      setLatitude(parsed.lat);
      setLongitude(parsed.lng);
      setGpsSuccessMsg(`تم استخراج إحداثيات الموقع تلقائياً من الرابط: (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`);
      setGpsErrorMsg(null);
    }
  };

  // Derived Category Name for display
  const servDefFilter = findServiceCategory(selectedCategoryFilter);
  const servDefCat = findServiceCategory(categoryId);
  const selectedCategoryObj = categories.find(c => c.id === categoryId);

  let activeCategoryName = '';
  if (servDefFilter) {
    activeCategoryName = servDefFilter.label;
  } else if (selectedCategoryObj) {
    activeCategoryName = selectedCategoryObj.name;
  } else if (servDefCat) {
    activeCategoryName = servDefCat.label;
  } else {
    activeCategoryName = 'المطاعم والوجبات السريعة';
  }

  const autoCategoryLogo = getCategoryDefaultLogo(categoryId, activeCategoryName, categories);
  const effectiveLogoUrl = logoUrl.trim() || autoCategoryLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Required Inputs:
    if (!name.trim()) {
      setError('يرجى إدخال (1) اسم المتجر / المطعم');
      return;
    }

    if (!phone.trim()) {
      setError('يرجى إدخال (2) رقم المتجر / الهاتف');
      return;
    }

    // Duplicate Phone Number Check across registered stores
    const dupCheck = checkDuplicateStorePhone(phone, stores, store?.id);
    if (dupCheck.isDuplicate) {
      setError(`⚠️ رقم الهاتف (${phone.trim()}) مسجل مسبقاً لدى متجر "${dupCheck.existingName}". يرجى استخدام رقم هاتف مختلف لتجنب أخطاء تكرار البيانات.`);
      return;
    }

    if (!createdDate) {
      setError('يرجى تحديد (3) تاريخ الإنشاء');
      return;
    }

    const finalLogoUrl = logoUrl.trim() || autoCategoryLogo;
    const computedAddress = latitude && longitude 
      ? `موقع جغرافي محدّد (${latitude}, ${longitude})`
      : 'صنعاء، اليمن';

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        createdAt: createdDate,
        workingHours: workingHours.trim() || '24 ساعة / مفتوح طوال اليوم',
        address: computedAddress,
        latitude: typeof latitude === 'number' ? latitude : 15.3694,
        longitude: typeof longitude === 'number' ? longitude : 44.1910,
        googleMapsUrl: googleMapsUrl.trim() || `https://maps.google.com/?q=${latitude || 15.3694},${longitude || 44.1910}`,
        categoryId: categoryId || (categories[0]?.id || 'default'),
        categoryName: activeCategoryName,
        activityType: activeCategoryName,
        logoUrl: finalLogoUrl,
        coverUrl: store?.coverUrl || finalLogoUrl,
        status: store?.status || 'open',
        serviceType: store?.serviceType || 'both',
        deliveryFeeType: store?.deliveryFeeType || 'fixed',
        fixedDeliveryFee: store?.fixedDeliveryFee || 1000,
        allowReturns,
        sections: store?.sections || ['الأصناف الرئيسية', 'المشروبات']
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات المتجر');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="text-lg font-bold">
                {store ? 'تعديل بيانات المتجر' : 'إضافة متجر جديد'}
              </h3>
              <span className="text-[11px] text-blue-100 font-medium block">
                تخصيص تلقائي ضمن قسم: <strong className="text-white font-bold">{activeCategoryName}</strong>
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Only the 6 requested fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Store Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                1. اسم المتجر / المطعم <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مطعم البيك / صيدلية الأمل / سوبرماركت البركة"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. رقم المتجر / الهاتف</span>
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="77XXXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono text-slate-800"
                  required
                />
              </div>

              {/* 3. Creation Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. تاريخ الإنشاء</span>
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={createdDate}
                  onChange={(e) => setCreatedDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* 4. Working Hours with Quick 24-Hours Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. ساعات النشاط والدوام</span>
                </label>

                {/* Quick 24h Button */}
                <button
                  type="button"
                  onClick={handleSet24Hours}
                  className="text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>دوام كامل (24 ساعة)</span>
                </button>
              </div>

              <input 
                type="text" 
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="مثال: 08:00 ص - 11:30 م"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-800 font-medium"
              />
            </div>

            {/* Return Policy Setting (تحديد إمكانية إرجاع الطلبات) */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-blue-950 block">سياسة وسياسة إرجاع الطلبات (ارتجاع الطلبات)</span>
                  <span className="text-[11px] text-blue-800 block">
                    يحدد هذا الخيار إمكانية إرجاع الطلبات أو منعها للعملاء عبر التطبيق أثناء الشراء لهذا المتجر.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={allowReturns} 
                    onChange={(e) => setAllowReturns(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 pt-1">
                <span>الحالة الحالية:</span>
                {allowReturns ? (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">🔄 يُسمح بإرجاع الطلبات</span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold">🚫 يمنع إرجاع الطلبات (غير قابل للإرجاع)</span>
                )}
              </div>
            </div>

            {/* 5. Store Logo */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>5. شعار المتجر (Logo)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    رفع صورة الشعار من الجهاز أو لصق رابط صورة مباشرة
                  </p>
                </div>

                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع شعار من الجهاز</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 items-center pt-2">
                <div className="relative w-14 h-14 rounded-xl border border-gray-300 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  <img 
                    src={effectiveLogoUrl} 
                    alt="Store Logo Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = autoCategoryLogo;
                    }}
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="رابط الشعار (أو اتركه فارغاً للشعار التلقائي)..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 6. Smart Location Selection (تحديد الموقع الجغرافي) */}
            <div className="space-y-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>6. تحديد الموقع الجغرافي (Location Selection)</span>
                </label>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  تحدّيد تلقائي ذكي
                </span>
              </div>

              {/* Geolocation Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGetDeviceLocation}
                  disabled={isLocating}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>جاري جلب إحداثيات GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-emerald-200" />
                      <span>تحديد موقعي الحالي (GPS)</span>
                    </>
                  )}
                </button>

                <div className="text-[11px] text-slate-500 flex items-center px-1">
                  <span>جلب خط الطول والعرض تلقائياً عبر المستعرض</span>
                </div>
              </div>

              {/* Google Maps Link Field */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>أو لصق رابط موقع خرائط جوجل (Google Maps Link):</span>
                </label>
                <div className="relative">
                  <input 
                    type="url" 
                    value={googleMapsUrl}
                    onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                    placeholder="https://maps.google.com/?q=15.3694,44.1910"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-0.5 bg-blue-50 px-2 py-0.5 rounded"
                    >
                      <span>معاينة الخريطة</span>
                      <Globe className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Location Status Feedback */}
              {gpsSuccessMsg && (
                <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs p-2.5 rounded-lg font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{gpsSuccessMsg}</span>
                </div>
              )}

              {gpsErrorMsg && (
                <div className="bg-rose-100/80 border border-rose-300 text-rose-900 text-xs p-2.5 rounded-lg font-bold flex items-center gap-2 animate-in fade-in">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{gpsErrorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'جاري الحفظ...' : (store ? 'حفظ التعديلات' : 'إضافة المتجر')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

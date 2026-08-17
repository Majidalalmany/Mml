import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Image as ImageIcon, 
  Clock, 
  Phone, 
  MapPin, 
  Upload, 
  Calendar, 
  Link as LinkIcon, 
  Check, 
  ExternalLink,
  Navigation,
  Compass,
  AlertCircle
} from 'lucide-react';
import { Store as StoreType, Category, DaySchedule } from '../types';
import { compressImageFile } from '../lib/imageUtils';
import { getCategoryDefaultLogo, findServiceCategory } from '../lib/categoryUtils';
import { checkDuplicateStorePhone } from '../lib/phoneUtils';
import { sanitizeText } from '../lib/securityUtils';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (storeData: Partial<StoreType>) => Promise<void>;
  store?: StoreType | null;
  categories: Category[];
  selectedCategoryFilter?: string;
  stores?: StoreType[];
}

const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة'
];

const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
  day,
  isOpen: true,
  openTime: '08:00',
  closeTime: '23:30',
  is24Hours: false
}));

const YEMEN_CITY_PRESETS = [
  { name: 'صنعاء', lat: 15.3694, lng: 44.1910 },
  { name: 'عدن', lat: 12.7855, lng: 45.0187 },
  { name: 'تعز', lat: 13.5789, lng: 44.0219 },
  { name: 'الحديدة', lat: 14.7978, lng: 42.9545 },
  { name: 'إب', lat: 13.9667, lng: 44.1833 },
  { name: 'المكلا', lat: 14.5425, lng: 49.1242 },
  { name: 'مأرب', lat: 15.4628, lng: 45.3267 },
  { name: 'ذمار', lat: 14.5427, lng: 44.4051 }
];

// Helper to parse direct coordinates: "15.3521, 44.2014" or "15.3521 44.2014"
export function parseCoordinatesOnly(input: string): { lat: number; lng: number } | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();
  
  // Direct coordinates with comma or spaces: "15.3521, 44.2014", "15.3521,44.2014", "15.3521 44.2014"
  const directMatch = clean.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }
  return null;
}

// Helper to check if string is any Google Maps URL or short link
export function isGoogleMapsUrl(input: string): boolean {
  if (!input || !input.trim()) return false;
  const clean = input.trim().toLowerCase();
  return (
    clean.includes('maps.app.goo.gl') ||
    clean.includes('goo.gl/maps') ||
    clean.includes('maps.google.') ||
    clean.includes('google.com/maps') ||
    clean.includes('google.co.') ||
    clean.includes('maps.google.com')
  );
}

// Helper to check if string is specifically a shortened Google Maps URL
export function isShortGoogleMapsUrl(input: string): boolean {
  if (!input || !input.trim()) return false;
  const clean = input.trim().toLowerCase();
  return (
    clean.startsWith('https://maps.app.goo.gl/') ||
    clean.startsWith('http://maps.app.goo.gl/') ||
    clean.startsWith('maps.app.goo.gl/') ||
    clean.startsWith('https://goo.gl/maps/') ||
    clean.startsWith('http://goo.gl/maps/') ||
    clean.startsWith('goo.gl/maps/') ||
    clean.includes('maps.app.goo.gl') ||
    clean.includes('goo.gl/maps')
  );
}

// Extract numeric latitude and longitude if available in text or URL query
export function parseGoogleMapsUrlOrCoords(input: string): { lat: number; lng: number } | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();
  
  // 1. Direct coordinates: "15.3694, 44.1910"
  const directMatch = parseCoordinatesOnly(clean);
  if (directMatch) {
    return directMatch;
  }

  // 2. Google Maps URLs (@lat,lng)
  const atMatch = clean.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 3. ?q=lat,lng or &q=lat,lng or ll=lat,lng or query=lat,lng
  const qMatch = clean.match(/[?&](?:q|ll|query)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 4. Protobuf encoded coordinates in Google Maps URLs (!3dlat!4dlng)
  const bangMatch = clean.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (bangMatch) {
    const lat = parseFloat(bangMatch[1]);
    const lng = parseFloat(bangMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 5. General coordinate pair search
  const anyCoords = clean.match(/(-?\d{1,2}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/);
  if (anyCoords) {
    const lat = parseFloat(anyCoords[1]);
    const lng = parseFloat(anyCoords[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

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
  
  // 3. Store Logo & File Name
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState<string>('');
  
  // 4. Creation Date
  const [createdDate, setCreatedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 5. Working Hours & Weekly Schedule
  const [workingHours, setWorkingHours] = useState('08:00 ص - 11:30 م');
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_WEEKLY_SCHEDULE);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Return policy permission toggle
  const [allowReturns, setAllowReturns] = useState<boolean>(true);
  
  // 6. Google Maps Link & Location Coordinates
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(15.3694);
  const [longitude, setLongitude] = useState<number>(44.1910);
  const [pinDropNote, setPinDropNote] = useState<string>('الموقع الافتراضي (صنعاء). يمكنك لصق رابط خرائط Google Maps أو اختيار المدينة مباشرة.');
  
  // Internal category state set automatically behind the scenes
  const [categoryId, setCategoryId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setPhone(store.phone || '');
      setLogoUrl(store.logoUrl || '');
      setLogoFileName(store.logoFileName || (store.logoUrl ? 'logo_uploaded.png' : ''));
      setWorkingHours(store.workingHours || '08:00 ص - 11:30 م');
      setWeeklySchedule(store.weeklySchedule && store.weeklySchedule.length > 0 ? store.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE);
      setAllowReturns(store.allowReturns ?? true);
      setCategoryId(store.categoryId || '');
      const lat = store.latitude ?? 15.3694;
      const lng = store.longitude ?? 44.1910;
      setLatitude(lat);
      setLongitude(lng);
      setGoogleMapsUrl(store.googleMapsUrl || `https://maps.google.com/?q=${lat},${lng}`);
      setPinDropNote(`الموقع المثبت حالياً: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      
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
      setLogoFileName('');
      setWorkingHours('08:00 ص - 11:30 م');
      setWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
      setAllowReturns(true);
      setCreatedDate(new Date().toISOString().split('T')[0]);
      setLatitude(15.3694);
      setLongitude(44.1910);
      setGoogleMapsUrl('');
      setPinDropNote('الصق رابط خرائط جوجل مابس لتثبيت الموقع الجغرافي الدقيق للمتجر.');

      // Dynamic Category Context Assignment
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
  }, [store, isOpen, categories, selectedCategoryFilter]);

  if (!isOpen) return null;

  // Handle Pasting Google Maps Link or direct coordinates
  const handleGoogleMapsUrlChange = (val: string) => {
    setGoogleMapsUrl(val);
    const clean = val.trim();

    if (!clean) {
      setPinDropNote('الصق رابط خرائط جوجل مابس (طويل أو مختصر مثل maps.app.goo.gl) أو أدخل الإحداثيات المباشرة (مثل: 15.3521, 44.2014).');
      return;
    }

    // 1. Check direct coordinates input: "15.3521, 44.2014"
    const directCoords = parseCoordinatesOnly(clean);
    if (directCoords) {
      setLatitude(directCoords.lat);
      setLongitude(directCoords.lng);
      setPinDropNote(`✅ تم التعرف على الإحداثيات المباشرة بنجاح: (${directCoords.lat}, ${directCoords.lng})`);
      return;
    }

    // 2. Check URLs containing coordinates
    const parsed = parseGoogleMapsUrlOrCoords(clean);
    if (parsed) {
      setLatitude(parsed.lat);
      setLongitude(parsed.lng);
      setPinDropNote(`✅ تم استخراج الإحداثيات وتثبيت الموقع بنجاح: (${parsed.lat}, ${parsed.lng})`);
      return;
    }

    // 3. Short Google Maps URLs (e.g. https://maps.app.goo.gl/EBK4kn1pLXD3PPEf8 or https://goo.gl/maps/...)
    if (isShortGoogleMapsUrl(clean) || isGoogleMapsUrl(clean)) {
      // Do NOT reset location to default, accept the shortened/valid link immediately
      setPinDropNote('✅ تم قبول رابط خرائط Google Maps المختصر بنجاح! سيتم توجيه العميل إليه مباشرة عند النقر.');
      return;
    }

    setPinDropNote('رابط مخصص أو إحداثيات قيد الإدخال...');
  };

  const handleApplyCityPreset = (city: typeof YEMEN_CITY_PRESETS[0]) => {
    setLatitude(city.lat);
    setLongitude(city.lng);
    setGoogleMapsUrl(`https://maps.google.com/?q=${city.lat},${city.lng}`);
    setPinDropNote(`تم تحديد موقع مدينة (${city.name}): ${city.lat}, ${city.lng}`);
  };

  // Handle Logo Upload (read-only file name display)
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        setLogoFileName(file.name);
        const compressedDataUrl = await compressImageFile(file, 400, 400, 0.8);
        setLogoUrl(compressedDataUrl);
      } catch (err) {
        setError('تعذر تحميل وضغط الشعار، يرجى اختيار صورة أخرى');
      }
    }
  };

  // Schedule management handlers
  const handleUpdateScheduleDay = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    setWeeklySchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
  };

  const handleApplyToAllDays = (sourceIndex: number) => {
    const src = weeklySchedule[sourceIndex];
    setWeeklySchedule(prev => prev.map(d => ({
      ...d,
      isOpen: src.isOpen,
      openTime: src.openTime,
      closeTime: src.closeTime,
      is24Hours: src.is24Hours
    })));
  };

  const handleSet24HoursAll = () => {
    setWeeklySchedule(prev => prev.map(d => ({
      ...d,
      isOpen: true,
      openTime: '00:00',
      closeTime: '23:59',
      is24Hours: true
    })));
    setWorkingHours('24 ساعة / مفتوح طوال اليوم');
  };

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

    const cleanName = sanitizeText(name);
    const cleanPhone = sanitizeText(phone);

    if (!cleanName) {
      setError('يرجى إدخال اسم المتجر / النشاط');
      return;
    }

    if (!cleanPhone) {
      setError('يرجى إدخال رقم هاتف المتجر');
      return;
    }

    const dupCheck = checkDuplicateStorePhone(cleanPhone, stores, store?.id);
    if (dupCheck.isDuplicate) {
      setError(`⚠️ رقم الهاتف (${cleanPhone}) مسجل مسبقاً لدى متجر "${dupCheck.existingName}".`);
      return;
    }

    if (!createdDate) {
      setError('يرجى تحديد تاريخ الإنشاء');
      return;
    }

    const rawMapInput = googleMapsUrl.trim();
    let finalMapLink = rawMapInput;

    // 1. Direct coordinates in input (e.g., "15.3521, 44.2014") -> auto construct maps URL
    const directCoords = parseCoordinatesOnly(rawMapInput);
    if (directCoords) {
      finalMapLink = `https://maps.google.com/?q=${directCoords.lat},${directCoords.lng}`;
    } else if (rawMapInput) {
      // 2. Prepend https:// if short link without protocol
      if (rawMapInput.startsWith('maps.app.goo.gl/') || rawMapInput.startsWith('goo.gl/maps/')) {
        finalMapLink = `https://${rawMapInput}`;
      } else {
        finalMapLink = rawMapInput;
      }
    } else {
      finalMapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    }

    const finalLogoUrl = logoUrl.trim() || autoCategoryLogo;
    const computedAddress = (latitude && longitude && (latitude !== 15.3694 || longitude !== 44.1910))
      ? `موقع جغرافي محدّد (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      : (isShortGoogleMapsUrl(finalMapLink) ? 'موقع جغرافي مثبت عبر رابط Google Maps' : `موقع جغرافي محدّد (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);

    try {
      setIsSubmitting(true);
      await onSave({
        name: cleanName,
        phone: cleanPhone,
        createdAt: createdDate,
        workingHours: sanitizeText(workingHours) || '08:00 ص - 11:30 م',
        weeklySchedule,
        address: computedAddress,
        latitude: typeof latitude === 'number' ? latitude : 15.3694,
        longitude: typeof longitude === 'number' ? longitude : 44.1910,
        googleMapsUrl: finalMapLink,
        mapLink: finalMapLink, // Keep direct map link
        categoryId: categoryId || (categories[0]?.id || 'default'),
        categoryName: activeCategoryName,
        activityType: activeCategoryName,
        logoUrl: finalLogoUrl,
        logoFileName: sanitizeText(logoFileName) || 'default_logo.png',
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-200 my-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact for mobile */}
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-200" />
            <div>
              <h3 className="text-base font-bold">
                {store ? 'تعديل بيانات المتجر' : 'إضافة متجر جديد'}
              </h3>
              <span className="text-[10px] text-blue-100 font-medium">
                قسم: <strong className="text-white">{activeCategoryName}</strong>
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Compact & Mobile Friendly */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Store Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              اسم المتجر / النشاط <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مطعم البيت الدمشقي / صيدلية الشفاء"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold text-slate-900"
              required
            />
          </div>

          {/* 2. Compact Phone & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-600" />
                <span>رقم الهاتف <span className="text-red-500">*</span></span>
              </label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="77XXXXXXX"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono text-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>تاريخ الإنشاء <span className="text-red-500">*</span></span>
              </label>
              <input 
                type="date" 
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-800"
                required
              />
            </div>
          </div>

          {/* 3. Logo Upload + Read-only File Name */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>شعار المتجر (اختياري)</span>
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => { setLogoUrl(''); setLogoFileName(''); }}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                >
                  استعادة الشعار التلقائي
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {effectiveLogoUrl ? (
                  <img 
                    src={effectiveLogoUrl} 
                    alt="Logo Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Store className="w-6 h-6 text-slate-300" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-slate-700 font-bold text-[11px] cursor-pointer shadow-2xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>اختيار صورة مخصصة</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoFileUpload} 
                    className="hidden" 
                  />
                </label>
                <span className="block text-[10px] text-slate-500 truncate font-mono">
                  {logoFileName || 'لم يتم اختيار ملف مخصص (يستخدم الشعار الافتراضي)'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Weekly Hours Table Button / Sub-Window */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>ساعات العمل وجدول الأيام الأسبوعي</span>
              </label>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>🕒 فتح جدول الأيام</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              ساعات العمل الحالية: <strong className="text-amber-900">{workingHours}</strong>
            </p>
          </div>

          {/* 5. Google Maps Link & Location Fast Control */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>الموقع الجغرافي وخرائط Google Maps</span>
              </label>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold font-mono">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>

            {/* Google Maps Link Direct Input Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-blue-600" />
                  <span>رابط خرائط جوجل أو الإحداثيات (Google Maps Link)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">استخراج الإحداثيات تلقائياً</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                  placeholder="الصق رابط جوجل مابس هنا (مثال: https://maps.app.goo.gl/... أو 15.3694, 44.1910)"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono shadow-2xs"
                />
                {googleMapsUrl && (
                  <button
                    type="button"
                    onClick={() => handleGoogleMapsUrlChange('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Yemen City Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">اختيار سريع لمركز المدينة:</span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {YEMEN_CITY_PRESETS.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handleApplyCityPreset(city)}
                    className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    📍 {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Status & Confirm / Open Button Card */}
            {(() => {
              const rawInput = googleMapsUrl.trim();
              const directCoords = parseCoordinatesOnly(rawInput);
              let liveTestUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
              if (directCoords) {
                liveTestUrl = `https://maps.google.com/?q=${directCoords.lat},${directCoords.lng}`;
              } else if (rawInput) {
                liveTestUrl = rawInput.startsWith('http') ? rawInput : `https://${rawInput}`;
              }
              const isShort = isShortGoogleMapsUrl(rawInput);

              return (
                <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">
                          {isShort ? 'رابط خرائط جوجل مختصر ونشط' : `الإحداثيات المسجلة: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`}
                        </span>
                        {isShort && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            رابط مباشر
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">{pinDropNote}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <a
                      href={liveTestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>تجربة وفتح الرابط في Google Maps</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 6. Return Policy Permission Toggle */}
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">إمكانية إرجاع الطلبات (المرتجع)</span>
              <span className="text-[10px] text-slate-500 block">هل يسمح للعميل بطلب إرجاع المنتجات من هذا المتجر؟</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={allowReturns} 
                onChange={(e) => setAllowReturns(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'جاري الحفظ...' : (store ? 'حفظ التعديلات' : 'إضافة المتجر')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sub-Window / Modal for Weekly Schedule Table */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-200" />
                <h4 className="text-sm font-bold">جدول ساعات العمل الأسبوعية (لكل يوم)</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-3 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-amber-900 font-medium">إجراء سريع:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSet24HoursAll}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-md cursor-pointer transition-colors"
                >
                  دوام 24 ساعة للكل
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyToAllDays(0)}
                  className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-md cursor-pointer transition-colors"
                >
                  نسخ السبت لباقي الأيام
                </button>
              </div>
            </div>

            {/* 7 Days Table */}
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-2 text-xs">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] text-slate-400 font-bold">
                    <th className="pb-1.5">اليوم</th>
                    <th className="pb-1.5 text-center">الحالة</th>
                    <th className="pb-1.5 text-center">من</th>
                    <th className="pb-1.5 text-center">إلى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklySchedule.map((schedule, idx) => (
                    <tr key={schedule.day} className="hover:bg-gray-50">
                      <td className="py-2 font-bold text-slate-800">{schedule.day}</td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateScheduleDay(idx, 'isOpen', !schedule.isOpen)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            schedule.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {schedule.isOpen ? 'مفتوح' : 'مغلق'}
                        </button>
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="time"
                          value={schedule.openTime}
                          disabled={!schedule.isOpen || schedule.is24Hours}
                          onChange={(e) => handleUpdateScheduleDay(idx, 'openTime', e.target.value)}
                          className="px-1.5 py-0.5 border border-gray-200 rounded text-[11px] disabled:opacity-40"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="time"
                          value={schedule.closeTime}
                          disabled={!schedule.isOpen || schedule.is24Hours}
                          onChange={(e) => handleUpdateScheduleDay(idx, 'closeTime', e.target.value)}
                          className="px-1.5 py-0.5 border border-gray-200 rounded text-[11px] disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                حفظ وإغلاق الجدول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

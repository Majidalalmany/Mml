import React, { useState } from 'react';
import { 
  Bike, 
  Car, 
  Truck, 
  DollarSign, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Calculator, 
  Route, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
  ShoppingBag,
  Plane,
  Globe,
  Coins
} from 'lucide-react';
import { 
  AdminUser, 
  MultiServicePricingConfig, 
  ServiceVehiclePricing, 
  InternationalShippingPricing 
} from '../types';
import { 
  INITIAL_MULTI_SERVICE_CONFIG, 
  getLocalMultiServicePricing, 
  saveLocalMultiServicePricing 
} from '../lib/vehicleService';
import { hasModulePermission } from '../lib/permissions';

interface VehiclesPricingManagerProps {
  currentUser?: AdminUser | null;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const VehiclesPricingManager: React.FC<VehiclesPricingManagerProps> = ({
  currentUser,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'manfaah' | 'international'>('store');
  const [config, setConfig] = useState<MultiServicePricingConfig>(() => getLocalMultiServicePricing());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Live Simulator State
  const [simDistanceKm, setSimDistanceKm] = useState<number>(3.6);
  const [simVehicleCategory, setSimVehicleCategory] = useState<'motorcycle' | 'car' | 'truck'>('motorcycle');

  const canEdit = currentUser ? hasModulePermission(currentUser.permissions, currentUser.role, 'delivery', 'edit') : true;

  // Handlers for Store Orders
  const updateStorePricing = (key: keyof ServiceVehiclePricing, val: number) => {
    setConfig(prev => ({
      ...prev,
      storeOrders: {
        ...prev.storeOrders,
        [key]: Math.max(0, Number(val) || 0)
      }
    }));
    setHasUnsavedChanges(true);
    setSavedSuccessMsg(null);
  };

  // Handlers for Manfaah & Fazaa
  const updateManfaahPricing = (key: keyof ServiceVehiclePricing, val: number) => {
    setConfig(prev => ({
      ...prev,
      manfaahFazaa: {
        ...prev.manfaahFazaa,
        [key]: Math.max(0, Number(val) || 0)
      }
    }));
    setHasUnsavedChanges(true);
    setSavedSuccessMsg(null);
  };

  // Handlers for International Shipping
  const updateInternationalPricing = (key: keyof InternationalShippingPricing, val: any) => {
    setConfig(prev => ({
      ...prev,
      internationalShipping: {
        ...prev.internationalShipping,
        [key]: key === 'freightCurrency' ? val : Math.max(0, Number(val) || 0)
      }
    }));
    setHasUnsavedChanges(true);
    setSavedSuccessMsg(null);
  };

  // Save changes
  const handleSaveAll = () => {
    saveLocalMultiServicePricing(config);
    setHasUnsavedChanges(false);
    const msg = 'تم حفظ واعتماد إعدادات التسعير لجميع الخدمات والوسائط بنجاح وتطبيقها في النظام!';
    setSavedSuccessMsg(msg);
    if (onShowToast) onShowToast(msg, 'success');
    setTimeout(() => setSavedSuccessMsg(null), 5000);
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    setConfig(INITIAL_MULTI_SERVICE_CONFIG);
    saveLocalMultiServicePricing(INITIAL_MULTI_SERVICE_CONFIG);
    setHasUnsavedChanges(false);
    const msg = 'تمت استعادة الإعدادات المالية والأسعار الافتراضية بنجاح!';
    setSavedSuccessMsg(msg);
    if (onShowToast) onShowToast(msg, 'success');
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  // Simulation calculation based on active tab
  let simPricePerKm = 100;
  let simMinFee = 500;
  let simBaseFreight = 0;
  let vehicleName = 'دراجة نارية';

  if (simVehicleCategory === 'motorcycle') vehicleName = 'دراجة نارية';
  if (simVehicleCategory === 'car') vehicleName = 'سيارة / باص';
  if (simVehicleCategory === 'truck') vehicleName = 'شاحنة / دينا';

  if (activeTab === 'store') {
    simPricePerKm = simVehicleCategory === 'motorcycle' 
      ? config.storeOrders.motorcyclePricePerKm 
      : simVehicleCategory === 'car' 
      ? config.storeOrders.carPricePerKm 
      : config.storeOrders.truckPricePerKm;
    simMinFee = config.storeOrders.minFee;
  } else if (activeTab === 'manfaah') {
    simPricePerKm = simVehicleCategory === 'motorcycle' 
      ? config.manfaahFazaa.motorcyclePricePerKm 
      : simVehicleCategory === 'car' 
      ? config.manfaahFazaa.carPricePerKm 
      : config.manfaahFazaa.truckPricePerKm;
    simMinFee = config.manfaahFazaa.minFee;
  } else {
    simBaseFreight = config.internationalShipping.fixedBaseFreightFee;
    simPricePerKm = simVehicleCategory === 'motorcycle' 
      ? config.internationalShipping.motorcycleLastMilePerKm 
      : simVehicleCategory === 'car' 
      ? config.internationalShipping.carLastMilePerKm 
      : config.internationalShipping.truckLastMilePerKm;
    simMinFee = config.internationalShipping.minDeliveryFee;
  }

  const simRawCalculatedFee = simDistanceKm * simPricePerKm;
  const simRoundedFee = Math.ceil(simRawCalculatedFee / 50) * 50;
  const isSimMinApplied = (simRoundedFee < simMinFee);
  const simEffectiveDelivery = Math.max(simMinFee, simRoundedFee);
  const simTotalFinal = simBaseFreight + simEffectiveDelivery;

  return (
    <div className="space-y-6 animate-in fade-in dir-rtl" dir="rtl">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900">الإدارة المالية وتوزيع تسعير الخدمات</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                تسعير متعدد الخدمات
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              إدخال وتخصيص أسعار الكيلومتر والحد الأدنى لطلبات المتاجر، خدمات منفعة وفزعة، والشحن الدولي بشكل مستقل.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleResetToDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="استعادة الإعدادات الافتراضية"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          {canEdit && (
            <button
              onClick={handleSaveAll}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Save className="w-4 h-4 text-emerald-300" />
              <span>حفظ واعتماد الأسعار</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
            محدث في كامل النظام
          </span>
        </div>
      )}

      {/* 3 Main Navigation Tabs for Financial Management */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'store'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>1. تسعير طلبات المتاجر العادية</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'store' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            الحد الأدنى: {config.storeOrders.minFee} ر.ي
          </span>
        </button>

        <button
          onClick={() => setActiveTab('manfaah')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'manfaah'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>2. تسعير خدمات منفعة وفزعة</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'manfaah' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            الحد الأدنى: {config.manfaahFazaa.minFee} ر.ي
          </span>
        </button>

        <button
          onClick={() => setActiveTab('international')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'international'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>3. تسعير التوصيل والشحن الدولي (الخارجي)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'international' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
            ثابت: {config.internationalShipping.fixedBaseFreightFee.toLocaleString()} ر.ي
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REGULAR STORE ORDERS PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'store' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Section Description Card */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-blue-950">تسعير طلبات المتاجر والمطاعم والسوبرماركت (المحلية)</h3>
                <p className="text-[11px] text-blue-800">
                  تُحتسب التكلفة بضرب المسافة الطرقية الواقعية بسعر الكيلو لكل مركبة، بشرط ألا تقل عن الحد الأدنى العام.
                </p>
              </div>
            </div>

            {/* General Minimum Fee Input for Store Orders */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-200 flex items-center gap-2.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-700">الحد الأدنى العام للطلبات:</span>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={config.storeOrders.minFee}
                  onChange={(e) => updateStorePricing('minFee', Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-28 px-2.5 py-1.5 rounded-lg border border-blue-300 font-mono font-extrabold text-sm text-blue-900 text-left bg-blue-50/30"
                />
                <span className="absolute left-2 top-1.5 text-[11px] text-blue-600 font-bold pointer-events-none">ر.ي</span>
              </div>
            </div>
          </div>

          {/* 3 Vehicle Cards for Store Orders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Motorcycle */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Bike className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">دراجة نارية (موتوسيكل)</h4>
                    <span className="text-[10px] text-slate-400">Motorcycle (حتى 15 كجم)</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  الفئة 1
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلومتر الواحد (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.storeOrders.motorcyclePricePerKm}
                    onChange={(e) => updateStorePricing('motorcyclePricePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="100"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[80, 100, 120, 150].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateStorePricing('motorcyclePricePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.storeOrders.motorcyclePricePerKm === p ? 'bg-blue-600 text-white font-bold border-blue-600' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                معادلة: Max({config.storeOrders.minFee} ر.ي ، المسافة × {config.storeOrders.motorcyclePricePerKm} ر.ي)
              </div>
            </div>

            {/* Car / Van */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Car className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">سيارة / باص (سيدان أو عائلية)</h4>
                    <span className="text-[10px] text-slate-400">Car / Van (15 - 100 كجم)</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  الفئة 2
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلومتر الواحد (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.storeOrders.carPricePerKm}
                    onChange={(e) => updateStorePricing('carPricePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="200"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[150, 200, 250, 300].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateStorePricing('carPricePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.storeOrders.carPricePerKm === p ? 'bg-indigo-600 text-white font-bold border-indigo-600' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                معادلة: Max({config.storeOrders.minFee} ر.ي ، المسافة × {config.storeOrders.carPricePerKm} ر.ي)
              </div>
            </div>

            {/* Truck / Dyna */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Truck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">شاحنة نقل / دينا (بيك آب)</h4>
                    <span className="text-[10px] text-slate-400">Truck / Dyna (أكثر من 100 كجم)</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  الفئة 3
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلومتر الواحد (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.storeOrders.truckPricePerKm}
                    onChange={(e) => updateStorePricing('truckPricePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="400"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[300, 400, 500, 600].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateStorePricing('truckPricePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.storeOrders.truckPricePerKm === p ? 'bg-amber-600 text-white font-bold border-amber-600' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                معادلة: Max({config.storeOrders.minFee} ر.ي ، المسافة × {config.storeOrders.truckPricePerKm} ر.ي)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANFA'AH & FAZ'AA SERVICES PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'manfaah' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Section Description Card */}
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950">تسعير خدمات منفعة وفزعة (المشاوير الفورية ونقل الأغراض)</h3>
                <p className="text-[11px] text-amber-800">
                  خدمات شراء فوري أو استلام ونقل طرود خاصة من مكان لآخر بتسعيرة مخصصة ومستقلة وحد أدنى خاص (افتراضي 700 ر.ي).
                </p>
              </div>
            </div>

            {/* General Minimum Fee Input for Manfaah */}
            <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center gap-2.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-700">الحد الأدنى لخدمة منفعة وفزعة:</span>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={config.manfaahFazaa.minFee}
                  onChange={(e) => updateManfaahPricing('minFee', Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-28 px-2.5 py-1.5 rounded-lg border border-amber-300 font-mono font-extrabold text-sm text-amber-900 text-left bg-amber-50/30"
                />
                <span className="absolute left-2 top-1.5 text-[11px] text-amber-600 font-bold pointer-events-none">ر.ي</span>
              </div>
            </div>
          </div>

          {/* 3 Vehicle Cards for Manfaah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Motorcycle */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Bike className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">دراجة نارية (مشاوير سريعة)</h4>
                    <span className="text-[10px] text-slate-400">توصيل مستندات وأغراض صغيرة</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  منفعة 1
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلومتر لمنفعة (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.manfaahFazaa.motorcyclePricePerKm}
                    onChange={(e) => updateManfaahPricing('motorcyclePricePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="150"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[100, 150, 180, 200].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateManfaahPricing('motorcyclePricePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.manfaahFazaa.motorcyclePricePerKm === p ? 'bg-amber-600 text-white font-bold border-amber-600' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                معادلة: Max({config.manfaahFazaa.minFee} ر.ي ، المسافة × {config.manfaahFazaa.motorcyclePricePerKm} ر.ي)
              </div>
            </div>

            {/* Car / Van */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
                    <Car className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">سيارة / باص (أغراض وكراتين)</h4>
                    <span className="text-[10px] text-slate-400">توصيل هدايا وطرود متعددة</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  منفعة 2
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلومتر لمنفعة (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.manfaahFazaa.carPricePerKm}
                    onChange={(e) => updateManfaahPricing('carPricePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="250"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[200, 250, 300, 350].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateManfaahPricing('carPricePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.manfaahFazaa.carPricePerKm === p ? 'bg-amber-600 text-white font-bold border-amber-600' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                معادلة: Max({config.manfaahFazaa.minFee} ر.ي ، المسافة × {config.manfaahFazaa.carPricePerKm} ر.ي)
              </div>
            </div>

            {/* Truck / Dyna */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                    <Truck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">شاحنة دينا (نقل أثاث وبضائع)</h4>
                    <span className="text-[10px] text-slate-400">نقل أغراض منزلية ومعدات ثقيلة</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                  منفعة 3
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلومتر لمنفعة (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.manfaahFazaa.truckPricePerKm}
                    onChange={(e) => updateManfaahPricing('truckPricePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="500"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[400, 500, 600, 800].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateManfaahPricing('truckPricePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.manfaahFazaa.truckPricePerKm === p ? 'bg-orange-600 text-white font-bold border-orange-600' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                معادلة: Max({config.manfaahFazaa.minFee} ر.ي ، المسافة × {config.manfaahFazaa.truckPricePerKm} ر.ي)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTERNATIONAL SHIPPING & DELIVERY PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'international' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Section Description & Fixed Base Freight Card */}
          <div className="bg-purple-50/70 border border-purple-200 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-purple-950">تسعير التوصيل والشحن الدولي (الخارجي)</h3>
                  <p className="text-[11px] text-purple-800">
                    تتكون التكلفة من [رسوم النقل والشحن الدولي الثابتة] + [تكلفة الميل الأخير والتوصيل المحلي بحسب وسيلة النقل].
                  </p>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-purple-200 flex items-center gap-2.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">الحد الأدنى للميل الأخير:</span>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={config.internationalShipping.minDeliveryFee}
                    onChange={(e) => updateInternationalPricing('minDeliveryFee', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-purple-300 font-mono font-extrabold text-sm text-purple-900 text-left bg-purple-50/30"
                  />
                  <span className="absolute left-2 top-1.5 text-[11px] text-purple-600 font-bold pointer-events-none">ر.ي</span>
                </div>
              </div>
            </div>

            {/* 1. FIXED BASE INTERNATIONAL FREIGHT INPUT WITH CURRENCY SELECTOR */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-purple-300/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div>
                  <label className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-purple-700" />
                    <span>رسوم النقل والشحن الدولي الثابتة / الموحدة (Base Freight Fee):</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    قيمة الشحن والتخليص الثابتة المضافة لكل طرد دولي قبل احتساب المسافة المحلية، مع تحديد عملة الفاتورة.
                  </p>
                </div>

                {/* Currency Selector */}
                <div className="flex items-center gap-2 bg-purple-50/80 p-1.5 rounded-xl border border-purple-200">
                  <span className="text-[11px] font-extrabold text-purple-900 px-1.5">عملة الشحن الدولي:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { code: 'YER', label: 'الريال اليمني (ر.ي)', short: 'ر.ي' },
                      { code: 'SAR', label: 'الريال السعودي (ر.س)', short: 'ر.س' },
                      { code: 'USD', label: 'الدولار الأمريكي ($)', short: '$' }
                    ].map((curr) => {
                      const isSelected = (config.internationalShipping.freightCurrency || 'YER') === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => updateInternationalPricing('freightCurrency', curr.code)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'bg-white text-purple-900 hover:bg-purple-100/70 border border-purple-200/80'
                          }`}
                          title={curr.label}
                        >
                          <span>{curr.code}</span>
                          <span className="text-[10px] opacity-80 font-normal">({curr.short})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Input row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6">
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    مبلغ الرسوم الثابتة ({config.internationalShipping.freightCurrency === 'SAR' ? 'بالريال السعودي' : config.internationalShipping.freightCurrency === 'USD' ? 'بالدولار الأمريكي' : 'بالريال اليمني'}):
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={config.internationalShipping.freightCurrency === 'USD' ? '5' : config.internationalShipping.freightCurrency === 'SAR' ? '10' : '500'}
                      value={config.internationalShipping.fixedBaseFreightFee}
                      onChange={(e) => updateInternationalPricing('fixedBaseFreightFee', Number(e.target.value))}
                      disabled={!canEdit}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-400 text-base font-extrabold font-mono text-purple-950 bg-purple-50/40 text-left dir-ltr"
                      placeholder={config.internationalShipping.freightCurrency === 'USD' ? '20' : config.internationalShipping.freightCurrency === 'SAR' ? '75' : '5000'}
                    />
                    <span className="absolute left-3 top-3 text-xs text-purple-700 font-bold pointer-events-none">
                      {config.internationalShipping.freightCurrency === 'SAR' ? 'ر.س ثابتة' : config.internationalShipping.freightCurrency === 'USD' ? '$ ثابتة' : 'ر.ي ثابتة'}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1.5">قيم مقترحة وسريعة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(config.internationalShipping.freightCurrency === 'USD' 
                      ? [10, 15, 20, 30, 50] 
                      : config.internationalShipping.freightCurrency === 'SAR' 
                      ? [30, 50, 75, 100, 150] 
                      : [3000, 5000, 8000, 10000, 15000]
                    ).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateInternationalPricing('fixedBaseFreightFee', val)}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                          config.internationalShipping.fixedBaseFreightFee === val 
                            ? 'bg-purple-700 text-white font-bold border-purple-700 shadow-2xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-purple-50'
                        }`}
                      >
                        {val.toLocaleString()} {config.internationalShipping.freightCurrency === 'SAR' ? 'ر.س' : config.internationalShipping.freightCurrency === 'USD' ? '$' : 'ر.ي'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Vehicle Cards for International Last-Mile Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Motorcycle */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                    <Bike className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">دراجة نارية (ميل أخير)</h4>
                    <span className="text-[10px] text-slate-400">طرود دولية خفيفة وأوراق</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  دولي 1
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلو للميل الأخير (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.internationalShipping.motorcycleLastMilePerKm}
                    onChange={(e) => updateInternationalPricing('motorcycleLastMilePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="100"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[80, 100, 150].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateInternationalPricing('motorcycleLastMilePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.internationalShipping.motorcycleLastMilePerKm === p ? 'bg-purple-700 text-white font-bold border-purple-700' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                إجمالي = {config.internationalShipping.fixedBaseFreightFee} + Max({config.internationalShipping.minDeliveryFee} ، مسافة × {config.internationalShipping.motorcycleLastMilePerKm})
              </div>
            </div>

            {/* Car / Van */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-800 text-white flex items-center justify-center shadow-xs">
                    <Car className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">سيارة (ميل أخير)</h4>
                    <span className="text-[10px] text-slate-400">كراتين وملابس وإلكترونيات</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  دولي 2
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلو للميل الأخير (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.internationalShipping.carLastMilePerKm}
                    onChange={(e) => updateInternationalPricing('carLastMilePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="200"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[150, 200, 250].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateInternationalPricing('carLastMilePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.internationalShipping.carLastMilePerKm === p ? 'bg-purple-700 text-white font-bold border-purple-700' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                إجمالي = {config.internationalShipping.fixedBaseFreightFee} + Max({config.internationalShipping.minDeliveryFee} ، مسافة × {config.internationalShipping.carLastMilePerKm})
              </div>
            </div>

            {/* Truck / Dyna */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-900 text-white flex items-center justify-center shadow-xs">
                    <Truck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">شاحنة دينا (ميل أخير)</h4>
                    <span className="text-[10px] text-slate-400">بضائع وشحنات ثقيلة ومعدات</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  دولي 3
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">سعر الكيلو للميل الأخير (ر.ي / كم):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={config.internationalShipping.truckLastMilePerKm}
                    onChange={(e) => updateInternationalPricing('truckLastMilePerKm', Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold font-mono text-slate-900 bg-white text-left dir-ltr"
                    placeholder="400"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">ر.ي / كم</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[300, 400, 500].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateInternationalPricing('truckLastMilePerKm', p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${config.internationalShipping.truckLastMilePerKm === p ? 'bg-purple-700 text-white font-bold border-purple-700' : 'bg-white text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-lg font-mono text-center">
                إجمالي = {config.internationalShipping.fixedBaseFreightFee} + Max({config.internationalShipping.minDeliveryFee} ، مسافة × {config.internationalShipping.truckLastMilePerKm})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIVERSAL SIMULATION ENGINE ADAPTED TO ACTIVE TAB */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                محاكي الاحتساب الديناميكي لـ {activeTab === 'store' ? 'طلبات المتاجر' : activeTab === 'manfaah' ? 'خدمة منفعة وفزعة' : 'الشحن الدولي'}
              </h3>
              <p className="text-[11px] text-slate-400">
                اختبار فوري للمسافة وسعر الكيلو والحد الأدنى المعتمد لهذا التبويب.
              </p>
            </div>
          </div>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            تطبيق حي وتلقائي
          </span>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
          {/* Select Vehicle Category */}
          <div className="sm:col-span-4">
            <label className="text-xs text-slate-300 font-bold block mb-1">اختر وسيلة النقل:</label>
            <select
              value={simVehicleCategory}
              onChange={(e) => setSimVehicleCategory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="motorcycle">🏍️ دراجة نارية ({simVehicleCategory === 'motorcycle' ? simPricePerKm : ''} ر.ي/كم)</option>
              <option value="car">🚗 سيارة / باص</option>
              <option value="truck">🚚 شاحنة نقل دينا</option>
            </select>
          </div>

          {/* Distance Input */}
          <div className="sm:col-span-4">
            <label className="text-xs text-slate-300 font-bold block mb-1">
              المسافة الطرقية الواقعية (كم):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={simDistanceKm}
                onChange={(e) => setSimDistanceKm(Math.max(0.1, Number(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-600 text-white text-xs font-bold font-mono rounded-xl px-3 py-2.5 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div className="flex gap-1">
                {[3.6, 5.0, 8.5].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSimDistanceKm(d)}
                    className={`text-[10px] px-2 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                      simDistanceKm === d ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {d}ك
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Box */}
          <div className="sm:col-span-4 bg-slate-800/90 border border-slate-600/80 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">القيمة المعتمدة للتوصيل:</span>
            <div className="text-xl font-black font-mono text-emerald-400 flex items-center justify-center gap-1.5">
              <span>{simTotalFinal.toLocaleString()}</span>
              <span className="text-xs text-emerald-300 font-normal">ر.ي</span>
            </div>
            {isSimMinApplied && (
              <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                (تم اعتماد الحد الأدنى المقرر: {simMinFee} ر.ي)
              </span>
            )}
          </div>
        </div>

        {/* Dynamic calculation explanation */}
        <div className="p-3.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-xs text-blue-100 flex items-start gap-2.5">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-amber-300 font-extrabold block">
              تفاصيل الاحتساب:
            </strong>
            <p className="text-[11px] leading-relaxed font-mono">
              {activeTab === 'international' ? (
                <span>
                  رسوم الشحن الدولي الثابتة ({simBaseFreight.toLocaleString()} {config.internationalShipping.freightCurrency === 'SAR' ? 'ر.س' : config.internationalShipping.freightCurrency === 'USD' ? '$' : 'ر.ي'}) + ميل أخير ({simDistanceKm} كم × {simPricePerKm} ر.ي = {simRawCalculatedFee.toFixed(0)} ر.ي ➔ تقريب {simRoundedFee.toLocaleString()} ر.ي {isSimMinApplied ? `-> اعتُمد الحد الأدنى ${simMinFee.toLocaleString()} ر.ي` : ''}) {config.internationalShipping.freightCurrency && config.internationalShipping.freightCurrency !== 'YER' ? `[الرسوم الثابتة بعملة ${config.internationalShipping.freightCurrency}]` : `= ${simTotalFinal.toLocaleString()} ر.ي`}
                </span>
              ) : (
                <span>
                  المسافة ({simDistanceKm} كم) × سعر الكيلو ({simPricePerKm} ر.ي/كم) = {simRawCalculatedFee.toFixed(0)} ر.ي ➔ تقريب تلقائي لأقرب 50 ر.ي ({simRoundedFee.toLocaleString()} ر.ي) {isSimMinApplied ? `➔ اعتُمد الحد الأدنى المقرر (${simMinFee.toLocaleString()} ر.ي) لأن الناتج أقل منه.` : `➔ الناتج المعتمد: ${simTotalFinal.toLocaleString()} ر.ي`}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

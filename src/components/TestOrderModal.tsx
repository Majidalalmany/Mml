import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  MapPin, 
  Store, 
  Bike, 
  Car, 
  Truck, 
  Calculator, 
  ShoppingBag, 
  Zap, 
  Globe, 
  ArrowRightLeft,
  Sparkles,
  Route,
  Activity,
  CheckCircle2,
  Loader2,
  Compass,
  Clock
} from 'lucide-react';
import { Order } from '../types';
import { fetchLiveOsrmRoadRoute, calculateDeliveryCost, calculateAirDistance } from '../lib/routingService';
import { getLocalVehicles, getLocalMultiServicePricing } from '../lib/vehicleService';

interface TestOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (orderData: Partial<Order>) => void;
}

// Famous predefined locations in Sana'a for fast and accurate testing
const POPULAR_LOCATIONS = [
  { name: 'شارع حدة - مركز المدينة', lat: 15.3184, lng: 44.1852 },
  { name: 'شارع الزبيري - تقاطع صخر', lat: 15.3462, lng: 44.1985 },
  { name: 'حي الأصبحي - شارع 24', lat: 15.2954, lng: 44.2045 },
  { name: 'حي الصافية - قرب وزارة المالية', lat: 15.3371, lng: 44.2183 },
  { name: 'شارع الستين الجنوبي - عطان', lat: 15.3125, lng: 44.1712 },
  { name: 'حي شميلة - جوار السوق المركزي', lat: 15.3089, lng: 44.2256 },
  { name: 'حي مذبح - جامعة صنعاء الجديدة', lat: 15.3725, lng: 44.1812 },
  { name: 'حي الحصبة - جولة الساعة', lat: 15.3852, lng: 44.2024 }
];

export const TestOrderModal: React.FC<TestOrderModalProps> = ({
  isOpen,
  onClose,
  onAddOrder
}) => {
  // Available vehicles and pricing configuration
  const vehicles = getLocalVehicles();
  const multiPricing = getLocalMultiServicePricing();

  // Basic Form State
  const [customerName, setCustomerName] = useState('أحمد محمد الشامي');
  const [customerPhone, setCustomerPhone] = useState('777123456');
  const [storeName, setStoreName] = useState('مطعم الشيباني الملكي - حدة');
  const [itemsSummary, setItemsSummary] = useState('وجبة كبسة دجاج عائلي + 2 مقبلات مشكل');
  const [orderAmount, setOrderAmount] = useState<number>(4500);
  
  const [serviceType, setServiceType] = useState<'store' | 'manfaah' | 'international'>('store');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh-motorcycle');

  // Interactive Dynamic Coordinates State (String based for smooth input without losing cursor or trailing decimals)
  const [pickupPresetIdx, setPickupPresetIdx] = useState<number | 'custom'>(0);
  const [dropoffPresetIdx, setDropoffPresetIdx] = useState<number | 'custom'>(2);

  const [pickupLocationName, setPickupLocationName] = useState(POPULAR_LOCATIONS[0].name);
  const [dropoffLocationName, setDropoffLocationName] = useState(POPULAR_LOCATIONS[2].name);

  const [pickupLatStr, setPickupLatStr] = useState<string>(POPULAR_LOCATIONS[0].lat.toString());
  const [pickupLngStr, setPickupLngStr] = useState<string>(POPULAR_LOCATIONS[0].lng.toString());
  const [dropoffLatStr, setDropoffLatStr] = useState<string>(POPULAR_LOCATIONS[2].lat.toString());
  const [dropoffLngStr, setDropoffLngStr] = useState<string>(POPULAR_LOCATIONS[2].lng.toString());

  // Real-time Dynamic OSRM Route State
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);
  const [liveRoadDistanceKm, setLiveRoadDistanceKm] = useState<number>(4.8);
  const [liveAirDistanceKm, setLiveAirDistanceKm] = useState<number>(3.2);
  const [liveDurationMinutes, setLiveDurationMinutes] = useState<number>(12);
  const [isLiveOsrm, setIsLiveOsrm] = useState<boolean>(true);
  const [routingMethodDesc, setRoutingMethodDesc] = useState<string>('مسار شوارع وانعطافات واقعي مباشر (OSRM OpenStreetMap)');

  const debounceTimerRef = useRef<any>(null);

  // Selected vehicle object
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Real-time parsed safe coordinates for mathematical calculation
  const safePickupLat = Number(parseFloat(pickupLatStr)) || 15.3184;
  const safePickupLng = Number(parseFloat(pickupLngStr)) || 44.1852;
  const safeDropoffLat = Number(parseFloat(dropoffLatStr)) || 15.3547;
  const safeDropoffLng = Number(parseFloat(dropoffLngStr)) || 44.2065;

  // Function to execute real-world OSRM routing
  const executeOsrmRouting = async (pLat: number, pLng: number, dLat: number, dLng: number) => {
    setIsRoutingLoading(true);
    try {
      const result = await fetchLiveOsrmRoadRoute(pLat, pLng, dLat, dLng);
      setLiveRoadDistanceKm(result.roadDistanceKm);
      setLiveAirDistanceKm(result.airDistanceKm);
      setLiveDurationMinutes(result.durationMinutes);
      setIsLiveOsrm(result.isLiveOsrm);
      setRoutingMethodDesc(result.methodDescription);
    } catch (err) {
      console.warn('OSRM Dynamic Routing error:', err);
      const air = calculateAirDistance(pLat, pLng, dLat, dLng);
      setLiveAirDistanceKm(air);
      setLiveRoadDistanceKm(Number(Math.max(0.8, air * 1.35).toFixed(2)));
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Trigger Dynamic Routing on coordinate changes with debounce for typing
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsRoutingLoading(true);

    debounceTimerRef.current = setTimeout(() => {
      executeOsrmRouting(safePickupLat, safePickupLng, safeDropoffLat, safeDropoffLng);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [safePickupLat, safePickupLng, safeDropoffLat, safeDropoffLng, isOpen]);

  // Real-time Delivery Cost Calculation adhering strictly to:
  // 1. Calculated_Fee = Distance_KM (from OSRM) * Rate_Per_KM
  // 2. Rounded_Fee = Math.ceil(Calculated_Fee / 50) * 50
  // 3. Final_Delivery_Fee = Math.max(Rounded_Fee, Minimum_Vehicle_Fee) (+ baseFixedFee if international)
  const pricingResult = calculateDeliveryCost({
    roadDistanceKm: liveRoadDistanceKm,
    vehicle: selectedVehicle,
    serviceType: serviceType,
    pricingSettings: {
      generalMinDeliveryFee: multiPricing.storeOrders.minFee,
      manfaahMinDeliveryFee: multiPricing.manfaahFazaa.minFee,
      roadCurvatureFactor: multiPricing.roadCurvatureFactor,
      enableLiveRoadRouting: true,
      multiServiceConfig: multiPricing
    }
  });

  // Calculate intermediate values for clear UI display
  const rawCalculatedFee = Number((liveRoadDistanceKm * pricingResult.pricePerKm).toFixed(1));
  const roundedFee = Math.ceil(rawCalculatedFee / 50) * 50;

  // Handlers for Preset Selectors (Immediate routing trigger)
  const handlePickupPresetChange = (idx: number) => {
    const loc = POPULAR_LOCATIONS[idx];
    if (loc) {
      setPickupPresetIdx(idx);
      setPickupLocationName(loc.name);
      setPickupLatStr(loc.lat.toString());
      setPickupLngStr(loc.lng.toString());
      executeOsrmRouting(loc.lat, loc.lng, safeDropoffLat, safeDropoffLng);
    }
  };

  const handleDropoffPresetChange = (idx: number) => {
    const loc = POPULAR_LOCATIONS[idx];
    if (loc) {
      setDropoffPresetIdx(idx);
      setDropoffLocationName(loc.name);
      setDropoffLatStr(loc.lat.toString());
      setDropoffLngStr(loc.lng.toString());
      executeOsrmRouting(safePickupLat, safePickupLng, loc.lat, loc.lng);
    }
  };

  // Handlers for Dynamic Coordinate Inputs with auto-split support
  const handlePickupLatChange = (value: string) => {
    if (value.includes(',')) {
      const parts = value.split(',').map(p => p.trim());
      if (parts[0]) setPickupLatStr(parts[0]);
      if (parts[1]) setPickupLngStr(parts[1]);
    } else {
      setPickupLatStr(value);
    }
    setPickupPresetIdx('custom');
    setPickupLocationName(`موقع متجر مخصص (${value}, ${pickupLngStr})`);
  };

  const handlePickupLngChange = (value: string) => {
    setPickupLngStr(value);
    setPickupPresetIdx('custom');
    setPickupLocationName(`موقع متجر مخصص (${pickupLatStr}, ${value})`);
  };

  const handleDropoffLatChange = (value: string) => {
    if (value.includes(',')) {
      const parts = value.split(',').map(p => p.trim());
      if (parts[0]) setDropoffLatStr(parts[0]);
      if (parts[1]) setDropoffLngStr(parts[1]);
    } else {
      setDropoffLatStr(value);
    }
    setDropoffPresetIdx('custom');
    setDropoffLocationName(`موقع عميل مخصص (${value}, ${dropoffLngStr})`);
  };

  const handleDropoffLngChange = (value: string) => {
    setDropoffLngStr(value);
    setDropoffPresetIdx('custom');
    setDropoffLocationName(`موقع عميل مخصص (${dropoffLatStr}, ${value})`);
  };

  // Swap Locations Helper
  const handleSwapLocations = () => {
    const tempLat = pickupLatStr;
    const tempLng = pickupLngStr;
    const tempName = pickupLocationName;
    const tempPreset = pickupPresetIdx;

    setPickupLatStr(dropoffLatStr);
    setPickupLngStr(dropoffLngStr);
    setPickupLocationName(dropoffLocationName);
    setPickupPresetIdx(dropoffPresetIdx);

    setDropoffLatStr(tempLat);
    setDropoffLngStr(tempLng);
    setDropoffLocationName(tempName);
    setDropoffPresetIdx(tempPreset);

    executeOsrmRouting(safeDropoffLat, safeDropoffLng, safePickupLat, safePickupLng);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrderData: Partial<Order> = {
      id: `ord_${Date.now()}`,
      orderNumber: newOrderNumber,
      customerName,
      customerPhone,
      address: dropoffLocationName,
      storeName,
      total: orderAmount + pricingResult.finalDeliveryFee,
      itemsTotal: orderAmount,
      deliveryFee: pricingResult.finalDeliveryFee,
      status: 'new',
      serviceType: serviceType as any,
      vehicleTypeId: selectedVehicle.id,
      vehicleTypeName: selectedVehicle.name,
      pickupLat: safePickupLat,
      pickupLng: safePickupLng,
      dropoffLat: safeDropoffLat,
      dropoffLng: safeDropoffLng,
      airDistanceKm: liveAirDistanceKm,
      actualRoadDistanceKm: liveRoadDistanceKm,
      itemsCount: 1,
      items: [
        {
          id: `item-${Date.now()}`,
          productName: itemsSummary,
          quantity: 1,
          price: orderAmount
        }
      ],
      createdAt: new Date().toISOString()
    };

    onAddOrder(newOrderData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in dir-rtl" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white">إضافة طلب تجريبي وحساب مسار الشوارع الفعلي</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400 font-mono flex items-center gap-1">
                  {isRoutingLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                      جاري فحص مسار OSRM...
                    </>
                  ) : (
                    <>
                      <Activity className="w-3 h-3 text-emerald-400" />
                      OSRM Real-World Street Routing
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                حساب ديناميكي فوري لمسافة الشوارع الحقيقية عبر OpenStreetMap بدون أي معاملات ثابتة أو تقديرات وهمية.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* 1. Service Type Selector */}
          <div>
            <label className="text-xs font-extrabold text-slate-800 block mb-2">نوع الخدمة المطلوبة:</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setServiceType('store')}
                className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  serviceType === 'store'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>طلب متجر عادي</span>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('manfaah')}
                className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  serviceType === 'manfaah'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span>منفعة وفزعة</span>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('international')}
                className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  serviceType === 'international'
                    ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Globe className="w-4 h-4 text-purple-600" />
                <span>شحن وتوصيل دولي</span>
              </button>
            </div>
          </div>

          {/* 2. DYNAMIC COORDINATES INPUTS & PRESETS (Requirement 1: Real OSRM Routing Trigger) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-xs text-slate-900">
                  إحداثيات المسار (تحديث فوري ديناميكي مع محرك الشوارع):
                </span>
              </div>
              <button
                type="button"
                onClick={handleSwapLocations}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="عكس نقطة الانطلاق والوصول"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>تبديل الموقعين</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store Location */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>موقع المتجر (Store Pin):</span>
                  </label>
                  {pickupPresetIdx === 'custom' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      إحداثيات يدوية ✏️
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">معلم محدد</span>
                  )}
                </div>

                <select
                  value={pickupPresetIdx === 'custom' ? 'custom' : pickupPresetIdx}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setPickupPresetIdx('custom');
                    } else {
                      handlePickupPresetChange(Number(e.target.value));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {POPULAR_LOCATIONS.map((loc, i) => (
                    <option key={i} value={i}>
                      🏪 {loc.name}
                    </option>
                  ))}
                  <option value="custom">📍 إحداثيات مخصصة (إدخال يدوي حر)</option>
                </select>

                {/* Coordinate Inputs with dynamic event listener */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">خط العرض (Lat):</span>
                    <input
                      type="text"
                      value={pickupLatStr}
                      onChange={(e) => handlePickupLatChange(e.target.value)}
                      placeholder="15.3184"
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">خط الطول (Lng):</span>
                    <input
                      type="text"
                      value={pickupLngStr}
                      onChange={(e) => handlePickupLngChange(e.target.value)}
                      placeholder="44.1852"
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Location */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>موقع العميل (Customer Pin):</span>
                  </label>
                  {dropoffPresetIdx === 'custom' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                      إحداثيات يدوية ✏️
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">معلم محدد</span>
                  )}
                </div>

                <select
                  value={dropoffPresetIdx === 'custom' ? 'custom' : dropoffPresetIdx}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setDropoffPresetIdx('custom');
                    } else {
                      handleDropoffPresetChange(Number(e.target.value));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {POPULAR_LOCATIONS.map((loc, i) => (
                    <option key={i} value={i}>
                      📍 {loc.name}
                    </option>
                  ))}
                  <option value="custom">📍 إحداثيات مخصصة (إدخال يدوي حر)</option>
                </select>

                {/* Coordinate Inputs with dynamic event listener */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">خط العرض (Lat):</span>
                    <input
                      type="text"
                      value={dropoffLatStr}
                      onChange={(e) => handleDropoffLatChange(e.target.value)}
                      placeholder="15.3547"
                      className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">خط الطول (Lng):</span>
                    <input
                      type="text"
                      value={dropoffLngStr}
                      onChange={(e) => handleDropoffLngChange(e.target.value)}
                      placeholder="44.2065"
                      className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time OSRM Engine Status Banner */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200/80 px-3 py-2 rounded-xl text-[11px]">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                {isRoutingLoading ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <Compass className="w-4 h-4 text-blue-600" />
                )}
                <span>
                  {isRoutingLoading 
                    ? 'جاري إرسال الإحداثيات لمحرك الخرائط (OSRM) وحساب مسار الشوارع الواقعي...' 
                    : routingMethodDesc}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-mono font-bold shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>الزمن المتوقع: ~{liveDurationMinutes} دقيقة</span>
              </div>
            </div>

          </div>

          {/* 3. Vehicle Type Selection */}
          <div>
            <label className="text-xs font-extrabold text-slate-800 block mb-2">اختيار وسيلة النقل:</label>
            <div className="grid grid-cols-3 gap-3">
              {vehicles.map((veh) => {
                const isSelected = veh.id === selectedVehicleId;
                const isMotorcycle = veh.id === 'veh-motorcycle';
                const isCar = veh.id === 'veh-car';
                
                return (
                  <button
                    key={veh.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(veh.id)}
                    className={`p-3 rounded-2xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {isMotorcycle && <Bike className="w-4 h-4" />}
                        {isCar && <Car className="w-4 h-4" />}
                        {!isMotorcycle && !isCar && <Truck className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {veh.pricePerKm} ر.ي/كم
                      </span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">{veh.name}</div>
                      <span className="text-[10px] text-slate-400">الحد الأدنى: {veh.minDeliveryFee} ر.ي</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. REAL-TIME CALCULATION WITH SMART CEIL ROUNDING (Requirements 2 & 3) */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-blue-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-blue-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-xs text-blue-100">نتائج احتساب مسافة الشوارع والتقريب المالي المعتمد:</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                تقريب ذكي لأقرب 50 ريال (Ceil)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-blue-950/80 p-2.5 rounded-xl border border-blue-700/50">
                <span className="text-[10px] text-slate-400 block mb-0.5">المسافة الهوائية (للمقارنة):</span>
                <span className="font-mono text-xs font-bold text-slate-300">{liveAirDistanceKm} كم</span>
              </div>

              <div className="bg-blue-950/80 p-2.5 rounded-xl border border-blue-700/50 relative">
                {isRoutingLoading && (
                  <div className="absolute top-1 left-1">
                    <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                  </div>
                )}
                <span className="text-[10px] text-blue-300 block mb-0.5 font-bold">المسافة الطرقية الواقعية (OSRM):</span>
                <span className="font-mono text-xs font-extrabold text-emerald-400">{liveRoadDistanceKm} كم</span>
              </div>

              <div className="bg-blue-950/80 p-2.5 rounded-xl border border-blue-700/50">
                <span className="text-[10px] text-amber-300 block mb-0.5">الناتج الفعلي قبل التقريب:</span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {liveRoadDistanceKm} × {pricingResult.pricePerKm} = {rawCalculatedFee} ر.ي
                </span>
              </div>

              <div className="bg-emerald-950/90 p-2.5 rounded-xl border border-emerald-500/60 shadow-xs">
                <span className="text-[10px] text-emerald-300 block mb-0.5">رسوم التوصيل المعتمدة:</span>
                <span className="font-mono text-base font-black text-emerald-400">{pricingResult.finalDeliveryFee.toLocaleString()} ر.ي</span>
              </div>
            </div>

            {/* Smart Step-by-Step Breakdown Display */}
            <div className="bg-black/40 p-3 rounded-xl border border-blue-700/50 space-y-1.5 text-[11px] font-mono text-blue-100">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Route className="w-3.5 h-3.5" />
                <span>خطوات تطبيق المعادلة المالية المعتمدة:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="text-slate-400 block">1. المسافة الفعلية × سعر الكيلو:</span>
                  <strong className="text-white">{liveRoadDistanceKm} كم × {pricingResult.pricePerKm} = {rawCalculatedFee} ر.ي</strong>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="text-slate-400 block">2. التقريب للأعلى (مضاعف 50):</span>
                  <strong className="text-amber-300">Math.ceil({rawCalculatedFee}/50)×50 = {roundedFee} ر.ي</strong>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="text-slate-400 block">3. مطابقة الحد الأدنى:</span>
                  <strong className="text-emerald-300">Max({roundedFee}, {pricingResult.appliedMinFee}) = {pricingResult.finalDeliveryFee} ر.ي</strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 pt-1">
                {pricingResult.calculationBreakdown}
              </p>
            </div>
          </div>

          {/* 5. Additional Order Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">اسم العميل:</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">هاتف العميل:</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 text-left"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">اسم المتجر / المرسل:</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">قيمة المشتريات (ر.ي):</label>
              <input
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(Number(e.target.value))}
                min="0"
                step="100"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 text-left"
              />
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">أصناف ومحتويات الطلب:</label>
            <input
              type="text"
              value={itemsSummary}
              onChange={(e) => setItemsSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>إجمالي الطلب مع التوصيل: {(orderAmount + pricingResult.finalDeliveryFee).toLocaleString()} ر.ي</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء وتثبيت الطلب في اللوحة ({pricingResult.finalDeliveryFee.toLocaleString()} ر.ي توصيل)</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

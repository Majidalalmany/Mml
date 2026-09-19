import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Navigation, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  User, 
  Store, 
  ExternalLink,
  ShieldCheck,
  Compass,
  Car,
  Bike,
  Layers,
  Zap,
  Globe,
  Receipt,
  DollarSign,
  Route,
  PackageCheck
} from 'lucide-react';
import { DriverUser, ActiveDeliveryOrder } from '../types';
import { getLocalVehicles } from '../lib/vehicleService';
import { loadGoogleMaps } from '../lib/googleMaps';
import { createAdvancedMarker } from './DriversMapManager';

interface DedicatedDeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverUser | null;
  order: ActiveDeliveryOrder | null;
}

type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export const DedicatedDeliveryMapModal: React.FC<DedicatedDeliveryMapModalProps> = ({
  isOpen,
  onClose,
  driver,
  order
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeMapType, setActiveMapType] = useState<GoogleMapType>('roadmap');

  useEffect(() => {
    if (!isOpen || !driver || !order || !mapContainerRef.current) return;

    let isSubscribed = true;

    loadGoogleMaps().then(async (google) => {
      if (!isSubscribed || !mapContainerRef.current || !google?.maps) return;

      if (google.maps.importLibrary) {
        try {
          await google.maps.importLibrary("marker");
        } catch (e) {
          console.warn('Could not import marker library:', e);
        }
      }

      const driverLat = driver.lat || 15.3694;
      const driverLng = driver.lng || 44.1910;
      const destLat = order.destLat || (driverLat + 0.012);
      const destLng = order.destLng || (driverLng + 0.015);
      const pickupLat = order.pickupLat || (driverLat - 0.005);
      const pickupLng = order.pickupLng || (driverLng - 0.005);

      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: driverLat, lng: driverLng },
        zoom: 14,
        mapId: 'DEMO_MAP_ID',
        mapTypeId: activeMapType,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.LEFT_TOP
        }
      });

      mapInstanceRef.current = map;

      const bounds = new google.maps.LatLngBounds();

      // 1. Pickup Store Marker
      if (pickupLat && pickupLng) {
        const pickupSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" fill="#f59e0b" stroke="#ffffff" stroke-width="3" />
            <text x="22" y="26" font-size="18" text-anchor="middle" dominant-baseline="central">🏪</text>
          </svg>
        `.trim();

        const pickupMarker = createAdvancedMarker({
          position: { lat: pickupLat, lng: pickupLng },
          map,
          title: order.storeName || 'المتجر',
          svgHtml: pickupSvg,
          zIndex: 30
        });

        const pInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2 text-right dir-rtl font-sans" dir="rtl">
              <div class="font-bold text-xs text-amber-600 mb-1">🏪 نقطة الاستلام (المتجر):</div>
              <div class="font-extrabold text-slate-800 text-sm">${order.storeName || 'المتجر'}</div>
              <div class="text-xs text-slate-600 mt-1">${order.pickupAddress || ''}</div>
            </div>
          `
        });
        if (pickupMarker) {
          pickupMarker.addListener('click', () => {
            pInfoWindow.open({ anchor: pickupMarker, map });
          });
        }

        bounds.extend({ lat: pickupLat, lng: pickupLng });
      }

      // 2. Driver Marker
      const isMotorcycle = driver.vehicleType === 'دراجة نارية' || driver.vehicleType === 'موتور' || driver.vehicleType?.toLowerCase().includes('motorcycle') || driver.vehicleType?.toLowerCase().includes('bike');
      const isTruck = driver.vehicleType?.includes('شاحنة') || driver.vehicleType?.includes('دينا') || driver.vehicleType?.toLowerCase().includes('truck');
      const vehicleEmoji = isMotorcycle ? '🏍️' : isTruck ? '🚚' : '🚗';
      const driverBgColor = isMotorcycle ? '#10b981' : isTruck ? '#8b5cf6' : '#2563eb';

      const driverSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="22" fill="${driverBgColor}" stroke="#ffffff" stroke-width="3" />
          <text x="25" y="30" font-size="20" text-anchor="middle" dominant-baseline="central">${vehicleEmoji}</text>
        </svg>
      `.trim();

      const driverMarker = createAdvancedMarker({
        position: { lat: driverLat, lng: driverLng },
        map,
        title: driver.name,
        svgHtml: driverSvg,
        zIndex: 50
      });

      const dInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2 text-right dir-rtl font-sans" dir="rtl">
            <div class="font-bold text-xs text-blue-600 mb-1">🚚 الكابتن المكلف:</div>
            <div class="font-extrabold text-slate-800 text-sm">${driver.name}</div>
            <div class="text-xs text-slate-600 mt-1">السرعة: ${driver.speed || 0} كم/س | ${driver.vehicleType || 'مركبة توصيل'}</div>
            <div class="text-xs text-slate-500 mt-0.5">الموقع الحالي: ${driver.locationName || 'موقع مباشر'}</div>
          </div>
        `
      });
      if (driverMarker) {
        driverMarker.addListener('click', () => {
          dInfoWindow.open({ anchor: driverMarker, map });
        });
      }

      bounds.extend({ lat: driverLat, lng: driverLng });

      // 3. Customer Dropoff Destination Marker
      const destSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" fill="#e11d48" stroke="#ffffff" stroke-width="3" />
          <text x="24" y="28" font-size="20" text-anchor="middle" dominant-baseline="central">🎯</text>
        </svg>
      `.trim();

      const destMarker = createAdvancedMarker({
        position: { lat: destLat, lng: destLng },
        map,
        title: order.customerName,
        svgHtml: destSvg,
        zIndex: 40
      });

      const destInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2.5 text-right dir-rtl font-sans" dir="rtl">
            <div class="font-black text-xs text-rose-600 mb-1">🏁 نقطة تسليم الطلب النهائي:</div>
            <div class="font-extrabold text-slate-900 text-sm">${order.customerName}</div>
            <div class="text-xs text-slate-600 font-mono my-1">📞 ${order.customerPhone}</div>
            <div class="text-xs text-slate-700 bg-rose-50 p-2 rounded border border-rose-200 mt-1">📍 ${order.dropoffAddress}</div>
          </div>
        `
      });
      if (destMarker) {
        destMarker.addListener('click', () => {
          destInfoWindow.open({ anchor: destMarker, map });
        });
      }

      bounds.extend({ lat: destLat, lng: destLng });

      // 4. Draw Route Polylines
      const routePoints: Array<{ lat: number; lng: number }> = [];
      if (pickupLat && pickupLng) routePoints.push({ lat: pickupLat, lng: pickupLng });
      routePoints.push({ lat: driverLat, lng: driverLng });
      routePoints.push({ lat: destLat, lng: destLng });

      new google.maps.Polyline({
        path: routePoints,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map
      });

      map.fitBounds(bounds, 80);
    }).catch(err => {
      console.error('Failed to load Google Maps in DedicatedDeliveryMapModal:', err);
    });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, driver, order]);

  // Handle Map Type Change
  const handleMapTypeChange = (type: GoogleMapType) => {
    setActiveMapType(type);
    if (mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  if (!isOpen || !driver || !order) return null;

  const driverLat = driver.lat || 15.3694;
  const driverLng = driver.lng || 44.1910;
  const destLat = order.destLat || (driverLat + 0.015);
  const destLng = order.destLng || (driverLng + 0.015);

  const roadDist = order.actualRoadDistanceKm || order.distanceKm || 3.6;
  const localVehicles = getLocalVehicles();
  const isTruck = driver.vehicleType?.includes('شاحنة') || driver.vehicleType?.includes('دينا') || driver.vehicleType === 'Truck';
  const isCar = driver.vehicleType?.includes('سيارة') || driver.vehicleType?.includes('باص') || driver.vehicleType === 'Car';
  const matchedVehicle = isTruck 
    ? (localVehicles.find(v => v.id === 'veh-truck') || localVehicles[2])
    : isCar
    ? (localVehicles.find(v => v.id === 'veh-car') || localVehicles[1])
    : (localVehicles.find(v => v.id === 'veh-motorcycle') || localVehicles[0]);

  const pricePerKm = matchedVehicle?.pricePerKm || 100;
  const minFee = matchedVehicle?.minDeliveryFee || 500;
  const dynamicCalculatedFee = Math.max(minFee, Math.round(roadDist * pricePerKm));
  const deliveryFee = order.fee || dynamicCalculatedFee;
  const totalOrderAmount = order.totalAmount || (deliveryFee + (order.itemsTotal || 2500));

  // Official Google Maps URL
  const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&origin=${driverLat},${driverLng}&destination=${destLat},${destLng}&travelmode=driving`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs dir-rtl" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden border border-slate-700/20">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">التتبع الملاحي المباشر عبر Google Maps</h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  متصل ومحدث لحظياً
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبع كابتن التوصيل والطلب رقم: <span className="font-mono text-amber-400 font-bold">#{order.orderNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMapsWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="فتح المسار في خرائط جوجل الرسمية"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Maps</span>
            </a>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Map Section (Col 8) */}
          <div className="lg:col-span-8 relative bg-slate-950 flex flex-col h-full min-h-[300px]">
            
            {/* Native Google Map View */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map Layer Switcher Pill */}
            <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md rounded-2xl p-1 shadow-2xl border border-slate-700/60 flex items-center gap-1">
              <button
                onClick={() => handleMapTypeChange('roadmap')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeMapType === 'roadmap' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                شوارع جوجل
              </button>
              <button
                onClick={() => handleMapTypeChange('satellite')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeMapType === 'satellite' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                أقمار صناعية 🛰️
              </button>
              <button
                onClick={() => handleMapTypeChange('terrain')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeMapType === 'terrain' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                تضاريس 🏔️
              </button>
            </div>

            {/* Bottom Overlay Telemetry Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 border border-slate-700/80 shadow-2xl flex items-center justify-between gap-2 text-white text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold">
                  {driver.speed || 35}
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">السرعة الحالية</div>
                  <div className="font-extrabold text-white">كم / ساعة</div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-800"></div>

              <div>
                <div className="text-[10px] text-slate-400">المسافة المتبقية</div>
                <div className="font-mono font-extrabold text-amber-400">{roadDist} كم</div>
              </div>

              <div className="h-6 w-px bg-slate-800"></div>

              <div>
                <div className="text-[10px] text-slate-400">زمن الوصول المتوقع</div>
                <div className="font-mono font-extrabold text-emerald-400">~ {Math.max(5, Math.round(roadDist * 3))} دقيقة</div>
              </div>

              <div className="h-6 w-px bg-slate-800"></div>

              <div>
                <div className="text-[10px] text-slate-400">أجرة التوصيل</div>
                <div className="font-mono font-extrabold text-white">{deliveryFee} ر.ي</div>
              </div>
            </div>

          </div>

          {/* Details & Telemetry Sidebar (Col 4) */}
          <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-4 sm:p-5 overflow-y-auto flex flex-col justify-between space-y-4">
            
            {/* Order Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">تفاصيل الشحنة</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  قيد التوصيل الآن
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">نقطة الانطلاق (المتجر):</span>
                    <strong className="text-slate-800 font-bold">{order.storeName || 'المتجر الرئيسي'}</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">{order.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">وجهة التسليم (العميل):</span>
                    <strong className="text-slate-800 font-bold">{order.customerName}</strong>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{order.customerPhone}</p>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded mt-1 border border-slate-100">{order.dropoffAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Profile & Contact */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>بيانات الكابتن</span>
                </div>
                <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ● متصل بالخدمة
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{driver.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{driver.phone}</div>
                  </div>
                </div>

                <a
                  href={`tel:${driver.phone}`}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-lg transition-colors"
                  title="اتصال بالمندوب"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div className="bg-white p-2 rounded border border-slate-100">
                  المركبة: <strong className="text-slate-900">{driver.vehicleType || 'دراجة'}</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-100">
                  اللوحة: <strong className="text-slate-900 font-mono">{driver.plateNumber || '—'}</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-100">
                  السرعة: <strong className="text-blue-600 font-mono">{driver.speed || 35} كم/س</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-100">
                  الطلبات المسندة: <strong className="text-amber-600 font-bold">{driver.assignedOrdersCount || 1}</strong>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer inside Modal */}
            <div className="pt-2 space-y-2 mt-auto">
              <a
                href={googleMapsWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Compass className="w-4 h-4 text-white" />
                <span>فتح الملاحة الرسمية في Google Maps</span>
              </a>

              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق هذه النافذة والعودة للخريطة الرئيسية
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

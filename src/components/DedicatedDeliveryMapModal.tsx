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
import L from 'leaflet';
import { DriverUser, ActiveDeliveryOrder } from '../types';
import { getLocalVehicles } from '../lib/vehicleService';

interface DedicatedDeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverUser | null;
  order: ActiveDeliveryOrder | null;
}

type TileLayerType = 'osm' | 'voyager' | 'satellite';

const TILE_LAYERS: Record<TileLayerType, { name: string; url: string; subdomains?: string; maxZoom?: number }> = {
  voyager: {
    name: 'شوارع ناصعة',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19
  },
  satellite: {
    name: 'أقمار صناعية 🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18
  }
};

export const DedicatedDeliveryMapModal: React.FC<DedicatedDeliveryMapModalProps> = ({
  isOpen,
  onClose,
  driver,
  order
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<TileLayerType>('voyager');

  // Change Tile Layer dynamically
  const switchTileLayer = (layerType: TileLayerType) => {
    setSelectedLayer(layerType);
    const map = leafletMapRef.current;
    if (!map) return;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const config = TILE_LAYERS[layerType];
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom || 19,
      subdomains: config.subdomains || 'abc',
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    activeTileLayerRef.current = newLayer;
  };

  useEffect(() => {
    if (!isOpen || !driver || !order || !mapContainerRef.current) return;

    // Small delay to ensure modal DOM is mounted with valid dimensions
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Destroy previous map instance if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const driverLat = driver.lat || 15.3694;
      const driverLng = driver.lng || 44.1910;
      const destLat = order.destLat || (driverLat + 0.015);
      const destLng = order.destLng || (driverLng + 0.015);
      const pickupLat = order.pickupLat || (driverLat - 0.005);
      const pickupLng = order.pickupLng || (driverLng - 0.005);

      // Create Leaflet Map with OpenStreetMap / Carto
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([driverLat, driverLng], 14);

      leafletMapRef.current = map;

      // Add selected Tile Layer (Carto Voyager by default for crisp aesthetic)
      const layerConfig = TILE_LAYERS[selectedLayer];
      const initialLayer = L.tileLayer(layerConfig.url, {
        maxZoom: layerConfig.maxZoom || 19,
        subdomains: layerConfig.subdomains || 'abcd',
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      activeTileLayerRef.current = initialLayer;

      // 1. Pickup Store Marker
      if (pickupLat && pickupLng) {
        const pickupIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-amber-500 border-2 border-white text-white shadow-xl flex items-center justify-center font-bold text-sm">
                🏪
              </div>
              <div class="absolute -bottom-6 bg-slate-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap border border-amber-500/80">
                ${order.storeName || 'المتجر / نقطة الاستلام'}
              </div>
            </div>
          `,
          className: 'custom-pickup-modal-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const pickupMarker = L.marker([pickupLat, pickupLng], { icon: pickupIcon }).addTo(map);
        pickupMarker.bindPopup(`
          <div class="p-2 text-right dir-rtl font-sans" dir="rtl">
            <div class="font-bold text-xs text-amber-600 mb-1">🏪 نقطة الاستلام (المتجر):</div>
            <div class="font-extrabold text-slate-800 text-sm">${order.storeName || 'المتجر'}</div>
            <div class="text-xs text-slate-600 mt-1">${order.pickupAddress}</div>
          </div>
        `);
      }

      // 2. Driver Marker
      const isMotorcycle = driver.vehicleType === 'دراجة نارية' || driver.vehicleType === 'موتور';
      const vehicleEmoji = isMotorcycle ? '🏍️' : '🚗';
      const driverIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2.5 rounded-full bg-blue-500/40 animate-ping"></div>
            <div class="w-12 h-12 rounded-full bg-blue-600 border-2 border-white text-white shadow-2xl flex items-center justify-center font-bold text-xl">
              ${vehicleEmoji}
            </div>
            <div class="absolute -bottom-7 bg-blue-950 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-blue-400">
              الكابتن: ${driver.name.split(' ')[0]} (${driver.speed || 35} كم/س)
            </div>
          </div>
        `,
        className: 'custom-driver-modal-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);
      driverMarker.bindPopup(`
        <div class="p-2 text-right dir-rtl font-sans" dir="rtl">
          <div class="font-bold text-xs text-blue-600 mb-1">🚚 الكابتن المكلف:</div>
          <div class="font-extrabold text-slate-800 text-sm">${driver.name}</div>
          <div class="text-xs text-slate-600 mt-1">السرعة: ${driver.speed || 0} كم/س | ${driver.vehicleType || 'مركبة توصيل'}</div>
          <div class="text-xs text-slate-500 mt-0.5">الموقع الحالي: ${driver.locationName || 'موقع مباشر'}</div>
        </div>
      `);

      // 3. Customer Dropoff Destination Marker
      const destIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-3.5 rounded-full bg-rose-500/40 animate-pulse"></div>
            <div class="w-12 h-12 rounded-full bg-rose-600 border-3 border-white text-white shadow-2xl flex items-center justify-center font-bold text-xl">
              🎯
            </div>
            <div class="absolute -bottom-8 bg-slate-900 text-amber-300 text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-rose-500">
              📍 وجهة التوصيل: ${order.customerName}
            </div>
          </div>
        `,
        className: 'custom-dest-modal-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`
        <div class="p-2.5 text-right dir-rtl font-sans" dir="rtl">
          <div class="font-black text-xs text-rose-600 mb-1">🏁 نقطة تسليم الطلب النهائي:</div>
          <div class="font-extrabold text-slate-900 text-sm">${order.customerName}</div>
          <div class="text-xs text-slate-600 font-mono my-1">📞 ${order.customerPhone}</div>
          <div class="text-xs text-slate-700 bg-rose-50 p-2 rounded border border-rose-200 mt-1">📍 ${order.dropoffAddress}</div>
        </div>
      `);

      // 4. Draw Route Polylines
      const routePoints: L.LatLngExpression[] = [];
      if (pickupLat && pickupLng) routePoints.push([pickupLat, pickupLng]);
      routePoints.push([driverLat, driverLng]);
      routePoints.push([destLat, destLng]);

      const polyline = L.polyline(routePoints, {
        color: '#f59e0b',
        weight: 6,
        opacity: 0.9,
        dashArray: '10, 8'
      }).addTo(map);

      // Fit map bounds with generous padding
      map.fitBounds(polyline.getBounds(), { padding: [80, 80] });
    }, 120);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen, driver, order]);

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

  // Free OpenStreetMap Direction & External Browser URL
  const osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${driverLat}%2C${driverLng}%3B${destLat}%2C${destLng}`;
  const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&origin=${driverLat},${driverLng}&destination=${destLat},${destLng}&travelmode=driving`;
  const whatsappUrl = `https://wa.me/967${order.customerPhone}?text=${encodeURIComponent(`حياك الله أخي ${order.customerName}، نود إبلاغك بأن الكابتن ${driver.name} في طريقه إليك لتسليم الطلب رقم #${order.orderNumber}`)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[94vh] sm:h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative dir-rtl" dir="rtl">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
              🚚
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  تفاصيل المشوار والطلب المباشر - #{order.orderNumber}
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  المندوب في طريق التسليم
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                الكابتن المكلف: <strong className="text-amber-300">{driver.name}</strong> ➔ العميل المستلم: <strong className="text-emerald-300">{order.customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={osmDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="فتح مسار التوجيه في OpenStreetMap"
            >
              <Globe className="w-4 h-4 text-emerald-200" />
              <span className="hidden md:inline">OpenStreetMap 🗺️</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (Map + Detailed Info Sidebar) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50">
          
          {/* Map View Area (7 cols on desktop) */}
          <div className="lg:col-span-7 relative h-[300px] sm:h-[380px] lg:h-full flex flex-col bg-slate-100 border-l border-slate-200">
            
            {/* Top Bar Floating Status & Free Layer Switcher */}
            <div className="absolute top-3 right-3 left-3 z-[400] bg-slate-900/90 text-white backdrop-blur-md p-2.5 sm:p-3 rounded-xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>المسار: <strong className="text-amber-300">{order.storeName || 'المتجر'}</strong> ➔ <strong className="text-emerald-300">{order.customerName}</strong></span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Free Tile Layer Switcher */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => switchTileLayer('voyager')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      selectedLayer === 'voyager' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    شوارع عصرية
                  </button>
                  <button
                    onClick={() => switchTileLayer('osm')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      selectedLayer === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    OSM 🗺️
                  </button>
                  <button
                    onClick={() => switchTileLayer('satellite')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      selectedLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    أقمار صناعية 🛰️
                  </button>
                </div>
              </div>
            </div>

            {/* Dedicated Leaflet Map Container */}
            <div ref={mapContainerRef} className="w-full flex-1 z-0" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-slate-200 text-[11px] space-y-1 text-slate-700 font-medium hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 border border-white"></span>
                <span>موقع الكابتن الحالي ({driver.speed || 35} كم/س)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
                <span>نقطة الاستلام ({order.storeName || 'المتجر'})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 border border-white"></span>
                <span>وجهة العميل النهائية (التوصيل)</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial & Order Info Sidebar (5 cols on desktop) */}
          <div className="lg:col-span-5 p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-white">
            
            {/* 1. FINANCIAL & DISTANCE SUMMARY CARD (Requested by user) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md space-y-3.5 border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-white">البيانات المالية ومسافة الرحلة الكلية</h3>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  حساب دقيق بالكيلومتر
                </span>
              </div>

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Total Road Distance */}
                <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block mb-1">المسافة الكلية للرحلة</span>
                  <div className="text-base font-black font-mono text-blue-300 flex items-center justify-center gap-1">
                    <Route className="w-3.5 h-3.5 text-blue-400" />
                    <span>{roadDist} كم</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">طرقية واقعية</span>
                </div>

                {/* Delivery Fee */}
                <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block mb-1">رسوم التوصيل</span>
                  <div className="text-base font-black font-mono text-amber-300">
                    {deliveryFee.toLocaleString()} <span className="text-[10px] font-normal">ر.ي</span>
                  </div>
                  <span className="text-[9px] text-amber-400/80 block mt-0.5">أجرة الكابتن</span>
                </div>

                {/* Total Final Amount */}
                <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 block mb-1">المبلغ الإجمالي</span>
                  <div className="text-base font-black font-mono text-emerald-400">
                    {totalOrderAmount.toLocaleString()} <span className="text-[10px] font-normal">ر.ي</span>
                  </div>
                  <span className="text-[9px] text-emerald-300/80 block mt-0.5">المستحق من العميل</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-xl">
                <span>⏱️ الوقت التقديري للوصول: <strong className="text-amber-300 font-bold">{order.estimatedMinutes || 14} دقيقة</strong></span>
                <span>🛵 وسيلة النقل: <strong className="text-slate-100">{driver.vehicleType || 'دراجة نارية'}</strong></span>
              </div>
            </div>

            {/* 2. Customer Details Box */}
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 p-4 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-rose-950 border-b border-rose-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-rose-600" />
                  <span>تفاصيل العميل والوجهة المحددة</span>
                </div>
                <span className="bg-rose-200/80 text-rose-900 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  طلب #{order.orderNumber}
                </span>
              </div>

              <div>
                <div className="text-[11px] text-slate-500">اسم العميل المستلم:</div>
                <div className="text-sm font-extrabold text-slate-900">{order.customerName}</div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال بالعميل ({order.customerPhone})</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="تواصل عبر واتساب"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>واتساب</span>
                </a>
              </div>

              <div className="bg-white p-3 rounded-lg border border-rose-100 space-y-1">
                <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>عنوان التسليم بالتحديد:</span>
                </div>
                <div className="text-xs text-slate-800 font-bold leading-relaxed">{order.dropoffAddress}</div>
              </div>
            </div>

            {/* 3. Pickup Store Details Box */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 border-b border-amber-200 pb-2">
                <Store className="w-4 h-4 text-amber-600" />
                <span>متجر الطلب وموقع الاستلام</span>
              </div>

              <div className="text-xs text-slate-800">
                <span className="text-slate-500">المتجر: </span>
                <strong className="text-amber-900 font-bold">{order.storeName || 'مركز خدمة فزعة المباشر'}</strong>
              </div>

              <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                <span className="text-[11px] text-amber-800 font-bold block mb-0.5">عنوان الاستلام:</span>
                <span>{order.pickupAddress}</span>
              </div>
            </div>

            {/* 4. Driver Profile Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>بيانات الكابتن المسؤول عن التوصيل</span>
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
                href={osmDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Globe className="w-4 h-4 text-emerald-200" />
                <span>فتح التوجيه الملاحي المباشر في OpenStreetMap</span>
              </a>

              <a
                href={googleMapsWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>عرض في متصفح خرائط الويب</span>
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

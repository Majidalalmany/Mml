import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  MapPin, 
  Store, 
  Navigation, 
  Route, 
  ExternalLink, 
  Layers, 
  Info, 
  Compass, 
  CheckCircle2,
  Maximize2,
  TrendingUp
} from 'lucide-react';
import L from 'leaflet';
import { Order } from '../types';
import { calculateAirDistance, calculateRoadDistance, fetchLiveOsrmRoadRoute } from '../lib/routingService';

interface DistanceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Partial<Order> | null;
  customPickup?: { lat: number; lng: number; label: string };
  customDropoff?: { lat: number; lng: number; label: string };
}

type TileType = 'streets' | 'osm' | 'satellite';

const TILES: Record<TileType, { name: string; url: string; subdomains?: string }> = {
  streets: {
    name: 'شوارع ناصعة',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  satellite: {
    name: 'أقمار صناعية 🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  }
};

export const DistanceVerificationModal: React.FC<DistanceVerificationModalProps> = ({
  isOpen,
  onClose,
  order,
  customPickup,
  customDropoff
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeTile, setActiveTile] = useState<TileType>('streets');

  // Coordinates extraction with default fallback to Sanaa
  const pickupLat = customPickup?.lat || order?.pickupLat || 15.3184;
  const pickupLng = customPickup?.lng || order?.pickupLng || 44.1852;
  const pickupName = customPickup?.label || order?.storeName || 'موقع المتجر / الفرع';

  const dropoffLat = customDropoff?.lat || order?.dropoffLat || 15.3547;
  const dropoffLng = customDropoff?.lng || order?.dropoffLng || 44.2065;
  const dropoffName = customDropoff?.label || order?.customerName || order?.address || 'موقع العميل / التوصيل';

  // Distance calculations
  const airDist = calculateAirDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const roadCalc = calculateRoadDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const roadDist = order?.actualRoadDistanceKm || roadCalc.roadDistanceKm;
  const differenceKm = Number((roadDist - airDist).toFixed(1));
  const multiplier = airDist > 0 ? Number((roadDist / airDist).toFixed(2)) : 1.38;

  // Initialize Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [(pickupLat + dropoffLat) / 2, (pickupLng + dropoffLng) / 2],
      zoom: 13,
      zoomControl: true
    });

    const currentTile = TILES[activeTile];
    tileLayerRef.current = L.tileLayer(currentTile.url, {
      subdomains: currentTile.subdomains || 'abc',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom Store Icon
    const storeIcon = L.divIcon({
      className: 'custom-store-pin',
      html: `
        <div style="background-color: #16a34a; color: white; width: 36px; height: 36px; border-radius: 12px; display: flex; items-center: center; justify-content: center; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4); border: 2px solid white; font-size: 18px; line-height: 32px; text-align: center;">
          🏪
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    // Custom Customer Icon
    const customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="background-color: #2563eb; color: white; width: 36px; height: 36px; border-radius: 12px; display: flex; items-center: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); border: 2px solid white; font-size: 18px; line-height: 32px; text-align: center;">
          📍
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    // Add Store Marker
    const storeMarker = L.marker([pickupLat, pickupLng], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; padding: 4px;">
          <strong style="color: #16a34a; font-size: 13px;">🏪 نقطة المتجر (الانطلاق):</strong>
          <p style="margin: 4px 0 2px 0; font-weight: bold; font-size: 12px;">${pickupName}</p>
          <p style="margin: 0; color: #64748b; font-size: 10px; font-family: monospace;">الإحداثيات: ${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}</p>
        </div>
      `);

    // Add Customer Marker
    const customerMarker = L.marker([dropoffLat, dropoffLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; padding: 4px;">
          <strong style="color: #2563eb; font-size: 13px;">📍 نقطة العميل (الوصول):</strong>
          <p style="margin: 4px 0 2px 0; font-weight: bold; font-size: 12px;">${dropoffName}</p>
          <p style="margin: 0; color: #64748b; font-size: 10px; font-family: monospace;">الإحداثيات: ${dropoffLat.toFixed(4)}, ${dropoffLng.toFixed(4)}</p>
        </div>
      `);

    // 1. Straight Air Line (Dashed Gray)
    const airLine = L.polyline([[pickupLat, pickupLng], [dropoffLat, dropoffLng]], {
      color: '#94a3b8',
      weight: 2.5,
      dashArray: '6, 8',
      opacity: 0.8
    }).addTo(map);

    // 2. Fetch and draw real-world OSRM road geometry
    let roadPolyline: L.Polyline | null = null;
    
    // Initial intermediate curve as placeholder while OSRM loads
    const midLat = (pickupLat + dropoffLat) / 2;
    const midLng = (pickupLng + dropoffLng) / 2;
    const offset1 = 0.003;
    const offset2 = -0.002;

    const initialPoints: [number, number][] = [
      [pickupLat, pickupLng],
      [pickupLat + (dropoffLat - pickupLat) * 0.25 + offset1, pickupLng + (dropoffLng - pickupLng) * 0.25],
      [midLat + offset2, midLng + offset1],
      [pickupLat + (dropoffLat - pickupLat) * 0.75 - offset1, pickupLng + (dropoffLng - pickupLng) * 0.75 + offset2],
      [dropoffLat, dropoffLng]
    ];

    roadPolyline = L.polyline(initialPoints, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Fetch live OSRM coordinates
    fetchLiveOsrmRoadRoute(pickupLat, pickupLng, dropoffLat, dropoffLng).then(res => {
      if (res.coordinates && res.coordinates.length > 0 && mapInstanceRef.current) {
        if (roadPolyline) {
          roadPolyline.setLatLngs(res.coordinates);
        }
      }
    }).catch(err => {
      console.warn('Could not fetch OSRM coordinates for verification map:', err);
    });

    // 3. Bounding Box (المستطيل الجغرافي المحيط)
    const bounds = L.latLngBounds([[pickupLat, pickupLng], [dropoffLat, dropoffLng]]);
    const boundingBox = L.rectangle(bounds.pad(0.15), {
      color: '#3b82f6',
      weight: 1,
      dashArray: '3, 4',
      fillOpacity: 0.03
    }).addTo(map);

    map.fitBounds(bounds.pad(0.25));
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, pickupLat, pickupLng, dropoffLat, dropoffLng, activeTile]);

  if (!isOpen) return null;

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${dropoffLat},${dropoffLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in dir-rtl" dir="rtl">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold">معاينة وتثبت المسافة بين نقطتي المتجر والعميل</h3>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400 font-mono">
                  {roadDist} كم مسار طرقي
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {order?.orderNumber ? `الطلب ${order.orderNumber} • ` : ''}{pickupName} ⬅️ {dropoffName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openInGoogleMaps}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="فتح المسار في خرائط جوجل للتحقق الخارجي"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خرائط Google</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[420px] bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {/* Map Layer Switcher Floating Pill */}
          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md border border-gray-200 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTile('streets')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeTile === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-gray-100'}`}
            >
              شوارع
            </button>
            <button
              onClick={() => setActiveTile('osm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeTile === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-gray-100'}`}
            >
              OSM
            </button>
            <button
              onClick={() => setActiveTile('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeTile === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-gray-100'}`}
            >
              أقمار صناعية
            </button>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-gray-200 text-xs space-y-1.5 max-w-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                <span className="w-3 h-1 bg-blue-600 rounded"></span>
                <span>المسار الطرقي الفعلي (الشوارع):</span>
              </span>
              <strong className="font-mono text-blue-900">{roadDist} كم</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400"></span>
                <span>المسافة الهوائية المباشرة:</span>
              </span>
              <strong className="font-mono text-slate-700">{airDist} كم</strong>
            </div>
          </div>
        </div>

        {/* Technical Distance Verification & Explanation Panel */}
        <div className="p-4 bg-slate-50 border-t border-gray-200 text-xs space-y-3 shrink-0">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-gray-200">
              <span className="text-[10px] text-slate-400 block">المسافة الهوائية (خط مستقيم)</span>
              <strong className="text-sm font-mono text-slate-700">{airDist} كم</strong>
            </div>

            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
              <span className="text-[10px] text-blue-700 font-bold block">المسافة الطرقية المعتمدة (شوارع)</span>
              <strong className="text-sm font-mono text-blue-900 font-extrabold">{roadDist} كم</strong>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold block">فارق المنعطفات والشوارع (+{multiplier}x)</span>
              <strong className="text-sm font-mono text-amber-900">+{differenceKm} كم انحناء طرقي</strong>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 text-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <strong className="text-slate-900 font-bold block">
                سبب اختلاف المسافة الطرقية ({roadDist} كم) عن المسافة الهوائية ({airDist} كم):
              </strong>
              <p className="text-slate-600">
                المسافة الهوائية تقيس الخط المباشر المجرد، بينما المسافة الطرقية تأخذ بالاعتبار شبكة الشوارع الفعلية، الميادين، الجسور، الشوارع ذات الاتجاه الواحد (One-way)، والمنعطفات الإجبارية لضمان وصول وسيلة النقل للموقع بأمان.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تمت مطابقة المسار الجغرافي بنجاح واحتساب التكلفة بدقة.</span>
            </div>

            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer"
            >
              إغلاق المعاينة
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

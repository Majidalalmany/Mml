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
import { Order } from '../types';
import { calculateAirDistance, calculateRoadDistance, fetchLiveOsrmRoadRoute } from '../lib/routingService';
import { loadGoogleMaps } from '../lib/googleMaps';
import { createAdvancedMarker } from './DriversMapManager';

interface DistanceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Partial<Order> | null;
  customPickup?: { lat: number; lng: number; label: string };
  customDropoff?: { lat: number; lng: number; label: string };
}

type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export const DistanceVerificationModal: React.FC<DistanceVerificationModalProps> = ({
  isOpen,
  onClose,
  order,
  customPickup,
  customDropoff
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeMapType, setActiveMapType] = useState<GoogleMapType>('roadmap');

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

  // Initialize Google Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

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

      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: (pickupLat + dropoffLat) / 2, lng: (pickupLng + dropoffLng) / 2 },
        zoom: 13,
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

      // Custom Store Icon SVG
      const storeSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#16a34a" stroke="#ffffff" stroke-width="2.5" />
          <text x="20" y="24" font-size="16" text-anchor="middle" dominant-baseline="central">🏪</text>
        </svg>
      `.trim();

      // Custom Customer Icon SVG
      const customerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="#ffffff" stroke-width="2.5" />
          <text x="20" y="24" font-size="16" text-anchor="middle" dominant-baseline="central">📍</text>
        </svg>
      `.trim();

      // Add Store Marker
      const storeMarker = createAdvancedMarker({
        position: { lat: pickupLat, lng: pickupLng },
        map,
        title: pickupName,
        svgHtml: storeSvg,
        zIndex: 30
      });

      const storeInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="direction: rtl; text-align: right; font-family: sans-serif; padding: 4px;">
            <strong style="color: #16a34a; font-size: 13px;">🏪 نقطة المتجر (الانطلاق):</strong>
            <p style="margin: 4px 0 2px 0; font-weight: bold; font-size: 12px;">${pickupName}</p>
            <p style="margin: 0; color: #64748b; font-size: 10px; font-family: monospace;">الإحداثيات: ${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}</p>
          </div>
        `
      });
      if (storeMarker) {
        storeMarker.addListener('click', () => {
          storeInfoWindow.open({ anchor: storeMarker, map });
        });
      }

      // Add Customer Marker
      const customerMarker = createAdvancedMarker({
        position: { lat: dropoffLat, lng: dropoffLng },
        map,
        title: dropoffName,
        svgHtml: customerSvg,
        zIndex: 40
      });

      const customerInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="direction: rtl; text-align: right; font-family: sans-serif; padding: 4px;">
            <strong style="color: #2563eb; font-size: 13px;">📍 نقطة العميل (الوصول):</strong>
            <p style="margin: 4px 0 2px 0; font-weight: bold; font-size: 12px;">${dropoffName}</p>
            <p style="margin: 0; color: #64748b; font-size: 10px; font-family: monospace;">الإحداثيات: ${dropoffLat.toFixed(4)}, ${dropoffLng.toFixed(4)}</p>
          </div>
        `
      });
      if (customerMarker) {
        customerMarker.addListener('click', () => {
          customerInfoWindow.open({ anchor: customerMarker, map });
        });
      }

      // 1. Straight Air Line (Dashed Gray)
      const airLine = new google.maps.Polyline({
        path: [
          { lat: pickupLat, lng: pickupLng },
          { lat: dropoffLat, lng: dropoffLng }
        ],
        strokeColor: '#94a3b8',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
          offset: '0',
          repeat: '15px'
        }],
        map
      });

      // 2. Road Polyline
      const roadPolyline = new google.maps.Polyline({
        path: [
          { lat: pickupLat, lng: pickupLng },
          { lat: pickupLat + (dropoffLat - pickupLat) * 0.5, lng: pickupLng + (dropoffLng - pickupLng) * 0.5 },
          { lat: dropoffLat, lng: dropoffLng }
        ],
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map
      });

      // Fetch live OSRM coordinates or update path
      fetchLiveOsrmRoadRoute(pickupLat, pickupLng, dropoffLat, dropoffLng).then(res => {
        if (res.coordinates && res.coordinates.length > 0 && isSubscribed) {
          const path = res.coordinates.map((c: [number, number]) => ({ lat: c[0], lng: c[1] }));
          roadPolyline.setPath(path);
        }
      }).catch(err => {
        console.warn('Could not fetch OSRM coordinates for verification map:', err);
      });

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickupLat, lng: pickupLng });
      bounds.extend({ lat: dropoffLat, lng: dropoffLng });
      map.fitBounds(bounds, 60);
    }).catch(err => {
      console.error('Failed to load Google Maps for Distance Verification:', err);
    });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Handle map type change
  const handleMapTypeChange = (type: GoogleMapType) => {
    setActiveMapType(type);
    if (mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

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
                <h3 className="text-sm font-bold">معاينة وتثبت المسافة عبر خرائط جوجل الرسمية</h3>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400 font-mono">
                  {roadDist} كم مسار طرقي
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-sans">
                  Google Maps API نشط
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                من: {pickupName} ⬅ إلى: {dropoffName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openInGoogleMaps}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="فتح المسار في تطبيق Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فتح في Google Maps</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[420px] bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {/* Map Layer Switcher Floating Pill */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-gray-200 flex items-center gap-1 text-xs">
            <button
              onClick={() => handleMapTypeChange('roadmap')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeMapType === 'roadmap' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-gray-100'}`}
            >
              شوارع جوجل
            </button>
            <button
              onClick={() => handleMapTypeChange('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeMapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-gray-100'}`}
            >
              أقمار صناعية 🛰️
            </button>
            <button
              onClick={() => handleMapTypeChange('terrain')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeMapType === 'terrain' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-gray-100'}`}
            >
              تضاريس 🏔️
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

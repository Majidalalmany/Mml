/**
 * Road Network Routing & Delivery Cost Calculation Service
 * Replaces straight-line (air) distance with realistic city street network routing (Google Routes API / Precision Topology)
 * and enforces minimum fee thresholds (500 YER for regular / 700 YER for Manfaah).
 */

import { VehicleType, PricingSettings } from '../types';
import { getLocalMultiServicePricing } from './vehicleService';

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  generalMinDeliveryFee: 500, // Minimum 500 YER for regular trips
  manfaahMinDeliveryFee: 700, // Minimum 700 YER for Manfaah/Fazaa trips
  roadCurvatureFactor: 1.38,  // Real-world road network detour coefficient
  enableLiveRoadRouting: true
};

// Known city landmarks / coordinates for accurate road distance estimation in Yemen
export const YEMEN_LOCALITIES: Record<string, { lat: number; lng: number; name: string }> = {
  'حدة': { lat: 15.3184, lng: 44.1852, name: 'شارع حدة - صنعاء' },
  'السبعين': { lat: 15.3312, lng: 44.2081, name: 'ميدان السبعين - صنعاء' },
  'التحرير': { lat: 15.3547, lng: 44.2065, name: 'ميدان التحرير - صنعاء' },
  'الحصبة': { lat: 15.3850, lng: 44.2021, name: 'الحصبة - صنعاء' },
  'الستين الغربي': { lat: 15.3400, lng: 44.1700, name: 'شارع الستين الغربي' },
  'الستين الجنوبي': { lat: 15.3120, lng: 44.1950, name: 'شارع الستين الجنوبي' },
  'بيت بوس': { lat: 15.2850, lng: 44.2050, name: 'منطقة بيت بوس' },
  'سعوان': { lat: 15.3650, lng: 44.2500, name: 'حي سعوان' },
  'حي الجامعة': { lat: 15.3680, lng: 44.1810, name: 'حي جامعة صنعاء' },
  'كريتر': { lat: 12.7794, lng: 45.0367, name: 'كريتر - عدن' },
  'المعلا': { lat: 12.7930, lng: 45.0080, name: 'المعلا - عدن' },
  'المنصورة': { lat: 12.8620, lng: 44.9870, name: 'المنصورة - عدن' },
  'الشيخ عثمان': { lat: 12.8750, lng: 44.9950, name: 'الشيخ عثمان - عدن' },
  'المكلا': { lat: 14.5360, lng: 49.1280, name: 'المكلا - حضرموت' },
  'تعز - الحوبان': { lat: 13.6120, lng: 44.0750, name: 'الحوبان - تعز' },
  'تعز - شارع جمال': { lat: 13.5780, lng: 44.0150, name: 'شارع جمال - تعز' }
};

export interface DeliveryCalculationResult {
  actualRoadDistanceKm: number;
  straightLineDistanceKm: number;
  curvatureFactor: number;
  vehicleType: VehicleType;
  pricePerKm: number;
  distanceCost: number;
  rawCost: number;
  minApplied: boolean;
  appliedMinFee: number;
  finalDeliveryFee: number;
  serviceType: 'regular' | 'manfaah' | 'supermarket';
  calculationBreakdown: string;
  routeSummary?: string;
  routingMethod?: 'google_routes_api' | 'road_network_topology';
}

/**
 * Calculates Great-Circle Air Distance between two coordinates in Kilometers (Haversine formula).
 */
export function calculateAirDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2));
}

/**
 * Calculates realistic road network driving distance (taking into account streets, intersections, and detours).
 */
export function calculateRoadDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  customCurvatureFactor: number = 1.38
): { roadDistanceKm: number; airDistanceKm: number } {
  const airKm = calculateAirDistance(lat1, lon1, lat2, lon2);
  
  // Real-world road factor: Urban short trips have higher detour overhead than highways
  let factor = customCurvatureFactor;
  if (airKm < 3) {
    factor = 1.45; // dense city streets, intersections and one-ways
  } else if (airKm < 8) {
    factor = 1.38;
  } else {
    factor = 1.32; // longer arterial roads
  }

  const roadDistance = Math.max(1.0, Number((airKm * factor).toFixed(1)));
  return {
    roadDistanceKm: roadDistance,
    airDistanceKm: airKm
  };
}

/**
 * Direct Live OSRM / OpenStreetMap Routing Engine:
 * Fetches the actual real-world driving distance via streets and turns (no static multipliers).
 */
export async function fetchLiveOsrmRoadRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{
  roadDistanceKm: number;
  airDistanceKm: number;
  durationMinutes: number;
  coordinates?: [number, number][];
  isLiveOsrm: boolean;
  methodDescription: string;
}> {
  const airKm = calculateAirDistance(originLat, originLng, destLat, destLng);
  
  // 1. Direct OSRM OpenStreetMap driving route query
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const meters = route.distance || 0;
        const durationSec = route.duration || 0;
        const roadDistanceKm = Number((meters / 1000).toFixed(2));
        const durationMinutes = Math.max(4, Math.ceil(durationSec / 60));
        const coordinates = route.geometry?.coordinates?.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]) || [];

        return {
          roadDistanceKm: Math.max(0.5, roadDistanceKm),
          airDistanceKm: airKm,
          durationMinutes,
          coordinates,
          isLiveOsrm: true,
          methodDescription: 'مسار شوارع وانعطافات واقعي مباشر (OSRM OpenStreetMap)'
        };
      }
    }
  } catch (err) {
    console.warn('Direct OSRM fetch failed, trying backend route:', err);
  }

  // 2. Try Backend API proxy (/api/routes/compute)
  try {
    const res = await fetch('/api/routes/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng }
      }),
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.distanceKm === 'number') {
        return {
          roadDistanceKm: Number(data.distanceKm.toFixed(2)),
          airDistanceKm: airKm,
          durationMinutes: data.durationMinutes || Math.ceil(data.distanceKm * 3),
          coordinates: data.coordinates,
          isLiveOsrm: data.method === 'osrm_openstreetmap' || data.method === 'google_routes_api',
          methodDescription: data.routeSummary || 'مسار شوارع شبكي دقيق'
        };
      }
    }
  } catch (err) {
    console.warn('Backend route compute failed:', err);
  }

  // 3. Fallback calculation if completely offline or rate limited
  const fallbackRoadDistance = Number(Math.max(1.0, airKm * 1.38).toFixed(2));
  return {
    roadDistanceKm: fallbackRoadDistance,
    airDistanceKm: airKm,
    durationMinutes: Math.max(5, Math.ceil(fallbackRoadDistance * 2.8)),
    isLiveOsrm: false,
    methodDescription: 'مسار شبكة شوارع تقديري (في حال عدم توفر اتصال OSRM)'
  };
}

/**
 * Live Road Routing fetcher from the backend API (Google Routes API / Topology Engine)
 */
export async function computeLiveRoadDistance(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  travelMode: 'DRIVE' | 'TWO_WHEELER' = 'DRIVE',
  curvatureFactor: number = 1.38
): Promise<{ distanceKm: number; durationMinutes: number; method: string; routeSummary: string }> {
  try {
    const res = await fetch('/api/routes/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, travelMode, curvatureFactor })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.distanceKm === 'number') {
        return {
          distanceKm: data.distanceKm,
          durationMinutes: data.durationMinutes || 10,
          method: data.method || 'road_network_topology',
          routeSummary: data.routeSummary || `${data.distanceKm} كم`
        };
      }
    }
  } catch (e) {
    console.warn('Live route compute network error, using fallback:', e);
  }

  // Client-side fallback calculation
  const fallbackDistance = typeof origin === 'string' && typeof destination === 'string'
    ? estimateRoadDistanceByAddress(origin, destination, curvatureFactor)
    : 3.5;

  return {
    distanceKm: fallbackDistance,
    durationMinutes: Math.max(5, Math.ceil(fallbackDistance * 3)),
    method: 'road_network_topology',
    routeSummary: `مسار شبكة الطرق: ${fallbackDistance} كم`
  };
}

/**
 * Estimates road distance from textual addresses if coordinates are not explicitly passed.
 */
export function estimateRoadDistanceByAddress(
  pickupText: string = '',
  dropoffText: string = '',
  customCurvature: number = 1.38
): number {
  let pLat = 15.3184; // Hadda Sanaa default
  let pLng = 44.1852;
  let dLat = 15.3547; // Tahrir Sanaa default
  let dLng = 44.2065;

  for (const [key, loc] of Object.entries(YEMEN_LOCALITIES)) {
    if (pickupText.includes(key)) {
      pLat = loc.lat;
      pLng = loc.lng;
    }
    if (dropoffText.includes(key)) {
      dLat = loc.lat;
      dLng = loc.lng;
    }
  }

  if (pickupText.trim() === dropoffText.trim() && pickupText.trim() !== '') {
    return 2.5; // Minimum local trip
  }

  const res = calculateRoadDistance(pLat, pLng, dLat, dLng, customCurvature);
  return res.roadDistanceKm;
}

/**
 * Utility to round an amount UP to the nearest multiple of 50 YER.
 * Formula: Math.ceil(amount / 50) * 50
 * Prevents awkward non-standard amounts like 590 YER -> 600 YER, 510 YER -> 550 YER.
 */
export function roundToNearest50(amount: number): number {
  if (!amount || isNaN(amount) || amount <= 0) return 0;
  return Math.ceil(amount / 50) * 50;
}

/**
 * Complete Delivery Fee Calculation Engine adhering to the requested business formula:
 * 1. Calculated_Fee = Distance_KM * Rate_Per_KM
 * 2. Rounded_Fee = Math.ceil(Calculated_Fee / 50) * 50
 * 3. Final_Delivery_Fee = Math.max(Rounded_Fee, Minimum_Vehicle_Fee) (+ baseFixedFee if international)
 */
export function calculateDeliveryCost({
  roadDistanceKm,
  vehicle,
  serviceType = 'regular',
  pricingSettings = DEFAULT_PRICING_SETTINGS
}: {
  roadDistanceKm: number;
  vehicle: VehicleType;
  serviceType?: 'regular' | 'store' | 'manfaah' | 'fazaa' | 'international' | 'supermarket' | string;
  pricingSettings?: PricingSettings;
}): DeliveryCalculationResult {
  const safeDistance = Math.max(0.5, Number(roadDistanceKm) || 1.0);
  const multiConfig = pricingSettings.multiServiceConfig || getLocalMultiServicePricing();
  
  const isMotorcycle = vehicle.icon === 'Bike' || vehicle.name.includes('دراجة') || vehicle.id === 'veh-motorcycle';
  const isCar = vehicle.icon === 'Car' || vehicle.name.includes('سيارة') || vehicle.name.includes('باص') || vehicle.id === 'veh-car';
  const isTruck = vehicle.icon === 'Truck' || vehicle.name.includes('شاحنة') || vehicle.name.includes('دينا') || vehicle.id === 'veh-truck';

  let pricePerKm = vehicle.pricePerKm || 100;
  let appliedMinFee = Math.max(500, vehicle.minDeliveryFee || 500);
  let baseFixedFee = 0;

  if (serviceType === 'manfaah' || serviceType === 'fazaa') {
    // Manfaah / Fazaa Pricing tab
    if (isMotorcycle) pricePerKm = multiConfig.manfaahFazaa.motorcyclePricePerKm;
    else if (isCar) pricePerKm = multiConfig.manfaahFazaa.carPricePerKm;
    else if (isTruck) pricePerKm = multiConfig.manfaahFazaa.truckPricePerKm;
    else pricePerKm = vehicle.pricePerKm || 150;

    const minSetting = Math.max(700, multiConfig.manfaahFazaa.minFee || 700);
    appliedMinFee = Math.max(minSetting, vehicle.minDeliveryFee || 700);
  } else if (serviceType === 'international') {
    // International Shipping Tab
    baseFixedFee = multiConfig.internationalShipping.fixedBaseFreightFee || 5000;
    if (isMotorcycle) pricePerKm = multiConfig.internationalShipping.motorcycleLastMilePerKm;
    else if (isCar) pricePerKm = multiConfig.internationalShipping.carLastMilePerKm;
    else if (isTruck) pricePerKm = multiConfig.internationalShipping.truckLastMilePerKm;
    else pricePerKm = vehicle.pricePerKm || 100;

    const minSetting = Math.max(1000, multiConfig.internationalShipping.minDeliveryFee || 1000);
    appliedMinFee = Math.max(minSetting, vehicle.minDeliveryFee || 1000);
  } else {
    // Regular Store Orders Tab
    if (isMotorcycle) pricePerKm = multiConfig.storeOrders.motorcyclePricePerKm;
    else if (isCar) pricePerKm = multiConfig.storeOrders.carPricePerKm;
    else if (isTruck) pricePerKm = multiConfig.storeOrders.truckPricePerKm;
    else pricePerKm = vehicle.pricePerKm || 100;

    const minSetting = Math.max(500, multiConfig.storeOrders.minFee || 500);
    appliedMinFee = Math.max(minSetting, vehicle.minDeliveryFee || 500);
  }

  // 1. Calculated_Fee = Distance_KM * Rate_Per_KM
  const calculatedFee = safeDistance * pricePerKm;
  
  // 2. Rounded_Fee = Math.ceil(Calculated_Fee / 50) * 50
  const roundedFee = Math.ceil(calculatedFee / 50) * 50;

  // 3. Final_Delivery_Fee = Math.max(Rounded_Fee, Minimum_Vehicle_Fee) (+ baseFixedFee if international)
  const isMinApplied = (roundedFee < appliedMinFee);
  const effectiveDistanceCost = Math.max(roundedFee, appliedMinFee);
  const finalDeliveryFee = baseFixedFee + effectiveDistanceCost;

  let breakdown = '';
  const currencySymbol = multiConfig.internationalShipping.freightCurrency === 'SAR' ? 'ر.س' : multiConfig.internationalShipping.freightCurrency === 'USD' ? '$' : 'ر.ي';

  if (serviceType === 'international') {
    breakdown = `شحن دولي ثابت (${baseFixedFee.toLocaleString()} ${currencySymbol}) + ميل أخير (${safeDistance} كم × ${pricePerKm} ر.ي = ${calculatedFee.toFixed(0)} ر.ي ➔ تقريب ${roundedFee.toLocaleString()} ر.ي ${isMinApplied ? `[اعتُمد الحد الأدنى: ${appliedMinFee.toLocaleString()} ر.ي]` : ''}) = ${finalDeliveryFee.toLocaleString()} ر.ي`;
  } else if (isMinApplied) {
    breakdown = `${safeDistance} كم مسافة طرقية × ${pricePerKm} ر.ي/كم = ${calculatedFee.toFixed(0)} ر.ي (مقرب: ${roundedFee.toLocaleString()} ر.ي) ➔ تم اعتماد الحد الأدنى المقرر: ${appliedMinFee.toLocaleString()} ر.ي`;
  } else {
    const isRoundedUp = roundedFee !== Math.round(calculatedFee);
    breakdown = `${safeDistance} كم مسافة طرقية × ${pricePerKm} ر.ي/كم = ${calculatedFee.toFixed(0)} ر.ي ${isRoundedUp ? `➔ تقريب تلقائي للأعلى (مضاعف 50 ر.ي): ${finalDeliveryFee.toLocaleString()} ر.ي` : `= ${finalDeliveryFee.toLocaleString()} ر.ي`}`;
  }

  return {
    actualRoadDistanceKm: safeDistance,
    straightLineDistanceKm: Number((safeDistance / (multiConfig.roadCurvatureFactor || 1.38)).toFixed(1)),
    curvatureFactor: multiConfig.roadCurvatureFactor || 1.38,
    vehicleType: vehicle,
    pricePerKm,
    distanceCost: roundedFee,
    rawCost: calculatedFee + baseFixedFee,
    minApplied: isMinApplied,
    appliedMinFee,
    finalDeliveryFee,
    serviceType: serviceType as any,
    calculationBreakdown: breakdown,
    routeSummary: `مسار شبكة الطرق الفعلية: ${safeDistance} كم عبر ${vehicle.name}`
  };
}

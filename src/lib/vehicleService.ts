/**
 * Vehicle Types, Weight Limits & Base Pricing Management Service
 * Manages vehicle fleet definitions (Motorcycle, Car, Truck), weight capacities, and pricing rules.
 */

import { 
  VehicleType, 
  PricingSettings, 
  Order, 
  OrderItem, 
  MultiServicePricingConfig, 
  ServiceVehiclePricing, 
  InternationalShippingPricing 
} from '../types';

export const INITIAL_MULTI_SERVICE_CONFIG: MultiServicePricingConfig = {
  storeOrders: {
    motorcyclePricePerKm: 100,
    carPricePerKm: 200,
    truckPricePerKm: 400,
    minFee: 500
  },
  manfaahFazaa: {
    motorcyclePricePerKm: 150,
    carPricePerKm: 250,
    truckPricePerKm: 500,
    minFee: 700
  },
  internationalShipping: {
    fixedBaseFreightFee: 5000,
    freightCurrency: 'YER',
    motorcycleLastMilePerKm: 100,
    carLastMilePerKm: 200,
    truckLastMilePerKm: 400,
    minDeliveryFee: 1000
  },
  roadCurvatureFactor: 1.38,
  enableLiveRoadRouting: true
};

export const INITIAL_VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'veh-motorcycle',
    name: 'دراجة نارية (موتوسيكل)',
    nameEn: 'Motorcycle',
    icon: 'Bike',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80',
    pricePerKm: 100, // 100 YER per KM
    minDeliveryFee: 500, // Minimum 500 YER for regular orders
    maxWeightKg: 15, // Up to 15 kg
    maxVolumeDescription: 'طلبات وجبات سريعة، صيدليات، طرود صغيرة خفيفة (حتى 15 كجم)',
    description: 'أسرع وسيلة لتوصيل الوجبات الفردية والأدوية وتفادي الاختناقات المرورية.',
    isDefault: true,
    isActive: true,
    order: 1
  },
  {
    id: 'veh-car',
    name: 'سيارة / باص (سيدان أو عائلية)',
    nameEn: 'Car / Van',
    icon: 'Car',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
    pricePerKm: 200, // 200 YER per KM
    minDeliveryFee: 800, // Minimum 800 YER (>= 500 YER)
    maxWeightKg: 100, // From 15 kg up to 100 kg
    maxVolumeDescription: 'مشتريات سوبرماركت، كراتين تموين، طرود متوسطة (15 - 100 كجم)',
    description: 'مثالية لطلبات السوبر ماركت، المشتريات المتعددة، والطرود الحساسة لعوامل الطقس.',
    isDefault: false,
    isActive: true,
    order: 2
  },
  {
    id: 'veh-truck',
    name: 'شاحنة نقل / دينا (بيك آب)',
    nameEn: 'Truck / Dyna',
    icon: 'Truck',
    imageUrl: 'https://images.unsplash.com/photo-1586191582152-47525381f2eb?w=300&auto=format&fit=crop&q=80',
    pricePerKm: 400, // 400 YER per KM
    minDeliveryFee: 1500, // Minimum 1500 YER (>= 500 YER)
    maxWeightKg: 2500, // Above 100 kg (up to 2500 kg)
    maxVolumeDescription: 'بضائع ثقيلة، كراتين جملة، أثاث وأجهزة إلكترونية (أكثر من 100 كجم)',
    description: 'مخصصة للحمولات الثقيلة، طلبات التموين والأسواق المركزية، وخدمة منفعة لنقل الأغراض الضخمة.',
    isDefault: false,
    isActive: true,
    order: 3
  }
];

export const INITIAL_PRICING_SETTINGS: PricingSettings = {
  generalMinDeliveryFee: 500, // Regular trips cannot be less than 500 YER
  manfaahMinDeliveryFee: 700, // Manfaah/Fazaa trips cannot be less than 700 YER
  roadCurvatureFactor: 1.38,  // Real-world road distance multiplier
  enableLiveRoadRouting: true,
  multiServiceConfig: INITIAL_MULTI_SERVICE_CONFIG
};

const STORAGE_KEY_VEHICLES = 'jahez_vehicle_types_v2';
const STORAGE_KEY_PRICING = 'jahez_pricing_settings_v2';
const STORAGE_KEY_MULTI_SERVICE = 'jahez_multi_service_pricing_v3';

export function getLocalMultiServicePricing(): MultiServicePricingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MULTI_SERVICE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.storeOrders && parsed.manfaahFazaa && parsed.internationalShipping) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading multi service pricing:', e);
  }
  return INITIAL_MULTI_SERVICE_CONFIG;
}

export function saveLocalMultiServicePricing(config: MultiServicePricingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_MULTI_SERVICE, JSON.stringify(config));
    
    // Also sync with basic vehicle list and general pricing settings for seamless compatibility
    const currentVehicles = getLocalVehicles();
    const updatedVehicles = currentVehicles.map(v => {
      if (v.id === 'veh-motorcycle') {
        return { ...v, pricePerKm: config.storeOrders.motorcyclePricePerKm, minDeliveryFee: config.storeOrders.minFee };
      }
      if (v.id === 'veh-car') {
        return { ...v, pricePerKm: config.storeOrders.carPricePerKm, minDeliveryFee: Math.max(config.storeOrders.minFee, 800) };
      }
      if (v.id === 'veh-truck') {
        return { ...v, pricePerKm: config.storeOrders.truckPricePerKm, minDeliveryFee: Math.max(config.storeOrders.minFee, 1500) };
      }
      return v;
    });
    saveLocalVehicles(updatedVehicles);
    
    saveLocalPricingSettings({
      generalMinDeliveryFee: config.storeOrders.minFee,
      manfaahMinDeliveryFee: config.manfaahFazaa.minFee,
      roadCurvatureFactor: config.roadCurvatureFactor,
      enableLiveRoadRouting: config.enableLiveRoadRouting,
      multiServiceConfig: config
    });
  } catch (e) {
    console.error('Error saving multi service pricing:', e);
  }
}

export function getLocalVehicles(): VehicleType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading local vehicles:', e);
  }
  return INITIAL_VEHICLE_TYPES;
}

export function saveLocalVehicles(vehicles: VehicleType[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Error saving local vehicles:', e);
  }
}

export function getLocalPricingSettings(): PricingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICING);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.generalMinDeliveryFee === 'number') return parsed;
    }
  } catch (e) {
    console.error('Error loading pricing settings:', e);
  }
  return INITIAL_PRICING_SETTINGS;
}

export function saveLocalPricingSettings(settings: PricingSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRICING, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving pricing settings:', e);
  }
}

/**
 * Finds vehicle type by ID or fallback to default motorcycle
 */
export function findVehicleType(vehicleId?: string, vehiclesList: VehicleType[] = INITIAL_VEHICLE_TYPES): VehicleType {
  if (!vehicleId) return vehiclesList[0] || INITIAL_VEHICLE_TYPES[0];
  const found = vehiclesList.find(v => v.id === vehicleId);
  return found || vehiclesList[0] || INITIAL_VEHICLE_TYPES[0];
}

/**
 * Parses weight text inside product name (e.g. "كيس أرز 10 كجم", "كرتون ماء 12 لتر")
 */
function parseWeightFromText(text: string): number | null {
  if (!text) return null;
  // Match patterns like "10 كجم", "10كجم", "5 كغ", "2.5 kg", "12 لتر"
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:كجم|كغ|كيلو|ك|kg|ltr|لتر)/i);
  if (kgMatch && kgMatch[1]) {
    const val = parseFloat(kgMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }
  return null;
}

/**
 * Calculates estimated total weight in KG for an order based on items, categories, and titles.
 */
export function calculateOrderEstimatedWeight(order: {
  items?: OrderItem[];
  itemsCount?: number;
  storeName?: string;
  categoryName?: string;
  estimatedWeightKg?: number;
  packageWeightKg?: number;
}): number {
  // 1. If explicit package or order weight is provided
  if (typeof order.packageWeightKg === 'number' && order.packageWeightKg > 0) {
    return order.packageWeightKg;
  }
  if (typeof order.estimatedWeightKg === 'number' && order.estimatedWeightKg > 0) {
    return order.estimatedWeightKg;
  }

  const items = order.items || [];
  const storeName = order.storeName || '';
  const categoryName = order.categoryName || '';
  const isSupermarket = storeName.includes('سوبر') || storeName.includes('هايبر') || 
                        storeName.includes('بقالة') || storeName.includes('تموين') || 
                        categoryName.includes('سوبر') || categoryName.includes('بقالة');
  const isWholesale = storeName.includes('جملة') || categoryName.includes('جملة');
  const isElectronics = storeName.includes('إلكترون') || storeName.includes('أجهزة') || categoryName.includes('إلكترون');

  let totalWeight = 0;

  if (items.length > 0) {
    items.forEach(item => {
      const qty = item.quantity || 1;
      if (item.weightKg && item.weightKg > 0) {
        totalWeight += item.weightKg * qty;
      } else {
        const parsedWeight = parseWeightFromText(item.productName);
        if (parsedWeight) {
          totalWeight += parsedWeight * qty;
        } else if (isWholesale) {
          totalWeight += 12 * qty; // 12 kg per wholesale item/carton
        } else if (isSupermarket) {
          totalWeight += 2.5 * qty; // 2.5 kg avg grocery line item
        } else if (isElectronics) {
          totalWeight += 4.0 * qty;
        } else {
          totalWeight += 0.45 * qty; // 0.45 kg restaurant meal or light item
        }
      }
    });
  } else {
    // Fallback based on itemsCount
    const count = order.itemsCount || 1;
    if (isWholesale) {
      totalWeight = count * 15;
    } else if (isSupermarket) {
      totalWeight = count * 2.5;
    } else if (isElectronics) {
      totalWeight = count * 4.0;
    } else {
      totalWeight = count * 0.45;
    }
  }

  // Return clean rounded weight (minimum 0.5 kg)
  return Math.max(0.5, Math.round(totalWeight * 10) / 10);
}

/**
 * Suggests the best vehicle type based on weight limits according to business rules:
 * - Motorcycle: up to 15 kg
 * - Car / Van: up to 100 kg
 * - Truck / Dyna: above 100 kg
 */
export function suggestVehicleByWeight(
  weightKg: number,
  vehiclesList: VehicleType[] = INITIAL_VEHICLE_TYPES
): VehicleType {
  const activeVehicles = vehiclesList
    .filter(v => v.isActive)
    .sort((a, b) => a.maxWeightKg - b.maxWeightKg);

  if (activeVehicles.length === 0) return INITIAL_VEHICLE_TYPES[0];

  // Find the smallest vehicle that can hold this weight
  const matchingVehicle = activeVehicles.find(v => v.maxWeightKg >= weightKg);
  
  // If weight exceeds all vehicles, return the highest capacity vehicle (Truck)
  if (!matchingVehicle) {
    return activeVehicles[activeVehicles.length - 1];
  }

  return matchingVehicle;
}

/**
 * Returns human-readable upgrade justification if order exceeds vehicle threshold.
 */
export function getVehicleRecommendationInfo(
  weightKg: number,
  selectedVehicle: VehicleType,
  vehiclesList: VehicleType[] = INITIAL_VEHICLE_TYPES
): { isUpgraded: boolean; message: string; suggestedVehicle: VehicleType } {
  const suggestedVehicle = suggestVehicleByWeight(weightKg, vehiclesList);
  const motorcycle = vehiclesList.find(v => v.icon === 'Bike' || v.name.includes('دراجة')) || INITIAL_VEHICLE_TYPES[0];
  const car = vehiclesList.find(v => v.icon === 'Car' || v.name.includes('سيارة')) || INITIAL_VEHICLE_TYPES[1];

  if (weightKg > (car.maxWeightKg || 100)) {
    return {
      isUpgraded: true,
      message: `وزن الطلب (${weightKg} كجم) يتجاوز سعة السيارة (100 كجم)؛ تم توجيه الطلب تلقائياً لشاحنة نقل دينا 🚚`,
      suggestedVehicle
    };
  }

  if (weightKg > (motorcycle.maxWeightKg || 15)) {
    return {
      isUpgraded: true,
      message: `وزن الطلب (${weightKg} كجم) يتجاوز سعة الدراجة النارية (15 كجم)؛ تم ترقية وسيلة النقل تلقائياً لسيارة/باص 🚗`,
      suggestedVehicle
    };
  }

  return {
    isUpgraded: false,
    message: `الوزن المقدر (${weightKg} كجم) مناسب للدراجة النارية 🏍️`,
    suggestedVehicle
  };
}

/**
 * Backward-compatible helper for legacy calls
 */
export function suggestVehicleForOrder(itemsCount: number = 1, categoryName: string = '', storeName: string = ''): string {
  const estimatedWeight = calculateOrderEstimatedWeight({ itemsCount, categoryName, storeName });
  const suggested = suggestVehicleByWeight(estimatedWeight);
  return suggested.id;
}

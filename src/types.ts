export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  label?: string;
  serviceName?: string;
  subtitle?: string; // e.g. "أشهى الأطباق من مطاعمك المفضلة"
  icon?: string;
  imageUrl?: string; // Category representative image URL
  category_image_url?: string; // alias for API / user specification
  categoryImageUrl?: string; // camelCase alias
  bannerUrl?: string; // Top Slider Banner Image URL
  banner_image_url?: string; // alias for API / user specification
  bannerImageUrl?: string; // camelCase alias
  coverUrl?: string; // fallback
  ctaText?: string; // e.g. "اطلب الآن" or "اطلب منفعة الآن"
  order: number;
  status: 'active' | 'inactive';
  isActive?: boolean;
  description?: string;
  productCount?: number;
  storeCount?: number;
  serviceType?: 'delivery' | 'field_service' | 'restaurant' | 'clothing' | 'supermarket' | 'global' | 'default';
  serviceTypeCategory?: 'delivery' | 'field_service'; // نوع الخدمة: توصيل / خدمة ميدانية
  
  // ER Diagram Unified Store Category Fields (جدول فئة_المتجر)
  unitType?: string; // نوع_الوحدة (e.g. 'standard', 'global_catalog', 'external_shopping')
  additionalAttributes?: Record<string, any>; // خصائص_إضافية (JSON)
  extraProperties?: Record<string, any>; // alias for خصائص_إضافية
  نوع_الوحدة?: string;
  خصائص_إضافية?: Record<string, any>;
  
  createdAt?: any;
  updatedAt?: any;
}

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  is24Hours?: boolean;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  categoryId: string;
  categoryName: string;
  activityType?: string; // نوع النشاط الحر (مطعم، صيدلية، إلكترونيات...)
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  mapLink?: string; // رابط خرائط جوجل الصريح أو المختصر
  logoUrl?: string;
  logoFileName?: string;
  coverUrl?: string;
  workingHours: string;
  weeklySchedule?: DaySchedule[];
  serviceType: 'delivery' | 'pickup' | 'both' | 'global';
  deliveryFeeType: 'fixed' | 'distance';
  fixedDeliveryFee?: number;
  allowReturns?: boolean; // هل المتجر يسمح بإرجاع الطلبات (مرتجع)
  status: 'open' | 'closed' | 'maintenance';
  isGlobalStore?: boolean; // هل المتجر متجر عالمي (Amazon, SHEIN, AliExpress)
  storeType?: 'local' | 'global'; // تصنيف المتجر (محلي أو دولي)
  platform?: 'amazon' | 'shein' | 'aliexpress' | string; // منصة المتجر العالمي
  globalSlug?: string;
  rating?: number;
  deliveryDays?: string; // مدة الشحن والتوصيل الدولي المقدرة
  trustedBadge?: string; // شارة التوثيق والضمان
  sections?: string[];
  createdAt?: any;
}

export interface ProductPriceOption {
  name: string;
  price: number;
  hasDiscount?: boolean;
  discountPrice?: number;
}

export interface ClothingSizeOption {
  size: string;
  price: number;
  hasDiscount?: boolean;
  discountPrice?: number;
}

export interface SupermarketWeightOption {
  unit: string;
  price: number;
  hasDiscount?: boolean;
  discountPrice?: number;
}

export interface ProductExtraOption {
  title: string;
  required: boolean;
  items: { name: string; extraPrice: number }[];
}

// Universal Product Variant System Types
export type PricingStrategyMode = 'flat' | 'single_attribute' | 'matrix';

export type ProductAttributeType = 
  | 'size'        // المقاسات
  | 'color'       // الألوان
  | 'flavor'      // النكهات
  | 'weight'      // الأوزان والعبوات
  | 'storage'     // سعة الذاكرة / الحجم
  | 'material'    // نوع الخامة / القماش
  | 'custom';     // خاصية مخصصة

export interface ProductAttribute {
  id: string;
  name: string;           // e.g. "المقاس" or "اللون" or "النكهة" or "العبوة"
  type: ProductAttributeType;
  values: string[];       // e.g. ["S", "M", "L", "XL"] or ["أسود", "أبيض"]
}

// Single Attribute Pricing Delta (for mode 'single_attribute')
export interface SingleAttributePriceItem {
  value: string;          // e.g. "حجم كبير" or "1 كجم"
  price: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  sku?: string;
  stock?: number;
  inStock?: boolean;
}

// Full Combination Matrix Variant (for mode 'matrix')
export interface ProductVariantCombination {
  id: string;
  title: string;          // e.g. "M / أسود" or "128GB / فضي"
  options: Record<string, string>; // e.g. { "المقاس": "M", "اللون": "أسود" }
  price: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  sku?: string;
  stock?: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  categoryId: string;
  categoryName?: string;
  storeId?: string;
  storeName?: string;
  sectionName?: string;
  imageUrl?: string;
  galleryImages?: string[];
  inStock: boolean;
  status: 'active' | 'inactive';
  sku?: string;
  stockQuantity?: number;
  
  // Universal Product Variant System
  pricingStrategy?: PricingStrategyMode;
  productAttributes?: ProductAttribute[];
  pricingDriverAttributeId?: string;
  singleAttributePrices?: SingleAttributePriceItem[];
  variantCombinations?: ProductVariantCombination[];
  
  prices?: ProductPriceOption[];
  options?: ProductExtraOption[];
  discountPercent?: number;
  // Category-specific attributes
  attributes?: Record<string, any>;
  // Food & Restaurant fields
  mealOptions?: string[];
  // Clothing fields
  colors?: string[];
  clothingSizes?: string[];
  clothingPriceType?: 'unified' | 'custom';
  clothingSizePrices?: ClothingSizeOption[];
  material?: string;
  // Supermarket fields
  supermarketWeights?: SupermarketWeightOption[];
  // Electronics & General fields
  techSpecs?: string;
  storageOptions?: string[];
  warranty?: string;
  generalFeatures?: string[];
  rating?: number;
  salesCount?: number;
  createdAt?: any;
}

export type RoleType = 
  | 'developer'
  | 'super_admin'
  | 'vice_admin'
  | 'finance_manager'
  | 'accountant'
  | 'customer_service'
  | 'cs_restaurants'
  | 'stores_manager'
  | 'auditor'
  | 'cashier'
  | 'customer_data'
  | 'content_writer'
  | 'content_office'
  | 'custom';

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: RoleType;
  storeId?: string;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  permissions?: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
  createdAt?: any;
  updatedAt?: any;
  lastLogin?: string;
}

export interface QualityReview {
  id: string;
  storeName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'published' | 'pending' | 'flagged';
  createdAt?: string;
}

export type OrderStatus = 
  | 'PENDING_REVIEW'
  | 'pending_review'
  | 'PENDING'
  | 'pending'
  | 'CONFIRMED'
  | 'confirmed'
  | 'APPROVED'
  | 'approved'
  | 'NEW'
  | 'PREPARING'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'new'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface VehicleType {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  imageUrl?: string;
  pricePerKm: number;
  minDeliveryFee: number;
  maxWeightKg: number;
  maxVolumeDescription?: string;
  description: string;
  isDefault?: boolean;
  isActive: boolean;
  order: number;
}

export interface ServiceVehiclePricing {
  motorcyclePricePerKm: number;
  carPricePerKm: number;
  truckPricePerKm: number;
  minFee: number;
}

export type InternationalFreightCurrency = 'YER' | 'SAR' | 'USD';

export interface InternationalShippingPricing {
  fixedBaseFreightFee: number; // رسوم الشحن والنقل الدولي الثابتة/الموحدة
  freightCurrency?: InternationalFreightCurrency; // العملة المحددة لرسوم الشحن الدولي (YER / SAR / USD)
  motorcycleLastMilePerKm: number;
  carLastMilePerKm: number;
  truckLastMilePerKm: number;
  minDeliveryFee: number;
}

export interface MultiServicePricingConfig {
  storeOrders: ServiceVehiclePricing;
  manfaahFazaa: ServiceVehiclePricing;
  internationalShipping: InternationalShippingPricing;
  roadCurvatureFactor: number;
  enableLiveRoadRouting: boolean;
  updatedAt?: any;
}

export interface PricingSettings {
  generalMinDeliveryFee: number; // minimum 500 YER for regular trips
  manfaahMinDeliveryFee: number; // minimum 700 YER for Manfaah/Fazaa trips
  roadCurvatureFactor: number; // realistic road routing multiplier
  enableLiveRoadRouting: boolean;
  multiServiceConfig?: MultiServicePricingConfig;
  updatedAt?: any;
}

export interface OrderItem {
  id?: string;
  productName: string;
  name?: string;
  productId?: string;
  price: number;
  quantity: number;
  totalPrice?: number;
  weightKg?: number;
  options?: string[];
  notes?: string;
  storeName?: string;
  storeId?: string;
  productUrl?: string;
  sourceUrl?: string;
  url?: string;
  imageUrl?: string;
  image?: string;
  size?: string;
  color?: string;

  // ER Diagram Unified Order Items Snapshots (جدول عنصر_الطلب)
  product_snapshot?: {
    id?: string;
    name?: string;
    productName?: string;
    price?: number;
    imageUrl?: string;
    productUrl?: string;
    sourceUrl?: string;
    storeName?: string;
    storeId?: string;
    brand?: string;
    [key: string]: any;
  };
  specs_snapshot?: {
    size?: string;
    color?: string;
    weightKg?: number;
    sku?: string;
    [key: string]: any;
  };
  addons_snapshot?: {
    options?: string[];
    addons?: any[];
    notes?: string;
    [key: string]: any;
  };

  // Arabic aliases matching ER Diagram
  لقطة_المنتج?: any;
  لقطة_المواصفات?: any;
  لقطة_الإضافات?: any;
}

export interface Order {
  id: string;
  orderId?: string;
  orderNumber?: string;
  orderType?: string;
  orderScope?: string;
  categoryId?: string; // معرف_الفئة من جدول فئة_المتجر
  categoryName?: string;
  storeCategory?: string;
  isGlobalStore?: boolean;
  clientId?: string; // معرف_العميل
  customerId?: string;
  معرف_العميل?: string;
  معرف_المتجر?: string;
  معرف_الفئة?: string;
  رسوم_التوصيل?: number;
  الحالة?: string;
  عناصر_الطلب?: OrderItem[];
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  invoiceNumber?: string | null;
  invoiceImageUrl?: string | null;
  invoiceUploadTime?: string | null;
  invoiceDriverId?: string | null;
  invoiceDriverName?: string | null;
  receivedByDriverAt?: string | null;
  customerName: string;
  customerPhone?: string;
  storeId?: string;
  storeName?: string;
  total: number;
  totalPrice?: number;
  itemsTotal?: number;
  subtotal?: number;
  deliveryFee?: number;
  calculatedDistanceKm?: number;
  actualRoadDistanceKm?: number;
  airDistanceKm?: number;
  estimatedWeightKg?: number;
  approvedWeightKg?: number;
  vehicleTypeId?: string;
  vehicleTypeName?: string;
  suggestedVehicleId?: string;
  suggestedVehicleName?: string;
  needsAdminReview?: boolean;
  reviewedByAdmin?: boolean;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  adminReviewNotes?: string;
  confirmedByAdminAt?: string;
  confirmedByAdminName?: string;
  routingMethod?: 'google_routes_api' | 'road_network_topology';
  status: OrderStatus;
  serviceType?: 'regular' | 'manfaah' | 'fazaa' | 'global_store' | string;
  itemsCount: number;
  items?: OrderItem[];
  deliveryType?: 'delivery' | 'pickup';
  paymentMethod?: 'cash' | 'card' | 'wallet' | 'jawali' | string;
  paymentStatus?: 'paid' | 'pending';
  address?: string;
  location?: string | { latitude?: number; longitude?: number; address?: string };
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  userEmail?: string;
  userRole?: string;
  targetType: 'store' | 'product' | 'category' | 'order' | 'user' | 'system' | 'setting';
  targetName?: string;
  details?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt?: any;
}

export interface SupportChatMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  text: string;
  createdAt: string;
  isManagerReply?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  requesterName: string;
  requesterEmail: string;
  targetAdminEmail: string;
  category: 'modification' | 'bug' | 'feature' | 'general';
  status: 'new' | 'in_progress' | 'completed' | 'closed';
  priority: 'normal' | 'high' | 'urgent';
  messages: SupportChatMessage[];
  createdAt?: any;
  updatedAt?: any;
}

export interface FazaaOrder {
  id: string;
  orderNumber: string;
  orderScope: 'local' | 'international';
  pickupAddress: string;
  deliveryAddress: string;
  orderType: string;
  categoryId?: string;
  packageWeightKg?: number;
  packageSpecs?: string;
  calculatedDistanceKm?: number;
  actualRoadDistanceKm?: number;
  vehicleTypeId?: string;
  vehicleTypeName?: string;
  paymentMethod?: 'cash' | 'card' | 'wallet';
  paymentStatus?: 'paid' | 'pending';
  calculatedDeliveryFee?: number;
  driverRouteInfo?: string;
  isInstant: boolean;
  scheduledDatetime?: string;
  notes?: string;
  attachmentUrl?: string;
  invoiceImageUrl?: string | null;
  invoiceUploadTime?: string | null;
  invoiceDriverId?: string | null;
  invoiceDriverName?: string | null;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  status: 'new' | 'assigned' | 'delivering' | 'completed' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}

export interface InvoiceReceipt {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType?: 'regular' | 'fazaa' | 'manfaa';
  driverId: string;
  driverName: string;
  driverPhone?: string;
  customerName?: string;
  storeName?: string;
  imageUrl: string;
  uploadedAt: string;
  amount?: number;
  notes?: string;
  createdAt?: any;
}

export interface FazaaCategory {
  id: string;
  name: string;
  riskLevel?: 'normal' | 'fragile' | 'special_handle';
  weightLimit?: string;
  driverInstructions?: string;
  isActive: boolean;
  createdAt?: any;
}

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  avatarUrl?: string;
  status?: 'active' | 'blocked';
  role?: 'client';
  createdAt?: any;
  updatedAt?: any;
}

export interface ActiveDeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  storeName?: string;
  pickupAddress: string;
  dropoffAddress: string;
  deliveryAddress?: string;
  destLat?: number;
  destLng?: number;
  pickupLat?: number;
  pickupLng?: number;
  fee?: number; // رسوم التوصيل
  totalAmount?: number; // إجمالي مبلغ الطلب المستحق
  itemsTotal?: number; // إجمالي المنتجات
  status: 'delivering' | 'assigned' | 'arrived' | 'new' | 'completed' | 'cancelled';
  estimatedMinutes?: number;
  distanceKm?: number;
  actualRoadDistanceKm?: number;
  invoiceImageUrl?: string | null;
  invoiceUploadTime?: string | null;
  invoiceDriverName?: string | null;
}

export interface DriverUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  plateNumber?: string;
  isOnline?: boolean;
  status?: 'active' | 'pending' | 'suspended';
  role?: 'driver';
  lat?: number;
  lng?: number;
  locationName?: string;
  speed?: number;
  assignedOrdersCount?: number;
  activeOrder?: ActiveDeliveryOrder;
  lastActive?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ManfaaOrder extends FazaaOrder {}

export type GlobalStoreId = 'shein' | 'amazon' | 'aliexpress';
export type GlobalStoreCategory = 'clothing' | 'electronics' | 'beauty' | 'shoes_bags';

export interface GlobalStore {
  id: GlobalStoreId;
  name: string;
  nameEn: string;
  slug: string;
  logo: string;
  banner: string;
  themeColor: string;
  badgeColor: string;
  description: string;
  deliveryDays: string;
  rating: number;
  trustedBadge: string;
  defaultCategory: GlobalStoreCategory;
  availableCategories: GlobalStoreCategory[];
}

export interface GlobalProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface GlobalProductSpec {
  label: string;
  value: string;
}

export interface GlobalProduct {
  id: string;
  storeId: GlobalStoreId;
  storeName: string;
  title: string;
  titleEn?: string;
  description: string;
  originalPriceUsd: number;
  currency: string;
  displayedPrice: number; // Calculated local price in YER using formula
  rating: number;
  reviewsCount: number;
  salesCount?: number;
  category: GlobalStoreCategory;
  badge?: string;
  imageUrl: string;
  galleryImages: string[];
  sizes: string[];
  colors: GlobalProductColor[];
  specs: GlobalProductSpec[];
  inStock: boolean;
  sourceUrl: string;
}

export interface GlobalCartItem {
  productId: string;
  productTitle: string;
  storeId: GlobalStoreId;
  storeName: string;
  imageUrl: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  displayedPrice: number;
  totalPrice: number;
  sourceUrl: string;
}

export interface GlobalStoreConfig {
  currencyRate: number; // Exchange rate (e.g. 535 YER per 1 USD)
  shippingProfit: number; // Base freight & service profit in YER
  roundTo: number; // 50
}

export type TabType = 
  | 'dashboard' 
  | 'global_stores'
  | 'app_preview'
  | 'categories' 
  | 'products' 
  | 'modifiers' 
  | 'restaurants' 
  | 'offers' 
  | 'delivery' 
  | 'fazaa'
  | 'customers'
  | 'notifications' 
  | 'discounts' 
  | 'orders' 
  | 'invoices'
  | 'reports' 
  | 'financial' 
  | 'admin' 
  | 'payment' 
  | 'quality' 
  | 'audit'
  | 'settings';



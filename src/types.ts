export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  coverUrl?: string;
  order: number;
  status: 'active' | 'inactive';
  description?: string;
  productCount?: number;
  storeCount?: number;
  createdAt?: any;
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
  logoUrl?: string;
  coverUrl?: string;
  workingHours: string;
  serviceType: 'delivery' | 'pickup' | 'both';
  deliveryFeeType: 'fixed' | 'distance';
  fixedDeliveryFee?: number;
  allowReturns?: boolean; // هل المتجر يسمح بإرجاع الطلبات (مرتجع)
  status: 'open' | 'closed' | 'maintenance';
  sections?: string[];
  createdAt?: any;
}

export interface ProductPriceOption {
  name: string;
  price: number;
}

export interface ProductExtraOption {
  title: string;
  required: boolean;
  items: { name: string; extraPrice: number }[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  categoryName?: string;
  storeId?: string;
  storeName?: string;
  sectionName?: string;
  imageUrl?: string;
  inStock: boolean;
  status: 'active' | 'inactive';
  sku?: string;
  prices?: ProductPriceOption[];
  options?: ProductExtraOption[];
  discountPercent?: number;
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

export interface OrderItem {
  id?: string;
  productName: string;
  price: number;
  quantity: number;
  options?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  orderId?: string;
  orderNumber?: string;
  clientId?: string;
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
  deliveryFee?: number;
  status: OrderStatus;
  itemsCount: number;
  items?: OrderItem[];
  deliveryType?: 'delivery' | 'pickup';
  paymentMethod?: 'cash' | 'card' | 'wallet';
  paymentStatus?: 'paid' | 'pending';
  address?: string;
  location?: string | { latitude?: number; longitude?: number; address?: string };
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
  fee?: number;
  status: 'delivering' | 'assigned' | 'arrived' | 'new' | 'completed' | 'cancelled';
  estimatedMinutes?: number;
  distanceKm?: number;
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

export type TabType = 
  | 'dashboard' 
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



import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  Utensils, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Search, 
  Filter, 
  Phone, 
  MapPin, 
  DollarSign, 
  Eye, 
  Plus, 
  Store as StoreIcon, 
  RefreshCw, 
  ShieldAlert, 
  FileText, 
  Printer, 
  ChevronDown, 
  User, 
  Calendar,
  Lock,
  Check,
  Receipt,
  Smartphone,
  Navigation,
  UserCheck,
  Camera,
  Bike,
  Car,
  ClipboardCheck,
  Sparkles,
  Calculator,
  Sliders,
  Scale,
  Zap,
  Globe,
  PhoneCall,
  Tag,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, Store, Category, AdminUser, DriverUser, VehicleType } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { ORDER_STATUS_CONFIG } from '../constants/orderStatus';
import { INITIAL_CATEGORIES } from '../services/seedData';
import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, setDoc, serverTimestamp, deleteDoc } from '../lib/firebase';
import { 
  getLocalVehicles, 
  findVehicleType, 
  suggestVehicleForOrder, 
  getLocalPricingSettings,
  calculateOrderEstimatedWeight,
  suggestVehicleByWeight,
  getVehicleRecommendationInfo
} from '../lib/vehicleService';
import { calculateRoadDistance, calculateDeliveryCost, estimateRoadDistanceByAddress, computeLiveRoadDistance } from '../lib/routingService';
import { TestOrderModal } from './TestOrderModal';
import { DistanceVerificationModal } from './DistanceVerificationModal';
import { getUnifiedStores } from '../lib/globalStoreService';
import { OrderSkeleton } from './SkeletonLoader';
import { OrderDetailModal } from './OrderDetailModal';

export { ORDER_STATUS_CONFIG };

// Default captains fallback list
const DEFAULT_DRIVERS: DriverUser[] = [
  {
    id: 'drv-sanaa-1',
    name: 'الكابتن أحمد الصنعاني',
    phone: '771234567',
    vehicleType: 'دراجة نارية',
    plateNumber: 'صنعاء 1234-أ',
    isOnline: true,
    status: 'active'
  },
  {
    id: 'drv-aden-2',
    name: 'الكابتن محمد العدني',
    phone: '739876543',
    vehicleType: 'سيارة',
    plateNumber: 'عدن 5678-ب',
    isOnline: true,
    status: 'active'
  },
  {
    id: 'drv-taiz-3',
    name: 'الكابتن طارق التعزي',
    phone: '711223344',
    vehicleType: 'دراجة نارية',
    plateNumber: 'تعز 9101-ج',
    isOnline: true,
    status: 'active'
  },
  {
    id: 'drv-mukalla-4',
    name: 'الكابتن عمر الحضرمي',
    phone: '700112233',
    vehicleType: 'سيارة',
    plateNumber: 'حضرموت 3322-د',
    isOnline: true,
    status: 'active'
  }
];

interface OrdersManagerProps {
  orders?: Order[];
  stores?: Store[];
  categories?: Category[];
  currentUser: AdminUser | null;
  isLoading?: boolean;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, extraData?: Partial<Order>) => Promise<void>;
  onCreateOrder?: (orderData: Partial<Order>) => Promise<void>;
  onSeedOrders?: () => Promise<void>;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders = [],
  stores = [],
  categories = [],
  currentUser,
  isLoading = false,
  onUpdateOrderStatus,
  onCreateOrder,
  onSeedOrders
}) => {
  // Mode switcher: 'admin' (الإدارة) or 'driver' (تطبيق المندوب)
  const [activeViewMode, setActiveViewMode] = useState<'admin' | 'driver'>('admin');

  // Admin filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [storeTypeFilter, setStoreTypeFilter] = useState<'all' | 'local' | 'global'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  // Driver Assignment Modal State
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');

  // Drivers List (Fetched from Firestore + fallback)
  const [drivers, setDrivers] = useState<DriverUser[]>(DEFAULT_DRIVERS);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('drv-sanaa-1');

  // Driver Receipt & Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);
  const [invoiceInput, setInvoiceInput] = useState('');
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string | null>(null);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Admin Order Review & Vehicle Assignment Modal State (واجهة مراجعة واعتماد الطلبات بالإدارة)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState<Order | null>(null);
  const [reviewVehicleId, setReviewVehicleId] = useState<string>('veh-motorcycle');
  const [reviewWeightKg, setReviewWeightKg] = useState<number>(1.5);
  const [reviewDistanceKm, setReviewDistanceKm] = useState<number>(3.5);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [vehiclesList, setVehiclesList] = useState<VehicleType[]>(() => getLocalVehicles());
  const [pricingSettings] = useState(() => getLocalPricingSettings());

  // New manual order modal state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isTestOrderModalOpen, setIsTestOrderModalOpen] = useState(false);
  const [verificationOrder, setVerificationOrder] = useState<Partial<Order> | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('771234567');
  const [newStoreId, setNewStoreId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(1500);
  const [newItemQty, setNewItemQty] = useState(1);
  const [newAddress, setNewAddress] = useState('صنعاء - شارع حدة');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [finalPriceInput, setFinalPriceInput] = useState<Record<string, string>>({});

  // Debouncing & double-assignment prevention refs
  const isAssigningRef = useRef(false);
  const lastAssignedRef = useRef<{ orderId: string; driverId: string; time: number } | null>(null);

  // Authorization check
  const canEditOrders = hasModulePermission(currentUser, 'orders', 'edit');
  const canCancelOrders = 
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'vice_admin' ||
    currentUser?.role === 'developer' ||
    (currentUser?.role as string) === 'admin' ||
    (currentUser?.role as string) === 'manager' ||
    currentUser?.email === 'admin@gmail.com' ||
    hasModulePermission(currentUser, 'orders', 'delete');

  // Open Review Modal and compute initial road distance, weight & suggested vehicle
  const handleOpenReviewModal = async (order: Order) => {
    setOrderToReview(order);
    
    // Refresh latest vehicle pricing configuration from storage
    const freshVehicles = getLocalVehicles();
    const freshPricing = getLocalPricingSettings();
    setVehiclesList(freshVehicles);

    // 1. Calculate Estimated Weight based on order items or category
    const estimatedWeight = order.approvedWeightKg || order.estimatedWeightKg || calculateOrderEstimatedWeight(order);
    setReviewWeightKg(estimatedWeight);

    // 2. Suggest vehicle automatically based on weight capacity
    const suggestedVehicle = suggestVehicleByWeight(estimatedWeight, freshVehicles);
    setReviewVehicleId(order.suggestedVehicleId || order.vehicleTypeId || suggestedVehicle.id);

    // 3. Calculate actual road network distance
    const estimatedDistance = estimateRoadDistanceByAddress(
      order.storeName || 'صنعاء - شارع حدة',
      order.address || 'صنعاء - ميدان التحرير',
      freshPricing.roadCurvatureFactor || 1.38
    );
    setReviewDistanceKm(order.actualRoadDistanceKm || estimatedDistance || 3.5);
    setReviewNotes(order.adminReviewNotes || '');
    setIsReviewModalOpen(true);

    // Async live road calculation
    try {
      const liveRoute = await computeLiveRoadDistance(
        order.storeName || 'صنعاء - شارع حدة',
        order.address || 'صنعاء - ميدان التحرير',
        suggestedVehicle.icon === 'Bike' ? 'TWO_WHEELER' : 'DRIVE',
        freshPricing.roadCurvatureFactor || 1.38
      );
      if (liveRoute && liveRoute.distanceKm) {
        setReviewDistanceKm(liveRoute.distanceKm);
      }
    } catch (e) {
      console.warn('Error fetching live road distance:', e);
    }
  };

  // Submit Admin Review & Approve Order
  const handleApproveOrderReview = async () => {
    if (!orderToReview) return;
    try {
      setIsSubmittingReview(true);
      const selectedVehicle = findVehicleType(reviewVehicleId, vehiclesList);
      
      // Calculate realistic delivery cost based on road distance and chosen vehicle
      const calcResult = calculateDeliveryCost({
        roadDistanceKm: reviewDistanceKm,
        vehicle: selectedVehicle,
        serviceType: orderToReview.serviceType === 'fazaa' ? 'manfaah' : 'regular',
        pricingSettings
      });

      // Calculate items subtotal
      const itemsSubtotal = orderToReview.items && orderToReview.items.length > 0
        ? orderToReview.items.reduce((sum, it) => sum + (it.price * it.quantity), 0)
        : (orderToReview.subtotal || Math.max(0, (orderToReview.total || 1500) - (orderToReview.deliveryFee || 500)));

      const finalTotal = itemsSubtotal + calcResult.finalDeliveryFee;
      const nowIso = new Date().toISOString();

      await onUpdateOrderStatus(orderToReview.id, 'preparing', {
        status: 'preparing',
        needsAdminReview: false,
        reviewedByAdmin: true,
        reviewedByAdminName: currentUser?.name || 'مسؤول الإدارة',
        reviewedAt: nowIso,
        approvedWeightKg: reviewWeightKg,
        estimatedWeightKg: orderToReview.estimatedWeightKg || reviewWeightKg,
        vehicleTypeId: selectedVehicle.id,
        vehicleTypeName: selectedVehicle.name,
        suggestedVehicleId: selectedVehicle.id,
        suggestedVehicleName: selectedVehicle.name,
        actualRoadDistanceKm: calcResult.actualRoadDistanceKm,
        deliveryFee: calcResult.finalDeliveryFee,
        subtotal: itemsSubtotal,
        total: finalTotal,
        totalPrice: finalTotal,
        routingMethod: calcResult.routingMethod || 'road_network_topology',
        adminReviewNotes: reviewNotes.trim() || undefined
      });

      setIsReviewModalOpen(false);
      setOrderToReview(null);
    } catch (err) {
      console.error('Failed to approve order review:', err);
      alert('حدث خطأ أثناء اعتماد الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Realtime Data Listeners from Firestore with component-level unmount cleanup
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders || []);
  const [internalStores, setInternalStores] = useState<Store[]>(stores || []);
  const [internalCategories, setInternalCategories] = useState<Category[]>(categories || []);
  const [isComponentLoading, setIsComponentLoading] = useState<boolean>(isLoading !== undefined ? isLoading : true);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeStores: (() => void) | undefined;
    let unsubscribeCats: (() => void) | undefined;
    let unsubscribeDrivers: (() => void) | undefined;

    try {
      setIsComponentLoading(true);

      // 1. Initial & Periodical API sync (to fetch orders placed via Mobile Client REST API)
      const fetchApiOrders = async () => {
        try {
          const res = await fetch('/api/orders');
          if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
              setLiveOrders(prev => {
                const map = new Map<string, Order>();
                prev.forEach(o => map.set(o.id || o.orderNumber, o));
                data.orders.forEach((o: Order) => map.set(o.id || o.orderNumber, o));
                return Array.from(map.values());
              });
            }
          }
        } catch {
          // Offline mode / silent
        }
      };
      fetchApiOrders();

      // 2. Component-level real-time snapshot listener for orders
      const ordersQuery = query(collection(db, 'orders'));
      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const list: Order[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const isGlobal = Boolean(
            data.orderType === 'global_store' ||
            data.orderType?.includes?.('global_store') ||
            data.orderType?.includes?.('متجر عالمي') ||
            data.orderScope === 'international' ||
            data.orderScope === 'global' ||
            data.serviceType === 'global_store' ||
            data.serviceType === 'global' ||
            data.isGlobalStore ||
            data.categoryId === 'global_stores' ||
            data.categoryId === 'cat-global' ||
            data.categoryId === 'global' ||
            data.categoryName === 'المتاجر العالمية' ||
            data.categoryName?.includes?.('عالمي') ||
            data.storeCategory === 'المتاجر العالمية' ||
            data.storeCategory?.includes?.('عالمي') ||
            data.storeId === 'amazon' ||
            data.storeId === 'global-store-amazon' ||
            data.storeId === 'shein' ||
            data.storeId === 'global-store-shein' ||
            data.storeId === 'aliexpress' ||
            data.storeId === 'global-store-aliexpress' ||
            data.storeName?.includes?.('أمازون') ||
            data.storeName?.includes?.('Amazon') ||
            data.storeName?.includes?.('SHEIN') ||
            data.storeName?.includes?.('شي إن') ||
            data.storeName?.includes?.('AliExpress') ||
            data.storeName?.includes?.('علي إكسبريس') ||
            data.storeName?.includes?.('المتاجر العالمية') ||
            (data.items && data.items.some?.((it: any) => 
              it.productUrl || 
              it.sourceUrl || 
              it.url ||
              it.isGlobal || 
              it.storeName?.includes?.('أمازون') || 
              it.storeName?.includes?.('Amazon') || 
              it.storeName?.includes?.('AliExpress') || 
              it.storeName?.includes?.('شي إن') ||
              it.storeName?.includes?.('SHEIN')
            ))
          );

          let storeName = data.storeName || (data.items?.[0]?.storeName);
          if (!storeName || storeName === 'متجر عام') {
            storeName = isGlobal ? 'المتاجر العالمية' : 'متجر عام';
          }

          return {
            id: docSnap.id,
            orderNumber: data.orderNumber || `ORD-${docSnap.id.substring(0, 5)}`,
            customerName: data.customerName || data.userName || 'عميل',
            customerPhone: data.customerPhone || data.phone || '',
            address: data.deliveryAddress || data.address || data.dropoffAddress || '',
            storeId: data.storeId || (isGlobal ? 'global-store-amazon' : ''),
            storeName,
            categoryId: data.categoryId || (isGlobal ? 'global_stores' : ''),
            categoryName: data.categoryName || (isGlobal ? 'المتاجر العالمية' : ''),
            storeCategory: data.storeCategory || (isGlobal ? 'المتاجر العالمية' : ''),
            isGlobalStore: isGlobal || Boolean(data.isGlobalStore),
            total: data.total || data.totalPrice || data.orderTotal || 0,
            itemsTotal: data.itemsTotal || data.subtotal || data.itemsPrice || 0,
            deliveryFee: data.deliveryFee || data.shippingFee || 0,
            status: (data.status || 'pending') as OrderStatus,
            needsAdminReview: Boolean(
              data.needsAdminReview || 
              data.status === 'pending_review' || 
              data.status === 'pending' || 
              data.status === 'PENDING_REVIEW' || 
              data.status === 'PENDING'
            ),
            itemsCount: data.itemsCount || (data.items ? data.items.length : 1),
            items: data.items || [],
            paymentMethod: data.paymentMethod || 'cash',
            paymentStatus: data.paymentStatus || 'pending',
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString(),
            ...data
          } as Order;
        });

        // Set live orders directly from Firestore snapshot without stale localStorage
        setLiveOrders(list);
        setIsComponentLoading(false);
      }, (err) => {
        console.warn('Orders onSnapshot error in OrdersManager:', err);
        setIsComponentLoading(false);
      });

      // 3. Component-level real-time snapshot listener for stores
      const storesQuery = query(collection(db, 'stores'));
      unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
        const sList: Store[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Store[];
        setInternalStores(sList);
      }, (err) => {
        console.warn('Stores snapshot error in OrdersManager:', err);
      });

      // 4. Component-level real-time snapshot listener for categories
      const catsQuery = query(collection(db, 'categories'));
      unsubscribeCats = onSnapshot(catsQuery, (snapshot) => {
        const cList: Category[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];
        setInternalCategories(cList);
      }, (err) => {
        console.warn('Categories snapshot error in OrdersManager:', err);
      });

      // 5. Component-level real-time snapshot listener for drivers
      const driversQuery = query(collection(db, 'drivers'));
      unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
        const dList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as DriverUser[];
        if (dList.length > 0) setDrivers(dList);
      }, (err) => {
        console.warn('Drivers snapshot error in OrdersManager:', err);
      });

    } catch (e) {
      console.warn('Data listeners setup error in OrdersManager:', e);
      setIsComponentLoading(false);
    }

    // Window event listener for immediately placed orders
    const handleOrderPlaced = (e: any) => {
      const newOrder = e.detail?.order;
      if (newOrder) {
        setLiveOrders(prev => {
          if (prev.some(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber)) {
            return prev;
          }
          return [newOrder, ...prev];
        });
      }
    };
    window.addEventListener('jahez_order_placed', handleOrderPlaced);

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeStores) unsubscribeStores();
      if (unsubscribeCats) unsubscribeCats();
      if (unsubscribeDrivers) unsubscribeDrivers();
      window.removeEventListener('jahez_order_placed', handleOrderPlaced);
    };
  }, []);

  // Sync prop changes when passed from App
  useEffect(() => {
    if (orders && orders.length > 0) {
      setLiveOrders(orders);
    }
  }, [orders]);

  useEffect(() => {
    if (stores && stores.length > 0) {
      setInternalStores(stores);
    }
  }, [stores]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setInternalCategories(categories);
    }
  }, [categories]);

  const safeOrders = useMemo(() => {
    const raw = liveOrders.length > 0 ? liveOrders : (orders || []);
    const uniqueMap = new Map();
    raw.forEach(o => {
      if (o.id) uniqueMap.set(o.id, o);
      else if (o.orderNumber) uniqueMap.set(o.orderNumber, o);
    });
    return Array.from(uniqueMap.values());
  }, [liveOrders, orders]);
  const safeStores = useMemo(() => {
    const storeList = internalStores.length > 0 ? internalStores : (stores || []);
    return getUnifiedStores(storeList);
  }, [internalStores, stores]);

  const safeCategories = useMemo(() => {
    const catList = internalCategories.length > 0 ? internalCategories : (categories || []);
    const merged = [...catList];
    INITIAL_CATEGORIES.forEach(initCat => {
      if (!merged.some(c => c.id === initCat.id || c.name === initCat.name)) {
        merged.push(initCat as any);
      }
    });
    return merged;
  }, [internalCategories, categories]);

  const isOrderGlobal = (order: Order) => Boolean(
    order.orderType === 'global_store' ||
    order.orderType?.includes('global_store') ||
    order.orderType?.includes('متجر عالمي') ||
    order.orderScope === 'international' ||
    order.orderScope === 'global' ||
    order.serviceType === 'global_store' ||
    order.serviceType === 'global' ||
    order.isGlobalStore ||
    order.categoryId === 'global_stores' ||
    order.categoryId === 'cat-global' ||
    order.categoryId === 'global' ||
    order.categoryName === 'المتاجر العالمية' ||
    order.categoryName?.includes('عالمي') ||
    order.storeCategory === 'المتاجر العالمية' ||
    order.storeCategory?.includes('عالمي') ||
    order.storeId === 'amazon' ||
    order.storeId === 'global-store-amazon' ||
    order.storeId === 'shein' ||
    order.storeId === 'global-store-shein' ||
    order.storeId === 'aliexpress' ||
    order.storeId === 'global-store-aliexpress' ||
    order.storeName?.includes('أمازون') ||
    order.storeName?.includes('Amazon') ||
    order.storeName?.includes('SHEIN') ||
    order.storeName?.includes('شي إن') ||
    order.storeName?.includes('AliExpress') ||
    order.storeName?.includes('علي إكسبريس') ||
    order.storeName?.includes('المتاجر العالمية') ||
    (order.items && order.items.some((it: any) => 
      it.productUrl || 
      it.sourceUrl || 
      it.url ||
      it.isGlobal || 
      it.storeId === 'amazon' ||
      it.storeId === 'shein' ||
      it.storeId === 'aliexpress' ||
      it.storeName?.includes('أمازون') || 
      it.storeName?.includes('Amazon') || 
      it.storeName?.includes('AliExpress') || 
      it.storeName?.includes('علي إكسبريس') || 
      it.storeName?.includes('SHEIN') || 
      it.storeName?.includes('شي إن')
    ))
  );

  const globalOrdersCount = useMemo(() => safeOrders.filter(isOrderGlobal).length, [safeOrders]);
  const localOrdersCount = safeOrders.length - globalOrdersCount;

  // Firestore Realtime Drivers Listener
  useEffect(() => {
    let unsubscribe: any;
    try {
      const driversQuery = query(collection(db, 'drivers'));
      unsubscribe = onSnapshot(driversQuery, (snapshot) => {
        const fetchedList: DriverUser[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as DriverUser[];

        if (fetchedList.length > 0) {
          const combined = [...fetchedList];
          DEFAULT_DRIVERS.forEach(defDrv => {
            if (!combined.some(d => d.id === defDrv.id || d.phone === defDrv.phone)) {
              combined.push(defDrv);
            }
          });
          setDrivers(combined);
        } else {
          setDrivers(DEFAULT_DRIVERS);
        }
      }, (err) => {
        console.warn('Drivers listener fallback:', err);
        setDrivers(DEFAULT_DRIVERS);
      });
    } catch (e) {
      setDrivers(DEFAULT_DRIVERS);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered orders for Admin View
  const filteredOrders = useMemo(() => {
    const allIds = safeOrders.map(o => o.id);
    const duplicates = allIds.filter((item, index) => allIds.indexOf(item) !== index);
    if (duplicates.length > 0) console.error('DUPLICATES IN SAFEORDERS:', duplicates);

    return safeOrders.filter((order) => {
      // Unblock filters for "all" and "new" tabs: show all documents from orders collection regardless of branch or orderType
      if (selectedStatusTab !== 'all' && selectedStatusTab !== 'new') {
        // Store Type Filter: All vs Local Stores vs Global Stores
        if (storeTypeFilter !== 'all') {
          const isGlobal = isOrderGlobal(order);
          if (storeTypeFilter === 'global' && !isGlobal) return false;
          if (storeTypeFilter === 'local' && isGlobal) return false;
        }
      }

      // Status filter
      if (selectedStatusTab !== 'all') {
        const rawStatus = (order.status || '').toLowerCase();
        if (selectedStatusTab === 'pending_review') {
          const isPending = 
            rawStatus === 'pending_review' || 
            rawStatus === 'pending' || 
            Boolean(order.needsAdminReview);
          if (!isPending) return false;
        } else if (selectedStatusTab === 'new') {
          const isNew = 
            rawStatus === 'new' || 
            rawStatus === 'pending' || 
            rawStatus === 'pending_review' || 
            Boolean(order.needsAdminReview);
          if (!isNew) return false;
        } else if (selectedStatusTab === 'preparing') {
          const isPrep = 
            rawStatus === 'preparing' || 
            rawStatus === 'confirmed' || 
            rawStatus === 'approved';
          if (!isPrep) return false;
        } else if (selectedStatusTab === 'delivering') {
          if (rawStatus !== 'delivering') return false;
        } else if (selectedStatusTab === 'delivered') {
          if (rawStatus !== 'delivered' && rawStatus !== 'completed') return false;
        } else if (selectedStatusTab === 'cancelled') {
          if (rawStatus !== 'cancelled') return false;
        } else if (selectedStatusTab === 'returned') {
          if (rawStatus !== 'returned') return false;
        } else if (selectedStatusTab === 'global_stores') {
          const isGlobal = isOrderGlobal(order);
          if (!isGlobal) return false;
        } else if (rawStatus !== selectedStatusTab.toLowerCase()) {
          return false;
        }
      }

      // Store filter
      if (selectedStoreId !== 'all') {
        const storeObj = safeStores.find(s => s.id === selectedStoreId);
        const matchesStoreId = 
          order.storeId === selectedStoreId ||
          (selectedStoreId === 'global-store-amazon' && (order.storeId === 'amazon' || order.storeName?.includes('Amazon') || order.storeName?.includes('أمازون'))) ||
          (selectedStoreId === 'global-store-shein' && (order.storeId === 'shein' || order.storeName?.includes('SHEIN') || order.storeName?.includes('شي إن'))) ||
          (selectedStoreId === 'global-store-aliexpress' && (order.storeId === 'aliexpress' || order.storeName?.includes('AliExpress') || order.storeName?.includes('علي إكسبريس')));

        const matchesStoreName = storeObj && order.storeName === storeObj.name;

        if (!matchesStoreId && !matchesStoreName) return false;
      }

      // Dynamic Category Filter (ER Diagram: جدول فئة_المتجر / معرف_الفئة)
      if (selectedCategoryId !== 'all') {
        const orderCatId = order.categoryId || (order as any).معرف_الفئة;
        const selectedCat = safeCategories.find(c => c.id === selectedCategoryId);
        const catName = selectedCat?.name;

        const matchesCatId = orderCatId === selectedCategoryId;
        const matchesCatName = Boolean(catName && (order.categoryName === catName || order.storeCategory === catName));

        // Also check if the store itself belongs to this category
        const storeMatch = safeStores.find(s => s.id === order.storeId || s.name === order.storeName);
        const matchesStoreCat = Boolean(
          storeMatch && (
            storeMatch.categoryId === selectedCategoryId ||
            (catName && storeMatch.categoryName === catName)
          )
        );

        // Global stores category check
        const matchesGlobalDirect = (selectedCategoryId === 'global_stores' || selectedCategoryId === 'global') && isOrderGlobal(order);

        if (!matchesCatId && !matchesCatName && !matchesStoreCat && !matchesGlobalDirect) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = order.orderNumber?.toLowerCase().includes(term);
        const nameMatch = order.customerName.toLowerCase().includes(term);
        const phoneMatch = order.customerPhone?.toLowerCase().includes(term);
        const storeMatch = order.storeName?.toLowerCase().includes(term);
        const addressMatch = order.address?.toLowerCase().includes(term);
        const driverMatch = order.driverName?.toLowerCase().includes(term);
        const branchMatch = order.branch?.toLowerCase().includes(term);
        const invoiceMatch = order.invoiceNumber?.toLowerCase().includes(term);
        const itemMatch = order.items?.some(i => i.productName.toLowerCase().includes(term));
        if (!numMatch && !nameMatch && !phoneMatch && !storeMatch && !addressMatch && !driverMatch && !branchMatch && !invoiceMatch && !itemMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [safeOrders, safeStores, safeCategories, storeTypeFilter, selectedStatusTab, selectedStoreId, selectedCategoryId, searchTerm]);

  // Orders assigned to selected driver in Driver View
  const selectedDriver = drivers.find(d => d.id === selectedDriverId || d.phone === selectedDriverId) || drivers[0];
  const driverAssignedOrders = useMemo(() => {
    if (!selectedDriver) return [];
    return safeOrders.filter(o => 
      o.driverId === selectedDriver.phone ||
      o.driverId === selectedDriver.id || 
      o.driverName === selectedDriver.name ||
      (o.driverPhone && o.driverPhone === selectedDriver.phone)
    ).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [safeOrders, selectedDriver]);

  // Status counts
  const counts = useMemo(() => {
    return {
      all: safeOrders.length,
      pending_review: safeOrders.filter(o => 
        o.status === 'pending_review' || 
        o.status === 'PENDING_REVIEW' || 
        o.status === 'pending' || 
        o.status === 'PENDING' || 
        o.needsAdminReview
      ).length,
      new: safeOrders.filter(o => 
        o.status === 'new' || 
        o.status === 'NEW' || 
        o.status === 'pending' || 
        o.status === 'PENDING' || 
        o.status === 'pending_review' || 
        o.status === 'PENDING_REVIEW' || 
        o.needsAdminReview
      ).length,
      preparing: safeOrders.filter(o => 
        o.status === 'preparing' || 
        o.status === 'PREPARING' || 
        o.status === 'confirmed' || 
        o.status === 'CONFIRMED' || 
        o.status === 'approved' || 
        o.status === 'APPROVED'
      ).length,
      delivering: safeOrders.filter(o => o.status === 'delivering' || o.status === 'DELIVERING').length,
      delivered: safeOrders.filter(o => o.status === 'delivered' || o.status === 'COMPLETED').length,
      cancelled: safeOrders.filter(o => o.status === 'cancelled' || o.status === 'CANCELLED').length,
      returned: safeOrders.filter(o => o.status === 'returned').length
    };
  }, [safeOrders]);

  // Handler for Admin status change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!canEditOrders) return;

    if (newStatus === 'cancelled' && !canCancelOrders) {
      alert('عفواً، صلاحية إلغاء الطلب مخصصة حصراً لمدراء النظام والإدارة الرسمية.');
      return;
    }

    // If changing to 'preparing', prompt driver selection modal
    const targetOrder = safeOrders.find(o => o.id === orderId);
    if (newStatus === 'preparing' && targetOrder) {
      setOrderToAssign(targetOrder);
      setIsAssignDriverModalOpen(true);
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      const nowIso = new Date().toISOString();

      // 1. Direct Firestore update strictly awaited
      if (!orderId.startsWith('local-')) {
        await setDoc(doc(db, 'orders', orderId), {
          status: newStatus,
          updatedAt: nowIso
        }, { merge: true });
      }

      // 2. Global handler and local state sync
      await onUpdateOrderStatus(orderId, newStatus);
      setLiveOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: newStatus,
        updatedAt: nowIso
      } : o));
    } catch (err: any) {
      console.error('Failed updating order status:', err);
      alert(`فشل تحديث حالة الطلب في قاعدة البيانات: ${err?.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handler for Admin to confirm order after calling the customer
  const handleCancelOrderWithConfirm = (order: Order) => {
    if (!canCancelOrders) {
      alert('عفواً، صلاحية إلغاء الطلب مخصصة حصراً لمدراء النظام والإدارة الرسمية.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من إلغاء الطلب رقم ${order.orderNumber || order.id.slice(0, 6)}؟`)) {
      handleStatusChange(order.id, 'cancelled');
    }
  };

  // Handler for Admin to delete order permanently from Firestore
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
      try {
        setUpdatingOrderId(orderId);
        if (!orderId.startsWith('local-')) {
          await deleteDoc(doc(db, "orders", orderId));
        }
        setLiveOrders(prev => prev.filter(o => o.id !== orderId));
      } catch (err: any) {
        console.error('Failed to delete order from Firestore:', err);
        alert(`فشل حذف الطلب: ${err?.message || 'يرجى المحاولة مجدداً'}`);
      } finally {
        setUpdatingOrderId(null);
      }
    }
  };

  const handleConfirmOrderAfterCall = async (order: Order) => {
    if (!canEditOrders) return;
    try {
      setUpdatingOrderId(order.id);
      const nowIso = new Date().toISOString();
      const adminName = currentUser?.name || 'مدير النظام';

      // 1. Direct Firestore update strictly awaited with status "preparing" (or confirmed)
      if (!order.id.startsWith('local-')) {
        await setDoc(doc(db, 'orders', order.id), {
          status: 'preparing',
          needsAdminReview: false,
          confirmedByAdminAt: nowIso,
          confirmedByAdminName: adminName,
          adminReviewNotes: `تم التأكيد هاتفياً مع العميل (${order.customerPhone || order.customerName}) بنجاح بواسطة ${adminName}.`,
          updatedAt: nowIso
        }, { merge: true });
      }

      // 2. Global state and local sync
      await onUpdateOrderStatus(order.id, 'preparing', {
        status: 'preparing',
        needsAdminReview: false,
        confirmedByAdminAt: nowIso,
        confirmedByAdminName: adminName,
        adminReviewNotes: `تم التأكيد هاتفياً مع العميل (${order.customerPhone || order.customerName}) بنجاح بواسطة ${adminName}.`
      });

      // Update local state directly
      setLiveOrders(prev => prev.map(o => o.id === order.id ? {
        ...o,
        status: 'preparing',
        needsAdminReview: false,
        confirmedByAdminAt: nowIso,
        confirmedByAdminName: adminName
      } : o));
    } catch (err: any) {
      console.error('Failed confirming order after call:', err);
      alert(`حدث خطأ أثناء تأكيد الطلب وحفظه في السيرفر: ${err?.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handler for Admin to confirm global store order with final price input
  const handleConfirmGlobalOrder = async (order: Order) => {
    if (!canEditOrders) return;
    const finalPrice = parseFloat(finalPriceInput[order.id]);
    if (!finalPrice || isNaN(finalPrice) || finalPrice <= 0) {
      alert('يرجى إدخال السعر النهائي المحسوب (ر.ي) قبل تأكيد الطلب.');
      return;
    }
    try {
      setUpdatingOrderId(order.id);
      const nowIso = new Date().toISOString();
      const adminName = currentUser?.name || 'مدير النظام';

      // 1. Direct Firestore update strictly awaited
      if (!order.id.startsWith('local-')) {
        await setDoc(doc(db, 'orders', order.id), {
          status: 'preparing',
          total: finalPrice,
          totalPrice: finalPrice,
          needsAdminReview: false,
          confirmedByAdminAt: nowIso,
          confirmedByAdminName: adminName,
          adminReviewNotes: `تم مراجعة وتأكيد طلب المتجر العالمي هاتفياً بواسطة ${adminName} بسعر ${finalPrice.toLocaleString('ar-YE')} ر.ي.`,
          updatedAt: nowIso
        }, { merge: true });
      }

      // 2. Global state and local sync
      await onUpdateOrderStatus(order.id, 'preparing', {
        status: 'preparing',
        total: finalPrice,
        totalPrice: finalPrice,
        needsAdminReview: false,
        confirmedByAdminAt: nowIso,
        confirmedByAdminName: adminName,
        adminReviewNotes: `تم مراجعة وتأكيد طلب المتجر العالمي هاتفياً بواسطة ${adminName} بسعر ${finalPrice.toLocaleString('ar-YE')} ر.ي.`
      });

      setLiveOrders(prev => prev.map(o => o.id === order.id ? {
        ...o,
        status: 'preparing',
        total: finalPrice,
        totalPrice: finalPrice,
        needsAdminReview: false,
        confirmedByAdminAt: nowIso,
        confirmedByAdminName: adminName
      } : o));
    } catch (err: any) {
      console.error('Failed confirming global order:', err);
      alert(`حدث خطأ أثناء تأكيد الطلب وحفظه في السيرفر: ${err?.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handler when Admin assigns a driver and accepts order (with debouncing & duplicate assignment prevention)
  const handleAssignDriverSubmit = async (driver: DriverUser) => {
    if (!orderToAssign) return;

    // 1. Debounce in-flight lock: prevent clicking multiple times concurrently
    if (isAssigningRef.current) {
      console.warn('Driver assignment already in progress, ignoring duplicate submit.');
      return;
    }

    const targetDriverPhone = (driver.phone || '').trim();
    const targetDriverName = (driver.name || '').trim();
    const targetDriverId = (driver.id || targetDriverPhone).trim();

    // 2. Prevent sending the exact same order to the same driver in the same moment (within 5 seconds)
    const now = Date.now();
    if (
      lastAssignedRef.current &&
      lastAssignedRef.current.orderId === orderToAssign.id &&
      (lastAssignedRef.current.driverId === targetDriverId || lastAssignedRef.current.driverId === targetDriverPhone) &&
      now - lastAssignedRef.current.time < 5000
    ) {
      alert('تم إرسال هذا الطلب لنفس المندوب للتو. يرجى الانتظار بضع ثوانٍ لمنع تكرار الإشعار.');
      return;
    }

    // 3. Check if the order is already assigned to this driver
    if (
      (orderToAssign.driverId === targetDriverPhone || orderToAssign.driverId === targetDriverId || orderToAssign.driverPhone === targetDriverPhone) &&
      (orderToAssign.status === 'preparing' || orderToAssign.status === 'delivering')
    ) {
      alert('هذا الطلب مسند بالفعل لهذا المندوب.');
      return;
    }

    // 4. Check if driver is already busy with another active order
    const isBusy = liveOrders.some(o => 
      o.id !== orderToAssign.id &&
      (o.driverId === targetDriverPhone || o.driverPhone === targetDriverPhone || o.driverId === targetDriverId) &&
      (o.status === 'preparing' || o.status === 'delivering' || o.status === 'PREPARING' || o.status === 'DELIVERING')
    );

    if (isBusy) {
      if (!window.confirm('تنبيه: هذا المندوب لديه طلب آخر قيد التوصيل حالياً. هل ترغب بالتأكيد وتعيينه لهذا الطلب أيضاً؟')) {
        return;
      }
    }

    try {
      isAssigningRef.current = true;
      lastAssignedRef.current = {
        orderId: orderToAssign.id,
        driverId: targetDriverPhone || targetDriverId,
        time: now
      };
      setUpdatingOrderId(orderToAssign.id);

      const nowIso = new Date().toISOString();

      // 1. Direct update to orders/{orderId} in Firestore exactly as expected by driver app
      if (!orderToAssign.id.startsWith('local-')) {
        await updateDoc(doc(db, 'orders', orderToAssign.id), {
          driverId: targetDriverPhone,
          driverName: targetDriverName,
          driverPhone: targetDriverPhone,
          status: 'preparing',
          assignedAt: nowIso,
          updatedAt: nowIso
        });
      }

      // 2. Trigger global App callback
      await onUpdateOrderStatus(orderToAssign.id, 'preparing', {
        driverId: targetDriverPhone,
        driverName: targetDriverName,
        driverPhone: targetDriverPhone,
        status: 'preparing',
        assignedAt: nowIso
      });

      // 3. Update local state directly
      setLiveOrders(prev => prev.map(o => o.id === orderToAssign.id ? {
        ...o,
        driverId: targetDriverPhone,
        driverName: targetDriverName,
        driverPhone: targetDriverPhone,
        status: 'preparing',
        assignedAt: nowIso
      } : o));

      setIsAssignDriverModalOpen(false);
      setOrderToAssign(null);
    } catch (err: any) {
      console.error('Failed assigning driver:', err);
      alert(`فشل إسناد المندوب وحفظ الطلب في السيرفر: ${err?.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      isAssigningRef.current = false;
      setUpdatingOrderId(null);
    }
  };

  // Handle File change for Invoice Photo
  const handleInvoiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoiceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for Driver to save invoice photo & number and complete order
  const handleSaveInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForInvoice) return;

    try {
      setIsSubmittingInvoice(true);
      const invoiceNumber = invoiceInput.trim() || `INV-${orderForInvoice.orderNumber || orderForInvoice.id.slice(0, 6)}`;
      const finalImage = invoiceImagePreview || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800';
      const activeDriverName = orderForInvoice.driverName || selectedDriver?.name || currentUser?.name || 'كابتن التوصيل';
      const activeDriverId = orderForInvoice.driverId || selectedDriver?.id || currentUser?.id || 'drv-gen';
      const amount = orderForInvoice.total || orderForInvoice.totalPrice || 0;

      // أ) إنشاء مستند في مجموعة driver_invoices
      try {
        await addDoc(collection(db, 'driver_invoices'), {
          orderId: orderForInvoice.id,
          driverId: activeDriverId,
          driverName: activeDriverName,
          invoiceNumber: invoiceNumber,
          imageUrl: finalImage,
          amount: amount,
          createdAt: serverTimestamp(),
          // حقول إضافية للعرض في لوحة InvoicesManager
          orderNumber: orderForInvoice.orderNumber || orderForInvoice.id,
          customerName: orderForInvoice.customerName || '',
          storeName: orderForInvoice.storeName || '',
          driverPhone: orderForInvoice.driverPhone || selectedDriver?.phone || '',
          uploadedAt: new Date().toISOString()
        });
      } catch (errDb) {
        console.warn('Could not save to driver_invoices collection:', errDb);
      }

      // ب) تحديث مستند الطلب في orders إلى status: "COMPLETED", invoiceNumber: invoiceNumber
      try {
        if (!orderForInvoice.id.startsWith('local-')) {
          await setDoc(doc(db, 'orders', orderForInvoice.id), {
            status: "COMPLETED",
            invoiceNumber: invoiceNumber,
            invoiceImageUrl: finalImage,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (errDb) {
        console.warn('Direct Firestore order invoice update warning:', errDb);
      }

      // تحديث حالة الطلب في الواجهة المحلية
      await onUpdateOrderStatus(orderForInvoice.id, 'COMPLETED' as any, {
        status: 'COMPLETED' as any,
        invoiceNumber: invoiceNumber,
        invoiceImageUrl: finalImage,
        invoiceUploadTime: new Date().toISOString()
      });

      setIsInvoiceModalOpen(false);
      setOrderForInvoice(null);
      setInvoiceInput('');
      setInvoiceImagePreview(null);
    } catch (err) {
      console.error('Failed saving invoice image:', err);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  // Handler for manual new order submit
  const handleCreateNewOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newItemName.trim()) return;

    const selectedStore = safeStores.find(s => s.id === newStoreId) || safeStores[0];
    const storeName = selectedStore ? selectedStore.name : 'متجر عام';
    const storeId = selectedStore ? selectedStore.id : '';

    const orderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalCalc = newItemPrice * newItemQty + 400;

    try {
      setIsSubmittingOrder(true);
      if (onCreateOrder) {
        await onCreateOrder({
          orderNumber: orderNum,
          customerName: newCustomerName.trim(),
          customerPhone: newCustomerPhone.trim(),
          storeId,
          storeName,
          itemsCount: newItemQty,
          items: [
            {
              productName: newItemName.trim(),
              price: newItemPrice,
              quantity: newItemQty
            }
          ],
          total: totalCalc,
          deliveryFee: 400,
          status: 'new',
          address: newAddress,
          notes: newNotes
        });
      }
      setIsNewOrderModalOpen(false);
      setNewCustomerName('');
      setNewItemName('');
      setNewNotes('');
    } catch (err) {
      console.error('Failed creating order:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">قسم إدارة وقبول الطلبات وتوزيع المندوبين</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                ربط مباشر Firestore ⚡
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              استقبال الطلبات الجديدة، التواصل مع العملاء، قبول وإسناد المندوبين، ومتابعة إدخال الفواتير والتوصيل.
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Admin vs Driver App) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setActiveViewMode('admin')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeViewMode === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>لوحة إدارة الطلبات (الإدارة)</span>
          </button>

          <button
            onClick={() => setActiveViewMode('driver')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeViewMode === 'driver'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>تطبيق المندوب / واجهة الكابتن 📱</span>
          </button>

          {canEditOrders && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTestOrderModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="إنشاء طلب تجريبي وتحديد الإحداثيات وحساب التكلفة فورياً"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>+ طلب تجريبي واحتساب فوري ⚡</span>
              </button>

              <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>طلب جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== VIEW MODE 1: ADMIN MANAGEMENT ==================== */}
      {activeViewMode === 'admin' && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20'
                  : 'bg-white border-gray-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1 opacity-80">
                <span>الكل</span>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold font-sans">{counts.all}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('pending_review')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'pending_review'
                  ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
              }`}
            >
              <div className={`flex items-center justify-between text-xs font-bold mb-1 ${selectedStatusTab === 'pending_review' ? 'text-white' : 'text-amber-800'}`}>
                <span>مراجعة الوسيلة 🚗</span>
                <Sliders className="w-4 h-4" />
              </div>
              <span className={`text-2xl font-extrabold font-sans ${selectedStatusTab === 'pending_review' ? 'text-white' : 'text-amber-950'}`}>{counts.pending_review}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('new')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'new'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span>جديدة (تأكيد)</span>
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-amber-900 font-sans">{counts.new}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('preparing')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'preparing'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-xs font-bold">قيد التحضير</span>
                <Utensils className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-blue-900 font-sans">{counts.preparing}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('delivering')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'delivering'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-xs font-bold">قيد التوصيل</span>
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-purple-900 font-sans">{counts.delivering}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('delivered')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'delivered'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-white border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs font-bold">مكتملة</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-emerald-900 font-sans">{counts.delivered}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('cancelled')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
                selectedStatusTab === 'cancelled'
                  ? 'bg-red-50 border-red-400 ring-2 ring-red-400/20'
                  : 'bg-white border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between text-red-700 mb-1">
                <span className="text-xs font-bold">ملغاة</span>
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-red-900 font-sans">{counts.cancelled}</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            {/* Status Tab Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 custom-scrollbar">
              {[
                { id: 'all', label: `جميع الطلبات (${counts.all})` },
                { id: 'pending_review', label: `🔍 مراجعة واعتماد الوسيلة (${counts.pending_review})` },
                { id: 'new', label: `الجديدة (${counts.new})` },
                { id: 'preparing', label: `قيد التحضير (${counts.preparing})` },
                { id: 'delivering', label: `قيد التوصيل (${counts.delivering})` },
                { id: 'delivered', label: `المكتملة (${counts.delivered})` },
                { id: 'cancelled', label: `الملغاة (${counts.cancelled})` },
                { id: 'returned', label: `المرجعة (${counts.returned})` },
                { id: 'global_stores', label: `المتاجر العالمية 🌐` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusTab(tab.id)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                    selectedStatusTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-gray-50 text-slate-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Field */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث برقم الطلب، اسم العميل، رقم الهاتف، اسم المتجر، المندوب، أو الصنف..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Category Filter (ER Diagram Unified Architecture) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option key="cat-all" value="all">جميع الفئات والأنشطة ({safeCategories.length})</option>
                  {safeCategories.map((cat, idx) => (
                    <option key={cat.id || `cat-${idx}`} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Store Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full md:w-52 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option key="store-all" value="all">جميع المتاجر والمطاعم</option>
                  {safeStores.map((st, idx) => (
                    <option key={st.id || `st-${idx}`} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Store Type Scope Switcher: All vs Local vs Global */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStoreTypeFilter('all')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    storeTypeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>الكل</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {safeOrders.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreTypeFilter('local')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    storeTypeFilter === 'local'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <StoreIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>طلبات المتاجر المحلية</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                    {localOrdersCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreTypeFilter('global')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    storeTypeFilter === 'global'
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-300" />
                  <span>طلبات المتاجر العالمية</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/40 text-white font-mono">
                    {globalOrdersCount}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                <span>النتائج المعروضة: <strong className="text-slate-800 font-bold">{filteredOrders.length}</strong> طلب</span>
              </div>
            </div>
          </div>

          {/* Orders List Grid */}
          {(isLoading || isComponentLoading) && safeOrders.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <OrderSkeleton key={i} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">لا توجد طلبات تطابق معايير البحث الحالية</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                قم بتغيير كلمة البحث أو الفلتر المستهدف لاستعراض بقية الطلبات المسجلة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const rawStatus = (order.status || 'new').toLowerCase();
                const statusConfig = ORDER_STATUS_CONFIG[rawStatus] || ORDER_STATUS_CONFIG.new;
                const StatusIcon = statusConfig.Icon;

                const isNew = rawStatus === 'new' || rawStatus === 'pending' || rawStatus === 'pending_review' || Boolean(order.needsAdminReview) || (!order.driverId && !order.driverName);
                const hasDriverAssigned = Boolean(order.driverId || order.driverName);
                const isCompleted = rawStatus === 'delivered' || rawStatus === 'completed';
                const isCancelled = rawStatus === 'cancelled';

                return (
                  <div 
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-blue-200 shadow-xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between space-y-3.5"
                  >
                    {/* Header: رقم الطلب، اسم المتجر، وشارة الحالة للقراءة فقط */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            {order.orderNumber || `#${order.id.slice(0, 6)}`}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm truncate" title={order.storeName || 'متجر عام'}>
                          {order.storeName || 'متجر عام'}
                        </h4>
                      </div>

                      {/* شارة الحالة النصية للقراءة فقط - لا توجد أي قوائم منسدلة */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border shrink-0 ${statusConfig.badgeClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>

                    {/* Body: اسم العميل ورقم العميل فقط (المعلومات الحيوية للقراءة فقط) */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{order.customerName || 'عميل'}</span>
                        </div>
                        {order.customerPhone && (
                          <a 
                            href={`tel:${order.customerPhone}`}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-mono font-bold flex items-center gap-1 mt-1 transition-colors w-fit"
                          >
                            <PhoneCall className="w-3 h-3 text-blue-500" />
                            <span>{order.customerPhone}</span>
                          </a>
                        )}
                      </div>

                      {order.driverName && (
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 block font-sans">الكابتن المعين</span>
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1">
                            <Truck className="w-3 h-3 text-purple-600" />
                            <span className="truncate max-w-[90px]">{order.driverName}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* الأزرار الحصرية المحددة للطلب */}
                    <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                      {/* زر مراجعة أصناف الطلب وأتمتة النقل والتسعير */}
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(order)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>مراجعة أصناف الطلب وأتمتة النقل والتسعير</span>
                      </button>

                      {/* أزرار الإسناد وتغيير الكابتن */}
                      <div className="flex items-center gap-2">
                        {isNew && !isCancelled && !isCompleted && canEditOrders && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToAssign(order);
                              setIsAssignDriverModalOpen(true);
                            }}
                            className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>تأكيد واختيار مندوب</span>
                          </button>
                        )}

                        {hasDriverAssigned && !isCancelled && !isCompleted && canEditOrders && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToAssign(order);
                              setIsAssignDriverModalOpen(true);
                            }}
                            className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="إعادة تعيين أو اختيار مندوب بديل"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>تغيير الكابتن</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="عرض تفاصيل الفاتورة والعناصر"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>التفاصيل</span>
                        </button>
                      </div>

                      {/* أزرار إلغاء وحذف الطلب */}
                      <div className="flex items-center gap-2 pt-1 border-t border-dashed border-gray-100">
                        {!isCancelled && !isCompleted && canCancelOrders && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrderWithConfirm(order)}
                            className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>إلغاء الطلب</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>حذف الطلب</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== VIEW MODE 2: DRIVER APP INTERFACE ==================== */}
      {activeViewMode === 'driver' && (
        <div className="space-y-5">
          {/* Captain Selector Header */}
          <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-5 rounded-2xl text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/80 border-2 border-purple-400 flex items-center justify-center font-bold text-xl">
                  🚚
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>واجهة تطبيقات الكباتن والمندوبين</span>
                    <span className="bg-purple-500/40 text-purple-200 text-[10px] px-2 py-0.5 rounded-full border border-purple-400">
                      محاكاة حية
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    اختر حساب المندوب لمتابعة الطلبات الموكلة له، إدخال رقم الفاتورة، وتحديث حالة التوصيل.
                  </p>
                </div>
              </div>

              {/* Driver Select */}
              <div className="w-full sm:w-auto">
                <label className="text-[11px] font-bold text-purple-300 block mb-1">حدد حساب المندوب الحالي:</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 rounded-xl border border-purple-400 bg-slate-800 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {drivers.map((drv) => (
                    <option key={drv.phone || drv.id} value={drv.phone || drv.id}>
                      {drv.name} ({drv.phone}) - {drv.vehicleType || 'دراجة'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Captain Banner Details */}
            {selectedDriver && (
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">الكابتن الحالي:</span>
                  <strong className="text-white">{selectedDriver.name}</strong>
                  <span className="text-slate-300 font-mono">({selectedDriver.phone})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>المركبة: <strong className="text-amber-200">{selectedDriver.vehicleType} - {selectedDriver.plateNumber || 'بدون لوحة'}</strong></span>
                  <span className="bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400 font-bold">
                    عدد الطلبات المسندة: {driverAssignedOrders.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Orders for Selected Driver */}
          {driverAssignedOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">لا توجد طلبات مسندة حالياً للكابتن ({selectedDriver?.name})</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                قم بالانتقال لوجهة إدارة الطلبات وتعيين هذا الكابتن لأحد الطلبات الجديدة لتظهر هنا فوراً.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>الطلبات الموكلة للكابتن {selectedDriver?.name} ({driverAssignedOrders.length}):</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {driverAssignedOrders.map((order) => {
                  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.new;
                  const isInvoiceProvided = !!order.invoiceNumber && order.invoiceNumber.trim().length > 0;
                  const canDeliver = isInvoiceProvided;

                  return (
                    <div 
                      key={order.id}
                      className="bg-white rounded-2xl border border-purple-200 shadow-md overflow-hidden flex flex-col justify-between"
                    >
                      {/* Driver Order Header */}
                      <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
                        <div>
                          <span className="font-mono font-extrabold text-sm text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                            {order.orderNumber || `#${order.id.slice(0, 6)}`}
                          </span>
                          <span className="text-xs text-purple-200 mr-2 font-bold">{order.storeName}</span>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusConfig.badgeClass}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Driver Order Details */}
                      <div className="p-4 space-y-3 flex-1 text-xs">
                        {/* Customer Info & Phone */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                            <a 
                              href={`tel:${order.customerPhone}`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold px-3 py-1 rounded-lg flex items-center gap-1 dir-ltr text-xs shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{order.customerPhone}</span>
                            </a>
                          </div>
                          <p className="text-slate-600 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{order.address || 'عنوان العميل غير محدد'}</span>
                          </p>
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 block">تفاصيل الأصناف ({order.itemsCount || order.items?.length || 1}):</span>
                          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between font-medium text-slate-800">
                                  <span><strong className="text-purple-600 ml-1">{it.quantity}x</strong> {it.productName}</span>
                                  <span className="font-mono font-bold">{(it.price * it.quantity).toLocaleString()} ر.ي</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-500">طلب عام بقيمة {order.total?.toLocaleString()} ر.ي</p>
                            )}
                          </div>
                        </div>

                        {/* Invoice Enforcement Requirement Banner */}
                        <div className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                          isInvoiceProvided 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <Receipt className="w-4 h-4 text-purple-700" />
                              <span>رقم الفاتورة:</span>
                            </span>
                            {isInvoiceProvided ? (
                              <span className="font-mono text-sm bg-white px-2.5 py-0.5 rounded border border-emerald-300 font-extrabold text-emerald-800">
                                {order.invoiceNumber} ✅
                              </span>
                            ) : (
                              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                                يلزم إدخال رقم الفاتورة أولاً ⚠️
                              </span>
                            )}
                          </div>

                          {!isInvoiceProvided && (
                            <p className="text-[11px] text-amber-800 font-medium">
                              ⚠️ تنبيه المندوب: لا يمكنك تحويل حالة الطلب إلى (قيد التوصيل) حتى تقوم باستلام الشحنة وتدوين رقم الفاتورة أدناه.
                            </p>
                          )}
                        </div>

                        {/* Total price */}
                        <div className="flex items-center justify-between bg-purple-50 p-2.5 rounded-xl border border-purple-200 font-bold">
                          <span className="text-purple-900">المبلغ المطلوب تحصيله:</span>
                          <span className="text-purple-950 font-mono text-base">{order.total?.toLocaleString()} ر.ي</span>
                        </div>
                      </div>

                      {/* Driver Action Workflow Controls */}
                      <div className="p-3.5 bg-gray-50 border-t border-gray-200 space-y-2">
                        {/* Step 1: Input Invoice Number */}
                        {!isInvoiceProvided ? (
                          <button
                            onClick={() => {
                              setOrderForInvoice(order);
                              setInvoiceInput(order.invoiceNumber || '');
                              setIsInvoiceModalOpen(true);
                            }}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>استلام الطلب وإدخال رقم الفاتورة 📦</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>تم استلام الطلب وتوثيق الفاتورة</span>
                            </span>
                            <button
                              onClick={() => {
                                setOrderForInvoice(order);
                                setInvoiceInput(order.invoiceNumber || '');
                                setIsInvoiceModalOpen(true);
                              }}
                              className="text-[10px] text-emerald-800 underline hover:text-emerald-950"
                            >
                              تعديل رقم الفاتورة
                            </button>
                          </div>
                        )}

                        {/* Step 2: Transition Status to "Delivering" or "Delivered" */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Delivering Button */}
                          <button
                            disabled={!canDeliver || order.status === 'delivering' || order.status === 'delivered' || order.status === 'completed' || order.status === 'COMPLETED'}
                            onClick={async () => {
                              try {
                                setUpdatingOrderId(order.id);
                                if (!order.id.startsWith('local-')) {
                                  await setDoc(doc(db, 'orders', order.id), {
                                    status: 'delivering',
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                }
                                await onUpdateOrderStatus(order.id, 'delivering');
                                setLiveOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivering' } : o));
                              } finally {
                                setUpdatingOrderId(null);
                              }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              canDeliver && order.status !== 'delivering' && order.status !== 'delivered' && order.status !== 'completed' && order.status !== 'COMPLETED'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer'
                                : order.status === 'delivering'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300 font-extrabold'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            }`}
                            title={!canDeliver ? 'يلزم استلام الطلب وإدخال رقم الفاتورة أولاً' : ''}
                          >
                            <Truck className="w-4 h-4" />
                            <span>
                              {order.status === 'delivering' 
                                ? 'قيد التوصيل الآن 🚗' 
                                : !canDeliver 
                                ? '🔒 قيد التوصيل (مغلق)' 
                                : 'بدء التوصيل (قيد التوصيل)'}
                            </span>
                          </button>

                          {/* Completed Delivered Button */}
                          <button
                            disabled={order.status !== 'delivering'}
                            onClick={async () => {
                              try {
                                setUpdatingOrderId(order.id);
                                if (!order.id.startsWith('local-')) {
                                  await setDoc(doc(db, 'orders', order.id), {
                                    status: 'completed',
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                }
                                await onUpdateOrderStatus(order.id, 'completed');
                                setLiveOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o));
                              } finally {
                                setUpdatingOrderId(null);
                              }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              order.status === 'delivering'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                                : (order.status === 'delivered' || order.status === 'completed' || order.status === 'COMPLETED')
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {(order.status === 'delivered' || order.status === 'completed' || order.status === 'COMPLETED') ? 'تم التسليم بنجاح ✅' : 'تأكيد التسليم للعميل'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL 1: ASSIGN DRIVER MODAL ==================== */}
      {isAssignDriverModalOpen && orderToAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">تأكيد قبول الطلب واختيار الكابتن المندوب</h3>
                  <p className="text-[11px] text-slate-300">
                    الطلب {orderToAssign.orderNumber || `#${orderToAssign.id.slice(0, 6)}`} - {orderToAssign.storeName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAssignDriverModalOpen(false);
                  setOrderToAssign(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Customer Contact Prompt */}
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-sm">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span>التواصل مع العميل لتأكيد الطلب:</span>
                  </span>
                  <a 
                    href={`tel:${orderToAssign.customerPhone}`}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                  >
                    <span>اتصال بالعميل ({orderToAssign.customerPhone})</span>
                  </a>
                </div>
                <p className="text-[11px] text-amber-800">
                  تواصل مع العميل <strong className="text-slate-900">({orderToAssign.customerName})</strong> لطلب التأكيد النهائي أو استفسار العنوان قبل قبول الطلب وتحويله للمندوب.
                </p>
              </div>

              {/* Driver Selection Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">اختر أحد المندوبين المسجلين لتسليم الطلب:</label>
                  <span className="text-[11px] text-slate-400">إجمالي المندوبين ({drivers.length})</span>
                </div>

                {/* Driver Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={driverSearchTerm}
                    onChange={(e) => setDriverSearchTerm(e.target.value)}
                    placeholder="ابحث باسم المندوب أو رقم الهاتف أو المركبة..."
                    className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Drivers List Grid */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {drivers
                    .filter(d => 
                      !driverSearchTerm.trim() || 
                      d.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
                      d.phone.includes(driverSearchTerm) ||
                      (d.vehicleType && d.vehicleType.includes(driverSearchTerm))
                    )
                    .map((driver) => {
                      const isCurrentlyAssigned = 
                        orderToAssign.driverId === driver.phone || 
                        orderToAssign.driverId === driver.id ||
                        (orderToAssign.driverPhone && orderToAssign.driverPhone === driver.phone);

                      return (
                        <div 
                          key={driver.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrentlyAssigned
                              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
                              : 'bg-white hover:bg-slate-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center shrink-0">
                              🚚
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">{driver.name}</span>
                                <span className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {driver.phone} • {driver.vehicleType || 'دراجة'} ({driver.plateNumber || 'بدون لوحة'})
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAssignDriverSubmit(driver)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>{isCurrentlyAssigned ? 'المندوب الحالي ✅' : 'قبول وتعيين المندوب 🚀'}</span>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Admin Cancel Option */}
              {canCancelOrders && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">في حال عدم رغبة العميل بالطلب:</span>
                  <button
                    onClick={() => {
                      handleStatusChange(orderToAssign.id, 'cancelled');
                      setIsAssignDriverModalOpen(false);
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-200 cursor-pointer"
                  >
                    إلغاء الطلب من الإدارة 🔴
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1.5: ADMIN ORDER REVIEW & VEHICLE ASSIGNMENT MODAL ==================== */}
      {isReviewModalOpen && orderToReview && (() => {
        const selectedVehicle = findVehicleType(reviewVehicleId, vehiclesList);
        const calc = calculateDeliveryCost({
          roadDistanceKm: reviewDistanceKm,
          vehicle: selectedVehicle,
          serviceType: 'regular',
          pricingSettings
        });
        const itemsSubtotal = orderToReview.items && orderToReview.items.length > 0
          ? orderToReview.items.reduce((sum, it) => sum + (it.price * it.quantity), 0)
          : (orderToReview.subtotal || Math.max(0, (orderToReview.total || 1500) - (orderToReview.deliveryFee || 500)));
        const finalGrandTotal = itemsSubtotal + calc.finalDeliveryFee;

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                    🚗
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">مراجعة أصناف الطلب واعتماد وسيلة النقل والتسعير</h3>
                    <p className="text-[11px] text-slate-300">
                      الطلب {orderToReview.orderNumber || `#${orderToReview.id.slice(0, 6)}`} • {orderToReview.storeName || 'المتجر'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setOrderToReview(null);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar text-xs">
                {/* Customer & Store Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">بيانات العميل:</span>
                    <p className="font-bold text-slate-900 text-xs">{orderToReview.customerName}</p>
                    <p className="text-slate-600 font-mono text-[11px]">{orderToReview.customerPhone}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{orderToReview.address || 'العنوان غير محدد بدقة'}</p>
                  </div>

                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 space-y-1">
                    <span className="text-[11px] font-bold text-blue-700 block">المتجر / الفرع:</span>
                    <p className="font-bold text-blue-950 text-xs">{orderToReview.storeName || 'متجر معتمد'}</p>
                    <p className="text-blue-800 text-[11px]">طريقة الدفع: {orderToReview.paymentMethod === 'jawali' ? 'محفظة جوالي / إلكتروني' : orderToReview.paymentMethod === 'card' ? 'بطاقة بنكية' : 'الدفع عند الاستلام (كاش)'}</p>
                    {orderToReview.notes && (
                      <p className="text-amber-800 text-[10px] bg-amber-100/60 px-2 py-0.5 rounded">ملاحظة: {orderToReview.notes}</p>
                    )}
                  </div>
                </div>

                {/* Items & Quantities Review Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <span>مراجعة المنتجات والكميات المطلوبة ({orderToReview.items?.length || 1}):</span>
                    </span>
                    <span className="text-[11px] font-bold text-blue-700 font-mono">
                      إجمالي الأصناف: {itemsSubtotal.toLocaleString()} ر.ي
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                    {orderToReview.items && orderToReview.items.length > 0 ? (
                      orderToReview.items.map((it, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/50">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center">
                              {it.quantity}x
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{it.productName}</p>
                              {it.options && it.options.length > 0 && (
                                <p className="text-[10px] text-slate-400">{it.options.join(' • ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-left font-mono">
                            <span className="font-bold text-slate-900">{(it.price * it.quantity).toLocaleString()} ر.ي</span>
                            <span className="text-[10px] text-slate-400 block">({it.price} ر.ي/قطعة)</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-slate-500">تفاصيل الأصناف مرتبطة بقائمة المتجر.</div>
                    )}
                  </div>
                </div>

                {/* Weight Review & Automatic Capacity Upgrade Section */}
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-700" />
                      <span>مراجعة واحتساب وزن الطلب (سعة الحمولة):</span>
                    </span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-950 font-bold px-2 py-0.5 rounded font-mono">
                      تقدير تلقائي ذكي
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={reviewWeightKg}
                        onChange={(e) => {
                          const w = Math.max(0.1, Number(e.target.value) || 1);
                          setReviewWeightKg(w);
                          const suggested = suggestVehicleByWeight(w, vehiclesList);
                          setReviewVehicleId(suggested.id);
                        }}
                        className="w-24 px-3 py-1.5 rounded-xl border border-amber-300 font-mono font-bold text-center bg-white focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-bold text-slate-700">كجم (KG)</span>
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 5, 15, 50, 120].map(wVal => (
                        <button
                          key={wVal}
                          type="button"
                          onClick={() => {
                            setReviewWeightKg(wVal);
                            const suggested = suggestVehicleByWeight(wVal, vehiclesList);
                            setReviewVehicleId(suggested.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            reviewWeightKg === wVal 
                              ? 'bg-amber-600 text-white border-amber-600' 
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {wVal} كجم
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight Auto-Recommendation Feedback */}
                  {(() => {
                    const rec = getVehicleRecommendationInfo(reviewWeightKg, selectedVehicle, vehiclesList);
                    if (rec.isUpgraded) {
                      return (
                        <div className="bg-white/80 p-2 rounded-lg border border-amber-300 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{rec.message}</span>
                        </div>
                      );
                    }
                    return (
                      <p className="text-[10px] text-slate-500">
                        سعة الحمولة: الدراجة حتى 15 كجم • السيارة من 15-100 كجم • الشاحنة لأكثر من 100 كجم
                      </p>
                    );
                  })()}
                </div>

                {/* Road Routing Distance Config */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      <span>المسافة الطرقية الواقعية (Road Network Distance):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setVerificationOrder(orderToReview)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>📍 معاينة النقطتين على الخريطة</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <input 
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={reviewDistanceKm}
                        onChange={(e) => setReviewDistanceKm(Math.max(0.5, Number(e.target.value) || 1))}
                        className="w-24 px-3 py-1.5 rounded-xl border border-gray-300 font-mono font-bold text-center bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-700">كيلومتر (كم)</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      محسوبة بناءً على شبكة الشوارع والانعطافات بدلاً من المسافة الهوائية
                    </span>
                  </div>
                </div>

                {/* Vehicle Selection Grid */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-xs block">
                    اختر نوع وسيلة النقل المناسبة لحجم ووزن هذا الطلب:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {vehiclesList.filter(v => v.isActive).map((veh) => {
                      const isSelected = reviewVehicleId === veh.id;
                      const isMotorcycle = veh.name.includes('دراجة') || veh.icon === 'Bike';
                      const isCar = veh.name.includes('سيارة') || veh.icon === 'Car';
                      const isTruck = veh.name.includes('شاحنة') || veh.icon === 'Truck';

                      return (
                        <div
                          key={veh.id}
                          onClick={() => setReviewVehicleId(veh.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/50 shadow-xs' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isMotorcycle ? '🏍️' : isCar ? '🚗' : '🚚'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs leading-tight">{veh.name}</p>
                              <span className="text-[10px] text-slate-400">{veh.maxVolumeDescription || 'حسب الأسطول'}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 text-[11px] space-y-0.5">
                            <div className="flex justify-between text-slate-600">
                              <span>سعر الكيلو:</span>
                              <strong className="font-mono text-blue-700">{veh.pricePerKm} ر.ي/كم</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>الحد الأدنى:</span>
                              <strong className="font-mono text-amber-700">{veh.minDeliveryFee} ر.ي</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Breakdown Box */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      <span>تفاصيل التسعير النهائي المعتمد:</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      calc.minApplied ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {calc.minApplied ? 'تم تطبيق الحد الأدنى المعتمد 📌' : 'حساب مباشر حسب الكيلومترات ✅'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">إجمالي المنتجات</span>
                      <strong className="font-mono text-slate-100 text-sm mt-0.5 block">{itemsSubtotal.toLocaleString()} ر.ي</strong>
                    </div>

                    <div className="bg-slate-800 p-2 rounded-lg">
                      <span className="text-[10px] text-blue-300 block">رسوم التوصيل ({selectedVehicle.name})</span>
                      <strong className="font-mono text-blue-300 text-sm mt-0.5 block">{calc.finalDeliveryFee.toLocaleString()} ر.ي</strong>
                    </div>

                    <div className="bg-emerald-950/80 border border-emerald-500/40 p-2 rounded-lg">
                      <span className="text-[10px] text-emerald-300 block">الإجمالي الكلي النهائي</span>
                      <strong className="font-mono text-emerald-400 text-base mt-0.5 block">{finalGrandTotal.toLocaleString()} ر.ي</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono text-center pt-1">
                    {calc.calculationBreakdown}
                  </p>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    ملاحظات الإدارة للطلب (تظهر للمندوب والعميل):
                  </label>
                  <input 
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="مثال: تم اختيار سيارة لتوصيل كراتين السوبرماركت بأمان..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setOrderToReview(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-200 font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={handleApproveOrderReview}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>اعتماد وسيلة النقل وإرسال الموافقة للعميل 🚀</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== MODAL 2: INVOICE IMAGE UPLOAD MODAL ==================== */}
      {isInvoiceModalOpen && orderForInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">📸 رفع الفاتورة وإنهاء تسليم الطلب</h3>
              </div>
              <button 
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  setOrderForInvoice(null);
                  setInvoiceImagePreview(null);
                }}
                className="p-1 text-purple-300 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-purple-900 space-y-1">
                <p><span className="text-purple-600 font-bold">الطلب:</span> #{orderForInvoice.orderNumber || orderForInvoice.id.slice(0, 6)} ({orderForInvoice.storeName})</p>
                <p><span className="text-purple-600 font-bold">العميل:</span> {orderForInvoice.customerName} - {orderForInvoice.customerPhone}</p>
                <p><span className="text-purple-600 font-bold">المبلغ:</span> {(orderForInvoice.total || orderForInvoice.totalPrice || 0).toLocaleString()} ر.ي</p>
              </div>

              {/* Image Upload Widget */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  التقط أو ارفع صورة الفاتورة الورقية الصادرة من المتجر:
                </label>

                {invoiceImagePreview ? (
                  <div className="relative rounded-xl border-2 border-dashed border-purple-400 p-2 bg-purple-50/50 flex flex-col items-center gap-2">
                    <img 
                      src={invoiceImagePreview} 
                      alt="معاينة الفاتورة" 
                      className="max-h-48 rounded-lg object-contain border border-purple-200 shadow-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="bg-white hover:bg-gray-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                        تغيير الصورة
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={handleInvoiceImageChange} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setInvoiceImagePreview(null)}
                        className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-purple-500 bg-gray-50 hover:bg-purple-50/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">اضغط لالتقاط أو اختيار صورة الفاتورة</span>
                    <span className="text-[10px] text-slate-400">يدعم الصور المباشرة من الكاميرا والمعرض</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleInvoiceImageChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  رقم الفاتورة المسجل من المتجر:
                </label>
                <input 
                  type="text" 
                  value={invoiceInput}
                  onChange={(e) => setInvoiceInput(e.target.value)}
                  placeholder="مثال: INV-1002"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setOrderForInvoice(null);
                    setInvoiceImagePreview(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvoice}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {isSubmittingInvoice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>[ تم تسليم الطلب ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: VIEW ORDER DETAILS ==================== */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">تفاصيل وسند الطلب {viewingOrder.orderNumber || `#${viewingOrder.id.slice(0, 6)}`}</h3>
                  <p className="text-[11px] text-slate-300">{viewingOrder.storeName}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingOrder(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Status Header */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span>حالة الطلب الحالية:</span>
                <span className={`font-bold px-3 py-1 rounded-full border ${ORDER_STATUS_CONFIG[viewingOrder.status]?.badgeClass || ''}`}>
                  {ORDER_STATUS_CONFIG[viewingOrder.status]?.label}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block">معلومات العميل:</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p><span className="text-slate-400">الاسم:</span> <strong className="text-slate-800">{viewingOrder.customerName}</strong></p>
                  <p><span className="text-slate-400">الهاتف:</span> <strong className="text-slate-800 font-mono">{viewingOrder.customerPhone || 'غير مسجل'}</strong></p>
                  <p><span className="text-slate-400">العنوان:</span> <span className="text-slate-700">{viewingOrder.address || 'استلام من المتجر'}</span></p>
                </div>
              </div>

              {/* Driver & Invoice Info OR Global Order Service Info */}
              {isOrderGlobal(viewingOrder) ? (
                <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200 space-y-1.5 text-indigo-950">
                  <div className="flex items-center justify-between">
                    <p className="font-bold flex items-center gap-1.5 text-indigo-800 text-xs">
                      <Globe className="w-4 h-4" />
                      <span>نوع الخدمة: شحن واستيراد دولي (المتاجر العالمية)</span>
                    </p>
                    <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">طلب خارجي</span>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    المتجر المصدر: <strong>{viewingOrder.storeName || 'متجر دولي'}</strong> — يتم شحن البضائع واستلامها في مستودعات التجميع الدولية قبل التوصيل للعميل.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 block">معلومات التوصيل والفاتورة:</span>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-2 text-purple-950">
                    <p><span className="text-purple-600 font-bold">المندوب المسند:</span> <strong>{viewingOrder.driverName || 'لم يتم التحديد بعد'}</strong> {viewingOrder.driverPhone ? `(${viewingOrder.driverPhone})` : ''}</p>
                    <p><span className="text-purple-600 font-bold">ملاحظة الفاتورة:</span> <strong className="font-mono text-emerald-800">{viewingOrder.invoiceNumber || 'تم إرفاق صورة الفاتورة'}</strong></p>
                    
                    {viewingOrder.invoiceImageUrl && (
                      <div className="pt-2 border-t border-purple-200 space-y-1">
                        <span className="text-xs font-bold text-purple-900 block">صورة الفاتورة المرفوعة من المندوب:</span>
                        <div className="rounded-xl overflow-hidden border border-purple-200 bg-slate-900 flex justify-center p-2 max-h-48">
                          <img 
                            src={viewingOrder.invoiceImageUrl} 
                            alt="صورة الفاتورة الورقية" 
                            className="max-h-44 object-contain rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">قائمة أصناف الطلب:</span>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {viewingOrder.items && viewingOrder.items.length > 0 ? (
                    viewingOrder.items.map((it, idx) => {
                      const prodName = it.product_snapshot?.name || it.product_snapshot?.productName || (it as any).لقطة_المنتج?.name || it.productName || it.name;
                      const prodUrl = it.product_snapshot?.productUrl || it.product_snapshot?.sourceUrl || (it as any).لقطة_المنتج?.productUrl || it.productUrl || it.sourceUrl;
                      const prodImg = it.product_snapshot?.imageUrl || (it as any).لقطة_المنتج?.imageUrl || it.imageUrl;
                      const specs = it.specs_snapshot || (it as any).لقطة_المواصفات || {};
                      const size = specs.size || it.size;
                      const color = specs.color || it.color;
                      const itemTotal = it.totalPrice || ((it.price || 0) * (it.quantity || 1));

                      return (
                        <div key={idx} className="p-3 flex items-center justify-between bg-white gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {prodImg && (
                              <img 
                                src={prodImg} 
                                alt={prodName} 
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900">{prodName}</p>
                                {prodUrl && (
                                  <a 
                                    href={prodUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold"
                                  >
                                    <span>عرض في المتجر</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {(size || color || (it.options && it.options.length > 0)) && (
                                <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px] text-slate-500">
                                  {size && <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono">المقاس: {size}</span>}
                                  {color && <span className="bg-slate-100 px-1.5 py-0.2 rounded">اللون: {color}</span>}
                                  {it.options && it.options.length > 0 && <span>({it.options.join(', ')})</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-left font-mono shrink-0">
                            <p className="font-bold text-slate-900">{it.quantity || 1} x {(it.price || 0).toLocaleString()} ر.ي</p>
                            <p className="text-[11px] text-slate-500">{itemTotal.toLocaleString()} ر.ي</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-slate-500">تفاصيل الاصناف مرتبطة بمنتجات المتجر.</div>
                  )}
                </div>
              </div>

              {/* Total Calculation */}
              {isOrderGlobal(viewingOrder) ? (
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-1 text-slate-800 font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-normal">الشحن الخارجي والتخليص:</span>
                    <span className="font-mono">{(viewingOrder.deliveryFee || 0) > 0 ? `${(viewingOrder.deliveryFee || 0).toLocaleString()} ر.ي` : 'يحدد هاتفياً'}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-indigo-200">
                    <span>الإجمالي الكلي المعتمد:</span>
                    <span className="text-indigo-700 font-mono text-base">{viewingOrder.total?.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-1 text-slate-800 font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-normal">رسوم التوصيل:</span>
                    <span className="font-mono">{(viewingOrder.deliveryFee || 400).toLocaleString()} ر.ي</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-blue-200">
                    <span>الإجمالي الكلي المستحق:</span>
                    <span className="text-blue-700 font-mono text-base">{viewingOrder.total?.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="bg-white hover:bg-gray-100 border border-gray-300 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </button>
              
              <button
                onClick={() => setViewingOrder(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: QUICK ADD MANUAL ORDER ==================== */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>إضافة طلب جديد يدوياً</span>
              </h3>
              <button onClick={() => setIsNewOrderModalOpen(false)}>
                <XCircle className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrderSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">المتجر / المطعم المصدر:</label>
                <select 
                  value={newStoreId}
                  onChange={(e) => setNewStoreId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                >
                  {safeStores.map((st, idx) => (
                    <option key={st.id || `store-opt-${idx}`} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم العميل:</label>
                <input 
                  type="text" 
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="مثال: عبد الله السقاف"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم هاتف العميل:</label>
                <input 
                  type="text" 
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المنتج / الصنف:</label>
                <input 
                  type="text" 
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="مثال: وجبة برجر دبل تشيز"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">سعر الصنف (ر.ي):</label>
                  <input 
                    type="number" 
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الكمية:</label>
                  <input 
                    type="number" 
                    min={1}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان التوصيل:</label>
                <input 
                  type="text" 
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات إضافية:</label>
                <textarea 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="أي تعليمات سريعة..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-100 font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingOrder}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {isSubmittingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>إضافة الطلب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: TEST ORDER MODAL (Requirement 1) ==================== */}
      {isTestOrderModalOpen && (
        <TestOrderModal
          isOpen={isTestOrderModalOpen}
          onClose={() => setIsTestOrderModalOpen(false)}
          onAddOrder={async (newOrderData) => {
            if (onCreateOrder) {
              await onCreateOrder(newOrderData);
            }
          }}
        />
      )}

      {/* ==================== MODAL: CLEAN ORDER DETAIL MODAL ==================== */}
      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={Boolean(selectedDetailOrder)}
        onClose={() => setSelectedDetailOrder(null)}
        onAssignDriver={(order) => {
          setOrderToAssign(order);
          setIsAssignDriverModalOpen(true);
        }}
        onCancelOrder={(order) => {
          handleCancelOrderWithConfirm(order);
        }}
        onDeleteOrder={(order) => {
          handleDeleteOrder(order.id);
        }}
        canCancelOrders={canCancelOrders}
      />

      {/* ==================== MODAL 4: DISTANCE & ROUTING VERIFICATION MODAL (Requirement 2) ==================== */}
      {verificationOrder && (
        <DistanceVerificationModal
          isOpen={!!verificationOrder}
          onClose={() => setVerificationOrder(null)}
          order={verificationOrder}
        />
      )}
    </div>
  );
};

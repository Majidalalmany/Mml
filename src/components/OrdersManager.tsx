import React, { useState, useMemo, useEffect } from 'react';
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
  PhoneCall
} from 'lucide-react';
import { Order, OrderStatus, Store, AdminUser, DriverUser, VehicleType } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { ORDER_STATUS_CONFIG } from '../constants/orderStatus';
import { db, collection, addDoc, onSnapshot, query } from '../lib/firebase';
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
  orders: Order[];
  stores: Store[];
  currentUser: AdminUser | null;
  isLoading: boolean;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, extraData?: Partial<Order>) => Promise<void>;
  onCreateOrder?: (orderData: Partial<Order>) => Promise<void>;
  onSeedOrders?: () => Promise<void>;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders = [],
  stores = [],
  currentUser,
  isLoading,
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
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

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

  // Realtime Orders Listener from Firestore 'orders' collection
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders);

  useEffect(() => {
    try {
      const ordersQuery = query(collection(db, 'orders'));
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const list: Order[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const isGlobal = Boolean(
            data.orderType === 'global_store' ||
            data.orderType?.includes?.('global_store') ||
            data.orderType?.includes?.('متجر عالمي') ||
            data.orderScope === 'international' ||
            data.serviceType === 'global_store' ||
            data.isGlobalStore
          );

          return {
            id: docSnap.id,
            orderNumber: data.orderNumber || `ORD-${docSnap.id.substring(0, 5)}`,
            customerName: data.customerName || data.userName || 'عميل',
            customerPhone: data.customerPhone || data.phone || '',
            address: data.deliveryAddress || data.address || data.dropoffAddress || '',
            storeId: data.storeId || '',
            storeName: isGlobal ? 'طلب متجر عالمي' : (data.storeName || (data.items?.[0]?.storeName) || 'متجر عام'),
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
        setLiveOrders(list);
      }, (err) => {
        console.warn('Orders onSnapshot error in OrdersManager:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Orders listener setup error in OrdersManager:', e);
    }
  }, []);

  // Sync prop changes when passed from App
  useEffect(() => {
    if (orders && orders.length > 0) {
      setLiveOrders(prev => {
        const map = new Map<string, Order>();
        prev.forEach(o => map.set(o.id, o));
        orders.forEach(o => map.set(o.id, o));
        return Array.from(map.values());
      });
    }
  }, [orders]);

  const safeOrders = liveOrders.length > 0 ? liveOrders : (orders || []);
  const safeStores = stores || [];

  // Firestore Realtime Drivers Listener
  useEffect(() => {
    try {
      const driversQuery = query(collection(db, 'drivers'));
      const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
        const fetchedList: DriverUser[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as DriverUser[];

        if (fetchedList.length > 0) {
          // Merge fetched with defaults to ensure complete list
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

      return () => unsubscribe();
    } catch (e) {
      setDrivers(DEFAULT_DRIVERS);
    }
  }, []);

  // Filtered orders for Admin View
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((order) => {
      // Status filter
      if (selectedStatusTab !== 'all') {
        if (selectedStatusTab === 'pending_review') {
          const isPending = 
            order.status === 'pending_review' || 
            order.status === 'PENDING_REVIEW' || 
            order.status === 'pending' || 
            order.status === 'PENDING' || 
            Boolean(order.needsAdminReview);
          if (!isPending) return false;
        } else if (selectedStatusTab === 'new') {
          const isNew = 
            order.status === 'new' || 
            order.status === 'NEW' || 
            order.status === 'pending' || 
            order.status === 'PENDING' || 
            order.status === 'pending_review' || 
            order.status === 'PENDING_REVIEW' || 
            Boolean(order.needsAdminReview);
          if (!isNew) return false;
        } else if (selectedStatusTab === 'preparing') {
          const isPrep = 
            order.status === 'preparing' || 
            order.status === 'PREPARING' || 
            order.status === 'confirmed' || 
            order.status === 'CONFIRMED' || 
            order.status === 'approved' || 
            order.status === 'APPROVED';
          if (!isPrep) return false;
        } else if (selectedStatusTab === 'global_stores') {
          const isGlobal = order.orderType === 'global_store' || order.storeCategory === 'المتاجر العالمية';
          if (!isGlobal) return false;
        } else if (order.status !== selectedStatusTab) {
          return false;
        }
      }

      // Store filter
      if (selectedStoreId !== 'all') {
        const storeObj = safeStores.find(s => s.id === selectedStoreId);
        if (order.storeId && order.storeId !== selectedStoreId) return false;
        if (!order.storeId && storeObj && order.storeName !== storeObj.name) return false;
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
        const itemMatch = order.items?.some(i => i.productName.toLowerCase().includes(term));
        if (!numMatch && !nameMatch && !phoneMatch && !storeMatch && !addressMatch && !driverMatch && !itemMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [safeOrders, safeStores, selectedStatusTab, selectedStoreId, searchTerm]);

  // Orders assigned to selected driver in Driver View
  const selectedDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];
  const driverAssignedOrders = useMemo(() => {
    if (!selectedDriver) return [];
    return safeOrders.filter(o => 
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
      await onUpdateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed updating order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handler for Admin to confirm order after calling the customer
  const handleConfirmOrderAfterCall = async (order: Order) => {
    if (!canEditOrders) return;
    try {
      setUpdatingOrderId(order.id);
      const nowIso = new Date().toISOString();
      const adminName = currentUser?.name || 'مدير النظام';
      await onUpdateOrderStatus(order.id, 'confirmed', {
        status: 'confirmed',
        needsAdminReview: false,
        confirmedByAdminAt: nowIso,
        confirmedByAdminName: adminName,
        adminReviewNotes: `تم التأكيد هاتفياً مع العميل (${order.customerPhone || order.customerName}) بنجاح بواسطة ${adminName}.`
      });

      // Update local state directly
      setLiveOrders(prev => prev.map(o => o.id === order.id ? {
        ...o,
        status: 'confirmed',
        needsAdminReview: false,
        confirmedByAdminAt: nowIso,
        confirmedByAdminName: adminName
      } : o));
    } catch (err) {
      console.error('Failed confirming order after call:', err);
      alert('حدث خطأ أثناء تأكيد الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handler when Admin assigns a driver and accepts order
  const handleAssignDriverSubmit = async (driver: DriverUser) => {
    if (!orderToAssign) return;
    try {
      setUpdatingOrderId(orderToAssign.id);
      await onUpdateOrderStatus(orderToAssign.id, 'preparing', {
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone
      });
      setIsAssignDriverModalOpen(false);
      setOrderToAssign(null);
    } catch (err) {
      console.error('Failed assigning driver:', err);
    } finally {
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

  // Handler for Driver to save invoice photo & number and receive/deliver order
  const handleSaveInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForInvoice || (!invoiceImagePreview && !invoiceInput.trim())) return;

    try {
      setIsSubmittingInvoice(true);
      const nowIso = new Date().toISOString();
      const finalImage = invoiceImagePreview || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800';
      const activeDriverName = orderForInvoice.driverName || selectedDriver?.name || currentUser?.name || 'كابتن التوصيل';
      const activeDriverId = orderForInvoice.driverId || selectedDriver?.id || currentUser?.id || 'drv-gen';

      // 1. Update Order document with invoice photo details and change status to delivering
      await onUpdateOrderStatus(orderForInvoice.id, 'delivering', {
        invoiceNumber: invoiceInput.trim() || `INV-${orderForInvoice.orderNumber || orderForInvoice.id.slice(0, 6)}`,
        invoiceImageUrl: finalImage,
        invoiceUploadTime: nowIso,
        invoiceDriverId: activeDriverId,
        invoiceDriverName: activeDriverName,
        receivedByDriverAt: nowIso
      });

      // 2. Save record in driver_invoices Firestore collection
      try {
        await addDoc(collection(db, 'driver_invoices'), {
          orderId: orderForInvoice.id,
          orderNumber: orderForInvoice.orderNumber || orderForInvoice.id,
          orderType: 'regular',
          driverId: activeDriverId,
          driverName: activeDriverName,
          driverPhone: orderForInvoice.driverPhone || selectedDriver?.phone || '',
          customerName: orderForInvoice.customerName,
          storeName: orderForInvoice.storeName || 'المتجر',
          imageUrl: finalImage,
          uploadedAt: nowIso,
          amount: orderForInvoice.total || orderForInvoice.totalPrice || 0,
          notes: invoiceInput.trim(),
          createdAt: nowIso
        });
      } catch (errDb) {
        console.warn('Could not save to driver_invoices collection:', errDb);
      }

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

              {/* Store Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full md:w-56 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">جميع المتاجر والمطاعم</option>
                  {safeStores.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders List Grid */}
          {isLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">جاري تحميل وتحديث الطلبات مباشرة من Firestore...</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                (() => {
                  const rawStatus = order.status;
                  const statusConfig = ORDER_STATUS_CONFIG[rawStatus] || ORDER_STATUS_CONFIG.new;
                  const StatusIcon = statusConfig.Icon;

                  const isGlobalOrder = Boolean(
                    order.orderType === 'global_store' ||
                    order.orderType?.includes('global_store') ||
                    order.orderType?.includes('متجر عالمي') ||
                    order.orderScope === 'international' ||
                    order.serviceType === 'global_store' ||
                    order.isGlobalStore ||
                    (order.items && order.items.some((it: any) => it.productUrl || it.sourceUrl || it.storeName?.includes('أمازون') || it.storeName?.includes('Amazon') || it.storeName?.includes('AliExpress') || it.storeName?.includes('SHEIN') || it.storeName?.includes('شي إن')))
                  );

                  return (
                    <div 
                      key={order.id}
                      className={`bg-white rounded-2xl border ${statusConfig.borderColor} shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between`}
                    >
                    {/* Card Header */}
                    <div className="p-4 bg-slate-50/60 border-b border-gray-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-extrabold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {order.orderNumber || `#${order.id.slice(0, 6)}`}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {isGlobalOrder ? (
                              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-lg font-bold">
                                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>طلب متجر عالمي</span>
                                {order.items && order.items.length > 0 && order.items[0]?.storeName && (
                                  <span className="text-[10px] text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-indigo-100 font-sans">
                                    {Array.from(new Set(order.items.map(i => i.storeName).filter(Boolean))).join(' / ') || order.storeName}
                                  </span>
                                )}
                              </span>
                            ) : (
                              order.storeName || 'متجر عام'
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                          </span>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative">
                        {canEditOrders ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={rawStatus}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all ${statusConfig.badgeClass}`}
                            >
                              <option value="new">🟡 جديد (بانتظار التأكيد)</option>
                              <option value="pending">🟠 قيد المراجعة والتدقيق</option>
                              <option value="confirmed">🟢 تم التأكيد هاتفياً</option>
                              <option value="preparing">🔵 قيد التحضير (تحديد مندوب)</option>
                              <option value="delivering">🟣 قيد التوصيل</option>
                              <option value="delivered">🟢 مكتمل / تم التسليم</option>
                              {canCancelOrders && <option value="cancelled">🔴 إلغاء عبر الإدارة</option>}
                              <option value="returned">⚪ تم الإرجاع</option>
                            </select>
                            {updatingOrderId === order.id && (
                              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                            )}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${statusConfig.badgeClass}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusConfig.label}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body Details */}
                    {isGlobalOrder ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                           <span className="font-bold text-sm text-indigo-900">{order.customerName}</span>
                           <a href={`tel:${order.customerPhone}`} className="bg-white text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200 shadow-sm">
                             <PhoneCall className="w-3 h-3" /> {order.customerPhone || 'اتصال'}
                           </a>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500">المنتجات المطلوبة:</span>
                          {order.items?.map((item, idx) => (
                             <div key={idx} className="flex gap-3 text-xs bg-slate-50 p-2 rounded-lg items-center">
                               <img src={item.imageUrl || item.image || 'https://via.placeholder.com/60'} alt={item.productName} className="w-12 h-12 object-cover rounded-md border" />
                               <div className="flex-1">
                                 <p className="font-bold text-slate-800">{item.productName}</p>
                                 <p className="text-slate-500">الكمية: {item.quantity} | اللون: {item.color || '-'} | المقاس: {item.size || '-'}</p>
                               </div>
                             </div>
                          ))}
                        </div>
                        <a href={order.items?.[0]?.url || order.items?.[0]?.productUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors">
                          🔗 فتح رابط المنتج في المتجر الأصلي
                        </a>
                        <div className="space-y-2 pt-2 border-t">
                          <input 
                            type="number" 
                            placeholder="أدخل السعر النهائي المحسوب (ر.ي)" 
                            className="w-full text-xs p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                            value={finalPriceInput[order.id] || ''}
                            onChange={(e) => setFinalPriceInput({...finalPriceInput, [order.id]: e.target.value})}
                          />
                          <button 
                            onClick={() => handleConfirmGlobalOrder(order)}
                            disabled={updatingOrderId === order.id}
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-700 transition-colors"
                          >
                             {updatingOrderId === order.id ? 'جاري التأكيد...' : 'تأكيد الطلب بعد الاتصال بالعميل'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3 flex-1">
                        {/* Customer & Phone with Admin Call Action */}
                        <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-900">{order.customerName}</span>
                          </div>
                          {order.customerPhone && (
                            <a 
                              href={`tel:${order.customerPhone}`}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5 dir-ltr transition-colors border border-blue-200"
                              title="التواصل مع العميل لتأكيد الطلب"
                            >
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span>{order.customerPhone}</span>
                              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-sans">تأكيد 📞</span>
                            </a>
                          )}
                        </div>

                      {/* Driver & Invoice Info Badge */}
                      <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-purple-700" />
                            <span>المندوب المسند:</span>
                          </span>
                          {order.driverName ? (
                            <span className="font-bold text-purple-950 bg-white px-2 py-0.5 rounded border border-purple-200">
                              {order.driverName} ({order.driverPhone || 'بدون هاتف'})
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setOrderToAssign(order);
                                setIsAssignDriverModalOpen(true);
                              }}
                              className="text-[11px] bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1 rounded-lg transition-all"
                            >
                              + اختيار كابتن توصيل
                            </button>
                          )}
                        </div>

                        {/* Invoice Number Status */}
                        <div className="flex items-center justify-between border-t border-purple-200/60 pt-1.5 text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                            <span>رقم الفاتورة المسجل:</span>
                          </span>
                          {order.invoiceNumber ? (
                            <span className="font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              {order.invoiceNumber} ✅
                            </span>
                          ) : (
                            <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold border border-amber-200">
                              بانتظار إدخال الكابتن للفاتورة ⏳
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items List Summary */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 block">الأصناف المطلوبة ({order.itemsCount || order.items?.length || 1}):</span>
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                                <span className="font-medium">
                                  <span className="font-bold text-blue-600 ml-1">{it.quantity}x</span>
                                  {it.productName}
                                  {it.options && it.options.length > 0 && (
                                    <span className="text-[10px] text-slate-400 mr-1">({it.options.join(', ')})</span>
                                  )}
                                </span>
                                <span className="font-bold font-mono text-slate-800">{(it.price * it.quantity).toLocaleString()} ر.ي</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600 font-medium bg-gray-50 p-2 rounded-lg">
                            طلب منتجات من {order.storeName || 'المتجر'} (إجمالي: {order.total?.toLocaleString()} ر.ي)
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      {order.address && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{order.address}</span>
                        </div>
                      )}

                      {/* Real-world Road Distance vs Global Store International Shipping (UI Fallback) */}
                      {isGlobalOrder ? (
                        <div className="flex items-center justify-between bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 text-xs">
                          <div className="flex items-center gap-1.5 text-indigo-900">
                            <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-bold">شحن ومناولة دولية:</span>
                            <span className="text-slate-600 text-[11px]">مستودعات الشحن الخارجي ✈️ ⬅ توصيل لعنوان العميل</span>
                          </div>
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-md">
                            شحن عالمي
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-slate-700 font-medium">المسافة الطرقية:</span>
                            <strong className="font-mono text-blue-900 font-extrabold text-xs">
                              {order.actualRoadDistanceKm ? `${order.actualRoadDistanceKm} كم` : '3.5 كم'}
                            </strong>
                            {order.airDistanceKm && (
                              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                ({order.airDistanceKm} كم خط هوائي)
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setVerificationOrder(order)}
                            className="bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0"
                            title="معاينة مسار الشوارع الفعلي ونقطتي المتجر والعميل ومطابقة المسافة"
                          >
                            <MapPin className="w-3 h-3 text-blue-500 hover:text-white" />
                            <span>📍 معاينة النقطتين على الخريطة</span>
                          </button>
                        </div>
                      )}

                      {/* Admin Confirmation Action (Phone Call Workflow) */}
                      {canEditOrders && (
                        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <PhoneCall className="w-4 h-4 text-emerald-600 animate-pulse" />
                              <span>تأكيد الإدارة بعد الاتصال بالعميل</span>
                            </span>
                            {order.confirmedByAdminAt ? (
                              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                                تم التأكيد هاتفياً ✅
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                                بانتظار التأكيد 📞
                              </span>
                            )}
                          </div>
                          
                          {!order.confirmedByAdminAt && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleConfirmOrderAfterCall(order)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow cursor-pointer"
                              title="تأكيد تفاصيل الطلب مع العميل ونقله للمرحلة التالية"
                            >
                              {updatingOrderId === order.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              ) : (
                                <PhoneCall className="w-4 h-4 text-emerald-100" />
                              )}
                              <span>تأكيد الطلب بعد الاتصال بالعميل</span>
                            </button>
                          )}

                          {order.confirmedByAdminAt && (
                            <p className="text-[11px] text-emerald-800">
                              تم تأكيد الطلب هاتفياً بواسطة <strong>{order.confirmedByAdminName || 'الإدارة'}</strong> في {new Date(order.confirmedByAdminAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Review & Vehicle Assignment Prominent Banner */}
                      {(order.needsAdminReview || rawStatus === 'pending_review' || order.status === 'PENDING_REVIEW') && (
                        <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950 flex items-center gap-1.5">
                              <Sliders className="w-4 h-4 text-amber-600 animate-pulse" />
                              <span>طلب بانتظار مراجعة المنتجات واعتماد وسيلة النقل</span>
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                              مراجعة الإدارة
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800">
                            يتطلب هذا الطلب مراجعة الأصناف واختيار وسيلة النقل الملائمة لحساب تكلفة التوصيل الواقعية بدقة قبل التأكيد.
                          </p>
                          {canEditOrders && (
                            <button
                              onClick={() => handleOpenReviewModal(order)}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                              <span>مراجعة الطلب واختيار وسيلة النقل واعتماد السعر 🚗</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Admin Approved Vehicle Badge */}
                      {order.reviewedByAdmin && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تم اعتماد وسيلة النقل: {order.vehicleTypeName || 'دراجة نارية'}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-800">
                              {order.actualRoadDistanceKm ? `${order.actualRoadDistanceKm} كم مسار فعلي` : ''}
                            </span>
                          </div>
                          <div className="text-emerald-700 text-[10px]">
                            تكلفة التوصيل المعتمدة: <strong>{(order.deliveryFee || 500).toLocaleString()} ر.ي</strong>
                            {order.adminReviewNotes && ` • ملاحظة: ${order.adminReviewNotes}`}
                          </div>
                        </div>
                      )}

                      {/* Cancellation Policy Badge */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                        <span className="font-bold text-slate-700">صلاحية الإلغاء:</span>
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>عبر الإدارة فقط بالتواصل مع العميل</span>
                        </span>
                      </div>

                      {/* Admin Workflow Actions */}
                      {canEditOrders && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {rawStatus === 'new' && !order.needsAdminReview && (
                            <button
                              onClick={() => {
                                setOrderToAssign(order);
                                setIsAssignDriverModalOpen(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Utensils className="w-3.5 h-3.5" />
                              <span>تأكيد القبول واختيار المندوب (قيد التحضير) 👨‍🍳</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenReviewModal(order)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 border border-amber-300 cursor-pointer"
                            title="مراجعة وتعديل وسيلة النقل والتسعير"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-700" />
                            <span>مراجعة الوسيلة</span>
                          </button>

                          <button
                            onClick={() => {
                              setOrderToAssign(order);
                              setIsAssignDriverModalOpen(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
                            title="تغيير المندوب المسند"
                          >
                            <Truck className="w-3.5 h-3.5 text-slate-600" />
                            <span>تغيير الكابتن</span>
                          </button>

                          {canCancelOrders && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] py-2 px-2.5 rounded-xl border border-red-200 cursor-pointer"
                              title="إلغاء الطلب من الإدارة"
                            >
                              إلغاء الطلب
                            </button>
                          )}
                        </div>
                      )}

                      {order.notes && (
                        <div className="text-[11px] bg-amber-50/80 border border-amber-200 text-amber-900 p-2 rounded-lg font-medium">
                          ملاحظة العميل: {order.notes}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
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
                  {drivers.map(drv => (
                    <option key={drv.id} value={drv.id}>
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
                            disabled={!canDeliver || order.status === 'delivering' || order.status === 'delivered'}
                            onClick={async () => {
                              try {
                                setUpdatingOrderId(order.id);
                                await onUpdateOrderStatus(order.id, 'delivering');
                              } finally {
                                setUpdatingOrderId(null);
                              }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              canDeliver && order.status !== 'delivering' && order.status !== 'delivered'
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
                                await onUpdateOrderStatus(order.id, 'delivered');
                              } finally {
                                setUpdatingOrderId(null);
                              }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              order.status === 'delivering'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                                : order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {order.status === 'delivered' ? 'تم التسليم بنجاح ✅' : 'تأكيد التسليم للعميل'}
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
                      const isCurrentlyAssigned = orderToAssign.driverId === driver.id;

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
                <h3 className="text-sm font-bold">📸 رفع صورة الفاتورة للطلب (بدء التوصيل)</h3>
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
                  ملاحظة أو رقم الفاتورة (اختياري):
                </label>
                <input 
                  type="text" 
                  value={invoiceInput}
                  onChange={(e) => setInvoiceInput(e.target.value)}
                  placeholder="مثال: INV-9821 أو تم دفع القيمة كاش"
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
                  disabled={isSubmittingInvoice || (!invoiceImagePreview && !invoiceInput.trim())}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingInvoice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>رفع الفاتورة وبدء التوصيل 🚀</span>
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

              {/* Driver & Invoice Info */}
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

              {/* Items breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">قائمة أصناف الطلب:</span>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {viewingOrder.items && viewingOrder.items.length > 0 ? (
                    viewingOrder.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                        <div>
                          <p className="font-bold text-slate-800">{it.productName}</p>
                          {it.options && <p className="text-[10px] text-slate-400">{it.options.join(', ')}</p>}
                        </div>
                        <div className="text-left font-mono">
                          <p className="font-bold text-slate-900">{it.quantity} x {it.price.toLocaleString()} ر.ي</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-slate-500">تفاصيل الاصناف مرتبطة بمنتجات المتجر.</div>
                  )}
                </div>
              </div>

              {/* Total Calculation */}
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
                  {safeStores.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
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

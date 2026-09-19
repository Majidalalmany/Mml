import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { 
  db, 
  auth,
  signOut,
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, writeBatch, 
  query, 
  where,
  getDocs,
  orderBy,
  limit 
} from './lib/firebase';
import { Category, Product, Store, AdminUser, TabType, Order, OrderStatus, AuditLog, SupportTicket, FazaaOrder, FazaaCategory, AppUser, DriverUser } from './types';
import { seedInitialFirestoreData } from './services/seedData';
import { logSystemActivity } from './lib/auditLogger';

// Core Layout Components (static for instant initial shell render)
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ViewLoadingFallback } from './components/ViewLoadingFallback';
import { CheckCircle2, AlertCircle, RefreshCw, ShieldAlert, Lock } from 'lucide-react';
import { hasModulePermission } from './lib/permissions';
import { ORDER_STATUS_LABELS } from './constants/orderStatus';
import { checkDuplicateStorePhone, checkDuplicateUserPhone } from './lib/phoneUtils';

// Direct Static Imports for Module Views and Modals to ensure zero-chunk-failure reliability
import { DashboardOverview } from './components/DashboardOverview';
import { ProductsManager } from './components/ProductsManager';
import { CategoriesManager } from './components/CategoriesManager';
import { StoresManager } from './components/StoresManager';
import { StoreModal } from './components/StoreModal';
import { AdminUsersManager } from './components/AdminUsersManager';
import { UserModal } from './components/UserModal';
import { SecondaryViews } from './components/SecondaryViews';
import { ProductModal } from './components/ProductModal';
import { CategoryModal } from './components/CategoryModal';
import { ProductViewModal } from './components/ProductViewModal';
import { OrdersManager } from './components/OrdersManager';
import { AuditLogsManager } from './components/AuditLogsManager';
import { StoreDetailPage } from './components/StoreDetailPage';
import { FazaaOrdersManager } from './components/FazaaOrdersManager';
import { AppUsersManager } from './components/AppUsersManager';
import { DriversMapManager } from './components/DriversMapManager';
import { InvoicesManager } from './components/InvoicesManager';
import { GlobalStoresHub } from './components/global/GlobalStoresHub';
import { BusinessCatalogManager } from './components/BusinessCatalogManager';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('jahez_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('الفرع الرئيسي - صنعاء');

  // Firestore Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fazaaOrders, setFazaaOrders] = useState<FazaaOrder[]>([]);
  const [fazaaCategories, setFazaaCategories] = useState<FazaaCategory[]>([]);
  const [drivers, setDrivers] = useState<DriverUser[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [selectedStoreDetail, setSelectedStoreDetail] = useState<Store | null>(null);
  const [initialStoreIdForModal, setInitialStoreIdForModal] = useState<string | undefined>(undefined);
  const [initialSectionForModal, setInitialSectionForModal] = useState<string | undefined>(undefined);

  // Category filter state for multi-page sidebar navigation
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('restaurants');
  const [isAddServiceTriggered, setIsAddServiceTriggered] = useState<boolean>(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Toast notifications with auto cleanup to prevent memory leaks
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Notice: Global onSnapshot listeners removed in favor of Component-Level Lazy Fetching.
  // Child components (OrdersManager, BusinessCatalogManager, StoresManager, ProductsManager,
  // AdminUsersManager, AuditLogsManager, FazaaOrdersManager, AppUsersManager, DashboardOverview)
  // now subscribe independently on mount and clean up on unmount to prevent system bottlenecks.

  // Fazaa Handlers
  const handleCreateFazaaOrder = async (orderData: Partial<FazaaOrder>) => {
    try {
      const apiRes = await fetch('/api/fazaa/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const resData = await apiRes.json();
      const newOrderPayload = resData.order || {
        ...orderData,
        id: `fz-${Date.now()}`,
        orderNumber: `FAZAA-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, 'fazaa_orders'), newOrderPayload);
      } catch (e) {
        console.warn('Firestore addDoc fallback:', e);
      }

      setFazaaOrders(prev => [newOrderPayload, ...prev]);
      showToast('تم استقبال وتجهيز طلب فزعة بنجاح في لوحة التحكم وقاعدة البيانات', 'success');
      logSystemActivity({
        action: 'إنشاء طلب فزعة',
        performedBy: currentUser?.name || 'المدير العام',
        userEmail: currentUser?.email,
        userRole: currentUser?.role,
        targetType: 'order',
        targetName: newOrderPayload.orderNumber,
        details: `تم إضافة طلب فزعة (${newOrderPayload.pickupAddress} -> ${newOrderPayload.deliveryAddress})`,
        severity: 'info'
      });
    } catch (err: any) {
      showToast(err?.message || 'تعذر إضافة طلب فزعة', 'error');
    }
  };

  const handleUpdateFazaaOrderStatus = async (orderId: string, status: FazaaOrder['status'], driverName?: string, driverPhone?: string) => {
    try {
      await fetch(`/api/fazaa/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, driverName, driverPhone })
      });

      try {
        await setDoc(doc(db, 'fazaa_orders', orderId), {
          status,
          ...(driverName !== undefined ? { driverName, driverPhone } : {}),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore updateDoc fallback:', e);
      }

      setFazaaOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status,
        ...(driverName !== undefined ? { driverName, driverPhone } : {})
      } : o));

      showToast('تم تحديث حالة طلب فزعة بنجاح في قاعدة البيانات', 'success');
    } catch (err: any) {
      showToast(err?.message || 'تعذر تحديث حالة طلب فزعة', 'error');
    }
  };

  const handleSaveFazaaCategory = async (catData: Partial<FazaaCategory>) => {
    try {
      const res = await fetch('/api/fazaa/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      const data = await res.json();
      if (data.category) {
        setFazaaCategories(prev => {
          const exists = prev.some(c => c.id === data.category.id);
          if (exists) return prev.map(c => c.id === data.category.id ? data.category : c);
          return [...prev, data.category];
        });
        showToast('تم حفظ تصنيف الشحنة بنجاح', 'success');
      }
    } catch (err: any) {
      showToast('حدث خطأ أثناء حفظ تصنيف الشحنة', 'error');
    }
  };

  const handleSaveAppUser = async (userData: Partial<AppUser>) => {
    try {
      if (userData.phone) {
        const dupCheck = checkDuplicateUserPhone(userData.phone, appUsers, userData.id);
        if (dupCheck.isDuplicate) {
          const errMsg = `رقم الهاتف (${userData.phone}) مسجل مسبقاً لعميل آخر باسم "${dupCheck.existingName}". يرجى إدخال رقم هاتف مختلف.`;
          showToast(errMsg, 'error');
          throw new Error(errMsg);
        }
      }

      let updatedUser: any = null;
      if (userData.id) {
        const res = await fetch(`/api/users/profile/${userData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        const data = await res.json();
        updatedUser = data.user;

        // Sync with Firestore 'clients' collection
        try {
          await updateDoc(doc(db, 'clients', userData.id), {
            ...userData,
            role: 'client',
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Firestore update doc fallback:', e);
        }
      } else {
        const res = await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        const data = await res.json();
        updatedUser = data.user;

        // Sync with Firestore 'clients' collection
        try {
          const docRef = await addDoc(collection(db, 'clients'), {
            ...userData,
            role: 'client',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          if (!updatedUser) {
            updatedUser = { id: docRef.id, ...userData, role: 'client' };
          }
        } catch (e) {
          console.warn('Firestore add doc fallback:', e);
        }
      }

      if (updatedUser) {
        setAppUsers(prev => {
          const exists = prev.some(u => u.id === updatedUser.id);
          if (exists) return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
          return [updatedUser, ...prev];
        });
        showToast('تم حفظ حساب وبيانات العميل في مجموعة العملاء (clients) بنجاح', 'success');
      }
    } catch (err: any) {
      showToast('تعذر حفظ ملف العميل', 'error');
    }
  };

  // Support Ticket Handlers (Absher)
  const handleCreateSupportTicket = async (ticketData: {
    title: string;
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    initialMessage: string;
  }) => {
    try {
      const ticketNum = 'MOD-' + Math.floor(100 + Math.random() * 900);
      const requesterName = currentUser ? currentUser.name : 'مستخدم النظام';
      const requesterEmail = currentUser ? currentUser.email : 'user@jahez.com';

      const newTicketDoc = {
        ticketNumber: ticketNum,
        title: ticketData.title,
        requesterName,
        requesterEmail,
        targetAdminEmail: 'majdallmany3@gmail.com',
        category: ticketData.category,
        status: 'new',
        priority: ticketData.priority,
        messages: [
          {
            id: 'msg-' + Date.now(),
            senderName: requesterName,
            senderEmail: requesterEmail,
            text: ticketData.initialMessage,
            createdAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'support_tickets'), newTicketDoc);

      // Audit Log for creating ticket
      await logSystemActivity({
        action: 'فتح طلب تعديل/مشكلة (أبشر)',
        performedBy: requesterName,
        userEmail: requesterEmail,
        targetType: 'system',
        targetName: ticketNum,
        details: `طلب تعديل جديد بعنوان: "${ticketData.title}" إلى المدير العام majdallmany3@gmail.com`,
        severity: ticketData.priority === 'urgent' ? 'warning' : 'info'
      });

      showToast(`أبشر! تم إرسال طلب التعديل #${ticketNum} مباشرة إلى المدير العام`);
    } catch (err: any) {
      console.error('Error creating support ticket:', err);
      showToast('فشل إرسال طلب التعديل: ' + (err.message || ''), 'error');
      throw err;
    }
  };

  const handleSendSupportMessage = async (ticketId: string, text: string) => {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      const ticket = supportTickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const senderName = currentUser ? currentUser.name : 'مستخدم النظام';
      const senderEmail = currentUser ? currentUser.email : 'user@jahez.com';
      const isManager = senderEmail === 'majdallmany3@gmail.com' || currentUser?.role === 'super_admin';

      const updatedMessages = [
        ...(ticket.messages || []),
        {
          id: 'msg-' + Date.now(),
          senderName,
          senderEmail,
          text,
          createdAt: new Date().toISOString(),
          isManagerReply: isManager
        }
      ];

      await updateDoc(ticketRef, {
        messages: updatedMessages,
        status: isManager ? 'in_progress' : ticket.status,
        updatedAt: new Date().toISOString()
      });

      showToast('تم إرسال الرد في المحادثة بنجاح');
    } catch (err: any) {
      console.error('Error sending support message:', err);
      showToast('فشل إرسال الرسالة: ' + (err.message || ''), 'error');
      throw err;
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: new Date().toISOString()
      });

      showToast('تم تحديث حالة طلب التعديل (أبشر) بنجاح');
    } catch (err: any) {
      console.error('Error updating ticket status:', err);
      showToast('فشل تعديل حالة المحادثة', 'error');
    }
  };

  // Auto-seed if Firestore database is empty on first load (Sole useEffect retained for data seeding)
  useEffect(() => {
    let isMounted = true;
    const verifyAndSeedInitialData = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'categories'), limit(1)));
        if (snap.empty && isMounted) {
          await handleSeedData();
        }
      } catch (err) {
        console.warn('Initial seed check non-blocking fallback:', err);
      }
    };
    verifyAndSeedInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Orders CRUD Handlers
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, extraData?: Partial<Order>) => {
    const statusLabel = ORDER_STATUS_LABELS[newStatus] || newStatus;
    const nowIso = new Date().toISOString();
    
    // 1. First persist strictly to Firestore
    if (!orderId.startsWith('local-')) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const updatePayload: any = {
          status: newStatus,
          updatedAt: nowIso,
          ...(extraData || {})
        };
        await setDoc(orderRef, updatePayload, { merge: true });
      } catch (err: any) {
        console.error('CRITICAL: Firestore updateDoc failed for order:', orderId, err);
        showToast(`فشل حفظ التحديث في قاعدة البيانات: ${err?.message || 'خطأ غير معروف'}`);
        throw err; // Re-throw to inform caller that DB update failed
      }
    }

    // 2. Update in-memory orders state only after DB persistence succeeds
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId) ? {
      ...o,
      status: newStatus,
      updatedAt: nowIso,
      ...(extraData || {})
    } : o));

    showToast(`تم تغيير حالة الطلب بنجاح إلى (${statusLabel})`);

    // Audit Log
    try {
      await logSystemActivity({
        action: 'تعديل حالة طلب',
        performedBy: currentUser ? currentUser.name : 'النظام',
        userEmail: currentUser?.email,
        userRole: currentUser?.role,
        targetType: 'order',
        targetName: orderId,
        details: `تحديث حالة الطلب إلى: (${statusLabel}) ${extraData?.driverName ? `وإسناده للمندوب ${extraData.driverName}` : ''} ${extraData?.invoiceNumber ? `مع تسجيل الفاتورة ${extraData.invoiceNumber}` : ''}`,
        severity: 'info'
      });
    } catch (e) {
      console.warn('Audit log error:', e);
    }
  };

  const handleCreateOrder = async (orderData: Partial<Order>) => {
    try {
      await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: new Date().toISOString()
      });
      showToast(`تمت إضافة الطلب #${orderData.orderNumber || ''} بنجاح في Firestore`);

      await logSystemActivity({
        action: 'إنشاء طلب جديد',
        performedBy: currentUser ? currentUser.name : 'العميل',
        userEmail: currentUser?.email,
        targetType: 'order',
        targetName: orderData.orderNumber || 'طلب جديد',
        details: `إضافة طلب بقيمة ${orderData.total} ريال لـ ${orderData.customerName}`,
        severity: 'info'
      });
    } catch (err: any) {
      console.error('Error creating order:', err);
      showToast('فشل إضافة الطلب في Firestore: ' + (err.message || ''), 'error');
      throw err;
    }
  };

  // Seed Data Handler
  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const success = await seedInitialFirestoreData();
      if (success) {
        showToast('تم تهيئة بيانات المتاجر والمنتجات والتصنيفات في Firestore بنجاح');
        await logSystemActivity({
          action: 'إعادة تهيئة البيانات السحابية (Seed Data)',
          performedBy: currentUser ? currentUser.name : 'المدير العام',
          userEmail: currentUser?.email,
          targetType: 'system',
          details: 'تم إجراء مزامنة وتهيئة أولية لقواعد بيانات المتاجر والطلبات بنجاح',
          severity: 'info'
        });
      } else {
        showToast('حدث خطأ أثناء تهيئة البيانات', 'error');
      }
    } catch (err: any) {
      showToast('خطأ في الإتصال بـ Firestore', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // --- STORE CRUD HANDLERS ---
  const handleUpdateStoreSections = async (storeId: string, updatedSections: string[]) => {
    try {
      const storeRef = doc(db, 'stores', storeId);
      await updateDoc(storeRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });
      showToast('تم تحديث أقسام المتجر بنجاح في قاعدة البيانات');
    } catch (err: any) {
      console.error('Error updating store sections:', err);
      showToast('فشل تحديث الأقسام: ' + (err.message || ''), 'error');
    }
  };

  const handleSaveStore = async (storeData: Partial<Store>) => {
    try {
      if (storeData.phone) {
        const dupCheck = checkDuplicateStorePhone(storeData.phone, stores, editingStore?.id);
        if (dupCheck.isDuplicate) {
          const errMsg = `رقم الهاتف (${storeData.phone}) مسجل مسبقاً لدى متجر "${dupCheck.existingName}". يرجى استخدام رقم هاتف مختلف لتجنب التكرار.`;
          showToast(errMsg, 'error');
          throw new Error(errMsg);
        }
      }

      if (editingStore) {
        const storeRef = doc(db, 'stores', editingStore.id);
        await updateDoc(storeRef, {
          ...storeData,
          updatedAt: new Date().toISOString()
        });
        showToast(`تم تحديث بيانات المتجر/المطعم "${storeData.name}" بنجاح في Firestore`);
        await logSystemActivity({
          action: 'تعديل بيانات متجر',
          performedBy: currentUser ? currentUser.name : 'إدارة المتاجر',
          userEmail: currentUser?.email,
          targetType: 'store',
          targetName: storeData.name,
          details: `تعديل معلومات المتجر والتصنيف ${storeData.categoryName}`,
          severity: 'info'
        });
      } else {
        const defaultSections = storeData.sections && storeData.sections.length > 0 
          ? storeData.sections 
          : ['وجبات رئيسية', 'مقبلات وسلطات', 'مشروبات وعصائر'];

        const docRef = await addDoc(collection(db, 'stores'), {
          ...storeData,
          sections: defaultSections,
          createdAt: new Date().toISOString()
        });

        const createdStore: Store = {
          id: docRef.id,
          name: storeData.name || 'متجر جديد',
          ...storeData,
          sections: defaultSections
        } as Store;

        setSelectedStoreDetail(createdStore);
        showToast(`تمت إضافة المتجر "${storeData.name}" بنجاح! تم الانتقال إلى صفحة المتجر لإضافة الأقسام والمنتجات`);
        
        await logSystemActivity({
          action: 'إضافة متجر جديد',
          performedBy: currentUser ? currentUser.name : 'إدارة المتاجر',
          userEmail: currentUser?.email,
          targetType: 'store',
          targetName: storeData.name,
          details: `إضافة متجر جديد بتصنيف ${storeData.categoryName}`,
          severity: 'info'
        });
      }
    } catch (err: any) {
      console.error('Error saving store:', err);
      showToast('فشل حفظ بيانات المتجر في Firebase: ' + (err.message || ''), 'error');
      throw err;
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      const st = stores.find(s => s.id === storeId);
      const batch = writeBatch(db);
      
      // 1. Delete the store itself
      batch.delete(doc(db, 'stores', storeId));
      
      // 2. Query Firestore for ALL products belonging to this storeId
      const deletedProductIds = new Set<string>();
      try {
        const productsSnap = await getDocs(
          query(collection(db, 'products'), where('storeId', '==', storeId))
        );
        productsSnap.forEach(pDoc => {
          deletedProductIds.add(pDoc.id);
          batch.delete(doc(db, 'products', pDoc.id));
        });
      } catch (queryErr) {
        console.warn('Firestore query products by storeId warning:', queryErr);
      }

      // Also include any products in current memory state for this store
      products.filter(p => p.storeId === storeId).forEach(p => {
        if (!deletedProductIds.has(p.id)) {
          deletedProductIds.add(p.id);
          batch.delete(doc(db, 'products', p.id));
        }
      });

      // 3. Commit atomic batch to Firestore
      await batch.commit();

      // 4. Reliable UI State updates ONLY AFTER batch.commit() succeeds
      setStores(prev => prev.filter(s => s.id !== storeId));
      setProducts(prev => prev.filter(p => !deletedProductIds.has(p.id)));

      showToast(`تم حذف المتجر و(${deletedProductIds.size}) صنف/منتج تابع له بنجاح`);
      await logSystemActivity({
        action: 'حذف متجر متسلسل',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'store',
        targetName: st?.name || storeId,
        details: `حذف المتجر ${st?.name || storeId} وجميع الأصناف التابعة له (${deletedProductIds.size}) من قاعدة البيانات`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error in cascade delete store:', err);
      showToast('خطأ: تعذر حذف المتجر والأصناف التابعة له: ' + (err.message || 'حدث خطأ أثناء الاتصال بقاعدة البيانات'), 'error');
    }
  };

  const handleToggleStoreStatus = async (store: Store) => {
    try {
      const storeRef = doc(db, 'stores', store.id);
      const newStatus = store.status === 'open' ? 'closed' : 'open';
      await updateDoc(storeRef, { status: newStatus });
      showToast(`تم تغيير حالة متجر "${store.name}" إلى (${newStatus === 'open' ? 'مفتوح' : 'مغلق'})`);
      await logSystemActivity({
        action: 'تغيير حالة متجر',
        performedBy: currentUser ? currentUser.name : 'النظام',
        userEmail: currentUser?.email,
        targetType: 'store',
        targetName: store.name,
        details: `تغيير الحالة إلى ${newStatus === 'open' ? 'مفتوح' : 'مغلق'}`,
        severity: 'info'
      });
    } catch (err: any) {
      console.error('Error toggling store status:', err);
      showToast('فشل تعديل حالة المتجر', 'error');
    }
  };

  // --- USER & RBAC HANDLERS ---
  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    try {
      if (userData.phone) {
        const dupCheck = checkDuplicateUserPhone(userData.phone, adminUsers, editingUser?.id);
        if (dupCheck.isDuplicate) {
          const errMsg = `رقم الهاتف (${userData.phone}) مسجل مسبقاً لموظف/مستخدم آخر باسم "${dupCheck.existingName}". يرجى استخدام رقم هاتف مختلف.`;
          showToast(errMsg, 'error');
          throw new Error(errMsg);
        }
      }

      if (editingUser) {
        const uRef = doc(db, 'adminUsers', editingUser.id);
        const updatePayload: Record<string, any> = {
          ...userData,
          updatedAt: new Date().toISOString()
        };
        if (!userData.password || !userData.password.trim()) {
          delete updatePayload.password;
        }
        await updateDoc(uRef, updatePayload);

        // Sync to admin_users and admins collections
        try {
          await setDoc(doc(db, 'admin_users', editingUser.id), {
            ...editingUser,
            ...updatePayload
          }, { merge: true });
          await setDoc(doc(db, 'admins', editingUser.id), {
            ...editingUser,
            ...updatePayload
          }, { merge: true });
        } catch (syncErr) {
          console.warn('Sync admin user to secondary collections warning:', syncErr);
        }

        showToast(`تم تحديث صلاحيات وعضوية "${userData.name}" بنجاح`);
        await logSystemActivity({
          action: 'تعديل بيانات حساب إداري',
          performedBy: currentUser ? currentUser.name : 'المدير العام',
          userEmail: currentUser?.email,
          targetType: 'user',
          targetName: userData.name,
          details: `تعديل صلاحيات وتفاصيل الحساب للدور ${userData.role}`,
          severity: 'info'
        });
      } else {
        const newDocRef = await addDoc(collection(db, 'adminUsers'), {
          ...userData,
          createdAt: new Date().toISOString()
        });

        // Sync to admin_users and admins collections
        try {
          await setDoc(doc(db, 'admin_users', newDocRef.id), {
            id: newDocRef.id,
            ...userData,
            createdAt: new Date().toISOString()
          });
          await setDoc(doc(db, 'admins', newDocRef.id), {
            id: newDocRef.id,
            ...userData,
            createdAt: new Date().toISOString()
          });
        } catch (syncErr) {
          console.warn('Sync new admin user to secondary collections warning:', syncErr);
        }

        showToast(`تمت إضافة الموظف "${userData.name}" وتعيين صلاحياته بنجاح`);
        await logSystemActivity({
          action: 'إضافة حساب إداري جديد',
          performedBy: currentUser ? currentUser.name : 'المدير العام',
          userEmail: currentUser?.email,
          targetType: 'user',
          targetName: userData.name,
          details: `إنشاء حساب جديد بالبريد ${userData.email} والدور ${userData.role}`,
          severity: 'info'
        });
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      showToast('فشل حفظ بيانات المستخدم في Firebase', 'error');
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const u = adminUsers.find(usr => usr.id === userId);
      await deleteDoc(doc(db, 'adminUsers', userId));
      showToast('تم حذف الموظف وإلغاء صلاحياته من Firestore');
      await logSystemActivity({
        action: 'حذف حساب إداري',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'user',
        targetName: u?.name || userId,
        details: `إلغاء وتجميد الحساب الإداري ${u?.email}`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      showToast('فشل حذف المستخدم', 'error');
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const uRef = doc(db, 'adminUsers', user.id);
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await updateDoc(uRef, { status: newStatus });
      showToast(`تم تغيير حالة حساب الموظف "${user.name}" إلى (${newStatus === 'active' ? 'نشط' : 'معطل'})`);
      await logSystemActivity({
        action: 'تعديل حالة تفعيل حساب',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'user',
        targetName: user.name,
        details: `تعديل الحالة إلى ${newStatus === 'active' ? 'نشط' : 'معطل'}`,
        severity: 'info'
      });
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      showToast('فشل تعديل حالة حساب الموظف', 'error');
    }
  };

  // --- PRODUCT CRUD HANDLERS ---
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: new Date().toISOString()
        });
        showToast(`تم تحديث بيانات المنتج "${productData.name}" بنجاح في Firestore`);
        await logSystemActivity({
          action: 'تعديل بيانات صنف/منتج',
          performedBy: currentUser ? currentUser.name : 'مدير المنتجات',
          userEmail: currentUser?.email,
          targetType: 'product',
          targetName: productData.name,
          details: `تحديث السعر إلى ${productData.price} ريال وتعديل التفاصيل`,
          severity: 'info'
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        showToast(`تمت إضافة المنتج "${productData.name}" بنجاح في Firestore`);
        await logSystemActivity({
          action: 'إضافة صنف/منتج جديد',
          performedBy: currentUser ? currentUser.name : 'مدير المنتجات',
          userEmail: currentUser?.email,
          targetType: 'product',
          targetName: productData.name,
          details: `إضافة المنتج بالسعر ${productData.price} ريال للمتجر ${productData.storeName}`,
          severity: 'info'
        });
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast('فشل حفظ المنتج في Firebase: ' + (err.message || ''), 'error');
      throw err;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const p = products.find(prd => prd.id === productId);
      await deleteDoc(doc(db, 'products', productId));
      showToast('تم حذف المنتج بنجاح من Firestore');
      await logSystemActivity({
        action: 'حذف صنف/منتج',
        performedBy: currentUser ? currentUser.name : 'مدير المنتجات',
        userEmail: currentUser?.email,
        targetType: 'product',
        targetName: p?.name || productId,
        details: `حذف المنتج ${p?.name} من قاعدة البيانات`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast('فشل حذف المنتج: ' + (err.message || ''), 'error');
    }
  };

  const handleToggleProductInStock = async (product: Product) => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        inStock: !product.inStock
      });
      showToast(`تم تغيير حالة التوفر للمنتج "${product.name}" إلى (${!product.inStock ? 'متوفر' : 'غير متوفر'})`);
    } catch (err: any) {
      console.error('Error toggling product stock:', err);
      showToast('فشل تحديث حالة التوفر في Firestore', 'error');
    }
  };

  // --- CATEGORY CRUD HANDLERS ---
  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    const rawName = (categoryData.name || categoryData.label || categoryData.serviceName || 'فئة جديدة').trim();
    const catId = categoryData.id || `cat-${Date.now()}`;
    const imgUrl = categoryData.imageUrl || categoryData.categoryImageUrl || categoryData.category_image_url || categoryData.coverUrl || '';
    const banUrl = categoryData.bannerUrl || categoryData.bannerImageUrl || categoryData.banner_image_url || '';
    
    const newCatPayload: Category = {
      id: catId,
      name: rawName,
      label: rawName,
      serviceName: rawName,
      nameEn: categoryData.nameEn || '',
      subtitle: categoryData.subtitle || '',
      description: categoryData.description || `إدارة واستعراض محلات وأنشطة قسم ${rawName}`,
      icon: categoryData.icon || 'Tag',
      serviceType: categoryData.serviceType || 'default',
      serviceTypeCategory: categoryData.serviceTypeCategory || 'delivery',
      
      imageUrl: imgUrl,
      categoryImageUrl: imgUrl,
      category_image_url: imgUrl,
      coverUrl: imgUrl,
      
      bannerUrl: banUrl,
      bannerImageUrl: banUrl,
      banner_image_url: banUrl,
      
      order: Number(categoryData.order) || (categories.length + 1),
      status: categoryData.status || 'active',
      isActive: categoryData.isActive !== false,
      ctaText: categoryData.ctaText || 'اطلب الآن',
      createdAt: categoryData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Instant state update
    setCategories(prev => {
      const filtered = prev.filter(c => c.id !== catId && c.name !== rawName);
      return [...filtered, newCatPayload];
    });

    // 2. Instant LocalStorage backup
    try {
      const stored = JSON.parse(localStorage.getItem('jahez_custom_categories') || '[]');
      const updated = stored.filter((c: any) => c.id !== catId && c.name !== rawName);
      updated.push(newCatPayload);
      localStorage.setItem('jahez_custom_categories', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage category backup error:', e);
    }

    // 3. Immediately switch active filter
    setSelectedCategoryFilter(catId);
    showToast(`تمت إضافة وتحديث نشاط "${rawName}" بنجاح في لوحة التحكم وتطبيق العميل`, 'success');

    // 4. Async Firestore background persistence (non-blocking)
    try {
      if (editingCategory) {
        const catRef = doc(db, 'categories', editingCategory.id);
        await updateDoc(catRef, {
          ...newCatPayload,
          updatedAt: new Date().toISOString()
        });
      } else {
        try {
          await setDoc(doc(db, 'categories', catId), newCatPayload);
        } catch (dbErr) {
          console.warn('Firestore setDoc category fallback to addDoc:', dbErr);
          await addDoc(collection(db, 'categories'), newCatPayload);
        }
      }
    } catch (err: any) {
      console.warn('Background firestore category sync error:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Delete the category itself
      batch.delete(doc(db, 'categories', categoryId));
      
      // 2. Query Firestore for ALL stores belonging to this categoryId
      const foundStoreIds = new Set<string>();
      try {
        const storesQuerySnap = await getDocs(
          query(collection(db, 'stores'), where('categoryId', '==', categoryId))
        );
        storesQuerySnap.forEach((sDoc) => {
          foundStoreIds.add(sDoc.id);
          batch.delete(doc(db, 'stores', sDoc.id));
        });
      } catch (storeQueryErr) {
        console.warn('Firestore query stores by categoryId warning:', storeQueryErr);
      }

      // Also include any stores in current memory state matching categoryId
      stores.filter(s => s.categoryId === categoryId).forEach(s => {
        if (!foundStoreIds.has(s.id)) {
          foundStoreIds.add(s.id);
          batch.delete(doc(db, 'stores', s.id));
        }
      });

      // 3. For all identified stores and for category products, find all products
      const deletedProductIds = new Set<string>();

      // Products by categoryId
      try {
        const catProductsSnap = await getDocs(
          query(collection(db, 'products'), where('categoryId', '==', categoryId))
        );
        catProductsSnap.forEach((pDoc) => {
          deletedProductIds.add(pDoc.id);
          batch.delete(doc(db, 'products', pDoc.id));
        });
      } catch (catProdErr) {
        console.warn('Firestore query products by categoryId warning:', catProdErr);
      }

      // Products by each storeId
      for (const stId of Array.from(foundStoreIds)) {
        try {
          const storeProductsSnap = await getDocs(
            query(collection(db, 'products'), where('storeId', '==', stId))
          );
          storeProductsSnap.forEach((pDoc) => {
            if (!deletedProductIds.has(pDoc.id)) {
              deletedProductIds.add(pDoc.id);
              batch.delete(doc(db, 'products', pDoc.id));
            }
          });
        } catch (stProdErr) {
          console.warn('Firestore query products by storeId warning:', stProdErr);
        }
      }

      // Also check memory state for any products matching category or stores
      products.forEach(p => {
        if (p.categoryId === categoryId || foundStoreIds.has(p.storeId)) {
          if (!deletedProductIds.has(p.id)) {
            deletedProductIds.add(p.id);
            batch.delete(doc(db, 'products', p.id));
          }
        }
      });

      // 4. Commit atomic batch to Firestore
      await batch.commit();

      // 5. Reliable UI State updates ONLY AFTER batch.commit() succeeds
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setStores(prev => prev.filter(s => !foundStoreIds.has(s.id)));
      setProducts(prev => prev.filter(p => !deletedProductIds.has(p.id)));

      showToast(`تم حذف الفئة و(${foundStoreIds.size}) متجر و(${deletedProductIds.size}) صنف بنجاح`);
      
      await logSystemActivity({
        action: 'حذف فئة متسلسل',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'category',
        targetName: categoryId,
        details: `حذف الفئة ${categoryId} وكافة المتاجر (${foundStoreIds.size}) والمنتجات (${deletedProductIds.size}) التابعة لها متسلسلاً`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error in cascade delete category:', err);
      showToast('خطأ: تعذر حذف الفئة لارتباطات البيانات: ' + (err.message || 'حدث خطأ في قاعدة البيانات'), 'error');
    }
  };

  const handleToggleCategoryStatus = async (category: Category) => {
    try {
      const catRef = doc(db, 'categories', category.id);
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      await updateDoc(catRef, { status: newStatus });
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, status: newStatus } : c));
      showToast(`تم تعديل حالة التصنيف "${category.name}"`);
    } catch (err: any) {
      console.error('Error toggling category status:', err);
      showToast('فشل تعديل حالة التصنيف', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('jahez_auth_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    showToast('تم تسجيل الخروج بنجاح');
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('jahez_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast(`مرحباً بك مجدداً، ${user.name}! تم تسجيل الدخول بصلاحية (${user.role})`);
  };

  // If user is not authenticated, show Login Screen
  if (!currentUser) {
    return <LoginScreen users={adminUsers} onLoginSuccess={handleLoginSuccess} />;
  }

  // Dynamic tab header title
  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'dashboard': return 'الرئيسية والإحصائيات الحية';
      case 'restaurants': return 'إدارة المتاجر والمطاعم والصيدليات';
      case 'categories': return 'إدارة التصنيفات الرئيسية';
      case 'products': return 'إدارة المنتجات الأصناف والأسعار';
      case 'admin': return 'إدارة المستخدمين ونظام الصلاحيات (RBAC)';
      case 'orders': return 'إدارة وتتبع الطلبات المباشرة';
      case 'audit': return 'سجل العمليات ومراقبة النظام (Audit Logs)';
      case 'modifiers': return 'الخيارات والإضافات (Modifiers)';
      case 'offers': return 'العروض والتخفيضات الترويجية';
      case 'reports': return 'التقارير المالية والأداء';
      case 'financial': return 'الإدارة المالية والعمولات';
      case 'quality': return 'تقييمات الجودة والملاحظات';
      case 'delivery': return 'خريطة المندوبين والتتبع المباشر (Fleet Map)';
      case 'fazaa': return 'إدارة أسطول وطلبات فزعة';
      default: return 'لوحة تحكم جاهز';
    }
  };

  const canAccessCurrentTab = hasModulePermission(currentUser, activeTab, 'view');

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans flex flex-col dir-rtl" dir="rtl">
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
            toastMessage.type === 'success' ? 'bg-slate-900 border-emerald-500' : 'bg-rose-900 border-rose-500'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedStoreDetail(null);
            setActiveTab(tab);
          }}
          selectedCategoryFilter={selectedCategoryFilter}
          onSelectCategory={(catFilter) => {
            setSelectedStoreDetail(null);
            setSelectedCategoryFilter(catFilter);
          }}
          onAddService={() => {
            setSelectedStoreDetail(null);
            setSelectedCategoryFilter('all');
            setActiveTab('restaurants');
            setIsAddServiceTriggered(true);
          }}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          currentUser={currentUser}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* Header Bar */}
          <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            onSeedData={handleSeedData}
            isSeeding={isSeeding}
            activeTabLabel={getTabLabel(activeTab)}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {/* Main Workspace Body */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
            
            {!canAccessCurrentTab ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-rose-200 text-center space-y-4 my-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">غير مصرح بالوصول لهذه الوحدة</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    عذراً، رتبتك الحالية ({currentUser.role}) أو حسابك الموظف لا يملك صلاحية عرض وحدة ({getTabLabel(activeTab)}). يرجى التواصل مع المدير العام (Super Admin) لترقية الصلاحيات.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('restaurants')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  العودة لقائمة المتاجر والخدمات
                </button>
              </div>
            ) : (
              <ErrorBoundary fallbackTitle={`حدث خطأ في عرض وحدة (${getTabLabel(activeTab)})`}>
                <Suspense fallback={<ViewLoadingFallback />}>
                  {/* Dedicated Store Detail View (صفحة المتجر المنفصلة للأقسام والمنتجات) */}
                  {selectedStoreDetail ? (
                    <StoreDetailPage 
                      store={selectedStoreDetail}
                      currentUser={currentUser}
                      onBack={() => setSelectedStoreDetail(null)}
                      onEditStore={(st) => {
                        setEditingStore(st);
                        setIsStoreModalOpen(true);
                      }}
                      onUpdateStoreSections={handleUpdateStoreSections}
                      onAddProductForStore={(stId, secName) => {
                        setEditingProduct(null);
                        setInitialStoreIdForModal(stId);
                        setInitialSectionForModal(secName);
                        setIsProductModalOpen(true);
                      }}
                      onEditProduct={(p) => {
                        setEditingProduct(p);
                        setInitialStoreIdForModal(undefined);
                        setInitialSectionForModal(undefined);
                        setIsProductModalOpen(true);
                      }}
                      onDeleteProduct={handleDeleteProduct}
                      onToggleProductInStock={handleToggleProductInStock}
                    />
                  ) : (
                    <>
                      {/* 1. Main Overview Dashboard (بيانات عامة للموقع بدون عرض متاجر أو منتجات) */}
                      {activeTab === 'dashboard' && (
                        <DashboardOverview 
                          onNavigateToFinancial={() => setActiveTab('financial')}
                          onNavigateToDelivery={() => setActiveTab('delivery')}
                          onNavigateToGlobalStores={() => setActiveTab('global_stores')}
                        />
                      )}

                      {/* 1b. Global Stores Experience (Amazon, SHEIN, AliExpress) */}
                      {activeTab === 'global_stores' && (
                        <GlobalStoresHub
                          currentUser={currentUser}
                          onShowToast={showToast}
                        />
                      )}

                      {/* 2. Unified Nested Business Catalog Manager (إدارة الأنشطة التجارية: فئات -> متاجر -> منتجات) */}
                      {(activeTab === 'restaurants' || activeTab === 'categories' || activeTab === 'products') && (
                        <BusinessCatalogManager 
                          onAddCategory={() => {
                            setEditingCategory(null);
                            setIsCategoryModalOpen(true);
                          }}
                          onEditCategory={(cat) => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          onDeleteCategory={handleDeleteCategory}
                          onToggleCategoryStatus={handleToggleCategoryStatus}
                          onAddStore={(initialCatId) => {
                            setEditingStore(null);
                            if (initialCatId) setSelectedCategoryFilter(initialCatId);
                            setIsStoreModalOpen(true);
                          }}
                          onEditStore={(st) => {
                            setEditingStore(st);
                            setIsStoreModalOpen(true);
                          }}
                          onDeleteStore={handleDeleteStore}
                          onToggleStoreStatus={handleToggleStoreStatus}
                          onUpdateStoreSections={handleUpdateStoreSections}
                          onAddProductForStore={(stId, secName) => {
                            setEditingProduct(null);
                            setInitialStoreIdForModal(stId);
                            setInitialSectionForModal(secName);
                            setIsProductModalOpen(true);
                          }}
                          onEditProduct={(p) => {
                            setEditingProduct(p);
                            setInitialStoreIdForModal(undefined);
                            setInitialSectionForModal(undefined);
                            setIsProductModalOpen(true);
                          }}
                          onDeleteProduct={handleDeleteProduct}
                          onToggleProductInStock={handleToggleProductInStock}
                          currentUser={currentUser}
                          initialCategoryId={selectedCategoryFilter}
                          initialStoreId={selectedStoreDetail?.id}
                        />
                      )}

                      {/* 2b. Stores & Restaurants View */}
                      {activeTab === 'restaurants' && (
                        <StoresManager 
                          selectedCategoryFilter={selectedCategoryFilter}
                          onSelectCategoryFilter={(filter) => setSelectedCategoryFilter(filter)}
                          onNavigateToCategories={() => setActiveTab('categories')}
                          onNavigateToGlobalCatalog={() => setActiveTab('global_stores')}
                          isAddServiceTriggered={isAddServiceTriggered}
                          onCloseAddServiceTrigger={() => setIsAddServiceTriggered(false)}
                          onAddCategory={() => {
                            setEditingCategory(null);
                            setIsCategoryModalOpen(true);
                          }}
                          onSaveCategory={handleSaveCategory}
                          onAddStore={() => {
                            setEditingStore(null);
                            setIsStoreModalOpen(true);
                          }}
                          onEditStore={(st) => {
                            setEditingStore(st);
                            setIsStoreModalOpen(true);
                          }}
                          onDeleteStore={handleDeleteStore}
                          onToggleStatus={handleToggleStoreStatus}
                          onSelectStore={(st) => setSelectedStoreDetail(st)}
                          currentUser={currentUser}
                        />
                      )}

                  {/* 3. Products View */}
                  {activeTab === 'products' && (
                    <ProductsManager 
                      onAddProduct={() => {
                        setEditingProduct(null);
                        setIsProductModalOpen(true);
                      }}
                      onEditProduct={(p) => {
                        setEditingProduct(p);
                        setIsProductModalOpen(true);
                      }}
                      onViewProduct={(p) => {
                        setViewingProduct(p);
                      }}
                      onDeleteProduct={handleDeleteProduct}
                      onToggleInStock={handleToggleProductInStock}
                      onSeedData={handleSeedData}
                      currentUser={currentUser}
                    />
                  )}

                  {/* 4. Users & RBAC Permissions View */}
                  {activeTab === 'admin' && (
                    <AdminUsersManager 
                      onAddUser={() => {
                        setEditingUser(null);
                        setIsUserModalOpen(true);
                      }}
                      onEditUser={(u) => {
                        setEditingUser(u);
                        setIsUserModalOpen(true);
                      }}
                      onDeleteUser={handleDeleteUser}
                      onToggleUserStatus={handleToggleUserStatus}
                      currentUser={currentUser}
                    />
                  )}

                  {/* 6. Orders Management View */}
                  {activeTab === 'orders' && (
                    <OrdersManager 
                      currentUser={currentUser}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onCreateOrder={handleCreateOrder}
                      onSeedOrders={handleSeedData}
                    />
                  )}

                  {/* 7. System Audit Logs & Monitoring View */}
                  {activeTab === 'audit' && (
                    <AuditLogsManager 
                      currentUser={currentUser}
                    />
                  )}

                  {/* 8. Fleet Drivers Interactive Map View */}
                  {activeTab === 'delivery' && (
                    <DriversMapManager 
                      currentUser={currentUser}
                      onShowToast={showToast}
                    />
                  )}

                  {/* 8b. Fazaa Orders & Fleet Management View */}
                  {activeTab === 'fazaa' && (
                    <FazaaOrdersManager 
                      currentUser={currentUser}
                      onCreateOrder={handleCreateFazaaOrder}
                      onUpdateOrderStatus={handleUpdateFazaaOrderStatus}
                      onCreateCategory={handleSaveFazaaCategory}
                    />
                  )}

                  {/* 9. App Customers & User Profiles View */}
                  {activeTab === 'customers' && (
                    <AppUsersManager 
                      currentUser={currentUser}
                      onSaveUser={handleSaveAppUser}
                    />
                  )}

                  {/* 9b. Driver Invoices & Receipts Gallery View */}
                  {activeTab === 'invoices' && (
                    <InvoicesManager
                      currentUser={currentUser}
                      onShowToast={showToast}
                    />
                  )}

                  {/* 10. Categories View */}
                  {activeTab === 'categories' && (
                    <CategoriesManager 
                      onAddCategory={() => {
                        setEditingCategory(null);
                        setIsCategoryModalOpen(true);
                      }}
                      onEditCategory={(cat) => {
                        setEditingCategory(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      onDeleteCategory={handleDeleteCategory}
                      onToggleStatus={handleToggleCategoryStatus}
                      onSeedData={handleSeedData}
                      currentUser={currentUser}
                    />
                  )}

                  {/* 10. Secondary / Specialized Views */}
                  {activeTab !== 'dashboard' && 
                   activeTab !== 'categories' && 
                   activeTab !== 'restaurants' && 
                   activeTab !== 'products' && 
                   activeTab !== 'admin' && 
                   activeTab !== 'orders' && 
                   activeTab !== 'invoices' &&
                   activeTab !== 'audit' && 
                   activeTab !== 'fazaa' && 
                   activeTab !== 'delivery' && 
                   activeTab !== 'customers' && (
                    <SecondaryViews tab={activeTab} selectedBranch={selectedBranch} />
                  )}
                    </>
                  )}
                </Suspense>
              </ErrorBoundary>
            )}

          </main>
        </div>
      </div>

      {/* Modals wrapped in Suspense */}
      <Suspense fallback={null}>
        <StoreModal 
          isOpen={isStoreModalOpen}
          onClose={() => {
            setIsStoreModalOpen(false);
            setEditingStore(null);
          }}
          onSave={handleSaveStore}
          store={editingStore}
          categories={categories}
          selectedCategoryFilter={selectedCategoryFilter}
          stores={stores}
        />

        <ProductModal 
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
            setInitialStoreIdForModal(undefined);
            setInitialSectionForModal(undefined);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
          categories={categories}
          stores={stores}
          initialStoreId={initialStoreIdForModal}
          initialSectionName={initialSectionForModal}
        />

        <CategoryModal 
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          category={editingCategory}
        />

        <UserModal 
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
          user={editingUser}
          stores={stores}
          users={adminUsers}
        />

        <ProductViewModal 
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      </Suspense>
    </div>
  );
}

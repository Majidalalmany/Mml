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
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
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

  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isLoadingFazaa, setIsLoadingFazaa] = useState<boolean>(true);
  const [isLoadingAppUsers, setIsLoadingAppUsers] = useState<boolean>(true);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(true);
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

  // 1. Categories Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingCategories(true);
    const categoriesQuery = query(collection(db, 'categories'));
    
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const catList: Category[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      catList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(catList);
      setIsLoadingCategories(false);
    }, (error) => {
      console.error('Categories listener error:', error);
      setIsLoadingCategories(false);
    });

    return () => unsubscribeCategories();
  }, []);

  // 2. Stores Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingStores(true);
    const storesQuery = query(collection(db, 'stores'));

    const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
      const storeList: Store[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Store[];

      setStores(storeList);
      setIsLoadingStores(false);
      
      // Sync selectedStoreDetail if open
      setSelectedStoreDetail(prev => {
        if (!prev) return null;
        const updated = storeList.find(s => s.id === prev.id);
        return updated || prev;
      });
    }, (error) => {
      console.error('Stores listener error:', error);
      setIsLoadingStores(false);
    });

    return () => unsubscribeStores();
  }, []);

  // 3. Products Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingProducts(true);
    const productsQuery = query(collection(db, 'products'));

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const prodList: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      setProducts(prodList);
      setIsLoadingProducts(false);
    }, (error) => {
      console.error('Products listener error:', error);
      setIsLoadingProducts(false);
    });

    return () => unsubscribeProducts();
  }, []);

  // 4. Admin Users Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingUsers(true);
    const usersQuery = query(collection(db, 'adminUsers'));

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const uList: AdminUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];

      setAdminUsers(uList);
      setIsLoadingUsers(false);
    }, (error) => {
      console.warn('Admin Users listener fallback:', error);
      setIsLoadingUsers(false);
    });

    return () => unsubscribeUsers();
  }, []);

  // 5. Orders Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingOrders(true);
    const ordersQuery = query(collection(db, 'orders'));

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const oList: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      setOrders(oList);
      setIsLoadingOrders(false);
    }, (error) => {
      console.warn('Orders listener fallback:', error);
      setIsLoadingOrders(false);
    });

    return () => unsubscribeOrders();
  }, []);

  // 6. Audit Logs Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingAudit(true);
    const auditQuery = query(collection(db, 'audit_logs'));

    const unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
      const aList: AuditLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];

      setAuditLogs(aList);
      setIsLoadingAudit(false);
    }, (error) => {
      console.warn('Audit logs listener fallback:', error);
      setIsLoadingAudit(false);
    });

    return () => unsubscribeAudit();
  }, []);

  // 7. Support Tickets Firestore Realtime Listener
  useEffect(() => {
    const ticketsQuery = query(collection(db, 'support_tickets'));

    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tList: SupportTicket[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];

      setSupportTickets(tList);
    }, (error) => {
      console.warn('Support tickets listener fallback:', error);
    });

    return () => unsubscribeTickets();
  }, []);

  // 7b. Drivers Realtime Listener
  useEffect(() => {
    const driversQuery = query(collection(db, 'drivers'));
    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const dList: DriverUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DriverUser[];
      setDrivers(dList);
    }, (error) => {
      console.warn('Drivers listener fallback:', error);
    });
    return () => unsubscribeDrivers();
  }, []);

  // 8. Fazaa & Manfaa Orders Realtime Listener
  useEffect(() => {
    setIsLoadingFazaa(true);
    let fazaaList: FazaaOrder[] = [];
    let manfaaList: FazaaOrder[] = [];

    const updateCombinedFazaaOrders = () => {
      const combined = [...fazaaList];
      manfaaList.forEach(mDoc => {
        if (!combined.some(f => f.id === mDoc.id)) {
          combined.push(mDoc);
        }
      });
      setFazaaOrders(combined);
      setIsLoadingFazaa(false);
    };

    const fazaaQuery = query(collection(db, 'fazaa_orders'));
    const unsubscribeFazaa = onSnapshot(fazaaQuery, (snapshot) => {
      fazaaList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FazaaOrder[];
      updateCombinedFazaaOrders();
    }, (error) => {
      console.warn('Fazaa orders listener fallback:', error);
      setIsLoadingFazaa(false);
    });

    const manfaaQuery = query(collection(db, 'manfaa_orders'));
    const unsubscribeManfaa = onSnapshot(manfaaQuery, (snapshot) => {
      manfaaList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FazaaOrder[];
      updateCombinedFazaaOrders();
    }, (error) => {
      console.warn('Manfaa orders listener fallback:', error);
    });

    return () => {
      unsubscribeFazaa();
      unsubscribeManfaa();
    };
  }, []);

  // 9. Fazaa Categories Listener
  useEffect(() => {
    const catQuery = query(collection(db, 'fazaa_categories'));
    const unsubscribeCats = onSnapshot(catQuery, (snapshot) => {
      const list: FazaaCategory[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FazaaCategory[];
      if (list.length > 0) {
        setFazaaCategories(list);
      } else {
        fetch('/api/fazaa/categories')
          .then(res => res.json())
          .then(data => {
            if (data.categories) setFazaaCategories(data.categories);
          })
          .catch(err => console.warn('Fazaa categories fallback:', err));
      }
    }, () => {
      fetch('/api/fazaa/categories')
        .then(res => res.json())
        .then(data => {
          if (data.categories) setFazaaCategories(data.categories);
        });
    });

    return () => unsubscribeCats();
  }, []);

  // 10. Clients Collection Firestore Realtime Listener
  useEffect(() => {
    setIsLoadingAppUsers(true);
    const clientsQuery = query(collection(db, 'clients'));
    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
      const list: AppUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppUser[];
      
      if (list.length > 0) {
        setAppUsers(list);
        setIsLoadingAppUsers(false);
      } else {
        // Fallback check on app_users
        const legacyQuery = query(collection(db, 'app_users'));
        onSnapshot(legacyQuery, (legSnap) => {
          const legList: AppUser[] = legSnap.docs.map(d => ({ id: d.id, ...d.data() })) as AppUser[];
          if (legList.length > 0) {
            setAppUsers(legList);
          } else {
            fetch('/api/users')
              .then(res => res.json())
              .then(data => { if (data.users) setAppUsers(data.users); })
              .catch(err => console.warn('App users API error:', err));
          }
          setIsLoadingAppUsers(false);
        }, () => setIsLoadingAppUsers(false));
      }
    }, (err) => {
      console.warn('Clients listener fallback:', err);
      setIsLoadingAppUsers(false);
    });

    return () => unsubscribeClients();
  }, []);

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
        await updateDoc(doc(db, 'fazaa_orders', orderId), {
          status,
          ...(driverName !== undefined ? { driverName, driverPhone } : {}),
          updatedAt: new Date().toISOString()
        });
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

  // Auto-seed if Firestore database is empty on first load
  useEffect(() => {
    if (!isLoadingCategories && !isLoadingProducts && !isLoadingStores && !isLoadingOrders &&
        categories.length === 0 && products.length === 0 && stores.length === 0 && orders.length === 0) {
      handleSeedData();
    }
  }, [isLoadingCategories, isLoadingProducts, isLoadingStores, isLoadingOrders]);

  // Orders CRUD Handlers
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, extraData?: Partial<Order>) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updatePayload: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(extraData || {})
      };
      await updateDoc(orderRef, updatePayload);
      const statusLabel = ORDER_STATUS_LABELS[newStatus] || newStatus;
      showToast(`تم تغيير حالة الطلب بنجاح إلى (${statusLabel})`);

      // Audit Log
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
    } catch (err: any) {
      console.error('Error updating order status:', err);
      showToast('فشل تعديل حالة الطلب في Firestore: ' + (err.message || ''), 'error');
      await logSystemActivity({
        action: 'خطأ في تعديل حالة الطلب',
        performedBy: currentUser ? currentUser.name : 'النظام',
        userEmail: currentUser?.email,
        targetType: 'order',
        targetName: orderId,
        details: `تفاصيل الخطأ: ${err.message}`,
        severity: 'error'
      });
      throw err;
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
      await deleteDoc(doc(db, 'stores', storeId));
      showToast('تم حذف المتجر بنجاح من Firestore');
      await logSystemActivity({
        action: 'حذف متجر',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'store',
        targetName: st?.name || storeId,
        details: `حذف المتجر ${st?.name} نهائياً من قاعدة البيانات`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error deleting store:', err);
      showToast('فشل حذف المتجر: ' + (err.message || ''), 'error');
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
        await updateDoc(uRef, {
          ...userData,
          updatedAt: new Date().toISOString()
        });
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
        await addDoc(collection(db, 'adminUsers'), {
          ...userData,
          createdAt: new Date().toISOString()
        });
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
      await deleteDoc(doc(db, 'categories', categoryId));
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      showToast('تم حذف التصنيف بنجاح من Firestore');
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showToast('فشل حذف التصنيف: ' + (err.message || ''), 'error');
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
          productsCount={products.length}
          categoriesCount={categories.length}
          categories={categories}
          stores={stores}
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
                      products={products}
                      categories={categories}
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
                          orders={orders}
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

                      {/* 2. Dedicated Categories & Services Management View (صفحة إدارة الفئات والخدمات المنفصلة) */}
                      {activeTab === 'categories' && (
                        <CategoriesManager 
                          categories={categories}
                          stores={stores}
                          products={products}
                          isLoading={isLoadingCategories}
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
                          onNavigateToStores={(categoryId) => {
                            if (categoryId) setSelectedCategoryFilter(categoryId);
                            setActiveTab('restaurants');
                          }}
                          currentUser={currentUser}
                        />
                      )}

                      {/* 2b. Stores & Restaurants View */}
                      {activeTab === 'restaurants' && (
                        <StoresManager 
                          stores={stores}
                          categories={categories}
                          products={products}
                          isLoading={isLoadingStores}
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
                      products={products}
                      categories={categories}
                      stores={stores}
                      isLoading={isLoadingProducts}
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
                      users={adminUsers}
                      stores={stores}
                      isLoading={isLoadingUsers}
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
                      orders={orders}
                      stores={stores}
                      currentUser={currentUser}
                      isLoading={isLoadingOrders}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onCreateOrder={handleCreateOrder}
                      onSeedOrders={handleSeedData}
                    />
                  )}

                  {/* 7. System Audit Logs & Monitoring View */}
                  {activeTab === 'audit' && (
                    <AuditLogsManager 
                      logs={auditLogs}
                      isLoading={isLoadingAudit}
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
                      orders={fazaaOrders}
                      categories={fazaaCategories}
                      currentUser={currentUser}
                      isLoading={isLoadingFazaa}
                      onCreateOrder={handleCreateFazaaOrder}
                      onUpdateOrderStatus={handleUpdateFazaaOrderStatus}
                      onCreateCategory={handleSaveFazaaCategory}
                    />
                  )}

                  {/* 9. App Customers & User Profiles View */}
                  {activeTab === 'customers' && (
                    <AppUsersManager 
                      users={appUsers}
                      currentUser={currentUser}
                      isLoading={isLoadingAppUsers}
                      onSaveUser={handleSaveAppUser}
                    />
                  )}

                  {/* 9b. Driver Invoices & Receipts Gallery View */}
                  {activeTab === 'invoices' && (
                    <InvoicesManager
                      drivers={drivers}
                      currentUser={currentUser}
                      onShowToast={showToast}
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

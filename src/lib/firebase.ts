// Offline Mock Database & Reactive Store Engine (100% Client-Side / Offline Mode)
// Provides instant, zero-latency operations with localStorage persistence and real-time updates

import { 
  INITIAL_CATEGORIES, 
  INITIAL_STORES, 
  INITIAL_PRODUCTS, 
  INITIAL_ADMIN_USERS, 
  INITIAL_ORDERS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SUPPORT_TICKETS 
} from '../services/seedData';

// Initial Demo Drivers for Yemen Fleet Tracking
export const INITIAL_DEMO_DRIVERS = [
  {
    id: 'drv-sanaa-1',
    name: 'الكابتن أحمد الصنعاني',
    phone: '771234567',
    email: 'ahmed.driver@jahez.com',
    vehicleType: 'دراجة نارية',
    plateNumber: 'صنعاء 1234-أ',
    isOnline: true,
    status: 'active',
    role: 'driver',
    lat: 15.3694,
    lng: 44.1910,
    speed: 38,
    locationName: 'شارع حدة - صنعاء',
    assignedOrdersCount: 2,
    activeOrder: {
      id: 'ord-sanaa-9821',
      orderNumber: 'FZ-9821',
      customerName: 'المهندس ياسر الحكيمي',
      customerPhone: '777443322',
      storeName: 'مطعم الشيباني الملكي - حدة',
      pickupAddress: 'شارع حدة - مقابل مركز المدينة',
      dropoffAddress: 'حي الأصبحي - شارع المقالح - منزل رقم 14',
      destLat: 15.3280,
      destLng: 44.2050,
      pickupLat: 15.3550,
      pickupLng: 44.1980,
      fee: 1500,
      status: 'delivering',
      estimatedMinutes: 12,
      distanceKm: 3.8
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv-aden-2',
    name: 'الكابتن محمد العدني',
    phone: '739876543',
    email: 'aden.driver@jahez.com',
    vehicleType: 'سيارة',
    plateNumber: 'عدن 5678-ب',
    isOnline: true,
    status: 'active',
    role: 'driver',
    lat: 12.7855,
    lng: 45.0187,
    speed: 45,
    locationName: 'خور مكسر - عدن',
    assignedOrdersCount: 1,
    activeOrder: {
      id: 'ord-aden-4412',
      orderNumber: 'AD-4412',
      customerName: 'الأستاذ وضاح باحشوان',
      customerPhone: '733221144',
      storeName: 'سوبرماركت الوفاء التجاري',
      pickupAddress: 'المعلا - الشارع الرئيسي',
      dropoffAddress: 'كريتر - جوار البنك الأهلي',
      destLat: 12.7750,
      destLng: 45.0350,
      pickupLat: 12.7910,
      pickupLng: 45.0080,
      fee: 2000,
      status: 'delivering',
      estimatedMinutes: 18,
      distanceKm: 5.2
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv-taiz-3',
    name: 'الكابتن طارق التعزي',
    phone: '715566778',
    email: 'taiz.driver@jahez.com',
    vehicleType: 'دراجة نارية',
    plateNumber: 'تعز 9012-ج',
    isOnline: false,
    status: 'active',
    role: 'driver',
    lat: 13.5789,
    lng: 44.0181,
    speed: 0,
    locationName: 'شارع جمال - تعز',
    assignedOrdersCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv-mukalla-4',
    name: 'الكابتن عمر الحضرمي',
    phone: '701122334',
    email: 'mukalla.driver@jahez.com',
    vehicleType: 'سيارة',
    plateNumber: 'حضرموت 3456-د',
    isOnline: true,
    status: 'active',
    role: 'driver',
    lat: 14.5425,
    lng: 49.1242,
    speed: 28,
    locationName: 'الديس - المكلا',
    assignedOrdersCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv-ibb-5',
    name: 'الكابتن سامي الإبي',
    phone: '775544332',
    email: 'ibb.driver@jahez.com',
    vehicleType: 'دراجة نارية',
    plateNumber: 'إب 7890-هـ',
    isOnline: true,
    status: 'active',
    role: 'driver',
    lat: 13.9667,
    lng: 44.1833,
    speed: 32,
    locationName: 'شارع تعز - إب',
    assignedOrdersCount: 1,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_FAZAA_CATEGORIES = [
  {
    id: 'fazaa-cat-1',
    name: 'نقل واستلام أغراض',
    description: 'إرسال واستلام الطرود، الهدايا، والمستندات بسرعة بين الأحياء',
    icon: 'Package',
    baseFee: 1000,
    status: 'active',
    order: 1
  },
  {
    id: 'fazaa-cat-2',
    name: 'شراء من مكان محدد',
    description: 'شراء أغراض خاصة من بقالات، صيدليات، أو أسواق شعبية غير مسجلة بالمتجر',
    icon: 'ShoppingBag',
    baseFee: 1500,
    status: 'active',
    order: 2
  },
  {
    id: 'fazaa-cat-3',
    name: 'مشاوير وخدمات خاصة',
    description: 'توصيل عاجل، خدمات تجديد مستندات، ودفع فواتير سريعة',
    icon: 'Zap',
    baseFee: 2000,
    status: 'active',
    order: 3
  }
];

export const INITIAL_FAZAA_ORDERS = [
  {
    id: 'fazaa-ord-1',
    orderNumber: 'FZ-1001',
    customerName: 'عبدالله السعدي',
    customerPhone: '771239988',
    categoryName: 'نقل واستلام أغراض',
    pickupAddress: 'صنعاء - شارع بغداد',
    dropoffAddress: 'صنعاء - حي الأصبحي',
    status: 'delivering',
    fee: 1500,
    assignedDriverId: 'drv-sanaa-1',
    assignedDriverName: 'الكابتن أحمد الصنعاني',
    notes: 'يرجى الحذر على الحقيبة الورقية لأنها تحتوي على مستندات رسمية',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'fazaa-ord-2',
    orderNumber: 'FZ-1002',
    customerName: 'مروى الشامي',
    customerPhone: '774556677',
    categoryName: 'شراء من مكان محدد',
    pickupAddress: 'صنعاء - صيدلية برج الأطباء - حدة',
    dropoffAddress: 'صنعاء - عصر - قرب فندق البستان',
    status: 'new',
    fee: 1800,
    notes: 'شراء أدوية مسكنات وحليب أطفال والوصول سريعاً',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];

export const INITIAL_APP_USERS = [
  {
    id: 'app-usr-1',
    name: 'عبدالرحمن العولقي',
    phone: '777123456',
    email: 'abood@gmail.com',
    ordersCount: 14,
    totalSpent: 48500,
    status: 'active',
    city: 'صنعاء',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  },
  {
    id: 'app-usr-2',
    name: 'سارة عبدالحليم',
    phone: '733987654',
    email: 'sara.h@gmail.com',
    ordersCount: 8,
    totalSpent: 32000,
    status: 'active',
    city: 'عدن',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
  },
  {
    id: 'app-usr-3',
    name: 'خالد الردفاني',
    phone: '711223344',
    email: 'khaled.r@yahoo.com',
    ordersCount: 22,
    totalSpent: 86400,
    status: 'active',
    city: 'تعز',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
  }
];

export const INITIAL_INVOICES = [
  {
    id: 'inv-rec-1',
    orderId: 'ord-sanaa-9821',
    orderNumber: 'FZ-9821',
    driverId: 'drv-sanaa-1',
    driverName: 'الكابتن أحمد الصنعاني',
    customerName: 'المهندس ياسر الحكيمي',
    storeName: 'مطعم الشيباني الملكي - حدة',
    amount: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3e06?auto=format&fit=crop&w=600&q=80',
    type: 'fazaa',
    status: 'approved',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

// Helper to seed or retrieve local collection data
function getInitialDataForCollection(collectionName: string): any[] {
  switch (collectionName) {
    case 'categories':
      return INITIAL_CATEGORIES.map((cat, idx) => ({ id: `cat-${idx + 1}`, ...cat }));
    case 'stores': {
      const catMap: Record<string, string> = {
        'محلات عصائر ومرطبات': 'cat-1',
        'سوبرماركت وبقالة': 'cat-2',
        'محلات ملابس وموضة': 'cat-3',
        'مطاعم ومقاهي': 'cat-4',
        'مخابز وحلويات': 'cat-5',
        'صيدليات ومستلزمات طبية': 'cat-6',
        'إلكترونيات وجوالات': 'cat-7',
        'بهارات وعطارة': 'cat-8'
      };
      return INITIAL_STORES.map((st, idx) => ({
        id: `store-${idx + 1}`,
        categoryId: catMap[st.categoryName] || 'cat-1',
        ...st
      }));
    }
    case 'products': {
      const catMap: Record<string, string> = {
        'محلات عصائر ومرطبات': 'cat-1',
        'سوبرماركت وبقالة': 'cat-2',
        'محلات ملابس وموضة': 'cat-3',
        'مطاعم ومقاهي': 'cat-4',
        'مخابز وحلويات': 'cat-5',
        'صيدليات ومستلزمات طبية': 'cat-6',
        'إلكترونيات وجوالات': 'cat-7',
        'بهارات وعطارة': 'cat-8'
      };
      const storeMap: Record<string, string> = {
        'عصائر ومرطبات الفردوس': 'store-1',
        'بوتيك الأناقة للملابس الجاهزة': 'store-2',
        'سوبر ماركت الوفاء التجاري': 'store-3',
        'مطعم الشيباني الفاخر': 'store-4',
        'مخبز وحلويات الروضة الملكية': 'store-5',
        'صيدلية ابن حيان الكبرى': 'store-6',
        'مركز المدينة للإلكترونيات والجوالات': 'store-7'
      };
      return INITIAL_PRODUCTS.map((prod, idx) => ({
        id: `prod-${idx + 1}`,
        categoryId: catMap[prod.categoryName] || 'cat-1',
        storeId: storeMap[prod.storeName] || 'store-1',
        ...prod
      }));
    }
    case 'adminUsers':
      return INITIAL_ADMIN_USERS.map((usr, idx) => ({ id: `admin-${idx + 1}`, ...usr }));
    case 'orders':
      return INITIAL_ORDERS.map((ord, idx) => ({ id: `order-${idx + 1}`, ...ord }));
    case 'audit_logs':
      return INITIAL_AUDIT_LOGS.map((log, idx) => ({ id: `log-${idx + 1}`, ...log }));
    case 'support_tickets':
      return INITIAL_SUPPORT_TICKETS.map((tck, idx) => ({ id: `ticket-${idx + 1}`, ...tck }));
    case 'drivers':
      return INITIAL_DEMO_DRIVERS;
    case 'fazaa_categories':
      return INITIAL_FAZAA_CATEGORIES;
    case 'fazaa_orders':
      return INITIAL_FAZAA_ORDERS;
    case 'app_users':
      return INITIAL_APP_USERS;
    case 'driver_invoices':
      return INITIAL_INVOICES;
    default:
      return [];
  }
}

const STORAGE_PREFIX = 'jahez_offline_db_';

function getLocalCollection(collectionName: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${collectionName}`);
    if (raw) {
      return JSON.parse(raw);
    }
    // Auto-seed initial data
    const initial = getInitialDataForCollection(collectionName);
    localStorage.setItem(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(initial));
    return initial;
  } catch (e) {
    console.warn(`Local DB read error for ${collectionName}:`, e);
    return getInitialDataForCollection(collectionName);
  }
}

function saveLocalCollection(collectionName: string, data: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(data));
    // Broadcast change event
    window.dispatchEvent(new CustomEvent('local_store_changed', { detail: { collectionName } }));
  } catch (e) {
    console.warn(`Local DB write error for ${collectionName}:`, e);
  }
}

// -------------------------------------------------------------
// Core Firestore Types & Interfaces
// -------------------------------------------------------------

export interface DocumentReference {
  id: string;
  path: string;
  _collectionName: string;
}

export interface CollectionReference {
  id: string;
  path: string;
  _collectionName: string;
}

export interface QueryConstraint {
  type: 'where' | 'orderBy';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
}

export interface Query {
  _collectionName: string;
  _constraints: QueryConstraint[];
}

export interface DocumentSnapshot {
  id: string;
  exists: () => boolean;
  data: () => Record<string, any>;
}

export interface QuerySnapshot {
  empty: boolean;
  size: number;
  docs: DocumentSnapshot[];
  forEach: (callback: (doc: DocumentSnapshot) => void) => void;
}

// -------------------------------------------------------------
// Database Instance Mock
// -------------------------------------------------------------

export const db = {
  _type: 'offline_mock_firestore',
  app: { name: '[DEFAULT]' }
};

// -------------------------------------------------------------
// Firestore Methods
// -------------------------------------------------------------

export function collection(_db: any, collectionName: string): CollectionReference {
  return {
    id: collectionName,
    path: collectionName,
    _collectionName: collectionName
  };
}

export function doc(
  first: any, 
  second?: string, 
  third?: string
): DocumentReference {
  let colName = '';
  let docId = '';

  if (third !== undefined) {
    colName = second || '';
    docId = third;
  } else if (second !== undefined) {
    if (typeof first === 'object' && first?._collectionName) {
      colName = first._collectionName;
      docId = second;
    } else {
      colName = first;
      docId = second;
    }
  } else {
    colName = 'general';
    docId = String(first);
  }

  return {
    id: docId,
    path: `${colName}/${docId}`,
    _collectionName: colName
  };
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function query(
  colOrQuery: CollectionReference | Query, 
  ...constraints: QueryConstraint[]
): Query {
  const colName = colOrQuery._collectionName;
  const existingConstraints = (colOrQuery as Query)._constraints || [];
  return {
    _collectionName: colName,
    _constraints: [...existingConstraints, ...constraints]
  };
}

function evaluateQuery(collectionName: string, constraints: QueryConstraint[] = []): any[] {
  let items = getLocalCollection(collectionName);

  for (const c of constraints) {
    if (c.type === 'where' && c.field && c.op !== undefined) {
      items = items.filter(item => {
        const val = item[c.field!];
        switch (c.op) {
          case '==':
            return val === c.value;
          case '!=':
            return val !== c.value;
          case '>':
            return val > c.value;
          case '>=':
            return val >= c.value;
          case '<':
            return val < c.value;
          case '<=':
            return val <= c.value;
          case 'array-contains':
            return Array.isArray(val) && val.includes(c.value);
          default:
            return true;
        }
      });
    } else if (c.type === 'orderBy' && c.field) {
      items = [...items].sort((a, b) => {
        const valA = a[c.field!] || '';
        const valB = b[c.field!] || '';
        if (valA < valB) return c.direction === 'desc' ? 1 : -1;
        if (valA > valB) return c.direction === 'desc' ? -1 : 1;
        return 0;
      });
    }
  }

  return items;
}

function buildSnapshot(items: any[]): QuerySnapshot {
  const docs: DocumentSnapshot[] = items.map(item => ({
    id: String(item.id || ''),
    exists: () => true,
    data: () => ({ ...item })
  }));

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (cb) => docs.forEach(cb)
  };
}

export async function getDocs(queryOrCol: CollectionReference | Query): Promise<QuerySnapshot> {
  const colName = queryOrCol._collectionName;
  const constraints = (queryOrCol as Query)._constraints || [];
  const items = evaluateQuery(colName, constraints);
  return buildSnapshot(items);
}

export async function getDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  const colName = docRef._collectionName;
  const items = getLocalCollection(colName);
  const found = items.find(item => String(item.id) === String(docRef.id));
  return {
    id: docRef.id,
    exists: () => !!found,
    data: () => found ? { ...found } : {}
  };
}

export async function addDoc(colRef: CollectionReference, data: Record<string, any>): Promise<DocumentReference> {
  const colName = colRef._collectionName;
  const items = getLocalCollection(colName);
  const newId = `${colName.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newItem = {
    ...data,
    id: newId,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };

  items.unshift(newItem);
  saveLocalCollection(colName, items);

  return {
    id: newId,
    path: `${colName}/${newId}`,
    _collectionName: colName
  };
}

export async function setDoc(
  docRef: DocumentReference, 
  data: Record<string, any>, 
  options?: { merge?: boolean }
): Promise<void> {
  const colName = docRef._collectionName;
  const items = getLocalCollection(colName);
  const index = items.findIndex(item => String(item.id) === String(docRef.id));

  if (index >= 0) {
    if (options?.merge) {
      items[index] = { ...items[index], ...data, id: docRef.id, updatedAt: new Date().toISOString() };
    } else {
      items[index] = { ...data, id: docRef.id, updatedAt: new Date().toISOString() };
    }
  } else {
    items.unshift({ ...data, id: docRef.id, createdAt: data.createdAt || new Date().toISOString() });
  }

  saveLocalCollection(colName, items);
}

export async function updateDoc(docRef: DocumentReference, data: Record<string, any>): Promise<void> {
  const colName = docRef._collectionName;
  const items = getLocalCollection(colName);
  const index = items.findIndex(item => String(item.id) === String(docRef.id));

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    saveLocalCollection(colName, items);
  }
}

export async function deleteDoc(docRef: DocumentReference): Promise<void> {
  const colName = docRef._collectionName;
  let items = getLocalCollection(colName);
  items = items.filter(item => String(item.id) !== String(docRef.id));
  saveLocalCollection(colName, items);
}

export function onSnapshot(
  queryOrCol: CollectionReference | Query,
  onNext: (snapshot: QuerySnapshot) => void,
  _onError?: (error: Error) => void
): () => void {
  const colName = queryOrCol._collectionName;
  const constraints = (queryOrCol as Query)._constraints || [];

  // Trigger initial snapshot immediately
  const sendFreshSnapshot = () => {
    try {
      const items = evaluateQuery(colName, constraints);
      onNext(buildSnapshot(items));
    } catch (err: any) {
      console.warn('Snapshot error:', err);
    }
  };

  sendFreshSnapshot();

  const handleStoreChange = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (!customEvt.detail || customEvt.detail.collectionName === colName) {
      sendFreshSnapshot();
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === `${STORAGE_PREFIX}${colName}`) {
      sendFreshSnapshot();
    }
  };

  window.addEventListener('local_store_changed', handleStoreChange);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('local_store_changed', handleStoreChange);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

export function writeBatch(_db?: any) {
  const operations: Array<() => void> = [];

  return {
    set(docRef: DocumentReference, data: any, options?: { merge?: boolean }) {
      operations.push(() => setDoc(docRef, data, options));
    },
    update(docRef: DocumentReference, data: any) {
      operations.push(() => updateDoc(docRef, data));
    },
    delete(docRef: DocumentReference) {
      operations.push(() => deleteDoc(docRef));
    },
    async commit() {
      for (const op of operations) {
        op();
      }
    }
  };
}

// -------------------------------------------------------------
// Auth Mock Engine
// -------------------------------------------------------------

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

class MockAuth {
  currentUser: FirebaseUser | null = null;
  private listeners: Array<(user: FirebaseUser | null) => void> = [];

  constructor() {
    try {
      const saved = localStorage.getItem('jahez_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        this.currentUser = {
          uid: u.id || 'admin-1',
          email: u.email || 'majdallmany3@gmail.com',
          displayName: u.name || 'مجد الألماني (المدير العام)'
        };
      }
    } catch {
      this.currentUser = null;
    }
  }

  notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const auth = new MockAuth();

export async function signInWithEmailAndPassword(
  _authInstance: any, 
  email: string, 
  _password?: string
) {
  const users = getLocalCollection('adminUsers');
  const found = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

  const mockUser: FirebaseUser = {
    uid: found?.id || 'admin-1',
    email: email,
    displayName: found?.name || email.split('@')[0]
  };

  auth.currentUser = mockUser;
  auth.notify();

  return { user: mockUser };
}

export async function createUserWithEmailAndPassword(
  _authInstance: any, 
  email: string, 
  _password?: string
) {
  const mockUser: FirebaseUser = {
    uid: `user-${Date.now()}`,
    email: email,
    displayName: email.split('@')[0]
  };

  auth.currentUser = mockUser;
  auth.notify();

  return { user: mockUser };
}

export async function signOut(_authInstance?: any) {
  auth.currentUser = null;
  localStorage.removeItem('jahez_auth_user');
  auth.notify();
}

export function onAuthStateChanged(
  _authInstance: any, 
  callback: (user: FirebaseUser | null) => void
) {
  return auth.onAuthStateChanged(callback);
}

export async function setPersistence(_auth: any, _persistence: any) {
  return Promise.resolve();
}

export const browserLocalPersistence = 'LOCAL';
export const browserSessionPersistence = 'SESSION';

export default {
  db,
  auth
};

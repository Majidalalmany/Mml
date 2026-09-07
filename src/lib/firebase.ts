import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  writeBatch, 
  serverTimestamp,
  type DocumentReference,
  type CollectionReference,
  type QueryConstraint,
  type Query,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User as FirebaseUser,
  type Auth
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Explicitly pass firestoreDatabaseId from firebase-applet-config.json to prevent connecting to wrong (default) database
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);

// Re-export Firestore and Auth functions
export {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
};

export type {
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  Query,
  DocumentSnapshot,
  QuerySnapshot,
  FirebaseUser,
  Firestore,
  Auth
};

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

export default {
  db,
  auth
};

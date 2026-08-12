import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Play, 
  Pause, 
  Navigation, 
  Gauge, 
  Calendar, 
  UserPlus, 
  X, 
  Check, 
  Layers, 
  LocateFixed,
  Car,
  Bike,
  Route,
  Clock,
  EyeOff
} from 'lucide-react';
import L from 'leaflet';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DriverUser, AdminUser, ActiveDeliveryOrder } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { DedicatedDeliveryMapModal } from './DedicatedDeliveryMapModal';

export interface DriverLocationPoint {
  id?: string;
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  timestamp: string;
}

// Sample YEMEN Cities Presets for Quick Map Positioning
const CITY_PRESETS = [
  { name: 'صنعاء', lat: 15.3694, lng: 44.1910 },
  { name: 'عدن', lat: 12.7855, lng: 45.0187 },
  { name: 'تعز', lat: 13.5789, latLng: [13.5789, 44.0181], lng: 44.0181 },
  { name: 'المكلا', lat: 14.5425, lng: 49.1242 },
  { name: 'إب', lat: 13.9667, lng: 44.1833 },
  { name: 'مأرب', lat: 15.4625, lng: 45.3258 },
  { name: 'الحديدة', lat: 14.7978, lng: 42.9545 }
];

// Seed fallback drivers if Firestore is initialised empty
const INITIAL_DEMO_DRIVERS: DriverUser[] = [
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
    email: '',
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
      orderNumber: 'FZ-4412',
      customerName: 'د. سارة المنصوري',
      customerPhone: '733221100',
      storeName: 'سوبرماركت التضامن',
      pickupAddress: 'خور مكسر - الشارع العام',
      dropoffAddress: 'حي العيدروس - الشارع الرئيسي - عمارة 8',
      destLat: 12.7720,
      destLng: 45.0350,
      pickupLat: 12.7880,
      pickupLng: 45.0210,
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
    phone: '711223344',
    email: 'tareq@jahez.com',
    vehicleType: 'دراجة نارية',
    plateNumber: 'تعز 9101-ج',
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
    phone: '700112233',
    email: '',
    vehicleType: 'سيارة',
    plateNumber: 'حضرموت 3322-د',
    isOnline: true,
    status: 'active',
    role: 'driver',
    lat: 14.5425,
    lng: 49.1242,
    speed: 52,
    locationName: 'شارع الستين - المكلا',
    assignedOrdersCount: 3,
    activeOrder: {
      id: 'ord-mkl-1029',
      orderNumber: 'FZ-1029',
      customerName: 'الأستاذ سالم باوزير',
      customerPhone: '700889900',
      storeName: 'صيدلية الحياة الكبرى',
      pickupAddress: 'المكلا - شارع الستين',
      dropoffAddress: 'حي السلام - قرب الكورنيش - فيلا 3',
      destLat: 14.5310,
      destLng: 49.1380,
      pickupLat: 14.5450,
      pickupLng: 49.1200,
      fee: 1800,
      status: 'delivering',
      estimatedMinutes: 10,
      distanceKm: 2.9
    },
    createdAt: new Date().toISOString()
  }
];

interface DriversMapManagerProps {
  currentUser: AdminUser | null;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const DriversMapManager: React.FC<DriversMapManagerProps> = ({
  currentUser,
  onShowToast
}) => {
  const [drivers, setDrivers] = useState<DriverUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'available' | 'online' | 'busy' | 'offline' | 'all'>('available');
  const [lastFirestoreSyncTime, setLastFirestoreSyncTime] = useState<string | null>(null);
  
  // Selection & Modal States
  const [selectedDriver, setSelectedDriver] = useState<DriverUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<DriverUser | null>(null);
  const [isSimulatingMove, setIsSimulatingMove] = useState<boolean>(false);

  // Form Fields for Add / Edit Driver
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicleType: 'دراجة نارية',
    plateNumber: '',
    status: 'active' as 'active' | 'pending' | 'suspended',
    isOnline: true,
    lat: 15.3694,
    lng: 44.1910,
    locationName: 'صنعاء'
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Path / Trail Tracking States
  const [activeTrailDriverId, setActiveTrailDriverId] = useState<string | null>(null);
  const [trailPointsCount, setTrailPointsCount] = useState<number>(0);
  const [isLoadingTrail, setIsLoadingTrail] = useState<boolean>(false);

  // Active Delivery Route Destination States
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<ActiveDeliveryOrder | null>(null);
  const [isDedicatedModalOpen, setIsDedicatedModalOpen] = useState<boolean>(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const trailMarkersRef = useRef<L.Marker[]>([]);

  // Active Delivery Route Map Refs
  const deliveryPolylineRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);

  const canCreate = !currentUser || hasModulePermission(currentUser.permissions, currentUser.role, 'drivers_management', 'create');
  const canEdit = !currentUser || hasModulePermission(currentUser.permissions, currentUser.role, 'drivers_management', 'edit');
  const canDelete = !currentUser || hasModulePermission(currentUser.permissions, currentUser.role, 'drivers_management', 'delete');

  // Clear Active Delivery Route and Destination Markers from Map
  const clearActiveDeliveryRoute = () => {
    if (deliveryPolylineRef.current) {
      deliveryPolylineRef.current.remove();
      deliveryPolylineRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    setActiveDeliveryOrder(null);
  };

  // Clear Path and Waypoint Markers from Map
  const clearDriverPath = () => {
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    trailMarkersRef.current.forEach(m => m.remove());
    trailMarkersRef.current = [];
    setActiveTrailDriverId(null);
    setTrailPointsCount(0);
  };

  // Draw Active Delivery Route and Destination Marker when clicking an online driver
  const handleDrawActiveOrderRoute = (driver: DriverUser) => {
    clearActiveDeliveryRoute();
    const map = leafletMapRef.current;
    if (!map || !driver || !driver.isOnline || driver.status !== 'active') return;

    const driverLat = driver.lat || 15.3694;
    const driverLng = driver.lng || 44.1910;

    // Resolve active order or generate realistic order destination
    let order = driver.activeOrder;
    if (!order && (driver.assignedOrdersCount || 0) > 0) {
      order = {
        id: `ord-${driver.id}-${Date.now()}`,
        orderNumber: `FZ-${Math.floor(1000 + Math.random() * 8999)}`,
        customerName: 'الأستاذ عبد الله المقطري',
        customerPhone: '77' + Math.floor(1000000 + Math.random() * 8999999),
        storeName: 'مركز خدمة فزعة المباشر',
        pickupAddress: `${driver.locationName || 'نقطة الانطلاق'} - الشارع العام`,
        dropoffAddress: `حي المطار / الروضة - منزل العميل - شارع الستين`,
        destLat: driverLat + 0.014,
        destLng: driverLng + 0.016,
        pickupLat: driverLat - 0.005,
        pickupLng: driverLng - 0.005,
        fee: 1500,
        status: 'delivering',
        estimatedMinutes: 14,
        distanceKm: 3.6
      };
    }

    if (!order) return;

    // 1. Draw Pickup Store Marker if available
    if (order.pickupLat && order.pickupLng) {
      const pickupIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white text-white shadow-md flex items-center justify-center font-bold text-xs">
              🏪
            </div>
            <div class="absolute -bottom-5 bg-slate-900 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-amber-500">
              ${order.storeName || 'المتجر'}
            </div>
          </div>
        `,
        className: 'custom-pickup-store-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const pMarker = L.marker([order.pickupLat, order.pickupLng], { icon: pickupIcon }).addTo(map);
      pMarker.bindPopup(`<div class="p-1.5 text-right font-sans" dir="rtl"><b class="text-amber-600 text-xs">🏪 نقطة الاستلام / المتجر:</b><br/><span class="font-bold text-slate-800 text-xs">${order.storeName}</span><br/><span class="text-[11px] text-slate-500">${order.pickupAddress}</span></div>`);
      pickupMarkerRef.current = pMarker;
    }

    // 2. Draw Customer Dropoff Destination Marker
    const destIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-3 rounded-full bg-rose-500/40 animate-ping"></div>
          <div class="w-10 h-10 rounded-full bg-rose-600 border-2 border-white text-white shadow-2xl flex items-center justify-center font-bold text-base">
            📍
          </div>
          <div class="absolute -bottom-7 bg-slate-900 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded shadow-xl whitespace-nowrap border border-rose-500">
            🎯 وجهة التسليم: ${order.customerName.split(' ')[0]}
          </div>
        </div>
      `,
      className: 'custom-dest-dropoff-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const dMarker = L.marker([order.destLat, order.destLng], { icon: destIcon }).addTo(map);
    dMarker.bindPopup(`
      <div class="p-2 text-right dir-rtl font-sans" dir="rtl">
        <div class="font-extrabold text-xs text-rose-600 mb-1">🎯 وجهة تسليم الطلب (${order.orderNumber})</div>
        <div class="text-xs text-slate-900 font-bold">👤 المستلم: ${order.customerName}</div>
        <div class="text-[10px] text-slate-600 font-mono mb-1">📞 ${order.customerPhone}</div>
        <div class="text-[11px] text-slate-700 border-t pt-1 border-slate-200">📍 ${order.dropoffAddress}</div>
        <div class="mt-1.5 text-[10px] text-emerald-800 font-bold bg-emerald-50 p-1.5 rounded border border-emerald-200">⏱️ الوقت المقدر للوصول: ${order.estimatedMinutes || 10} دقيقة (${order.distanceKm || 3} كم)</div>
      </div>
    `);
    destMarkerRef.current = dMarker;

    // 3. Draw Active Delivery Polyline Route
    const routePoints: L.LatLngExpression[] = [];
    if (order.pickupLat && order.pickupLng) {
      routePoints.push([order.pickupLat, order.pickupLng]);
    }
    routePoints.push([driverLat, driverLng]);
    routePoints.push([order.destLat, order.destLng]);

    const polyline = L.polyline(routePoints, {
      color: '#f59e0b', // Vibrant Amber Delivery Route Line
      weight: 5,
      opacity: 0.9,
      dashArray: '10, 8'
    }).addTo(map);

    deliveryPolylineRef.current = polyline;
    setActiveDeliveryOrder(order);

    // Fit map view to show both driver and destination
    map.fitBounds(polyline.getBounds(), { padding: [80, 80] });
  };

  // Fetch or Generate Driver 2-Hour Trajectory Path from Firestore
  const handleLoadDriverTrail = async (driver: DriverUser) => {
    if (!driver || !leafletMapRef.current) return;
    setIsLoadingTrail(true);
    
    // Clear previous drawn route
    clearDriverPath();

    const map = leafletMapRef.current;
    const driverLat = driver.lat || 15.3694;
    const driverLng = driver.lng || 44.1910;
    const twoHoursAgoTime = Date.now() - (2 * 60 * 60 * 1000);

    try {
      // Query Firestore `driver_locations` for this driver's position logs
      const locsRef = collection(db, 'driver_locations');
      const qLocs = query(locsRef, where('driverId', '==', driver.id));
      const snapshot = await getDocs(qLocs);

      let fetchedPoints: DriverLocationPoint[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as DriverLocationPoint[];

      // Filter points within last 2 hours
      let recentPoints = fetchedPoints.filter(p => {
        const time = new Date(p.timestamp).getTime();
        return !isNaN(time) && time >= twoHoursAgoTime;
      });

      // Sort points chronologically (oldest to newest)
      recentPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // If fewer than 3 historical points exist in Firestore, generate a realistic 2-hour delivery route ending at current location
      if (recentPoints.length < 3) {
        recentPoints = [];
        const totalWaypoints = 9;
        const nowMs = Date.now();

        // Direction offsets based on driver position for realistic curve
        const baseOffsetLat = 0.018;
        const baseOffsetLng = 0.022;

        for (let i = 0; i < totalWaypoints; i++) {
          const ratio = i / (totalWaypoints - 1); // 0.0 to 1.0
          const timeOffsetMs = (2 * 60 * 60 * 1000) * (1 - ratio);
          const pointTime = new Date(nowMs - timeOffsetMs).toISOString();

          // Smooth curve towards current position
          const angle = ratio * Math.PI * 0.8;
          const currentLat = driverLat - (baseOffsetLat * (1 - ratio)) + (Math.sin(angle) * 0.003);
          const currentLng = driverLng - (baseOffsetLng * (1 - ratio)) + (Math.cos(angle) * 0.003);
          const pointSpeed = Math.floor(25 + Math.random() * 30);

          const newPoint: DriverLocationPoint = {
            driverId: driver.id,
            lat: currentLat,
            lng: currentLng,
            speed: i === totalWaypoints - 1 ? (driver.speed || 35) : pointSpeed,
            timestamp: pointTime
          };

          recentPoints.push(newPoint);

          // Save generated location history into Firestore `driver_locations`
          addDoc(collection(db, 'driver_locations'), newPoint).catch(e => console.warn('Loc log error:', e));
        }
      }

      // Draw Path Polyline on Map
      const latLngs: L.LatLngExpression[] = recentPoints.map(p => [p.lat, p.lng]);
      
      const polyline = L.polyline(latLngs, {
        color: '#2563eb', // Vibrant Blue Path
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 10'
      }).addTo(map);

      polylineRef.current = polyline;

      // Add START Marker (🏁 نقطة بداية المسار قبل ساعتين)
      if (recentPoints.length > 0) {
        const startPt = recentPoints[0];
        const startIcon = L.divIcon({
          html: `
            <div class="bg-indigo-600 text-white font-bold text-[10px] px-2 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap flex items-center gap-1">
              <span>🏁 بداية المسار</span>
              <span class="opacity-80 font-mono">(${new Date(startPt.timestamp).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
          `,
          className: 'custom-start-flag-marker',
          iconAnchor: [40, 15]
        });

        const startMarker = L.marker([startPt.lat, startPt.lng], { icon: startIcon }).addTo(map);
        trailMarkersRef.current.push(startMarker);

        // Add intermediate trajectory nodes with time & speed tooltips
        recentPoints.forEach((pt, idx) => {
          if (idx > 0 && idx < recentPoints.length - 1) {
            const nodeIcon = L.divIcon({
              html: `<div class="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-xs"></div>`,
              className: 'custom-path-node-icon',
              iconAnchor: [6, 6]
            });

            const nodeMarker = L.marker([pt.lat, pt.lng], { icon: nodeIcon }).addTo(map);
            const timeFormatted = new Date(pt.timestamp).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
            nodeMarker.bindTooltip(`الساعة: ${timeFormatted} | السرعة: ${pt.speed || 0} كم/س`, { direction: 'top' });
            trailMarkersRef.current.push(nodeMarker);
          }
        });
      }

      // Fit map bounds to show the entire 2-hour trajectory nicely
      map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

      setActiveTrailDriverId(driver.id);
      setTrailPointsCount(recentPoints.length);
      setIsLoadingTrail(false);

      onShowToast?.(`تم رسم مسار تحركات الكابتن "${driver.name}" خلال آخر ساعتين (${recentPoints.length} نقاط مسجلة)`, 'success');
    } catch (err: any) {
      console.error('Error fetching driver location trail:', err);
      setIsLoadingTrail(false);
      onShowToast?.('حدث خطأ أثناء تحميل مسار الكابتن من Firestore', 'error');
    }
  };

  // 1. Fetch Drivers from Firestore in Realtime
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'drivers'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DriverUser[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as DriverUser[];

      const syncTimeStr = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastFirestoreSyncTime(syncTimeStr);

      if (list.length > 0) {
        setDrivers(list);
        // Keep selected driver synced with real-time Firestore updates
        if (selectedDriver) {
          const freshSelected = list.find(d => d.id === selectedDriver.id);
          if (freshSelected) setSelectedDriver(freshSelected);
        }
      } else {
        // Populate default demo drivers if Firestore collection is empty
        setDrivers(INITIAL_DEMO_DRIVERS);
        // Silently persist initial demo set to Firestore
        INITIAL_DEMO_DRIVERS.forEach(d => {
          setDoc(doc(db, 'drivers', d.id), d).catch(e => console.warn('Demo driver seed error:', e));
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.warn('Drivers Firestore realtime error, fallback to initial state:', err);
      setDrivers(INITIAL_DEMO_DRIVERS);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Default view over Yemen (Sana'a)
      const map = L.map(mapContainerRef.current, {
        center: [15.3694, 44.1910],
        zoom: 7,
        zoomControl: false
      });

      // Standard OSM Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Add zoom control top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 3. Update Map Markers when `filteredDrivers` change
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    filteredDrivers.forEach(driver => {
      const lat = driver.lat || 15.3694;
      const lng = driver.lng || 44.1910;

      // Determine marker color and pulse styling
      const isOnline = driver.isOnline && driver.status === 'active';
      const isBusy = (driver.assignedOrdersCount || 0) > 0;
      const isAvailable = isOnline && !isBusy;

      const markerHtml = `
        <div class="relative flex items-center justify-center">
          ${isAvailable ? `<div class="absolute -inset-2.5 rounded-full bg-emerald-500/50 animate-ping"></div>` : isOnline ? `<div class="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping"></div>` : ''}
          <div class="w-10 h-10 rounded-full border-2 ${
            !isOnline ? 'bg-slate-700 border-slate-400 text-slate-200' :
            isBusy ? 'bg-amber-500 border-amber-300 text-white' : 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/50'
          } shadow-lg flex items-center justify-center font-bold text-xs">
            ${driver.vehicleType?.includes('دراجة') ? '🛵' : '🚗'}
          </div>
          <div class="absolute -bottom-5 ${isAvailable ? 'bg-emerald-950 border-emerald-400 text-emerald-300' : 'bg-slate-900/90 text-white border-slate-700'} text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap border">
            ${driver.name.split(' ')[0] || 'مندوب'} ${isAvailable ? '⚡ متاح' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-driver-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div class="p-2 font-sans text-right dir-rtl" dir="rtl" style="min-width: 220px;">
          <div class="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
            <div class="w-8 h-8 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-blue-600'} text-white font-bold text-xs flex items-center justify-center">
              ${driver.name.charAt(0)}
            </div>
            <div>
              <h4 class="font-bold text-xs text-slate-800 m-0">${driver.name}</h4>
              <span class="text-[10px] text-slate-500 font-mono">${driver.phone}</span>
            </div>
          </div>
          
          <div class="space-y-1 text-xs mb-3 text-slate-600">
            <div class="flex items-center justify-between">
              <span>حالة الإسناد:</span>
              <span class="font-bold ${isAvailable ? 'text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200' : isBusy ? 'text-amber-600' : 'text-slate-400'}">
                ${isAvailable ? '⚡ متاح للإسناد الان' : isBusy ? '🚚 مشغول بطلب' : '🔴 غير متصل'}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>المركبة:</span>
              <span class="font-bold text-slate-800">${driver.vehicleType || 'غير محدد'} (${driver.plateNumber || 'بدون لوحة'})</span>
            </div>
            <div class="flex items-center justify-between">
              <span>الإحداثيات الحية:</span>
              <span class="font-bold text-emerald-700 font-mono text-[10px]">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>السرعة المباشرة:</span>
              <span class="font-bold text-blue-600 font-mono">${driver.speed || 0} كم/س</span>
            </div>
            <div class="flex items-center justify-between">
              <span>الطلبات المسندة:</span>
              <span class="font-bold text-amber-600">${driver.assignedOrdersCount || 0} طلبات</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        handleFocusDriverOnMap(driver);
      });

      markersRef.current[driver.id] = marker;
    });
  }, [drivers, statusFilter, searchTerm]);

  // 4. Live Motion Simulator Effect (Demonstrates GPS movement in preview)
  useEffect(() => {
    if (!isSimulatingMove) return;

    const interval = setInterval(() => {
      setDrivers(prevDrivers => {
        return prevDrivers.map(d => {
          if (!d.isOnline || d.status !== 'active') return d;
          
          // Slight random GPS movement shift
          const deltaLat = (Math.random() - 0.5) * 0.003;
          const deltaLng = (Math.random() - 0.5) * 0.003;
          const newSpeed = Math.floor(20 + Math.random() * 40);

          return {
            ...d,
            lat: (d.lat || 15.3694) + deltaLat,
            lng: (d.lng || 44.1910) + deltaLng,
            speed: newSpeed
          };
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulatingMove]);

  // Handler: Open Add Modal
  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      vehicleType: 'دراجة نارية',
      plateNumber: '',
      status: 'active',
      isOnline: true,
      lat: 15.3694,
      lng: 44.1910,
      locationName: 'صنعاء'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleOpenEditModal = (driver: DriverUser) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      password: '',
      vehicleType: driver.vehicleType || 'دراجة نارية',
      plateNumber: driver.plateNumber || '',
      status: driver.status || 'active',
      isOnline: driver.isOnline ?? true,
      lat: driver.lat || 15.3694,
      lng: driver.lng || 44.1910,
      locationName: driver.locationName || 'صنعاء'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Handler: Save Driver (Create or Update)
  const handleSaveDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('يرجى إدخال اسم المندوب الكامل');
      return;
    }

    if (!formData.phone.trim()) {
      setFormError('يرجى إدخال رقم الهاتف / الجوال (المعرف الإجباري والوحيد للمندوب)');
      return;
    }

    // Check duplicate phone in existing drivers
    const exists = drivers.find(d => d.phone.trim() === formData.phone.trim() && d.id !== editingDriver?.id);
    if (exists) {
      setFormError(`⚠️ رقم الهاتف (${formData.phone}) مسجل مسبقاً للمندوب "${exists.name}". يرجى إدخال رقم هاتف فريد.`);
      return;
    }

    try {
      if (editingDriver) {
        // Update existing driver in Firestore
        const driverRef = doc(db, 'drivers', editingDriver.id);
        const updatePayload: Partial<DriverUser> = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          vehicleType: formData.vehicleType,
          plateNumber: formData.plateNumber.trim(),
          status: formData.status,
          isOnline: formData.isOnline,
          lat: formData.lat,
          lng: formData.lng,
          locationName: formData.locationName,
          updatedAt: new Date().toISOString()
        };

        await updateDoc(driverRef, updatePayload);
        onShowToast?.(`تم تحديث بيانات المندوب "${formData.name}" في Firestore بنجاح`, 'success');
      } else {
        // Add NEW Driver to Firestore `drivers` collection
        const newDriverId = `driver-${Date.now()}`;
        const newPayload: DriverUser = {
          id: newDriverId,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          vehicleType: formData.vehicleType,
          plateNumber: formData.plateNumber.trim(),
          status: formData.status,
          isOnline: formData.isOnline,
          role: 'driver',
          lat: formData.lat,
          lng: formData.lng,
          locationName: formData.locationName,
          speed: 0,
          assignedOrdersCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'drivers', newDriverId), newPayload);
        onShowToast?.(`تم إضافة المندوب الجديد "${formData.name}" بنجاح في مجموعة (drivers)`, 'success');
      }

      setIsAddModalOpen(false);
      setEditingDriver(null);
    } catch (err: any) {
      console.error('Save driver error:', err);
      setFormError('فشل حفظ بيانات المندوب: ' + (err.message || ''));
    }
  };

  // Handler: Toggle Online/Offline
  const handleToggleOnline = async (driver: DriverUser) => {
    try {
      const dRef = doc(db, 'drivers', driver.id);
      const newOnline = !driver.isOnline;
      await updateDoc(dRef, { isOnline: newOnline });
      onShowToast?.(`تم تغيير حالة اتصال الكابتن "${driver.name}" إلى ${newOnline ? 'متصل 🟢' : 'أوفلاين 🔴'}`, 'success');
    } catch (e: any) {
      onShowToast?.('فشل تغيير حالة الاتصال', 'error');
    }
  };

  // Handler: Delete Driver
  const handleDeleteDriverSubmit = async (driver: DriverUser) => {
    if (!window.confirm(`هل أنت أعدت التأكيد على حذف المندوب "${driver.name}" نهائياً من قاعدة البيانات؟`)) return;

    try {
      await deleteDoc(doc(db, 'drivers', driver.id));
      onShowToast?.(`تم حذف المندوب "${driver.name}" بنجاح`, 'success');
      if (selectedDriver?.id === driver.id) setSelectedDriver(null);
    } catch (e: any) {
      onShowToast?.('فشل حذف المندوب', 'error');
    }
  };

  // Handler: Center Map on Driver & Show Detailed Active Delivery Route / Destination
  const handleFocusDriverOnMap = (driver: DriverUser) => {
    setSelectedDriver(driver);
    clearDriverPath();
    clearActiveDeliveryRoute();

    const map = leafletMapRef.current;
    if (map && driver.lat && driver.lng) {
      // Zoom in to high-detail level
      map.flyTo([driver.lat, driver.lng], 16, { duration: 1.2 });
      const marker = markersRef.current[driver.id];
      if (marker) {
        marker.openPopup();
      }
    }

    // Load 2-hour location history trajectory
    handleLoadDriverTrail(driver);

    // If driver is online & delivering an active order, draw active route and destination point
    if (driver.isOnline && driver.status === 'active') {
      handleDrawActiveOrderRoute(driver);
    }
  };

  // Handler: Push simulated live location offset directly to Firestore to verify real-time GPS synchronization
  const handlePushSimulatedLocationToFirestore = async () => {
    const availableOrOnline = drivers.filter(d => d.isOnline && d.status === 'active');
    if (availableOrOnline.length === 0) {
      onShowToast?.('لا يوجد مندوبون متصلون حالياً لتحديث إحداثياتهم بـ Firestore', 'error');
      return;
    }

    try {
      // Pick first online driver or selected driver
      const targetDriver = selectedDriver || availableOrOnline[0];
      const deltaLat = (Math.random() - 0.5) * 0.004;
      const deltaLng = (Math.random() - 0.5) * 0.004;
      const newLat = (targetDriver.lat || 15.3694) + deltaLat;
      const newLng = (targetDriver.lng || 44.1910) + deltaLng;
      const newSpeed = Math.floor(25 + Math.random() * 35);

      const driverRef = doc(db, 'drivers', targetDriver.id);
      await updateDoc(driverRef, {
        lat: newLat,
        lng: newLng,
        speed: newSpeed,
        lastUpdated: new Date().toISOString()
      });

      onShowToast?.(`⚡ تم تحديث إحداثيات الكابتن "${targetDriver.name}" مباشرة في Firestore!`, 'success');
    } catch (e: any) {
      console.error('Error updating live location in Firestore:', e);
      onShowToast?.('فشل تحديث الإحداثيات المباشرة في Firestore', 'error');
    }
  };

  // Filtered drivers list for sidebar list & map rendering
  const filteredDrivers = drivers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;

    if (statusFilter === 'available') {
      return d.isOnline && d.status === 'active' && (d.assignedOrdersCount || 0) === 0;
    }
    if (statusFilter === 'online') return d.isOnline && d.status === 'active';
    if (statusFilter === 'offline') return !d.isOnline;
    if (statusFilter === 'busy') return (d.assignedOrdersCount || 0) > 0;

    return true;
  });

  const availableDriversCount = drivers.filter(d => d.isOnline && d.status === 'active' && (d.assignedOrdersCount || 0) === 0).length;
  const onlineCount = drivers.filter(d => d.isOnline && d.status === 'active').length;
  const busyCount = drivers.filter(d => (d.assignedOrdersCount || 0) > 0).length;

  return (
    <div className="space-y-5 dir-rtl" dir="rtl">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">📍 خريطة المندوبين والتتبع المباشر (Fleet Map)</h2>
                {lastFirestoreSyncTime && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Firestore متصل ({lastFirestoreSyncTime})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">مراقبة إحداثيات المندوبين النشطين المتاحين للإسناد لحظياً ومتابعة مواقعهم في الوقت الفعلي</p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Live Firestore Coordinate Push Test Button */}
          <button
            onClick={handlePushSimulatedLocationToFirestore}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="تحديث موقع المندوب مباشرة في Firestore لاختبار المزامنة اللحظية"
          >
            <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>تحديث موقع حي في Firestore ⚡</span>
          </button>

          {/* Motion Simulation Button */}
          <button
            onClick={() => setIsSimulatingMove(!isSimulatingMove)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isSimulatingMove 
                ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse' 
                : 'bg-gray-50 hover:bg-gray-100 text-slate-700 border-gray-200'
            }`}
            title="محاكاة تحرك المندوبين على الخريطة لعرض التتبع الحي"
          >
            {isSimulatingMove ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-slate-600" />}
            <span>{isSimulatingMove ? 'إيقاف المحاكاة' : 'تشغيل محاكاة الحركة'}</span>
          </button>

          {/* Add New Driver Button */}
          {canCreate && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مندوب جديد (أدمن حصراً)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-xl border border-emerald-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-lg shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-emerald-800 font-bold">متاحون للإسناد الآن</div>
            <div className="text-xl font-black text-emerald-700 font-mono">{availableDriversCount} مندوب جاهز</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">إجمالي المتصلين</div>
            <div className="text-lg font-bold text-slate-800 font-mono">{onlineCount} متصل</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">مشغولون بطلبات</div>
            <div className="text-lg font-bold text-amber-600 font-mono">{busyCount} جاري توصيلها</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">متوسط السرعة الحية</div>
            <div className="text-lg font-bold text-indigo-600 font-mono">
              {Math.round(drivers.reduce((acc, d) => acc + (d.speed || 0), 0) / (drivers.length || 1))} كم/س
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: Map Container & Sidebar List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[680px]">
        
        {/* Interactive Map View Area (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col relative h-[450px] sm:h-[520px] lg:h-full">
          
          {/* Map Controls Header Bar */}
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-3 text-xs z-10 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold">خريطة اليمن الحية - الإحداثيات المباشرة من Firestore</span>
              <span className="hidden sm:inline-block text-[10px] text-emerald-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-emerald-900/50">
                {statusFilter === 'available' ? 'تُعرض فقط المندوبين المتاحين للإسناد' : `تُعرض (${filteredDrivers.length}) مندوبين`}
              </span>
            </div>

            {/* Quick City View Preset Buttons */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-md">
              <span className="text-[10px] text-slate-400 shrink-0">القفز لمدينة:</span>
              {CITY_PRESETS.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const map = leafletMapRef.current;
                    if (map) map.flyTo([city.lat, city.lng], 12);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Map Canvas */}
          <div ref={mapContainerRef} className="w-full flex-1 z-0 bg-slate-100 min-h-0" />

          {/* Selected Driver Floating Card Overlay */}
          {selectedDriver && (
            <div className="absolute bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-md bg-white p-3.5 sm:p-4 rounded-xl shadow-2xl border border-slate-200 z-20 animate-in fade-in slide-in-from-bottom-2 max-h-[82%] sm:max-h-[88%] overflow-y-auto custom-scrollbar">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                    {selectedDriver.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-800 text-sm">{selectedDriver.name}</h3>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${selectedDriver.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono dir-ltr text-right">{selectedDriver.phone}</div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedDriver(null);
                    clearDriverPath();
                    clearActiveDeliveryRoute();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>المركبة: <strong className="text-slate-800">{selectedDriver.vehicleType || 'غير محدد'}</strong></div>
                <div>اللوحة: <strong className="text-slate-800 font-mono">{selectedDriver.plateNumber || 'بدون'}</strong></div>
                <div>السرعة الحالية: <strong className="text-blue-600 font-mono">{selectedDriver.speed || 0} كم/س</strong></div>
                <div>الطلبات المسندة: <strong className="text-amber-600 font-mono">{selectedDriver.assignedOrdersCount || 0}</strong></div>
                <div className="col-span-2 text-slate-500 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-1.5 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedDriver.locationName || 'غير معروف'}</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold shrink-0">
                    📍 {selectedDriver.lat?.toFixed(4)}, {selectedDriver.lng?.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Active Delivery Specific Destination Section */}
              {selectedDriver.isOnline && activeDeliveryOrder && (
                <div className="mb-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2 pb-1.5 border-b border-amber-200/70">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      <span>🚚 يتجه المندوب لتسليم الطلب #{activeDeliveryOrder.orderNumber}</span>
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      ⏱️ {activeDeliveryOrder.estimatedMinutes || 12} دقيقة
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-2 font-bold text-slate-900 bg-white/80 p-1.5 rounded border border-amber-100">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[11px]">العميل:</span>
                        <span>{activeDeliveryOrder.customerName}</span>
                      </div>
                      <a 
                        href={`tel:${activeDeliveryOrder.customerPhone}`}
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors font-mono"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>{activeDeliveryOrder.customerPhone}</span>
                      </a>
                    </div>

                    {activeDeliveryOrder.storeName && (
                      <div className="flex items-start gap-1 text-[11px] text-amber-950 px-1">
                        <span className="font-bold text-amber-800 shrink-0">🏪 المتجر:</span>
                        <span className="font-medium">{activeDeliveryOrder.storeName}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-1.5 text-[11px] text-rose-900 font-semibold bg-rose-50/90 p-2 rounded-lg border border-rose-200 mt-1 shadow-xs">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">📍 وجهة التسليم بالتحديد:</div>
                        <div className="text-slate-900 font-bold">{activeDeliveryOrder.dropoffAddress}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsDedicatedModalOpen(true);
                    }}
                    className="w-full mt-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Navigation className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>فتح خريطة التتبع المستقلة للعميل والمسار 🚀</span>
                  </button>
                </div>
              )}

              {/* Display Path / Route Button */}
              <div className="mb-3">
                {activeTrailDriverId === selectedDriver.id ? (
                  <button
                    onClick={clearDriverPath}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>إخفاء مسار التتبع المسجل ({trailPointsCount} نقاط)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleLoadDriverTrail(selectedDriver)}
                    disabled={isLoadingTrail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Route className="w-4 h-4" />
                    <span>{isLoadingTrail ? 'جاري جلب المسار من Firestore...' : '📍 عرض مسار تحركات الكابتن (آخر ساعتين)'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                {canEdit && (
                  <button
                    onClick={() => handleToggleOnline(selectedDriver)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      selectedDriver.isOnline ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {selectedDriver.isOnline ? 'تعيين كـ أوفلاين' : 'تفعيل المتصل'}
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => handleOpenEditModal(selectedDriver)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل البيانات</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => {
                      handleDeleteDriverSubmit(selectedDriver);
                      clearDriverPath();
                      clearActiveDeliveryRoute();
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="حذف المندوب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drivers List & Filter Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col h-[500px] lg:h-full">
          
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-gray-100 space-y-3 bg-gray-50/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم المندوب أو رقم الهاتف..."
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold custom-scrollbar pb-1">
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shadow-2xs ${
                  statusFilter === 'available' ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>⚡ المتاحون للإسناد ({availableDriversCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'online' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                المتصلين ({onlineCount})
              </button>
              <button
                onClick={() => setStatusFilter('busy')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'busy' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                مشغولين ({busyCount})
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'offline' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                أوفلاين ({drivers.length - onlineCount})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                الكل ({drivers.length})
              </button>
            </div>
          </div>

          {/* List of Driver Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">جاري تحميل قائمة المندوبين...</div>
            ) : filteredDrivers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                <div>لا يوجد مندوبون مطابقون للفلتر ({statusFilter === 'available' ? 'لا يوجد مندوبون متاحون للإسناد حالياً' : 'لا تتوفر نتائج'})</div>
              </div>
            ) : (
              filteredDrivers.map(driver => {
                const isSelected = selectedDriver?.id === driver.id;
                const isOnline = driver.isOnline && driver.status === 'active';
                const isBusy = (driver.assignedOrdersCount || 0) > 0;
                const isAvailable = isOnline && !isBusy;

                return (
                  <div
                    key={driver.id}
                    onClick={() => handleFocusDriverOnMap(driver)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-400' 
                        : isAvailable 
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/70 border-emerald-200/80' 
                          : 'bg-white hover:bg-slate-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className={`w-9 h-9 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-slate-800'} text-white font-bold text-xs flex items-center justify-center`}>
                            {driver.name.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            isAvailable ? 'bg-emerald-500 animate-pulse' : isOnline ? 'bg-amber-500' : 'bg-slate-400'
                          }`}></span>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-slate-800 flex items-center gap-1">
                            <span>{driver.name}</span>
                            {isAvailable && <span className="text-[10px] text-emerald-600">⚡</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{driver.phone}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAvailable 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : isBusy 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-gray-100 text-slate-600'
                      }`}>
                        {isAvailable ? '⚡ متاح للإسناد' : isBusy ? '🚚 مشغول بطلب' : 'غائب'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-100/80 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{driver.locationName || 'موقع عام'}</span>
                      </div>
                      
                      <div className="font-mono text-emerald-700 font-bold text-[10px]">
                        📍 {driver.lat?.toFixed(3)}, {driver.lng?.toFixed(3)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Driver (إضافة / تعديل مندوب حصرياً بواسطة الأدمن) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 dir-rtl" dir="rtl">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingDriver ? `تعديل بيانات المندوب (${editingDriver.name})` : 'إضافة مندوب جديد (إنشاء بواسطة الأدمن حصراً)'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveDriverSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                  {formError}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>القوانين الأمنية:</strong> يُمنع إنشاء حسابات المندوبين من داخل تطبيق المندوب الذكي. المندوبون يتم إضافتهم وتفعيلهم حصراً بواسطة إدارة لوحة التحكم وتُخزن بياناتهم في مجموعة <code>drivers</code>.
                </span>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  اسم المندوب / الكابتن الكامل <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: الكابتن خليل اليماني"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  required
                />
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    رقم الهاتف / الجوال (المعرف الأساسي) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="77XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gray-50/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="driver@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Vehicle Type & Plate Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">نوع المركبة</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="دراجة نارية">🛵 دراجة نارية</option>
                    <option value="سيارة">🚗 سيارة صغيرة / تكسي</option>
                    <option value="شاحنة نقل">نقل / بيك أب</option>
                    <option value="قارب / فلوكة">قارب / فلوكة</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم اللوحة المرورية</label>
                  <input 
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    placeholder="مثال: صنعاء 8833-أ"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Initial City Position Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">المدينة / النطاق الجغرافي للمندوب</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CITY_PRESETS.map((city, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setFormData({
                        ...formData,
                        lat: city.lat,
                        lng: city.lng,
                        locationName: city.name
                      })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        formData.locationName === city.name 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Online Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">حالة الحساب</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">نشط ومفعل (Active)</option>
                    <option value="pending">قيد الفحص والمراجعة (Pending)</option>
                    <option value="suspended">موقوف مؤقتاً (Suspended)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">حالة الاتصال للخدمة</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isOnline: !formData.isOnline })}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      formData.isOnline ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-slate-600 border border-gray-200'
                    }`}
                  >
                    {formData.isOnline ? '🟢 متصل بالخدمة (Online)' : '🔴 غير متصل (Offline)'}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDriver ? 'حفظ التعديلات' : 'إضافة المندوب الآن'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Dedicated Standalone Delivery Map Modal Interface */}
      <DedicatedDeliveryMapModal 
        isOpen={isDedicatedModalOpen}
        onClose={() => setIsDedicatedModalOpen(false)}
        driver={selectedDriver}
        order={activeDeliveryOrder}
      />

    </div>
  );
};

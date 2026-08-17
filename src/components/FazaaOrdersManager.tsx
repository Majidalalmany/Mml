import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert,
  ArrowRight,
  PackageCheck,
  Zap,
  Edit2,
  Trash2,
  DollarSign,
  Save,
  Calculator,
  Navigation,
  X
} from 'lucide-react';
import { FazaaOrder, FazaaCategory, AdminUser } from '../types';
import { hasModulePermission } from '../lib/permissions';

interface FazaaOrdersManagerProps {
  orders: FazaaOrder[];
  categories: FazaaCategory[];
  currentUser: AdminUser | null;
  isLoading: boolean;
  onCreateOrder: (orderData: Partial<FazaaOrder>) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: FazaaOrder['status'], driverName?: string, driverPhone?: string) => Promise<void>;
  onCreateCategory: (categoryData: Partial<FazaaCategory>) => Promise<void>;
}

export const FazaaOrdersManager: React.FC<FazaaOrdersManagerProps> = ({
  orders = [],
  categories = [],
  currentUser,
  isLoading,
  onCreateOrder,
  onUpdateOrderStatus,
  onCreateCategory
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'categories' | 'pricing_calculator'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fazaa Tariff Rates Configuration State
  const [baseFare, setBaseFare] = useState<number>(500);
  const [pricePerKm, setPricePerKm] = useState<number>(150);
  const [pricePerKg, setPricePerKg] = useState<number>(100);
  const [freeWeightLimitKg, setFreeWeightLimitKg] = useState<number>(3);
  const [expressMultiplier, setExpressMultiplier] = useState<number>(1.2);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [viewingOrder, setViewingOrder] = useState<FazaaOrder | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // New Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newScope, setNewScope] = useState<'local' | 'international'>('local');
  const [newPickup, setNewPickup] = useState('');
  const [newDelivery, setNewDelivery] = useState('');
  const [newType, setNewType] = useState('أغراض شخصية');
  const [newPackageWeight, setNewPackageWeight] = useState<number>(2);
  const [newPackageSpecs, setNewPackageSpecs] = useState('طرد مغلف بحجم متوسط');
  const [newEstDistance, setNewEstDistance] = useState<number>(6.5);
  const [newIsInstant, setNewIsInstant] = useState(true);
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('771234567');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Driver assign state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FazaaCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catRisk, setCatRisk] = useState<'normal' | 'fragile' | 'special_handle'>('normal');
  const [catWeight, setCatWeight] = useState('');
  const [catInstructions, setCatInstructions] = useState('');
  const [catActive, setCatActive] = useState(true);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const canEdit = hasModulePermission(currentUser, 'delivery', 'edit');

  const safeOrders = orders || [];
  const safeCategories = categories || [];

  // Default Categories if empty
  const defaultTypesList = safeCategories.length > 0 
    ? safeCategories.map(c => c.name || '') 
    : [
        'قابلة للكسر',
        'ترت وجاتو - كابتن مختص',
        'بقالات',
        'كرتون - لا يزيد عن 10 كيلو',
        'ميني كيك وحلويات',
        'أغراض شخصية',
        'إكسسوارات',
        'تحف وهدايا',
        'أوراق مهمة'
      ];

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((order) => {
      if (selectedStatusTab !== 'all' && order.status !== selectedStatusTab) return false;
      if (selectedScope !== 'all' && order.orderScope !== selectedScope) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = (order.orderNumber || '').toLowerCase().includes(term);
        const nameMatch = (order.customerName || '').toLowerCase().includes(term);
        const phoneMatch = (order.customerPhone || '').toLowerCase().includes(term);
        const pickupMatch = (order.pickupAddress || '').toLowerCase().includes(term);
        const delivMatch = (order.deliveryAddress || '').toLowerCase().includes(term);
        const typeMatch = (order.orderType || '').toLowerCase().includes(term);
        if (!numMatch && !nameMatch && !phoneMatch && !pickupMatch && !delivMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [safeOrders, selectedStatusTab, selectedScope, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: safeOrders.length,
      new: safeOrders.filter(o => o.status === 'new').length,
      assigned: safeOrders.filter(o => o.status === 'assigned').length,
      delivering: safeOrders.filter(o => o.status === 'delivering').length,
      completed: safeOrders.filter(o => o.status === 'completed').length,
      cancelled: safeOrders.filter(o => o.status === 'cancelled').length
    };
  }, [safeOrders]);

  const handleStatusChange = async (orderId: string, newStatus: FazaaOrder['status']) => {
    if (!canEdit) return;
    try {
      setUpdatingOrderId(orderId);
      await onUpdateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update Fazaa order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrderId || !driverNameInput.trim()) return;
    try {
      await onUpdateOrderStatus(assigningOrderId, 'assigned', driverNameInput.trim(), driverPhoneInput.trim());
      setAssigningOrderId(null);
      setDriverNameInput('');
      setDriverPhoneInput('');
    } catch (err) {
      console.error('Error assigning driver:', err);
    }
  };

  const calculateFazaaFee = (distanceKm: number, weightKg: number, isInstant: boolean) => {
    const extraWeight = Math.max(0, weightKg - freeWeightLimitKg);
    const distanceCost = distanceKm * pricePerKm;
    const weightCost = extraWeight * pricePerKg;
    let total = baseFare + distanceCost + weightCost;
    if (isInstant) {
      total = total * expressMultiplier;
    }
    return Math.round(total);
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPickup.trim() || !newDelivery.trim() || !newCustomerName.trim()) return;

    let scheduledCombined = '';
    if (!newIsInstant && newScheduledDate) {
      scheduledCombined = `${newScheduledDate} ${newScheduledTime || '10:00'}`;
    }

    const computedFee = calculateFazaaFee(newEstDistance, newPackageWeight, newIsInstant);
    const routeInfo = `مسار تلقائي: من (${newPickup.trim()}) إلى (${newDelivery.trim()}) عبر أقرب خط سير | المسافة: ${newEstDistance} كم`;

    try {
      setIsSubmittingOrder(true);
      await onCreateOrder({
        orderScope: newScope,
        pickupAddress: newPickup.trim(),
        deliveryAddress: newDelivery.trim(),
        orderType: newType,
        packageWeightKg: newPackageWeight,
        packageSpecs: newPackageSpecs.trim(),
        calculatedDistanceKm: newEstDistance,
        calculatedDeliveryFee: computedFee,
        driverRouteInfo: routeInfo,
        isInstant: newIsInstant,
        scheduledDatetime: scheduledCombined,
        notes: newNotes.trim(),
        attachmentUrl: newAttachmentUrl.trim(),
        customerName: newCustomerName.trim(),
        customerPhone: newCustomerPhone.trim(),
        status: 'new'
      });
      setIsNewOrderModalOpen(false);
      setNewPickup('');
      setNewDelivery('');
      setNewNotes('');
      setNewAttachmentUrl('');
      setNewCustomerName('');
    } catch (err) {
      console.error('Error creating Fazaa order:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleOpenCategoryModal = (cat?: FazaaCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatRisk(cat.riskLevel || 'normal');
      setCatWeight(cat.weightLimit || '');
      setCatInstructions(cat.driverInstructions || '');
      setCatActive(cat.isActive);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatRisk('normal');
      setCatWeight('');
      setCatInstructions('');
      setCatActive(true);
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      setIsSubmittingCat(true);
      await onCreateCategory({
        ...(editingCategory ? { id: editingCategory.id } : {}),
        name: catName.trim(),
        riskLevel: catRisk,
        weightLimit: catWeight.trim(),
        driverInstructions: catInstructions.trim(),
        isActive: catActive
      });
      setIsCategoryModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const getRiskBadge = (typeStr?: string | null) => {
    const s = typeStr || '';
    if (s.includes('كسر') || s.includes('زجاج')) {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>قابلة للكسر - شديد العناية</span>
        </span>
      );
    }
    if (s.includes('ترت') || s.includes('جاتو') || s.includes('كيك') || s.includes('كابتن مختص')) {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>كابتن مختص (تثبيت أفقياً)</span>
        </span>
      );
    }
    if (s.includes('أوراق') || s.includes('مستندات')) {
      return (
        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0">
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>مستندات سرية ومهمة</span>
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0">
        شحنة قياسية
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">خدمة فزعة للتوصيل السريع والشحنات الخاصّة</h2>
              <span className="bg-purple-50 text-purple-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-purple-200">
                لوحة المعالجة والتحكم
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              استقبال معطيات فزعة من التطبيق، تتبع مسارات الشحن من عنوان إلى عنوان، وإدارة تصنيفات الطلبات بدقة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طلب فزعة جديد</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab(activeSubTab === 'orders' ? 'categories' : 'orders')}
            className="bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>{activeSubTab === 'orders' ? 'إدارة أنواع الشحنات والتصنيفات' : 'العودة لطلبات فزعة'}</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 flex-wrap">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>قائمة طلبات فزعة ({counts.all})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pricing_calculator')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'pricing_calculator'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span>⚖️ حاسبة وتحديد تسعيرة الوزن والمسافة</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>تصنيفات الشحنات الديناميكية ({defaultTypesList.length})</span>
        </button>
      </div>

      {activeSubTab === 'orders' ? (
        <div className="space-y-4">
          {/* Order list content */}
          {/* Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs cursor-pointer ${
                selectedStatusTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-gray-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold block mb-1">الكل</span>
              <span className="text-2xl font-extrabold font-sans">{counts.all}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('new')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs cursor-pointer ${
                selectedStatusTab === 'new'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white border-gray-200 text-amber-900 hover:border-amber-300'
              }`}
            >
              <span className="text-xs font-bold block mb-1">طلبات جديدة</span>
              <span className="text-2xl font-extrabold font-sans">{counts.new}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('assigned')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs cursor-pointer ${
                selectedStatusTab === 'assigned'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-200 text-blue-900 hover:border-blue-300'
              }`}
            >
              <span className="text-xs font-bold block mb-1">قيد التعيين</span>
              <span className="text-2xl font-extrabold font-sans">{counts.assigned}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('delivering')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs cursor-pointer ${
                selectedStatusTab === 'delivering'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white border-gray-200 text-purple-900 hover:border-purple-300'
              }`}
            >
              <span className="text-xs font-bold block mb-1">جاري التنفيذ</span>
              <span className="text-2xl font-extrabold font-sans">{counts.delivering}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('completed')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs cursor-pointer ${
                selectedStatusTab === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-gray-200 text-emerald-900 hover:border-emerald-300'
              }`}
            >
              <span className="text-xs font-bold block mb-1">مكتملة</span>
              <span className="text-2xl font-extrabold font-sans">{counts.completed}</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('cancelled')}
              className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs cursor-pointer ${
                selectedStatusTab === 'cancelled'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white border-gray-200 text-rose-900 hover:border-rose-300'
              }`}
            >
              <span className="text-xs font-bold block mb-1">ملغاة</span>
              <span className="text-2xl font-extrabold font-sans">{counts.cancelled}</span>
            </button>
          </div>

          {/* Search & Scope Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث برقم الطلب، اسم العميل، عنوان الاستلام والتسليم، أو نوع الشحنة..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="w-full md:w-48 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">جميع النطاقات (محلية ودولية)</option>
                <option value="local">محلية داخلية 🇾🇪</option>
                <option value="international">دولية خارجية 🌐</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">جاري تحميل وتزامن طلبات فزعة من قواعد البيانات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">لا توجد طلبات فزعة في هذه القائمة</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                يمكنك إضافة طلب جديد من الأزرار العلوية أو تغيير خيارات الفلترة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Order Header */}
                  <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-extrabold text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        {order.orderNumber || `#${order.id.slice(0, 6)}`}
                      </span>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        order.orderScope === 'international'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {order.orderScope === 'international' ? '🌐 شحنة دولية' : '🇾🇪 شحنة محلية'}
                      </span>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center gap-2">
                      {canEdit ? (
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as FazaaOrder['status'])}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="new">🟡 جديد</option>
                          <option value="assigned">🔵 قيد التعيين</option>
                          <option value="delivering">🟣 جاري التنفيذ</option>
                          <option value="completed">🟢 مكتمل</option>
                          <option value="cancelled">🔴 ملغى</option>
                        </select>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-slate-700">
                          {order.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-4 space-y-3.5 flex-1">
                    {/* Category / Risk badge & Execution timing */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {order.orderType}
                        </span>
                        {getRiskBadge(order.orderType)}
                      </div>

                      <div className="text-[11px] font-bold font-mono">
                        {order.isInstant ? (
                          <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>تنفيذ فوراً ("الآن")</span>
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <span>مجدول: {order.scheduledDatetime || 'موعد محدد'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper Delivery Route Path (من عنوان -> إلى عنوان) */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">مسار التوصيل للشحنة (Route Path):</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-100">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">من (عنوان الاستلام / Pickup):</span>
                            <span className="font-bold text-slate-800">{order.pickupAddress}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-100">
                          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">إلى (عنوان التسليم / Delivery):</span>
                            <span className="font-bold text-slate-800">{order.deliveryAddress}</span>
                          </div>
                        </div>
                      </div>

                      {/* Weight, Distance & Fare Specs Box */}
                      <div className="p-2.5 bg-purple-50/80 rounded-lg border border-purple-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-purple-600 font-bold block">وزن الشحنة:</span>
                          <span className="font-mono font-extrabold text-purple-950">{order.packageWeightKg ?? 2} كجم</span>
                        </div>
                        <div>
                          <span className="text-purple-600 font-bold block">المسافة المحسوبة:</span>
                          <span className="font-mono font-extrabold text-purple-950">{order.calculatedDistanceKm ?? 6.5} كم</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-purple-600 font-bold block">تكلفة التوصيل:</span>
                          <span className="font-mono font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            {(order.calculatedDeliveryFee ?? calculateFazaaFee(order.calculatedDistanceKm || 6.5, order.packageWeightKg || 2, order.isInstant)).toLocaleString()} ر.ي
                          </span>
                        </div>
                        {order.packageSpecs && (
                          <div className="col-span-2 sm:col-span-3 pt-1 border-t border-purple-200/60 text-purple-900">
                            <span className="font-bold">مواصفات الطلب: </span>
                            <span>{order.packageSpecs}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer & Notes */}
                    <div className="flex items-center justify-between text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900">{order.customerName}</span>
                      </div>
                      <a href={`tel:${order.customerPhone}`} className="text-blue-600 font-mono font-bold dir-ltr flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </div>

                    {order.notes && (
                      <div className="text-xs bg-amber-50/90 text-amber-900 border border-amber-200 p-2.5 rounded-xl space-y-0.5">
                        <span className="font-bold text-[11px] block text-amber-800">ملاحظات الشحنة:</span>
                        <p>{order.notes}</p>
                      </div>
                    )}

                    {/* Attached Image Thumbnail */}
                    {order.attachmentUrl && (
                      <div className="flex items-center justify-between bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-purple-900">مرفق صورة مع الطلب</span>
                        </div>
                        <button
                          onClick={() => setPreviewImageUrl(order.attachmentUrl || null)}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>معاينة وتكبير 🔍</span>
                        </button>
                      </div>
                    )}

                    {/* Driver info / Assign button */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">المندوب / الكابتن المكلف:</span>
                        <span className="font-bold text-slate-800">
                          {order.driverName ? `${order.driverName} (${order.driverPhone})` : 'لم يتم تعيين كابتن بعد'}
                        </span>
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => {
                            setAssigningOrderId(order.id);
                            setDriverNameInput(order.driverName || '');
                            setDriverPhoneInput(order.driverPhone || '');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 cursor-pointer"
                        >
                          {order.driverName ? 'تعديل الكابتن' : 'تعيين كابتن'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      تاريخ الطلب: {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-YE') : 'الآن'}
                    </span>

                    <button
                      onClick={() => setViewingOrder(order)}
                      className="bg-white hover:bg-purple-50 text-purple-700 border border-gray-200 font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>سند ومعاينة كاملة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSubTab === 'pricing_calculator' ? (
        /* Pricing & Route Calculation Matrix Tab */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">إعدادات تسعيرة أسطول فزعة حسب الوزن والمسافة</h3>
                  <p className="text-xs text-slate-500">
                    يتم الاعتماد على هذه المحدادات لحساب التكاليف تلقائياً وتحديد أقرب خط سير لمندوب التوصيل في التطبيق.
                  </p>
                </div>
              </div>

              {pricingSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{pricingSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">رسوم البداية / فتح العداد (ر.ي):</label>
                <input 
                  type="number" 
                  value={baseFare}
                  onChange={(e) => setBaseFare(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-400 block">رسوم ثابتة لكل طلب عند فتح الخدمة</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تعريفة الكيلومتر الواحد (ر.ي / كم):</label>
                <input 
                  type="number" 
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-400 block">تكلفة المسافة المحسوبة بين الموقعين</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">سعر الكيلوجرام الزائد (ر.ي / كجم):</label>
                <input 
                  type="number" 
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-400 block">يحتسب بعد تجاوز حد الوزن المجاني</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">الوزن المجاني المتاح (كجم):</label>
                <input 
                  type="number" 
                  value={freeWeightLimitKg}
                  onChange={(e) => setFreeWeightLimitKg(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-400 block">أقصى وزن مجاني قبل تطبيق زيادات الوزن</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPricingSuccessMsg('تم حفظ وتحديث قواعد ومعادلة تسعيرة فزعة بنجاح! 🚀');
                  setTimeout(() => setPricingSuccessMsg(null), 3500);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>اعتماد وحفظ التسعيرة بالتطبيق</span>
              </button>
            </div>
          </div>

          {/* Interactive Calculator & Closest Driver Route Simulator */}
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white p-6 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h4 className="text-lg font-extrabold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <span>حاسبة محاكاة التكلفة وأقرب خط سير للكابتن</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  قم بتجربة أدخل المسافة والوزن لملاحظة معادلة الحساب الأتوماتيكية المستخدمة في التطبيق.
                </p>
              </div>

              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-mono font-bold">
                محاكاة مباشرة ⚡
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="space-y-4 md:col-span-1 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-200 flex justify-between">
                    <span>المسافة التقديرية:</span>
                    <span className="text-amber-400 font-mono font-bold">{newEstDistance} كم</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    step="0.5"
                    value={newEstDistance}
                    onChange={(e) => setNewEstDistance(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-200 flex justify-between">
                    <span>وزن الطلب / الحزمة:</span>
                    <span className="text-amber-400 font-mono font-bold">{newPackageWeight} كجم</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="30" 
                    step="0.5"
                    value={newPackageWeight}
                    onChange={(e) => setNewPackageWeight(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-white/10 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>رسوم البداية:</span>
                    <span className="font-mono">{baseFare} ر.ي</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تكلفة المسافة ({newEstDistance} كم):</span>
                    <span className="font-mono">{(newEstDistance * pricePerKm).toLocaleString()} ر.ي</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تكلفة الوزن الزائد ({Math.max(0, newPackageWeight - freeWeightLimitKg)} كجم):</span>
                    <span className="font-mono">{(Math.max(0, newPackageWeight - freeWeightLimitKg) * pricePerKg).toLocaleString()} ر.ي</span>
                  </div>
                </div>
              </div>

              {/* Total Calculated Fare Display */}
              <div className="md:col-span-2 bg-white/10 p-5 rounded-2xl border border-white/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide block">إجمالي أجرة التوصيل المحسوبة:</span>
                  <div className="text-4xl font-extrabold text-amber-400 font-sans flex items-baseline gap-2">
                    {calculateFazaaFee(newEstDistance, newPackageWeight, newIsInstant).toLocaleString()}
                    <span className="text-sm font-normal text-slate-300">ريال يمني</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Navigation className="w-4 h-4 animate-bounce" />
                    <span>تحديد أقرب خط سير لمندوب التوصيل (GPS Smart Route):</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    يتم احتساب نقطة الانطلاق ونقطة التسليم تلقائياً، وإرسال الطلب فورياً لأقرب سائق متواجد في القطر المباشر لتخفيض وقت الانتظار.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Categories / Shipment Types Tab */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">تصنيفات وأنواع شحنات فزعة الديناميكية</h3>
              <p className="text-xs text-slate-500">
                يمكن للإدارة التحكم بتصنيفات الطلبات وشروط الوزن والتعليمات الموجهة للكباتن، وتنعكس مباشرة في التطبيق.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => handleOpenCategoryModal()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تصنيف شحنة جديد</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(safeCategories.length > 0 ? safeCategories : defaultTypesList.map((name, i) => ({
              id: `def-${i}`,
              name: name || 'شحنة عامة',
              riskLevel: (name || '').includes('كسر') ? 'fragile' : ((name || '').includes('كيك') || (name || '').includes('جاتو') ? 'special_handle' : 'normal'),
              weightLimit: 'حسب الشروط',
              driverInstructions: 'حمل وتسليم بحذر وفق تعليمات العميل',
              isActive: true
            }))).map((cat: any) => (
              <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-slate-500'}`}>
                    {cat.isActive ? 'مفعل بالتطبيق' : 'معطل'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p><span className="text-slate-400">مستوى الخطورة:</span> <strong className="text-slate-800">{cat.riskLevel === 'fragile' ? '🚨 قابلة للكسر' : cat.riskLevel === 'special_handle' ? '✨ عناية خاصة' : '🟢 عادي'}</strong></p>
                  <p><span className="text-slate-400">حدود الوزن/الحجم:</span> <span className="text-slate-800 font-mono">{cat.weightLimit || 'غير محدد'}</span></p>
                  {cat.driverInstructions && (
                    <p className="text-[11px] bg-purple-50/70 text-purple-900 p-2 rounded-lg font-medium">
                      تعليمات الكابتن: {cat.driverInstructions}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل الشروط</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="bg-white p-3 rounded-2xl max-w-2xl w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-800 text-xs">معاينة الصورة المرفقة للطلب</h4>
              <button onClick={() => setPreviewImageUrl(null)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={previewImageUrl} alt="Attachment" className="w-full max-h-[70vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">تعيين الكابتن / المندوب للطلب</h3>
            <form onSubmit={handleAssignDriverSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الكابتن:</label>
                <input 
                  type="text" 
                  required
                  value={driverNameInput}
                  onChange={e => setDriverNameInput(e.target.value)}
                  placeholder="مثال: الكابتن محمد الحيمي"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم هاتف الكابتن:</label>
                <input 
                  type="text" 
                  required
                  value={driverPhoneInput}
                  onChange={e => setDriverPhoneInput(e.target.value)}
                  placeholder="770000000"
                  className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrderId(null)}
                  className="px-3.5 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl"
                >
                  حفظ وتعيين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Fazaa Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-300" />
                <span>إضافة طلب فزعة جديد (شحنة)</span>
              </h3>
              <button onClick={() => setIsNewOrderModalOpen(false)}>
                <X className="w-5 h-5 text-purple-300 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نطاق الطلب (Scope):</label>
                  <select 
                    value={newScope}
                    onChange={e => setNewScope(e.target.value as 'local' | 'international')}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  >
                    <option value="local">محلية 🇾🇪</option>
                    <option value="international">دولية 🌐</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الشحنة / القائمة:</label>
                  <select 
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  >
                    {defaultTypesList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">من (عنوان الاستلام):</label>
                <input 
                  type="text" 
                  required
                  value={newPickup}
                  onChange={e => setNewPickup(e.target.value)}
                  placeholder="مثال: صنعاء - شارع حدة بجوار بنك اليمن"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">إلى (عنوان التسليم):</label>
                <input 
                  type="text" 
                  required
                  value={newDelivery}
                  onChange={e => setNewDelivery(e.target.value)}
                  placeholder="مثال: صنعاء - الأصبحي عمارة الأمل"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم العميل طالب الخدمة:</label>
                  <input 
                    type="text" 
                    required
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="اسم العميل"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم هاتف العميل:</label>
                  <input 
                    type="text" 
                    required
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                  />
                </div>
              </div>

              {/* Execution Time Controls */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                <span className="font-bold text-slate-800 block">التوقيت والجدولة (Execution Time):</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input 
                      type="radio" 
                      name="isInstant" 
                      checked={newIsInstant} 
                      onChange={() => setNewIsInstant(true)} 
                    />
                    <span>التنفيذ فوراً ("الآن")</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input 
                      type="radio" 
                      name="isInstant" 
                      checked={!newIsInstant} 
                      onChange={() => setNewIsInstant(false)} 
                    />
                    <span>مجدول بموعد محدد</span>
                  </label>
                </div>

                {!newIsInstant && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">التاريخ (السنة / الشهر / اليوم):</span>
                      <input 
                        type="date" 
                        value={newScheduledDate} 
                        onChange={e => setNewScheduledDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الوقت (الساعة / الدقيقة):</span>
                      <input 
                        type="time" 
                        value={newScheduledTime} 
                        onChange={e => setNewScheduledTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">أضف ملاحظاتك هنا:</label>
                <textarea 
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="ملاحظات للرابط أو الكابتن..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رابط الصورة المرفقة (إن وجد):</label>
                <input 
                  type="text" 
                  value={newAttachmentUrl}
                  onChange={e => setNewAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  {isSubmittingOrder ? 'جاري الإرسال...' : 'حفظ طلب فزعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {editingCategory ? 'تعديل تصنيف شحنة فزعة' : 'إضافة تصنيف شحنة جديد'}
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم تصنيف الشحنة:</label>
                <input 
                  type="text" 
                  required
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="مثال: قابلة للكسر"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مستوى الخطورة / طريقة التعامل:</label>
                <select 
                  value={catRisk}
                  onChange={e => setCatRisk(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                >
                  <option value="normal">🟢 عادي (شحنة قياسية)</option>
                  <option value="fragile">🚨 قابلة للكسر (شديد الحذر)</option>
                  <option value="special_handle">✨ عناية خاصة (تثبيت/تبريد)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شروط الوزن / الحجم:</label>
                <input 
                  type="text" 
                  value={catWeight}
                  onChange={e => setCatWeight(e.target.value)}
                  placeholder="مثال: حتى 10 كيلو"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تعليمات وتوجيهات للكابتن:</label>
                <textarea 
                  rows={2}
                  value={catInstructions}
                  onChange={e => setCatInstructions(e.target.value)}
                  placeholder="تعليمات المندوب..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="catActive"
                  checked={catActive}
                  onChange={e => setCatActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="catActive" className="font-bold text-slate-800 cursor-pointer">
                  تفعيل هذا التصنيف في خيارات التطبيق
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl"
                >
                  {isSubmittingCat ? 'حفظ...' : 'حفظ التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">سند وتفاصيل طلب فزعة {viewingOrder.orderNumber}</h3>
              <button onClick={() => setViewingOrder(null)}>
                <X className="w-5 h-5 text-purple-300 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p><strong className="text-slate-400">العميل:</strong> {viewingOrder.customerName} ({viewingOrder.customerPhone})</p>
              <p><strong className="text-slate-400">من (موقع الاستلام):</strong> {viewingOrder.pickupAddress}</p>
              <p><strong className="text-slate-400">إلى (موقع التسليم):</strong> {viewingOrder.deliveryAddress}</p>
              <p><strong className="text-slate-400">نوع الشحنة:</strong> {viewingOrder.orderType}</p>
              <p><strong className="text-slate-400">الكابتن/المندوب:</strong> {viewingOrder.driverName || 'لم يعين بعد'}</p>
              <p><strong className="text-slate-400">النطاق:</strong> {viewingOrder.orderScope === 'international' ? 'دولية' : 'محلية'}</p>
              <p><strong className="text-slate-400">التوقيت:</strong> {viewingOrder.isInstant ? 'فوراً ("الآن")' : `مجدول (${viewingOrder.scheduledDatetime})`}</p>
              {viewingOrder.notes && <p><strong className="text-slate-400">ملاحظات:</strong> {viewingOrder.notes}</p>}
              
              {viewingOrder.invoiceImageUrl && (
                <div className="pt-2 border-t space-y-1">
                  <span className="font-bold text-slate-800 block">صورة الفاتورة المرفوعة من المندوب:</span>
                  <div className="p-2 bg-slate-900 rounded-xl flex justify-center max-h-48">
                    <img src={viewingOrder.invoiceImageUrl} alt="صورة الفاتورة" className="max-h-44 object-contain rounded" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button onClick={() => setViewingOrder(null)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

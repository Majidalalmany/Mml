import React, { useState, useMemo } from 'react';
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
  Calendar
} from 'lucide-react';
import { Order, OrderStatus, Store, AdminUser } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { ORDER_STATUS_CONFIG } from '../constants/orderStatus';

export { ORDER_STATUS_CONFIG };

interface OrdersManagerProps {
  orders: Order[];
  stores: Store[];
  currentUser: AdminUser | null;
  isLoading: boolean;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // New order modal state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('771234567');
  const [newStoreId, setNewStoreId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(1500);
  const [newItemQty, setNewItemQty] = useState(1);
  const [newAddress, setNewAddress] = useState('صنعاء - شارع حدة');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Authorization check
  const canEditOrders = hasModulePermission(currentUser, 'orders', 'edit');

  const safeOrders = orders || [];
  const safeStores = stores || [];

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((order) => {
      // Status filter
      if (selectedStatusTab !== 'all') {
        if (order.status !== selectedStatusTab) return false;
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
        const itemMatch = order.items?.some(i => i.productName.toLowerCase().includes(term));
        if (!numMatch && !nameMatch && !phoneMatch && !storeMatch && !addressMatch && !itemMatch) {
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

  // Status counts
  const counts = useMemo(() => {
    return {
      all: safeOrders.length,
      new: safeOrders.filter(o => o.status === 'new').length,
      preparing: safeOrders.filter(o => o.status === 'preparing').length,
      delivering: safeOrders.filter(o => o.status === 'delivering').length,
      delivered: safeOrders.filter(o => o.status === 'delivered').length,
      cancelled: safeOrders.filter(o => o.status === 'cancelled').length,
      returned: safeOrders.filter(o => o.status === 'returned').length
    };
  }, [safeOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!canEditOrders) return;
    try {
      setUpdatingOrderId(orderId);
      await onUpdateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed updating order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
          total: totalCalc,
          deliveryFee: 400,
          status: 'new',
          itemsCount: newItemQty,
          items: [
            {
              productName: newItemName.trim(),
              price: newItemPrice,
              quantity: newItemQty
            }
          ],
          deliveryType: 'delivery',
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          address: newAddress.trim(),
          notes: newNotes.trim(),
          createdAt: new Date().toISOString()
        });
      }
      setIsNewOrderModalOpen(false);
      setNewCustomerName('');
      setNewItemName('');
    } catch (err) {
      console.error('Error creating order:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">إدارة الطلبات المباشرة والحية</h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>تزامن Firestore فوري</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              عرض الطلبات، تتبع المراحل، وتعديل حالة الطلب لحظة بلحظة لكل مستخدم مخول.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEditOrders && (
            <button
              onClick={() => {
                setNewStoreId(safeStores[0]?.id || '');
                setIsNewOrderModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طلب تجريبي جديد</span>
            </button>
          )}

          {safeOrders.length === 0 && onSeedOrders && (
            <button
              onClick={onSeedOrders}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>توليد طلبات نموذجية</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Warning Banner if Read-Only */}
      {!canEditOrders && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">وضع العرض فقط: </span>
            <span>حسابك الحالي لا يملك صلاحية تعديل حالة الطلبات. يمكنك فقط استعراض الطلبات والتفاصيل.</span>
          </div>
        </div>
      )}

      {/* Status Stats Metric Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedStatusTab('new')}
          className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
            selectedStatusTab === 'new'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold">جديدة</span>
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
            <span className="text-xs font-bold font-sans">مكتملة</span>
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

        <button
          onClick={() => setSelectedStatusTab('returned')}
          className={`p-3.5 rounded-xl border text-right transition-all shadow-2xs ${
            selectedStatusTab === 'returned'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white border-gray-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-xs font-bold">مرجعة</span>
            <RotateCcw className="w-4 h-4" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 font-sans">{counts.returned}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        {/* Status Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 custom-scrollbar">
          {[
            { id: 'all', label: `جميع الطلبات (${counts.all})` },
            { id: 'new', label: `الجديدة (${counts.new})` },
            { id: 'preparing', label: `قيد التحضير (${counts.preparing})` },
            { id: 'delivering', label: `قيد التوصيل (${counts.delivering})` },
            { id: 'delivered', label: `المكتملة (${counts.delivered})` },
            { id: 'cancelled', label: `الملغاة (${counts.cancelled})` },
            { id: 'returned', label: `المرجعة (${counts.returned})` }
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
              placeholder="ابحث برقم الطلب، اسم العميل، رقم الهاتف، اسم المتجر أو الصنف..."
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

      {/* Orders List */}
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
          {filteredOrders.map((order) => {
            const rawStatus = order.status;
            const statusConfig = ORDER_STATUS_CONFIG[rawStatus] || ORDER_STATUS_CONFIG.new;
            const StatusIcon = statusConfig.Icon;

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
                        {order.storeName || 'متجر عام'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Status Changer Dropdown */}
                  <div className="relative">
                    {canEditOrders ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={rawStatus}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all ${statusConfig.badgeClass}`}
                        >
                          <option value="new">🟡 جديد (جديد)</option>
                          <option value="preparing">🔵 قيد التحضير</option>
                          <option value="delivering">🟣 قيد التوصيل</option>
                          <option value="delivered">🟢 مكتمل / تم التسليم</option>
                          <option value="cancelled">🔴 تم الإلغاء</option>
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
                <div className="p-4 space-y-3 flex-1">
                  {/* Customer & Phone */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-900">{order.customerName}</span>
                    </div>
                    {order.customerPhone && (
                      <a 
                        href={`tel:${order.customerPhone}`}
                        className="text-blue-600 hover:text-blue-700 font-mono font-bold flex items-center gap-1 dir-ltr"
                      >
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>{order.customerPhone}</span>
                      </a>
                    )}
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

                  {/* Address & Delivery note */}
                  {order.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{order.address}</span>
                    </div>
                  )}

                  {/* Cancellation & Return Policy Rules Badge */}
                  {(() => {
                    const storeObj = safeStores.find(s => s.id === order.storeId || s.name === order.storeName);
                    const isReturnAllowed = storeObj?.allowReturns !== false;
                    const canUserCancel = rawStatus === 'new';

                    return (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">حق الإلغاء للعميل:</span>
                          {canUserCancel ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                              متاح (الطلب جديد) ✅
                            </span>
                          ) : (
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-200">
                              غير متاح (قيد المعالجة/التوصيل) 🚫
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1">
                          <span className="font-bold text-slate-700">سياسة إرجاع المتجر:</span>
                          {isReturnAllowed ? (
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                              مسموح بالإرجاع 🔄
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-gray-100 px-2 py-0.5 rounded font-bold border border-gray-200">
                              غير قابل للإرجاع 🚫
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Driver Workflow Action Shortcuts */}
                  {canEditOrders && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {rawStatus === 'new' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>قبول وتغيير إلى قيد التحضير 👨‍🍳</span>
                        </button>
                      )}

                      {rawStatus === 'preparing' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'delivering')}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>بدء التوصيل (قيد التوصيل) 🚗</span>
                        </button>
                      )}

                      {rawStatus === 'delivering' && (
                        <button
                          onClick={() => {
                            alert(`📍 تم إرسال إشعار فوري للعميل (${order.customerName}): "مندوب التوصيل وصل إلى موقعك المحدد! 📍 يرجى الخروج لاستلام الطلب"`);
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>📍 إرسال: تم الوصول للموقع</span>
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

                {/* Card Footer Price & View Modal */}
                <div className="p-3.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">الإجمالي الكلي:</span>
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {order.total?.toLocaleString()} <span className="text-xs font-normal text-slate-500">ر.ي</span>
                    </span>
                  </div>

                  <button
                    onClick={() => setViewingOrder(order)}
                    className="bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-gray-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض التفاصيل والسند</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
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
                className="bg-white hover:bg-gray-100 border border-gray-300 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </button>
              
              <button
                onClick={() => setViewingOrder(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Order Modal */}
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {isSubmittingOrder ? 'جاري الحفظ...' : 'حفظ الطلب في Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

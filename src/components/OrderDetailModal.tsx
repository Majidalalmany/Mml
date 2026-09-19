import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Store as StoreIcon, 
  Truck, 
  FileText, 
  Navigation, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Eye,
  CreditCard,
  Layers,
  PhoneCall,
  UserCheck,
  Trash2
} from 'lucide-react';
import { Order } from '../types';
import { ORDER_STATUS_LABELS } from '../constants/orderStatus';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignDriver?: (order: Order) => void;
  onCancelOrder?: (order: Order) => void;
  onDeleteOrder?: (order: Order) => void;
  canCancelOrders?: boolean;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onAssignDriver,
  onCancelOrder,
  onDeleteOrder,
  canCancelOrders = true
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const rawStatus = (order.status || 'new').toLowerCase();
  const statusLabel = ORDER_STATUS_LABELS[rawStatus] || ORDER_STATUS_LABELS[order.status] || order.status;
  const isNew = rawStatus === 'new' || rawStatus === 'pending';
  const isCancelled = rawStatus === 'cancelled';
  const isCompleted = rawStatus === 'delivered' || rawStatus === 'completed';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden text-right dir-rtl animate-in zoom-in-95 duration-150"
          dir="rtl"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    تفاصيل الطلب {order.orderNumber || `#${order.id.slice(0, 6)}`}
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isNew ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    isCancelled ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {statusLabel}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  تاريخ الإنشاء: {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-YE') : 'الآن'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            
            {/* Top Grid: Customer & Store Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Customer Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>بيانات العميل</span>
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{order.customerName}</h4>
                  {order.customerPhone && (
                    <div className="flex items-center justify-between pt-1">
                      <a 
                        href={`tel:${order.customerPhone}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-mono font-bold flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-blue-100"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </div>
                  )}
                  {order.address && (
                    <div className="flex items-start gap-1.5 text-slate-600 text-[11px] pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{order.address}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 text-[11px] mt-1">
                      <strong>ملاحظة العميل:</strong> {order.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Store & Driver Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <StoreIcon className="w-4 h-4 text-emerald-600" />
                  <span>المتجر والتوصيل</span>
                </span>
                <div className="space-y-1.5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{order.storeName || 'متجر عام'}</h4>
                    {order.branch && (
                      <span className="text-[11px] text-slate-500 font-sans">الفرع: {order.branch}</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">المندوب المسند:</span>
                    {order.driverName ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-purple-200 text-purple-900">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600" />
                          <span className="font-bold">{order.driverName}</span>
                        </div>
                        {order.driverPhone && (
                          <a 
                            href={`tel:${order.driverPhone}`} 
                            className="text-xs font-mono font-bold text-purple-700 hover:underline"
                          >
                            {order.driverPhone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 block">
                        لم يتم تعيين مندوب بعد
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice & Distance Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Distance Info */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">مسافة مسار الطريق</span>
                    <span className="font-bold font-mono text-slate-800">
                      {order.actualRoadDistanceKm 
                        ? `${order.actualRoadDistanceKm} كم مسار فعلي` 
                        : (order.airDistanceKm ? `${order.airDistanceKm} كم (هوائي)` : 'غير محددة')}
                    </span>
                  </div>
                </div>
                {order.vehicleTypeName && (
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {order.vehicleTypeName}
                  </span>
                )}
              </div>

              {/* Invoice Info */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">فاتورة الشراء</span>
                    <span className="font-bold text-slate-800">
                      {order.invoiceNumber ? `#${order.invoiceNumber}` : (order.invoiceImageUrl ? 'تم رفع الفاتورة' : 'بانتظار رفع الفاتورة')}
                    </span>
                  </div>
                </div>
                {order.invoiceImageUrl && (
                  <button
                    onClick={() => setSelectedImage(order.invoiceImageUrl || null)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض الصورة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>الأصناف المطلوبة ({order.items ? order.items.length : 0})</span>
                <span className="text-slate-400 font-normal">الكمية والأسعار</span>
              </h4>

              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-xs truncate">{item.name}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            {item.size && <span>الحجم: {item.size}</span>}
                            {item.color && <span>اللون: {item.color}</span>}
                            {item.url && (
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <span>رابط المنتج الخارجي</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0 font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          {((item.price || 0) * (item.quantity || 1)).toLocaleString()} ر.ي
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.quantity || 1} × {(item.price || 0).toLocaleString()} ر.ي
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    لا توجد أصناف مسجلة
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>سعر الأصناف (Subtotal)</span>
                <span className="font-mono font-bold">
                  {(order.itemsTotal || (order.total ? order.total - (order.deliveryFee || 0) : 0)).toLocaleString()} ر.ي
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>رسوم التوصيل المعتمدة</span>
                <span className="font-mono font-bold">
                  {(order.deliveryFee || 0).toLocaleString()} ر.ي
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>المجموع الإجمالي</span>
                <span className="font-mono font-extrabold text-blue-700 text-base">
                  {(order.total || 0).toLocaleString()} <span className="text-xs text-slate-500 font-sans">ر.ي</span>
                </span>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إغلاق النافذة
            </button>

            <div className="flex items-center gap-2">
              {isNew && onAssignDriver && (
                <button
                  onClick={() => {
                    onClose();
                    onAssignDriver(order);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تأكيد وإسناد لمندوب</span>
                </button>
              )}

              {!isNew && !isCompleted && !isCancelled && canCancelOrders && onCancelOrder && (
                <button
                  onClick={() => {
                    onClose();
                    onCancelOrder(order);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>إلغاء الطلب</span>
                </button>
              )}

              {onDeleteOrder && (
                <button
                  onClick={() => {
                    onClose();
                    onDeleteOrder(order);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>حذف الطلب</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Photo Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2">
            <img src={selectedImage} alt="Invoice preview" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </>
  );
};

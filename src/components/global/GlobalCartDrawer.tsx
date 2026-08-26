import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Banknote, 
  Wallet, 
  ShieldCheck, 
  Truck, 
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { GlobalCartItem } from '../../types';
import { 
  getLocalCart, 
  removeFromGlobalCart, 
  clearGlobalCart, 
  submitGlobalStoreOrder 
} from '../../lib/globalStoreService';

interface GlobalCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onOrderCompleted?: (orderNumber: string) => void;
}

export const GlobalCartDrawer: React.FC<GlobalCartDrawerProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onOrderCompleted
}) => {
  const [items, setItems] = useState<GlobalCartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryCity, setDeliveryCity] = useState<string>('صنعاء');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_delivery');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccessNumber, setOrderSuccessNumber] = useState<string | null>(null);

  // Sync cart items on drawer open or event
  useEffect(() => {
    const refresh = () => setItems(getLocalCart());
    refresh();
    window.addEventListener('jahez_cart_updated', refresh);
    return () => window.removeEventListener('jahez_cart_updated', refresh);
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleRemove = (index: number) => {
    const updated = removeFromGlobalCart(index);
    setItems([...updated]);
    onShowToast('تم حذف الصنف من السلة', 'success');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      onShowToast('سلة التسوق فارغة', 'error');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      onShowToast('يرجى كتابة الاسم ورقم الهاتف وعنوان التوصيل بالتفصيل', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitGlobalStoreOrder({
        customerName,
        customerPhone,
        deliveryCity,
        deliveryAddress,
        notes: deliveryNotes,
        items,
        paymentMethod
      });

      if (res.success) {
        setOrderSuccessNumber(res.orderNumber);
        setItems([]);
        onShowToast(`تم تسجيل الطلب الدولي بنجاح برقم: ${res.orderNumber}`, 'success');
        if (onOrderCompleted) onOrderCompleted(res.orderNumber);
      }
    } catch (err: any) {
      console.error('Error submitting global order:', err);
      onShowToast('حدث خطأ أثناء حفظ الطلب في النظام', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end dir-rtl animate-in fade-in" dir="rtl">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">سلة مشتريات المتاجر العالمية</h2>
              <span className="text-xs text-slate-400 font-medium">
                {items.length} {items.length === 1 ? 'صنف محدد' : 'أصناف محددة'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {orderSuccessNumber ? (
            <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-200 text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-950">تم إرسال طلب الشراء بنجاح!</h3>
                <p className="text-xs text-emerald-800 font-medium">
                  تم تسجيل طلبك وحفظه مباشرة في لوحة تحكم الإدارة لمباشرة الشراء والشحن.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-center font-mono space-y-1">
                <span className="text-[11px] text-slate-400 block font-sans">رقم الشحنة الدولي:</span>
                <span className="text-xl font-bold text-emerald-700 tracking-wider block">
                  {orderSuccessNumber}
                </span>
              </div>

              <button
                onClick={() => {
                  setOrderSuccessNumber(null);
                  onClose();
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                متابعة التسوق واستعراض المتاجر
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">السلة فارغة حالياً</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                تصفح منتجات أمازون، شي إن، وعلي إكسبريس وأضف سلعك المفضلة للشراء والشحن إلى اليمن.
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700">السلع المختارة للشحن:</h3>
                {items.map((item, idx) => (
                  <div 
                    key={`${item.productId}-${idx}`}
                    className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-50"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-md">
                          {item.storeName}
                        </span>
                        {item.selectedSize && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md border border-blue-200">
                            مقاس: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-[10px] bg-gray-100 text-slate-700 font-medium px-1.5 py-0.5 rounded-md">
                            لون: {item.selectedColor}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.productTitle}
                      </h4>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono">
                          {item.quantity} × {item.displayedPrice.toLocaleString()} ر.ي
                        </span>
                        <span className="font-bold text-blue-700 font-mono">
                          {item.totalPrice.toLocaleString()} ر.ي
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>بيانات المستلم وعنوان التوصيل في اليمن:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد عبد الله الشامي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">رقم الهاتف (واتساب) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 771234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">المدينة *</label>
                    <select
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    >
                      <option value="صنعاء">صنعاء</option>
                      <option value="عدن">عدن</option>
                      <option value="تعز">تعز</option>
                      <option value="الحديدة">الحديدة</option>
                      <option value="المكلا">المكلا</option>
                      <option value="إب">إب</option>
                      <option value="ذمار">ذمار</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">العنوان بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      placeholder="الشارع، الحي، أقرب معلم"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">ملاحظات إضافية على الشحنة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="ملاحظات حول المقاس، الاستلام أو التغليف..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Payment Methods */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-slate-700 block">طريقة الدفع المفضلة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash_on_delivery', label: 'الدفع عند الاستلام', desc: 'نقداً عند وصول المندوب', icon: Banknote },
                      { id: 'kuraimi_jawali', label: 'حوالة جوالي / الكريمي', desc: 'تحويل مباشر لحساب المنصة', icon: Wallet }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id)}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          paymentMethod === p.id 
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <p.icon className="w-3.5 h-3.5 text-blue-600" />
                          <span>{p.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 mt-4 shadow-md">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>إجمالي السلع ({items.length} أصناف):</span>
                    <span className="font-mono">{totalAmount.toLocaleString()} ر.ي</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>الشحن الدولي والفحص الجمركي:</span>
                    <span className="text-emerald-400 font-bold">مدرج مجاناً ضمن السعر ✓</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold">المبلغ المستحق النهائي:</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {totalAmount.toLocaleString()} ريال
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري تسجيل الطلب الدولي...' : 'تأكيد وإرسال طلب الشراء'}</span>
                </button>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

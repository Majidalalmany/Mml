import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

# 1. Add handleDeleteOrder
delete_func = """
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      if (!orderId.startsWith('local-')) {
        await deleteDoc(doc(db, 'orders', orderId));
      }
      setLiveOrders(prev => prev.filter(o => o.id !== orderId));
      if (onShowToast) onShowToast('تم حذف الطلب بنجاح', 'success');
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      if (onShowToast) onShowToast('فشل حذف الطلب', 'error');
    }
  };
"""

if "const handleDeleteOrder =" not in content:
    # insert before handleStatusChange
    content = content.replace("const handleStatusChange =", delete_func + "\n  const handleStatusChange =")

# 2. Update action buttons
bad_actions = """                      {/* Admin Workflow Actions */}
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
                      )}"""

good_actions = """                      {/* Admin Workflow Actions */}
                      {canEditOrders && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {/* Confirm Order (تأكيد الطلب) */}
                          {rawStatus === 'new' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'preparing')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              تأكيد الطلب ✅
                            </button>
                          )}

                          {/* Choose/Assign Driver */}
                          {(!order.driverId || rawStatus === 'new') && (
                            <button
                              onClick={() => {
                                setOrderToAssign(order);
                                setIsAssignDriverModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              اختيار / تعيين المندوب 👨‍🍳
                            </button>
                          )}

                          {/* Change Captain */}
                          {order.driverId && rawStatus !== 'new' && (
                            <button
                              onClick={() => {
                                setOrderToAssign(order);
                                setIsAssignDriverModalOpen(true);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2 px-2.5 rounded-xl transition-all border border-slate-300 cursor-pointer"
                            >
                              تغيير الكابتن
                            </button>
                          )}
                          
                          {/* Review Items and Pricing */}
                          <button
                            onClick={() => handleOpenReviewModal(order)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 border border-amber-300 cursor-pointer w-full"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-700" />
                            <span>مراجعة أصناف الطلب وأتمتة النقل والتسعير</span>
                          </button>

                          {/* Cancel Order */}
                          {canCancelOrders && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] py-2 px-2.5 rounded-xl border border-red-200 cursor-pointer flex-1"
                            >
                              إلغاء الطلب
                            </button>
                          )}

                          {/* Delete Order */}
                          {canCancelOrders && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] py-2 px-2.5 rounded-xl border border-red-700 cursor-pointer flex-1"
                            >
                              حذف الطلب 🗑️
                            </button>
                          )}
                        </div>
                      )}"""

if bad_actions in content:
    content = content.replace(bad_actions, good_actions)
    print("Replaced actions block")
else:
    print("Could not find bad_actions block")

# 3. Add busy check to handleAssignDriverSubmit
bad_assign = """  const handleAssignDriverSubmit = async (driver: DriverUser) => {
    if (!orderToAssign) return;
    try {"""

good_assign = """  const handleAssignDriverSubmit = async (driver: DriverUser) => {
    if (!orderToAssign) return;
    
    // Prevent double assignment
    const isBusy = liveOrders.some(o => 
      o.id !== orderToAssign.id &&
      (o.driverId === driver.phone || o.driverPhone === driver.phone || o.driverId === driver.id) &&
      (o.status === 'preparing' || o.status === 'delivering' || o.status === 'PREPARING' || o.status === 'DELIVERING')
    );

    if (isBusy) {
      alert('هذا المندوب مشغول بتوصيل طلب حالي. لا يمكن إسناد طلبين في نفس الوقت.');
      return;
    }

    try {"""

if bad_assign in content:
    content = content.replace(bad_assign, good_assign)
    print("Added busy check to handleAssignDriverSubmit")
else:
    print("Could not find bad_assign block")

with open('src/components/OrdersManager.tsx', 'w') as f:
    f.write(content)


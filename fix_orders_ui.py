import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

bad_block = """                      {/* Status Dropdown */}
                      <div className="relative">
                        {canEditOrders ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={
                                rawStatus === 'NEW' || rawStatus === 'pending' || rawStatus === 'pending_review' || rawStatus === 'PENDING' || rawStatus === 'PENDING_REVIEW'
                                  ? 'new'
                                  : rawStatus === 'PREPARING' || rawStatus === 'confirmed' || rawStatus === 'CONFIRMED' || rawStatus === 'approved' || rawStatus === 'APPROVED'
                                  ? 'preparing'
                                  : rawStatus === 'DELIVERING'
                                  ? 'delivering'
                                  : rawStatus === 'COMPLETED' || rawStatus === 'delivered'
                                  ? 'completed'
                                  : rawStatus === 'CANCELLED' || rawStatus === 'returned'
                                  ? 'cancelled'
                                  : rawStatus
                              }
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all ${statusConfig.badgeClass}`}
                            >
                              <option value="new">🟡 جديد</option>
                              <option value="preparing">🔵 قيد التحضير (إسناد للمندوب)</option>
                              <option value="delivering">🟣 قيد التوصيل</option>
                              <option value="completed">🟢 مكتمل</option>
                              {canCancelOrders && <option value="cancelled">🔴 ملغي</option>}
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
                      </div>"""

good_block = """                      {/* Read-Only Status Badge */}
                      <div className="relative">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${statusConfig.badgeClass}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusConfig.label}</span>
                          {updatingOrderId === order.id && (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
                          )}
                        </span>
                      </div>"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open('src/components/OrdersManager.tsx', 'w') as f:
        f.write(content)
    print("Fixed status dropdown")
else:
    print("Could not find status dropdown block")


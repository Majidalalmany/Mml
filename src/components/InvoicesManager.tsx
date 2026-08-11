import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Truck, 
  Eye, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Store, 
  ShoppingBag, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  AlertTriangle
} from 'lucide-react';
import { collection, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InvoiceReceipt, DriverUser, AdminUser } from '../types';
import { hasModulePermission } from '../lib/permissions';
import { logAuditEvent } from '../lib/auditLogger';

interface InvoicesManagerProps {
  drivers: DriverUser[];
  currentUser: AdminUser | null;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({
  drivers,
  currentUser,
  onShowToast
}) => {
  const [invoices, setInvoices] = useState<InvoiceReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'regular' | 'fazaa' | 'manfaa'>('all');

  // Lightbox View Modal
  const [activeLightbox, setActiveLightbox] = useState<InvoiceReceipt | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Delete Confirmation Modal
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceReceipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = hasModulePermission(currentUser?.permissions, currentUser?.role || 'custom', 'orders', 'delete');

  // Real-time listener for driver_invoices
  useEffect(() => {
    setIsLoading(true);

    const invoicesQuery = query(collection(db, 'driver_invoices'));
    const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
      const list: InvoiceReceipt[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as InvoiceReceipt[];

      // Sort by uploadedAt / createdAt descending
      list.sort((a, b) => {
        const timeA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setInvoices(list);
      setIsLoading(false);
    }, (error) => {
      console.warn('Invoices listener fallback error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Driver Filter
      if (selectedDriverFilter !== 'all' && inv.driverId !== selectedDriverFilter && inv.driverName !== selectedDriverFilter) {
        return false;
      }

      // Type Filter
      if (selectedTypeFilter !== 'all' && inv.orderType !== selectedTypeFilter) {
        return false;
      }

      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = inv.orderNumber?.toLowerCase().includes(term);
        const driverMatch = inv.driverName?.toLowerCase().includes(term);
        const customerMatch = inv.customerName?.toLowerCase().includes(term);
        const storeMatch = inv.storeName?.toLowerCase().includes(term);
        if (!numMatch && !driverMatch && !customerMatch && !storeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedDriverFilter, selectedTypeFilter, searchTerm]);

  // Drivers List for Dropdown
  const driverOptions = useMemo(() => {
    const map = new Map<string, string>();
    drivers.forEach(d => map.set(d.id, d.name));
    invoices.forEach(inv => {
      if (inv.driverId && inv.driverName) map.set(inv.driverId, inv.driverName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [drivers, invoices]);

  // Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = invoices.filter(i => (i.uploadedAt || '').startsWith(todayStr)).length;
    const uniqueDriversCount = new Set(invoices.map(i => i.driverId || i.driverName)).size;

    return {
      total: invoices.length,
      today: todayCount,
      uniqueDrivers: uniqueDriversCount
    };
  }, [invoices]);

  // Action: Delete Invoice
  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'driver_invoices', deletingInvoice.id));

      if (currentUser) {
        await logAuditEvent({
          action: 'حذف صورة فاتورة',
          performedBy: currentUser.name || currentUser.email || 'مدير النظام',
          userEmail: currentUser.email,
          userRole: currentUser.role,
          targetType: 'order',
          targetName: deletingInvoice.orderNumber,
          details: `تم حذف صورة الفاتورة للطلب رقم ${deletingInvoice.orderNumber} المرفوعة بواسطة المندوب ${deletingInvoice.driverName}`,
          severity: 'warning'
        });
      }

      onShowToast?.(`تم حذف الفاتورة للطلب #${deletingInvoice.orderNumber} بنجاح`, 'success');
      setDeletingInvoice(null);
    } catch (e: any) {
      console.error('Error deleting invoice:', e);
      onShowToast?.('حدث خطأ أثناء حذف الفاتورة من القاعدة', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper: Download Image
  const handleDownloadImage = (imageUrl: string, fileName: string) => {
    try {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `Invoice_${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onShowToast?.('جاري بدء تنزيل صورة الفاتورة...', 'info');
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-800">🧾 معرض وفواتير المندوبين (Invoice Receipts)</h2>
                <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  تحديث حي ورسمي
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                عرض وقراءة صور الفواتير المرفوعة مباشرة من المندوبين عند بدء التوصيل وفرزها حسب المندوب والتاريخ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 500);
            }}
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-600 border border-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">إجمالي الفواتير المرفوعة</div>
            <div className="text-2xl font-black text-slate-800 font-mono">{stats.total} فاتورة</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">فواتير مرفوعة اليوم</div>
            <div className="text-2xl font-black text-emerald-700 font-mono">{stats.today} اليوم</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">المندوبون الرافعون للفواتير</div>
            <div className="text-2xl font-black text-purple-700 font-mono">{stats.uniqueDrivers} كابتن</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الطلب، اسم المندوب، العميل، أو المتجر..."
              className="w-full pr-9 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Driver Filter Dropdown */}
          <div className="w-full md:w-64 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
            <Truck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-bold shrink-0">المندوب:</span>
            <select
              value={selectedDriverFilter}
              onChange={(e) => setSelectedDriverFilter(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع المندوبين ({driverOptions.length})</option>
              {driverOptions.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold shrink-0 w-full md:w-auto">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              الكل ({invoices.length})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('regular')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'regular' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              طلبات المتاجر
            </button>
            <button
              onClick={() => setSelectedTypeFilter('manfaa')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'manfaa' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              منفعة / فزعة
            </button>
          </div>

        </div>
      </div>

      {/* Invoices Gallery Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-bold">جاري تحميل صور الفواتير المرفوعة من Firestore...</div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-700">لا توجد صور فواتير مطابقة للبحث أو المندوب المحدد</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            عند قيام المندوبين برفع صور الفواتير عند بدء توصيل الطلبات، ستظهر جميع الصور هنا مع تاريخ ووقت الرفع وتفاصيل الطلب.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInvoices.map((inv) => {
            const uploadDate = inv.uploadedAt ? new Date(inv.uploadedAt) : new Date();
            const formattedDateStr = uploadDate.toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' });
            const formattedTimeStr = uploadDate.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={inv.id} 
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Header Info */}
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-mono font-extrabold text-amber-300">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>طلب #{inv.orderNumber}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inv.orderType === 'manfaa' || inv.orderType === 'fazaa'
                      ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                      : 'bg-blue-900 text-blue-300 border border-blue-700'
                  }`}>
                    {inv.orderType === 'manfaa' || inv.orderType === 'fazaa' ? 'خدمة منفعة' : 'طلب متجر'}
                  </span>
                </div>

                {/* Driver Info Bar */}
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(inv.driverName || 'م').charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">{inv.driverName || 'كابتن توصيل'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{inv.driverPhone || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Image Preview Container */}
                <div 
                  className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer group/img"
                  onClick={() => {
                    setActiveLightbox(inv);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                >
                  <img
                    src={inv.imageUrl}
                    alt={`فاتورة طلب #${inv.orderNumber}`}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>قراءة الفاتورة</span>
                    </span>
                  </div>
                </div>

                {/* Order & Time Details */}
                <div className="p-3 space-y-2 text-xs flex-1 flex flex-col justify-between">
                  <div className="space-y-1 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">اسم العميل:</span>
                      <strong className="text-slate-800 font-bold">{inv.customerName || 'عميل'}</strong>
                    </div>

                    {inv.storeName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">المتجر/الجهة:</span>
                        <strong className="text-amber-800 font-bold">{inv.storeName}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>تاريخ الرفع:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700">{formattedDateStr}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>الوقت الدقيق:</span>
                      </span>
                      <span className="font-mono font-bold text-blue-600 dir-ltr">{formattedTimeStr}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setActiveLightbox(inv);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>قراءة</span>
                    </button>

                    <button
                      onClick={() => handleDownloadImage(inv.imageUrl, inv.orderNumber)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="تنزيل الصورة"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => setDeletingInvoice(inv)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="حذف الفاتورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Full-screen Reader Modal */}
      {activeLightbox && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 text-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-800 shadow-2xl overflow-hidden">
            
            {/* Lightbox Header */}
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    قراءة صورة الفاتورة للطلب #{activeLightbox.orderNumber}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>المندوب: <strong className="text-amber-300">{activeLightbox.driverName}</strong></span>
                    <span>•</span>
                    <span>الرفع: <strong className="text-blue-300">{new Date(activeLightbox.uploadedAt || '').toLocaleString('ar-YE')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                  title="تدوير"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadImage(activeLightbox.imageUrl, activeLightbox.orderNumber)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الصورة</span>
                </button>
                <button
                  onClick={() => setActiveLightbox(null)}
                  className="p-2 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Reader Stage */}
            <div className="flex-1 overflow-auto p-6 bg-slate-950 flex items-center justify-center min-h-[350px]">
              <img
                src={activeLightbox.imageUrl}
                alt="صورة الفاتورة المكبرة"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out'
                }}
                className="max-h-[65vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Footer Details */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div>العميل: <strong className="text-white">{activeLightbox.customerName || 'غير محدد'}</strong></div>
              <div>المتجر: <strong className="text-amber-300">{activeLightbox.storeName || 'غير محدد'}</strong></div>
              <div>المستوى الحالي للتكبير: <strong className="text-blue-400 font-mono">{Math.round(zoomLevel * 100)}%</strong></div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">تأكيد حذف صورة الفاتورة</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت تأكيد من حذف صورة الفاتورة للطلب رقم <strong className="text-slate-800">#{deletingInvoice.orderNumber}</strong> المرفوعة بواسطة المندوب <strong className="text-slate-800">{deletingInvoice.driverName}</strong>؟
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDeleteInvoice}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، حذف الفاتورة نهائياً'}
              </button>

              <button
                onClick={() => setDeletingInvoice(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

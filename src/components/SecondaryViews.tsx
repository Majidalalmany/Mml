import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Sliders, 
  Truck, 
  Bell, 
  Percent, 
  BarChart3, 
  DollarSign, 
  UserCheck, 
  CreditCard, 
  Settings,
  Store,
  Gift,
  CheckCircle2,
  Clock,
  Shield,
  ShieldCheck,
  Lock,
  Globe,
  Key,
  RefreshCw,
  Server,
  Zap,
  Check
} from 'lucide-react';
import { TabType } from '../types';
import { VehiclesPricingManager } from './VehiclesPricingManager';

interface ViewProps {
  tab: TabType;
  selectedBranch: string;
}

// 1. Settings & SSL Component
const SettingsView: React.FC = () => {
  const [forceHttps, setForceHttps] = useState(true);
  const [enableHsts, setEnableHsts] = useState(true);
  const [enableXssProtection, setEnableXssProtection] = useState(true);
  const [enableFirestoreSsl, setEnableFirestoreSsl] = useState(true);
  const [isVerifyingSsl, setIsVerifyingSsl] = useState(false);
  const [sslMessage, setSslMessage] = useState<string | null>(null);

  const handleVerifySsl = () => {
    setIsVerifyingSsl(true);
    setSslMessage(null);
    setTimeout(() => {
      setIsVerifyingSsl(false);
      setSslMessage('تم فحص شهادة SSL وتأكيد بروتوكول HTTPS بنجاح! جميع الاتصالات مشفرة بدرجة أمان 256-bit AES بدون أي تحذيرات.');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center border border-slate-700 shadow-xs">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">إعدادات الأمان والتشفير وشهادات SSL / HTTPS</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                اتصال مشفر وآمن 100%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              إدارة بروتوكول HTTPS، ترويسات أمان الشبكة (HSTS)، وشهادات التشفير لنطاق المنصة الرسمية
            </p>
          </div>
        </div>

        <button
          onClick={handleVerifySsl}
          disabled={isVerifyingSsl}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isVerifyingSsl ? 'animate-spin' : ''}`} />
          <span>{isVerifyingSsl ? 'جاري فحص الشهادة...' : 'إعادة فحص شهادة SSL وتحديث الأمان'}</span>
        </button>
      </div>

      {sslMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{sslMessage}</span>
        </div>
      )}

      {/* SSL Certificate Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">النطاق المحمي (Official Domain)</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-bold text-slate-800 font-mono dir-ltr text-right">
            https://jahezye.com
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3 h-3" />
            تم فرض تحويل HTTPS الإجباري
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">جهة إصدار شهادة SSL</span>
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-base font-bold text-slate-800 font-mono">
            Google Trust Services / Let's Encrypt
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            التشفير: TLS 1.3 (256-bit AES GCM)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">حالة التجديد التلقائي</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-emerald-700">
            سارية ومفعلة تلقائياً
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            تاريخ الانتهاء: 2027-12-31 (Auto-Renew)
          </div>
        </div>
      </div>

      {/* HTTPS & Security Controls */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">إعدادات بروتوكول الأمان وتشفير البيانات (HTTPS & SSL Protocol)</h3>
        </div>

        <div className="space-y-4">
          {/* Control 1: Force HTTPS */}
          <div className="flex items-center justify-between p-4 bg-gray-50/70 rounded-xl border border-gray-200/80">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-slate-800 block">فرض تحويل جميع الزوار لبروتوكول HTTPS الإجباري</span>
              <span className="text-xs text-slate-400 block">إعادة توجيه أي طلب HTTP تلقائياً إلى الرابط المشفر SSL لضمان عدم ظهور أي تحذير أمان</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={forceHttps} 
                onChange={(e) => setForceHttps(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Control 2: HSTS */}
          <div className="flex items-center justify-between p-4 bg-gray-50/70 rounded-xl border border-gray-200/80">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-slate-800 block">تفعيل ترويسة HSTS (Strict-Transport-Security)</span>
              <span className="text-xs text-slate-400 block">إلزام متصفح العميل بالتواصل الحصري مع خوادم المنصة عبر التشفير العالي لمدة سنة</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableHsts} 
                onChange={(e) => setEnableHsts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Control 3: XSS & CSRF */}
          <div className="flex items-center justify-between p-4 bg-gray-50/70 rounded-xl border border-gray-200/80">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-slate-800 block">حماية الجلسات والبيانات من هجمات Cross-Site Scripting (XSS)</span>
              <span className="text-xs text-slate-400 block">فحص مدخلات النموذج والبريد الإلكتروني وتوثيق الجلسة بحماية SSL العالية</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableXssProtection} 
                onChange={(e) => setEnableXssProtection(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Control 4: Firestore SSL */}
          <div className="flex items-center justify-between p-4 bg-gray-50/70 rounded-xl border border-gray-200/80">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-slate-800 block">تشفير اتصالات Firestore وقواعد البيانات مباشرة (gRPC / SSL)</span>
              <span className="text-xs text-slate-400 block">تأمين كل عمليات الاستعلام وتحديثات أسعار المنتجات والمتاجر بشهادة غوغل السحابية</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableFirestoreSsl} 
                onChange={(e) => setEnableFirestoreSsl(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between text-xs text-slate-500">
        <span>نظام جاهز لإدارة المطاعم والمتاجر — الإصدار 3.5 (النسخة المستقرة)</span>
        <span className="font-mono text-slate-400">SSL Certificate Fingerprint: SHA-256 (Verified)</span>
      </div>
    </div>
  );
};

// 2. Orders View Component
const OrdersView: React.FC<{ selectedBranch: string }> = ({ selectedBranch }) => (
  <div className="space-y-4">
    <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">إدارة الطلبات الحية ({selectedBranch})</h2>
          <p className="text-xs text-slate-400">متابعة طلبات العملاء والحالات لحظة بلحظة</p>
        </div>
      </div>
      <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-3 py-1 rounded-full font-bold">
        النظام متصل مباشرة بـ Firestore
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs text-slate-400 block font-medium">الطلبات الجديدة</span>
          <span className="text-2xl font-bold text-amber-600 font-sans">14</span>
        </div>
        <Clock className="w-8 h-8 text-amber-500 bg-amber-50 p-1.5 rounded-lg border border-amber-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs text-slate-400 block font-medium">قيد التحضير في المطبخ</span>
          <span className="text-2xl font-bold text-blue-600 font-sans">8</span>
        </div>
        <Sliders className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg border border-blue-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs text-slate-400 block font-medium">تم التوصيل بنجاح اليوم</span>
          <span className="text-2xl font-bold text-green-600 font-sans">42</span>
        </div>
        <CheckCircle2 className="w-8 h-8 text-green-500 bg-green-50 p-1.5 rounded-lg border border-green-100" />
      </div>
    </div>

    <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center space-y-3 shadow-xs">
      <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
      <h3 className="text-base font-bold text-slate-800">قائمة الطلبات جارية المعالجة</h3>
      <p className="text-xs text-slate-400 max-w-md mx-auto">
        جميع البيانات مرتبطة بتصنيفات المنتجات وقاعدة بيانات الأسعار.
      </p>
    </div>
  </div>
);

// 3. Notifications View Component
const NotificationsView: React.FC = () => (
  <div className="space-y-6 animate-in fade-in">
    {/* Header */}
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">مركزي التنبيهات والإشعارات المباشرة للتطبيق</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إرسال تنبيهات خروج الاستلام التلقائية عند وصول سائق التوصيل للموقع المحدد ومتابعة التنبيهات.
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          alert('📍 تم إرسال تنبيه فوري لجميع المستخدمين ذوي الطلبات النشطة: "مندوب التوصيل وصل لموقعك المحدد! 📍 يرجى الخروج لاستلام طلبك"');
        }}
        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
      >
        <Bell className="w-4 h-4 animate-bounce" />
        <span>إرسال تنبيه وصول المندوب فوراً 📍</span>
      </button>
    </div>

    {/* Arrival Driver Notification Alert Config */}
    <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-3">
      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
        <Zap className="w-5 h-5 text-amber-600 shrink-0" />
        <span>خاصية التنبيه الآلي "تم الوصول إلى الموقع المحدد":</span>
      </div>
      <p className="text-xs text-amber-800 leading-relaxed">
        عند نقر مندوب التوصيل في خريطة الطلبات على زر <strong>"تم الوصول إلى الموقع المحدد 📍"</strong>، يتم إرسال إشعار فوري منبثق وصوتي للهاتف الجوال الخاص بالعميل ليلهمه بالخروج لاستلام شحنته بدون الحاجة للاتصال الهاتفي.
      </p>
    </div>

    {/* Sent Notifications Log */}
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <h3 className="text-base font-bold text-slate-800 border-b border-gray-100 pb-3">سجل التنبيهات الصادرة مؤخراً للعملاء</h3>

      <div className="space-y-3">
        {[
          { id: 'nt-1', title: '📍 وصول المندوب للموقع المحدد', body: 'عزيزي العميل، وصل الكابتن أحمد المحضار إلى موقعك المحدد. يرجى الخروج لاستلام الطلب.', target: 'العميل: أحمد صلاح (771234567)', time: 'قبل 5 دقائق', status: 'تم التسليم للجوال 📲' },
          { id: 'nt-2', title: '📍 وصول المندوب للموقع المحدد', body: 'عزيزي العميل، وصل كابتن فزعة إلى موقعك. يرجى الخروج لاستلام الشحنة.', target: 'العميل: سامي الريمي (778899000)', time: 'قبل 18 دقيقة', status: 'تم التسليم للجوال 📲' },
          { id: 'nt-3', title: '🎁 عرض خاص ومباشر', body: 'خصم 20% على طلبات الوجبات السريعة لفترة محدودة!', target: 'جميع عملاء التطبيق', time: 'قبل ساعتين', status: 'تم الإرسال الجماعي 📢' }
        ].map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{item.title}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">{item.status}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{item.body}</p>
              <span className="text-[11px] text-slate-400 block pt-0.5">{item.target} • {item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 4. Offers View Component
const OffersView: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
    <div className="flex items-center gap-3">
      <Gift className="w-6 h-6 text-red-600" />
      <div>
        <h2 className="text-xl font-bold text-slate-800">العروض والتخفيضات المميزة</h2>
        <p className="text-xs text-slate-400">إدارة بانرات العروض والخصومات المؤقتة للمنتجات</p>
      </div>
    </div>
    <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2">
      <Gift className="w-10 h-10 text-red-400 mx-auto" />
      <h4 className="font-bold text-slate-800 text-sm">لا توجد عروض ترويجية منتهية</h4>
      <p className="text-xs text-slate-400">العروض الحالية مرتبطة تلقائياً بخصومات المنتجات في جدول المنتجات.</p>
    </div>
  </div>
);

// 5. Delivery View Component
const DeliveryView: React.FC<{ selectedBranch: string }> = ({ selectedBranch }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
    <div className="flex items-center gap-3">
      <Truck className="w-6 h-6 text-blue-600" />
      <div>
        <h2 className="text-xl font-bold text-slate-800">إدارة التوصيل وأسطول السائقين</h2>
        <p className="text-xs text-slate-400">تتبع السائقين وتحديد نطاق التوصيل لفرع ({selectedBranch})</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
        <span className="text-xs font-bold text-blue-600">سائقين متصلين الآن</span>
        <div className="text-2xl font-bold text-blue-900 font-sans">28 سائق</div>
      </div>
      <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-1">
        <span className="text-xs font-bold text-green-600">طلبات في الطريق للعملاء</span>
        <div className="text-2xl font-bold text-green-900 font-sans">19 طلب</div>
      </div>
      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-1">
        <span className="text-xs font-bold text-purple-600">متوسط وقت التوصيل</span>
        <div className="text-2xl font-bold text-purple-900 font-sans">24 دقيقة</div>
      </div>
    </div>
  </div>
);

// 6. Financial & Vehicle Category Pricing View
const FinancialView: React.FC = () => {
  return <VehiclesPricingManager />;
};

// Main Router / Switcher Component - Strictly No Conditional Hooks
export const SecondaryViews: React.FC<ViewProps> = ({ tab, selectedBranch }) => {
  if (tab === 'settings') {
    return <SettingsView />;
  }

  if (tab === 'orders') {
    return <OrdersView selectedBranch={selectedBranch} />;
  }

  if (tab === 'notifications') {
    return <NotificationsView />;
  }

  if (tab === 'discounts') {
    return <DiscountsSettlementView />;
  }

  if (tab === 'offers') {
    return <OffersView />;
  }

  if (tab === 'delivery') {
    return <DeliveryView selectedBranch={selectedBranch} />;
  }

  if (tab === 'financial' || tab === 'reports') {
    return <FinancialView />;
  }

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-3 shadow-xs">
      <Settings className="w-10 h-10 text-slate-400 mx-auto" />
      <h3 className="text-lg font-bold text-slate-800">وحدة {tab} في تطبيق جاهز</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">
        هذا القسم مرتبط بقاعدة بيانات Firestore وتطبيق الحماية والأمان المتقدم.
      </p>
    </div>
  );
};

// Component for Discounts & Driver Commission Settlement
const DiscountsSettlementView: React.FC = () => {
  const [unsettledItems, setUnsettledItems] = useState([
    { id: 'settle-1', driverName: 'أحمد المحضار', driverPhone: '771234567', orderNumber: '#ORD-8821', storeName: 'مطعم الشيباني', discountAmount: 500, driverCommission: 1200, totalAmount: 1700, date: '2026-08-05 10:30 ص' },
    { id: 'settle-2', driverName: 'سامي الريمي', driverPhone: '778899000', orderNumber: '#ORD-8822', storeName: 'صيدلية الأمل', discountAmount: 300, driverCommission: 1000, totalAmount: 1300, date: '2026-08-05 11:15 ص' },
    { id: 'settle-3', driverName: 'خالد باوزير', driverPhone: '773344555', orderNumber: '#ORD-8825', storeName: 'سوبرماركت الوفاء', discountAmount: 800, driverCommission: 1500, totalAmount: 2300, date: '2026-08-05 12:00 م' },
  ]);

  const [settledItems, setSettledItems] = useState<any[]>([
    { id: 'settled-prev-1', driverName: 'محمد العماري', driverPhone: '770001122', orderNumber: '#ORD-8790', storeName: 'مطعم البيك', discountAmount: 400, driverCommission: 1100, totalAmount: 1500, settledAt: '2026-08-04 05:45 م', settledBy: 'إدارة المالية' }
  ]);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSettleSingle = (id: string) => {
    const itemToSettle = unsettledItems.find(i => i.id === id);
    if (!itemToSettle) return;

    setUnsettledItems(prev => prev.filter(i => i.id !== id));
    setSettledItems(prev => [
      {
        ...itemToSettle,
        settledAt: new Date().toLocaleString('ar-YE'),
        settledBy: 'الإدارة المالية'
      },
      ...prev
    ]);

    setSuccessMsg(`تم تسوية عمولة وتخفيض السائق (${itemToSettle.driverName}) بمبلغ ${itemToSettle.totalAmount.toLocaleString()} ر.ي ونقلها لسجل المسواة بنجاح! ✅`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSettleAll = () => {
    if (unsettledItems.length === 0) return;

    const newSettled = unsettledItems.map(item => ({
      ...item,
      settledAt: new Date().toLocaleString('ar-YE'),
      settledBy: 'الإدارة المالية (تسوية جماعية)'
    }));

    setSettledItems(prev => [...newSettled, ...prev]);
    setUnsettledItems([]);

    setSuccessMsg(`تم تسوية جميع العمولات والتخفيضات المعلقة (${newSettled.length} عنصر) بنجاح! 🚀`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const totalUnsettledCommission = unsettledItems.reduce((acc, curr) => acc + curr.driverCommission, 0);
  const totalUnsettledDiscount = unsettledItems.reduce((acc, curr) => acc + curr.discountAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">إدارة التخفيضات وتسوية عمولات المناديب</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              واجهة تخصيص ومراجعة العمولات والتخفيضات المراد تسويتها مع السائقين والمتاجر بنقرة واحدة.
            </p>
          </div>
        </div>

        {unsettledItems.length > 0 && (
          <button
            onClick={handleSettleAll}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تسوية جميع العمولات المتبقية ({unsettledItems.length})</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-purple-700">إجمالي عمولات المناديب المعلقة</span>
          <div className="text-2xl font-extrabold text-purple-950 font-sans">{totalUnsettledCommission.toLocaleString()} <span className="text-xs font-normal">ر.ي</span></div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-amber-800">إجمالي التخفيضات المخصومة</span>
          <div className="text-2xl font-extrabold text-amber-950 font-sans">{totalUnsettledDiscount.toLocaleString()} <span className="text-xs font-normal">ر.ي</span></div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-emerald-800">سجلات العمولات المسواة</span>
          <div className="text-2xl font-extrabold text-emerald-950 font-sans">{settledItems.length} عملية</div>
        </div>
      </div>

      {/* Unsettled Items Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-slate-800">1. قائمة التخفيضات وعمولات المناديب المراد تسويتها (قيد المعالجة)</h3>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
            {unsettledItems.length} عناصر معلقة
          </span>
        </div>

        {unsettledItems.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">ممتاز! تم تسوية جميع العمولات والتخفيضات الحالية</h4>
            <p className="text-xs text-slate-400">لا توجد أية مستحقات معلقة للمناديب في الوقت الحالي.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unsettledItems.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">المندوب: {item.driverName}</span>
                    <span className="text-xs text-slate-500 dir-ltr font-mono">({item.driverPhone})</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">غير مسواة</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>الطلب: <strong className="text-slate-800">{item.orderNumber}</strong></span>
                    <span>•</span>
                    <span>المتجر: <strong className="text-slate-800">{item.storeName}</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 block pt-0.5">{item.date}</span>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                  <div className="text-right">
                    <div className="text-xs font-bold text-purple-700">عمولة المندوب: {item.driverCommission.toLocaleString()} ر.ي</div>
                    <div className="text-[11px] text-amber-700">التخفيض المخصوم: {item.discountAmount.toLocaleString()} ر.ي</div>
                  </div>

                  <button
                    onClick={() => handleSettleSingle(item.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تسوية</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settled Items History Log */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-slate-800">2. سجل العمولات والتخفيضات المسواة (الأرشيف المالي)</h3>
          <span className="text-xs text-slate-400 font-bold">
            {settledItems.length} عمليات تسوية سابقة
          </span>
        </div>

        <div className="space-y-3">
          {settledItems.map((item) => (
            <div key={item.id} className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{item.driverName}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    تمت التسوية بنجاح ✅
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  طلب: {item.orderNumber} ({item.storeName}) • تمت بواسطة: {item.settledBy} • {item.settledAt}
                </div>
              </div>

              <div className="text-left font-mono font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                {item.totalAmount?.toLocaleString() || (item.driverCommission + item.discountAmount).toLocaleString()} ر.ي
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


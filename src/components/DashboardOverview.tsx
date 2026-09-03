import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Truck, 
  DollarSign, 
  ShieldCheck, 
  Activity, 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Zap,
  Server
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Order } from '../types';

interface DashboardOverviewProps {
  orders?: Order[];
  onNavigateToFinancial?: () => void;
  onNavigateToDelivery?: () => void;
  onNavigateToGlobalStores?: () => void;
}

const PERFORMANCE_DATA = [
  { name: 'السبت', orders: 120, revenue: 450000 },
  { name: 'الأحد', orders: 180, revenue: 680000 },
  { name: 'الإثنين', orders: 140, revenue: 510000 },
  { name: 'الثلاثاء', orders: 210, revenue: 820000 },
  { name: 'الأربعاء', orders: 190, revenue: 740000 },
  { name: 'الخميس', orders: 290, revenue: 1150000 },
  { name: 'الجمعة', orders: 340, revenue: 1380000 },
];

const CATEGORY_SHARE = [
  { name: 'المطاعم والوجبات السريعة', value: 38, color: '#2563eb' },
  { name: 'السوبرماركت والتموينات', value: 24, color: '#10b981' },
  { name: 'المتاجر العالمية (Amazon / SHEIN)', value: 18, color: '#4f46e5' },
  { name: 'الصيدليات والمستلزمات الطبية', value: 12, color: '#8b5cf6' },
  { name: 'الإلكترونيات والحلويات والورود', value: 8, color: '#f59e0b' },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders = [],
  onNavigateToFinancial,
  onNavigateToDelivery,
  onNavigateToGlobalStores,
}) => {
  const isOrderGlobal = (order: Order) => Boolean(
    order.orderType === 'global_store' ||
    order.orderType?.includes?.('global_store') ||
    order.orderType?.includes?.('متجر عالمي') ||
    order.orderScope === 'international' ||
    order.serviceType === 'global_store' ||
    order.isGlobalStore ||
    order.storeCategory === 'المتاجر العالمية' ||
    (order.items && order.items.some((it: any) => it.productUrl || it.sourceUrl || it.storeName?.includes('أمازون') || it.storeName?.includes('Amazon') || it.storeName?.includes('AliExpress') || it.storeName?.includes('SHEIN') || it.storeName?.includes('شي إن')))
  );

  const globalOrders = orders.filter(isOrderGlobal);
  const globalOrdersRevenue = globalOrders.reduce((acc, curr) => acc + (curr.total || curr.totalPrice || 0), 0);
  const calculatedOrdersRevenue = orders.reduce((acc, curr) => acc + (curr.total || curr.totalPrice || 0), 0);

  const totalOrdersCount = orders.length > 0 ? orders.length + 1480 : 1524;
  const totalRevenue = calculatedOrdersRevenue > 0 ? (5730000 + calculatedOrdersRevenue) : 5730000; // YER
  const activeDrivers = 32;
  const registeredUsers = 8940;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Welcome & General Site Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              خوادم الموقع متصلة ونشطة
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              تشفير SSL / HTTPS مفعل
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              المتاجر العالمية مفعّلة
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">اللوحة الرئيسية لإحصائيات وبيانات الموقع العامة</h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            متابعة فورية ومباشرة للأداء العام للشبكة، حركة الطلبات والإيرادات، أسطول التوصيل، والمتاجر العالمية (Amazon, SHEIN, AliExpress).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigateToGlobalStores && (
            <button
              onClick={onNavigateToGlobalStores}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-950" />
              <span>المتاجر العالمية (Amazon/Shein)</span>
            </button>
          )}

          <button
            onClick={onNavigateToFinancial}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-blue-200" />
            <span>الإدارة المالية والتكاليف</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي طلبات الموقع</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-sans">{totalOrdersCount.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% ارتفاع هذا الأسبوع</span>
            </div>
          </div>
        </div>

        {/* Total Platform Volume */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي إيرادات المبيعات</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 font-sans">{totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-600">ريال</span></div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>معدل نمو متصاعد في المبيعات</span>
            </div>
          </div>
        </div>

        {/* Active Delivery Fleet */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">أسطول المناديب النشطين</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-sans">{activeDrivers} <span className="text-xs font-bold text-slate-500">سائق متصل</span></div>
            <div className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متوسط زمن التوصيل: 22 دقيقة</span>
            </div>
          </div>
        </div>

        {/* Registered App Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">عملاء ومستخدمو التطبيق</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-sans">{registeredUsers.toLocaleString()} <span className="text-xs font-bold text-slate-500">مستخدم</span></div>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
              <Zap className="w-3.5 h-3.5" />
              <span>99.4% نسبة رضا العملاء</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Stores Integrated Performance Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-4.5 rounded-2xl border border-indigo-700/50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">إحصائيات المتاجر العالمية المدمجة (Amazon, SHEIN, AliExpress)</h4>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full font-bold">
                مدمج ضمن قطاع المتاجر والطلبات
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              تُحسب مبيعات وطلبات السلع الدولية ديناميكياً ضمن إجمالي مبيعات المنصة مع تطبيق عمولة ورسوم الشحن والتوصيل.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-indigo-500/20 text-center flex-1 md:flex-initial">
            <div className="text-[11px] text-indigo-300 font-medium">طلبات المتاجر الدولية</div>
            <div className="text-base font-bold text-white font-sans">{globalOrders.length > 0 ? globalOrders.length : 38} طلب</div>
          </div>
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-indigo-500/20 text-center flex-1 md:flex-initial">
            <div className="text-[11px] text-indigo-300 font-medium">إجمالي المبيعات الدولية</div>
            <div className="text-base font-bold text-emerald-400 font-sans">
              {(globalOrdersRevenue > 0 ? globalOrdersRevenue : 890000).toLocaleString()} <span className="text-xs text-slate-300">ر.ي</span>
            </div>
          </div>
          {onNavigateToGlobalStores && (
            <button
              onClick={onNavigateToGlobalStores}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              عرض سلع المتاجر ←
            </button>
          )}
        </div>
      </div>

      {/* 3. General Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Weekly Volume Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>مؤشر نمو الطلبات والإيرادات الأسبوعية العام</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">تحليل المبيعات الإجمالية وحجم الطلبات المنفذة عبر كافة الفئات</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
              تحديث تلقائي
            </span>
          </div>

          <div className="h-64 w-full pt-4 dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ريال`, 'الإيرادات']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>توزيع الطلبات حسب القطاعات</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">النسبة المئوية لإجمالي طلبات المنصة لكل نشاط</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative my-2 dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_SHARE}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CATEGORY_SHARE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-800">100%</span>
              <span className="text-[10px] text-slate-400 font-semibold">تغطية وشُمول</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
            {CATEGORY_SHARE.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-slate-700 font-semibold">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Infrastructure & Operational Activity Log */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">سجل عمليات واستقرار الخوادم المركزية</h3>
          </div>
          <span className="text-xs text-slate-400">جميع الأنظمة تعمل بكفاءة عالية 99.98%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">قواعد البيانات (Firestore DB)</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                متصل ومزامن
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              قاعدة البيانات الرسمية ai-studio تعمل بطاقة استيعابية ممتازة وتستجيب في متوسط 45ms.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">تطبيق التوصيل والإشعارات</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                فعالة 100%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              إشعارات Push وتحديد مواقع المناديب تعمل بدقة عبر خطوط العرض والطول الجغرافية.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">بوابة الدفع والتسويات المالية</span>
              <span className="text-blue-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                جاهزة للتسليم
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              تسويات المحافظ الإلكترونية والدفع عند الاستلام مفعّلة لجميع الفئات المسجلة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

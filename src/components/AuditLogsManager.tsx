import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  User, 
  Clock, 
  RefreshCw, 
  Trash2, 
  FileText, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building,
  Package,
  ShoppingBag,
  Settings
} from 'lucide-react';
import { AuditLog, AdminUser } from '../types';

interface AuditLogsManagerProps {
  logs: AuditLog[];
  isLoading: boolean;
  currentUser: AdminUser | null;
  onClearLogs?: () => Promise<void>;
  onRefreshLogs?: () => void;
}

export const AuditLogsManager: React.FC<AuditLogsManagerProps> = ({
  logs = [],
  isLoading,
  currentUser,
  onClearLogs,
  onRefreshLogs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTargetType, setSelectedTargetType] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const safeLogs = logs || [];

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return safeLogs.filter((logItem) => {
      // Severity filter
      if (selectedSeverity !== 'all' && logItem.severity !== selectedSeverity) {
        return false;
      }
      // Target Type filter
      if (selectedTargetType !== 'all' && logItem.targetType !== selectedTargetType) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const actionMatch = logItem.action?.toLowerCase().includes(term);
        const userMatch = logItem.performedBy?.toLowerCase().includes(term);
        const emailMatch = logItem.userEmail?.toLowerCase().includes(term);
        const targetMatch = logItem.targetName?.toLowerCase().includes(term);
        const detailsMatch = logItem.details?.toLowerCase().includes(term);
        if (!actionMatch && !userMatch && !emailMatch && !targetMatch && !detailsMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [safeLogs, selectedSeverity, selectedTargetType, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: safeLogs.length,
      info: safeLogs.filter(l => l.severity === 'info').length,
      warning: safeLogs.filter(l => l.severity === 'warning').length,
      error: safeLogs.filter(l => l.severity === 'error' || l.severity === 'critical').length,
    };
  }, [safeLogs]);

  const getSeverityBadge = (sev: AuditLog['severity']) => {
    switch (sev) {
      case 'critical':
      case 'error':
        return {
          label: 'خطأ / خلل فني',
          bg: 'bg-red-50 text-red-800 border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          label: 'تنبيه هامة',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: ShieldAlert,
          iconColor: 'text-amber-600'
        };
      default:
        return {
          label: 'عملية ناعمة',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: CheckCircle2,
          iconColor: 'text-blue-600'
        };
    }
  };

  const getTargetIcon = (type: AuditLog['targetType']) => {
    switch (type) {
      case 'store': return Building;
      case 'product': return Package;
      case 'order': return ShoppingBag;
      case 'user': return User;
      case 'setting': return Settings;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 shrink-0">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight">سجل العمليات ومراقبة النظام (Audit & Activity Logs)</h2>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-3 py-0.5 rounded-full border border-emerald-400/30">
                متاح للمدير العام
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تتبع زمني شامل ومباشر لجميع العمليات، التعديلات، والأحداث التي يتم تنفيذها في النظام مع تفاصيل اسم منفذ العملية وحالتها الفنية.
            </p>
          </div>
        </div>

      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>إجمالي الأحداث المسجلة</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 font-sans">{stats.total}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 text-xs mb-1 font-bold">
            <span>عمليات ناجحة اعتيادية</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-extrabold text-blue-900 font-sans">{stats.info}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1 font-bold">
            <span>تنبيهات وملاحظات</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-amber-900 font-sans">{stats.warning}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-2xs">
          <div className="flex items-center justify-between text-red-700 text-xs mb-1 font-bold">
            <span>أخطاء / مشاكل فنية ⚠️</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-extrabold text-red-900 font-sans">{stats.error}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم/اسم العملية، اسم المستخدم، البريد، أو تفاصيل الهدف..."
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

          {/* Severity & Target Type Selectors */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع مستويات الخطورة</option>
              <option value="info">عمليات ناعمة (Info)</option>
              <option value="warning">تنبيهات (Warning)</option>
              <option value="error">أخطاء ومشاكل (Error)</option>
            </select>

            <select
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأهداف</option>
              <option value="order">الطلبات</option>
              <option value="store">المتاجر</option>
              <option value="product">المنتجات</option>
              <option value="user">المستخدمين</option>
              <option value="system">النظام</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جاري قراءة سجل العمليات مباشرة من Firestore...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">لا توجد عمليات مطابقة في السجل</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            جرّب تغيير عبارة البحث أو اختيار جميع الفلاتر لاستعراض العمليات المسجلة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((logItem) => {
            const sevInfo = getSeverityBadge(logItem.severity);
            const SevIcon = sevInfo.icon;
            const TargetIcon = getTargetIcon(logItem.targetType);
            const isExpanded = expandedLogId === logItem.id;

            return (
              <div 
                key={logItem.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:border-blue-300 transition-all overflow-hidden"
              >
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : logItem.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/70"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${sevInfo.bg}`}>
                      <SevIcon className={`w-5 h-5 ${sevInfo.iconColor}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{logItem.action}</span>
                        {logItem.targetName && (
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {logItem.targetName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevInfo.bg}`}>
                          {sevInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{logItem.performedBy}</span>
                          {logItem.userEmail && <span className="text-slate-400 font-mono text-[11px]">({logItem.userEmail})</span>}
                        </span>
                        
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{logItem.createdAt ? new Date(logItem.createdAt).toLocaleString('ar-YE') : 'منذ لحظات'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                      <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 border-t border-gray-100 bg-slate-50/80 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">تفاصيل العملية / الحدث:</span>
                      <div className="p-3 bg-white rounded-xl border border-gray-200 text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                        {logItem.details || 'لا توجد تفاصيل إضافية مسجلة لهذه العملية.'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-slate-400 block">نوع المستهدف:</span>
                        <strong className="text-slate-800 uppercase">{logItem.targetType}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-slate-400 block">منفّذ العملية:</span>
                        <strong className="text-slate-800">{logItem.performedBy}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-slate-400 block">المعرّف التسلسلي:</span>
                        <strong className="text-slate-800 font-mono">{logItem.id}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

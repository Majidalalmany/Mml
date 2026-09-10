import { OrderStatus } from '../types';
import { Clock, Utensils, Truck, CheckCircle2, XCircle, RotateCcw, ClipboardCheck, CheckCheck } from 'lucide-react';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  preparing: 'قيد التحضير',
  delivering: 'قيد التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  // Backwards compatibility mappings for uppercase/legacy values
  NEW: 'جديد',
  PREPARING: 'قيد التحضير',
  DELIVERING: 'قيد التوصيل',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  delivered: 'مكتمل',
  confirmed: 'قيد التحضير',
  CONFIRMED: 'قيد التحضير',
  approved: 'قيد التحضير',
  APPROVED: 'قيد التحضير',
  pending: 'جديد',
  PENDING: 'جديد',
  pending_review: 'جديد',
  PENDING_REVIEW: 'جديد',
  returned: 'ملغي',
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  badgeClass: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  Icon: any;
}> = {
  PENDING_REVIEW: {
    label: 'قيد المراجعة وتحديد وسيلة النقل',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-300',
    Icon: ClipboardCheck
  },
  pending_review: {
    label: 'قيد المراجعة وتحديد وسيلة النقل',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-300',
    Icon: ClipboardCheck
  },
  PENDING: {
    label: 'قيد المراجعة',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-300',
    Icon: ClipboardCheck
  },
  pending: {
    label: 'قيد المراجعة',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-300',
    Icon: ClipboardCheck
  },
  CONFIRMED: {
    label: 'تم التأكيد هاتفياً',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    Icon: CheckCircle2
  },
  confirmed: {
    label: 'تم التأكيد هاتفياً',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    Icon: CheckCircle2
  },
  APPROVED: {
    label: 'معتمد / بانتظار التحضير',
    badgeClass: 'bg-teal-100 text-teal-950 border-teal-300',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    borderColor: 'border-teal-300',
    Icon: CheckCheck
  },
  approved: {
    label: 'معتمد / بانتظار التحضير',
    badgeClass: 'bg-teal-100 text-teal-950 border-teal-300',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    borderColor: 'border-teal-300',
    Icon: CheckCheck
  },
  NEW: {
    label: 'طلب جديد (NEW)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-300',
    Icon: Clock
  },
  PREPARING: {
    label: 'قيد التحضير (PREPARING)',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-300',
    Icon: Utensils
  },
  DELIVERING: {
    label: 'قيد التوصيل (DELIVERING)',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-300',
    Icon: Truck
  },
  COMPLETED: {
    label: 'تم الاستلام (COMPLETED)',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    Icon: CheckCircle2
  },
  CANCELLED: {
    label: 'تم الإلغاء (CANCELLED)',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    borderColor: 'border-red-300',
    Icon: XCircle
  },
  new: {
    label: 'طلب جديد',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-300',
    Icon: Clock
  },
  preparing: {
    label: 'قيد التحضير',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-300',
    Icon: Utensils
  },
  delivering: {
    label: 'قيد التوصيل',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-300',
    Icon: Truck
  },
  completed: {
    label: 'مكتمل / تم التسليم',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    Icon: CheckCircle2
  },
  delivered: {
    label: 'مكتمل / تم التسليم',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    Icon: CheckCircle2
  },
  cancelled: {
    label: 'تم الإلغاء',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    borderColor: 'border-red-300',
    Icon: XCircle
  },
  returned: {
    label: 'تم الإرجاع',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-400',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    borderColor: 'border-slate-300',
    Icon: RotateCcw
  }
};

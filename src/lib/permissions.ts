import { RoleType, AdminUser } from '../types';

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMap = Record<string, ModulePermission>;

export interface RoleDefinition {
  id: RoleType;
  label: string;
  description: string;
  badgeColor: string;
  defaultPermissions: PermissionMap;
}

export const ALL_MODULES = [
  { id: 'dashboard', label: 'الرئيسية والإحصائيات' },
  { id: 'restaurants', label: 'المتاجر والمطاعم والصيدليات' },
  { id: 'categories', label: 'التصنيفات الرئيسية' },
  { id: 'products', label: 'المنتجات والأصناف والأسعار' },
  { id: 'modifiers', label: 'الخيارات والإضافات (Modifiers)' },
  { id: 'offers', label: 'العروض والتخفيضات' },
  { id: 'delivery', label: 'التوصيل وسائقي الشحن' },
  { id: 'notifications', label: 'الإشعارات والتنبيهات' },
  { id: 'discounts', label: 'التخفيضات والعمولات' },
  { id: 'orders', label: 'إدارة الطلبات' },
  { id: 'reports', label: 'التقارير المالية والأداء' },
  { id: 'financial', label: 'الإدارة المالية' },
  { id: 'admin', label: 'إدارة المستخدمين والصلاحيات' },
  { id: 'payment', label: 'بوابات الدفع الإلكتروني' },
  { id: 'quality', label: 'بيانات العملاء والجودة' },
  { id: 'audit', label: 'سجل العمليات ومراقبة النظام' },
  { id: 'settings', label: 'إعدادات النظام العامة' }
];

const fullPerm = (): ModulePermission => ({ view: true, create: true, edit: true, delete: true });
const readOnlyPerm = (): ModulePermission => ({ view: true, create: false, edit: false, delete: false });
const noPerm = (): ModulePermission => ({ view: false, create: false, edit: false, delete: false });

export const ROLE_DEFINITIONS: Record<RoleType, RoleDefinition> = {
  developer: {
    id: 'developer',
    label: 'المطور (Developer)',
    description: 'صلاحية كاملة على الكود والقاعدة البيانات (دعم فني وتطوير)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    defaultPermissions: ALL_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: fullPerm() }), {})
  },

  super_admin: {
    id: 'super_admin',
    label: 'المدير (Super Admin)',
    description: 'صلاحية شاملة (إضافة/تعديل/حذف) لكل الوحدات والمستخدمين والإعدادات',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    defaultPermissions: ALL_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: fullPerm() }), {})
  },

  vice_admin: {
    id: 'vice_admin',
    label: 'نائب المدير',
    description: 'نفس صلاحيات المدير باستثناء حذف المستخدمين أو تغيير الإعدادات العامة',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultPermissions: {
      ...ALL_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: fullPerm() }), {}),
      admin: { view: true, create: true, edit: true, delete: false },
      settings: noPerm()
    }
  },

  finance_manager: {
    id: 'finance_manager',
    label: 'مدير الحسابات',
    description: 'الاطلاع والتحكم في التقارير والإدارة المالية فقط (لا يرى المتاجر أو المنتجات)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: noPerm(),
      categories: noPerm(),
      products: noPerm(),
      modifiers: noPerm(),
      offers: noPerm(),
      delivery: noPerm(),
      notifications: noPerm(),
      discounts: fullPerm(),
      orders: readOnlyPerm(),
      reports: fullPerm(),
      financial: fullPerm(),
      admin: noPerm(),
      payment: fullPerm(),
      quality: noPerm(),
      settings: noPerm()
    }
  },

  accountant: {
    id: 'accountant',
    label: 'محاسب',
    description: 'عرض الفواتير والإيرادات اليومية فقط بدون صلاحية تعديل أو حذف',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: noPerm(),
      categories: noPerm(),
      products: noPerm(),
      modifiers: noPerm(),
      offers: noPerm(),
      delivery: noPerm(),
      notifications: noPerm(),
      discounts: noPerm(),
      orders: readOnlyPerm(),
      reports: readOnlyPerm(),
      financial: readOnlyPerm(),
      admin: noPerm(),
      payment: readOnlyPerm(),
      quality: noPerm(),
      settings: noPerm()
    }
  },

  customer_service: {
    id: 'customer_service',
    label: 'خدمة العملاء',
    description: 'عرض إدارة الطلبات وجدول التوصيل لتحديث حالة الطلب فقط (لا يرى الأسعار أو المستخدمين)',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: noPerm(),
      categories: noPerm(),
      products: noPerm(),
      modifiers: noPerm(),
      offers: noPerm(),
      delivery: { view: true, create: false, edit: true, delete: false },
      notifications: noPerm(),
      discounts: noPerm(),
      orders: { view: true, create: false, edit: true, delete: false },
      reports: noPerm(),
      financial: noPerm(),
      admin: noPerm(),
      payment: noPerm(),
      quality: readOnlyPerm(),
      settings: noPerm()
    }
  },

  cs_restaurants: {
    id: 'cs_restaurants',
    label: 'خدمة عملاء ومطاعم',
    description: 'خدمة العملاء + عرض بيانات المتاجر والمطاعم والتصنيفات (بدون تعديل)',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: readOnlyPerm(),
      categories: readOnlyPerm(),
      products: readOnlyPerm(),
      modifiers: readOnlyPerm(),
      offers: noPerm(),
      delivery: { view: true, create: false, edit: true, delete: false },
      notifications: noPerm(),
      discounts: noPerm(),
      orders: { view: true, create: false, edit: true, delete: false },
      reports: noPerm(),
      financial: noPerm(),
      admin: noPerm(),
      payment: noPerm(),
      quality: readOnlyPerm(),
      settings: noPerm()
    }
  },

  stores_manager: {
    id: 'stores_manager',
    label: 'بيانات المطاعم والمتاجر',
    description: 'صلاحية كاملة على (المطاعم، التصنيفات، المنتجات، الأصناف والأسعار والخيارات)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: fullPerm(),
      categories: fullPerm(),
      products: fullPerm(),
      modifiers: fullPerm(),
      offers: readOnlyPerm(),
      delivery: noPerm(),
      notifications: noPerm(),
      discounts: noPerm(),
      orders: readOnlyPerm(),
      reports: noPerm(),
      financial: noPerm(),
      admin: noPerm(),
      payment: noPerm(),
      quality: noPerm(),
      settings: noPerm()
    }
  },

  auditor: {
    id: 'auditor',
    label: 'مراجع (Auditor)',
    description: 'صلاحية عرض فقط (قراءة) لكل شيء في النظام بدون إمكانية التعديل',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    defaultPermissions: ALL_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: readOnlyPerm() }), {})
  },

  cashier: {
    id: 'cashier',
    label: 'أمين صندوق',
    description: 'إدارة الدفع وبوابات الاسترداد والمبالغ بدون تقارير تفصيلية للمستخدمين',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: noPerm(),
      categories: noPerm(),
      products: noPerm(),
      modifiers: noPerm(),
      offers: noPerm(),
      delivery: noPerm(),
      notifications: noPerm(),
      discounts: noPerm(),
      orders: readOnlyPerm(),
      reports: noPerm(),
      financial: readOnlyPerm(),
      admin: noPerm(),
      payment: { view: true, create: true, edit: true, delete: false },
      quality: noPerm(),
      settings: noPerm()
    }
  },

  customer_data: {
    id: 'customer_data',
    label: 'بيانات العملاء',
    description: 'إدارة وتحديث بيانات وسجلات العناوين وأرقام جوالات العملاء',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: noPerm(),
      categories: noPerm(),
      products: noPerm(),
      modifiers: noPerm(),
      offers: noPerm(),
      delivery: noPerm(),
      notifications: noPerm(),
      discounts: noPerm(),
      orders: readOnlyPerm(),
      reports: noPerm(),
      financial: noPerm(),
      admin: noPerm(),
      payment: noPerm(),
      quality: fullPerm(),
      settings: noPerm()
    }
  },

  content_writer: {
    id: 'content_writer',
    label: 'كاتب محتوى',
    description: 'رفع الصور وتعديل الأوصاف والنصوص بدون صلاحية تغيير الأسعار أو حالة المتجر',
    badgeColor: 'bg-lime-100 text-lime-800 border-lime-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: { view: true, create: false, edit: true, delete: false },
      categories: { view: true, create: false, edit: true, delete: false },
      products: { view: true, create: false, edit: true, delete: false },
      modifiers: readOnlyPerm(),
      offers: readOnlyPerm(),
      delivery: noPerm(),
      notifications: noPerm(),
      discounts: noPerm(),
      orders: noPerm(),
      reports: noPerm(),
      financial: noPerm(),
      admin: noPerm(),
      payment: noPerm(),
      quality: noPerm(),
      settings: noPerm()
    }
  },

  content_office: {
    id: 'content_office',
    label: 'مكتب محتوى وإعلانات',
    description: 'إدارة العروض والتخفيضات والمنشورات والإشعارات والتنبيهات',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    defaultPermissions: {
      dashboard: readOnlyPerm(),
      restaurants: readOnlyPerm(),
      categories: readOnlyPerm(),
      products: readOnlyPerm(),
      modifiers: readOnlyPerm(),
      offers: fullPerm(),
      delivery: noPerm(),
      notifications: fullPerm(),
      discounts: fullPerm(),
      orders: noPerm(),
      reports: noPerm(),
      financial: noPerm(),
      admin: noPerm(),
      payment: noPerm(),
      quality: noPerm(),
      settings: noPerm()
    }
  },

  custom: {
    id: 'custom',
    label: 'صلاحية مخصصة دقيقة',
    description: 'تحديد صلاحيات جراحية مخصصة لكل زر في القائمة الجانبية',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    defaultPermissions: ALL_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: readOnlyPerm() }), {})
  }
};

export function hasModulePermission(
  userOrPermissions: AdminUser | PermissionMap | undefined | null,
  roleOrModuleId: RoleType | string | undefined,
  moduleIdOrAction?: string | 'view' | 'create' | 'edit' | 'delete',
  actionArg: 'view' | 'create' | 'edit' | 'delete' = 'view'
): boolean {
  // Check if first argument is an AdminUser object
  if (userOrPermissions && typeof userOrPermissions === 'object' && 'role' in userOrPermissions) {
    const user = userOrPermissions as AdminUser;
    const moduleId = roleOrModuleId as string;
    const action = (moduleIdOrAction as 'view' | 'create' | 'edit' | 'delete') || 'view';

    // Super Admin, Developer, or admin@gmail.com always gets 100% full unrestricted permission!
    if (user.role === 'super_admin' || user.role === 'developer' || user.email === 'admin@gmail.com') {
      return true;
    }

    if (user.permissions && user.permissions[moduleId]) {
      return !!user.permissions[moduleId][action];
    }

    const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.custom;
    if (roleDef.defaultPermissions && roleDef.defaultPermissions[moduleId]) {
      return !!roleDef.defaultPermissions[moduleId][action];
    }
    return false;
  }

  // Fallback signature: (userPermissions, role, moduleId, action)
  const permissions = userOrPermissions as PermissionMap | undefined;
  const role = roleOrModuleId as RoleType | undefined;
  const moduleId = moduleIdOrAction as string;
  const action = actionArg;

  if (role === 'super_admin' || role === 'developer') return true;

  if (permissions && permissions[moduleId]) {
    return !!permissions[moduleId][action];
  }

  const roleDef = role ? ROLE_DEFINITIONS[role] : ROLE_DEFINITIONS.custom;
  if (roleDef && roleDef.defaultPermissions && roleDef.defaultPermissions[moduleId]) {
    return !!roleDef.defaultPermissions[moduleId][action];
  }

  return false;
}

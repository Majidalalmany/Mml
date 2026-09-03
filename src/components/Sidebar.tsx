import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Tag, 
  Package, 
  Sliders, 
  Store as StoreIcon, 
  Gift, 
  Truck, 
  Bell, 
  Percent, 
  ShoppingBag, 
  FileText,
  ShieldCheck, 
  BarChart3, 
  DollarSign, 
  UserCheck, 
  CreditCard, 
  Settings,
  ChevronLeft,
  ChevronDown,
  X,
  Users,
  Activity,
  Plus,
  PlusCircle,
  FolderPlus,
  Layers,
  Globe
} from 'lucide-react';
import { TabType, AdminUser, Category, Store } from '../types';
import { hasModulePermission, ROLE_DEFINITIONS } from '../lib/permissions';
import { getAllServiceCategories, getCategoryImageUrl } from '../lib/categoryUtils';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedCategoryFilter?: string;
  onSelectCategory?: (categoryFilter: string) => void;
  onAddService?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  productsCount: number;
  categoriesCount: number;
  categories?: Category[];
  stores?: Store[];
  currentUser: AdminUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedCategoryFilter = 'all',
  onSelectCategory,
  onAddService,
  isOpen,
  setIsOpen,
  productsCount,
  categoriesCount,
  categories = [],
  stores = [],
  currentUser
}) => {
  const [isServicesExpanded, setIsServicesExpanded] = useState<boolean>(true);
  const allCategoriesList = getAllServiceCategories(categories, stores);

  const allNavItems = [
    { id: 'dashboard' as TabType, label: 'الرئيسية (إحصائيات الموقع)', icon: LayoutDashboard },
    { id: 'global_stores' as TabType, label: 'المتاجر العالمية (Amazon/Shein)', icon: Globe, highlight: true },
    { id: 'categories' as TabType, label: 'إدارة الفئات والخدمات', icon: Layers, count: categories.length, highlight: true },
    { id: 'restaurants' as TabType, label: 'المتاجر والأنشطة التجارية', icon: StoreIcon, count: stores.length, hasSubMenu: true },
    { id: 'delivery' as TabType, label: 'خريطة المندوبين المباشرة', icon: Truck, highlight: true },
    { id: 'offers' as TabType, label: 'العروض والإعلانات', icon: Gift },
    { id: 'fazaa' as TabType, label: 'أسطول وطلبات فزعة', icon: Truck },
    { id: 'customers' as TabType, label: 'حسابات عملاء التطبيق', icon: Users },
    { id: 'notifications' as TabType, label: 'التنبيهات والإشعارات', icon: Bell },
    { id: 'discounts' as TabType, label: 'التخفيضات والعمولات', icon: Percent },
    { id: 'orders' as TabType, label: 'إدارة الطلبات', icon: ShoppingBag },
    { id: 'invoices' as TabType, label: 'صور وفواتير المندوبين', icon: FileText, highlight: true },
    { id: 'financial' as TabType, label: 'الإدارة المالية', icon: DollarSign },
    { id: 'quality' as TabType, label: 'بيانات العملاء للجودة', icon: Users },
    { id: 'payment' as TabType, label: 'الدفع الإلكتروني', icon: CreditCard },
    { id: 'audit' as TabType, label: 'سجل العمليات والمراقبة', icon: Activity },
    { id: 'admin' as TabType, label: 'الإدارة والأدوار', icon: UserCheck },
    { id: 'settings' as TabType, label: 'إعدادات النظام', icon: Settings }
  ];

  // Filter items based on current user permissions
  const visibleItems = allNavItems.filter((item) => {
    if (!currentUser) return true; // Show all if no user
    return hasModulePermission(currentUser.permissions, currentUser.role, item.id, 'view');
  });

  const roleDef = currentUser ? (ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.custom) : null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 right-0 h-full w-64 bg-white text-slate-700 z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-sm border-l border-gray-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } md:static md:z-auto shrink-0`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <div className="w-4 h-4 border-2 border-white rounded-xs" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 font-sans">جاهز</h1>
              <span className="text-[10px] text-blue-600 block font-medium">نظام الإدارة الموحد</span>
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Profile Badge Header in Sidebar */}
        {currentUser && roleDef && (
          <div className="p-3 bg-blue-50/50 border-b border-blue-100/80 mx-2 my-2 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 border text-[10px] px-2 py-0.5 rounded-full font-bold ${roleDef.badgeColor}`}>
                <ShieldCheck className="w-3 h-3" />
                {roleDef.label}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                مفعل
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar">
          {visibleItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              لا توجد وحدات مسموحة لهذا الدور.
            </div>
          ) : (
            visibleItems.map((item) => {
              const Icon = item.icon;
              const isGlobalTabActive = (activeTab === 'global_stores') || (activeTab === 'restaurants' && (selectedCategoryFilter === 'cat-global' || selectedCategoryFilter === 'global' || selectedCategoryFilter === 'المتاجر العالمية'));
              const isActive = item.id === 'global_stores' ? isGlobalTabActive : (activeTab === item.id);

              // Special routing for Global Stores item to navigate to StoresManager with cat-global filter
              if (item.id === 'global_stores') {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory('cat-global');
                      }
                      setActiveTab('restaurants');
                      setIsServicesExpanded(true);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs' 
                        : 'text-slate-600 hover:bg-gray-50 hover:text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-indigo-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        دولي
                      </span>
                      {item.highlight && !isActive && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              }

              if (item.id === 'restaurants') {
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('restaurants');
                        setIsServicesExpanded(!isServicesExpanded);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 font-bold' 
                          : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.count !== undefined && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-sans font-semibold ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600'
                          }`}>
                            {item.count}
                          </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isServicesExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                      </div>
                    </button>

                    {/* Sub-menu Dropdown List */}
                    {isServicesExpanded && (
                      <div className="pr-4 pl-1 pt-1 pb-1 space-y-0.5 border-r-2 border-blue-200 mr-3">
                        {allCategoriesList.map((sub) => {
                          const isSubActive = isActive && (
                            selectedCategoryFilter === sub.id || 
                            selectedCategoryFilter === sub.label ||
                            sub.keywords.some(kw => selectedCategoryFilter === kw)
                          );
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                if (onSelectCategory) {
                                  onSelectCategory(sub.id);
                                }
                                setActiveTab('restaurants');
                                if (window.innerWidth < 1024) setIsOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-right ${
                                isSubActive
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              <img 
                                src={getCategoryImageUrl(sub, sub.label)} 
                                alt={sub.label} 
                                className="w-5 h-5 rounded-md object-cover shrink-0 border border-gray-200" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="truncate flex-1">{sub.label}</span>
                            </button>
                          );
                        })}

                        {/* REQUIREMENT 3: LAST OPTION IN SERVICES DROPDOWN: + إضافة خدمة جديدة */}
                        <button
                          onClick={() => {
                            if (onAddService) {
                              onAddService();
                            }
                            if (window.innerWidth < 1024) setIsOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all text-right shadow-2xs cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate flex-1">+ إضافة خدمة جديدة</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-bold' 
                      : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.count !== undefined && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-sans font-semibold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                    {item.highlight && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                    <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isActive ? 'rotate-90 text-blue-600' : ''}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-white border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500 text-[11px]">Firestore Connected</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">SSL v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
};


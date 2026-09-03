import React from 'react';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Pill, 
  Shirt, 
  Tv, 
  Cake, 
  Apple, 
  Flame, 
  Coffee, 
  Store, 
  Tag, 
  Pizza, 
  Briefcase, 
  Footprints, 
  Package, 
  Gift, 
  Watch, 
  Glasses, 
  Car, 
  Scissors, 
  Sparkles,
  Layers,
  Folder,
  Globe,
  LucideIcon
} from 'lucide-react';
import { Category } from '../types';
import { normalizeArabicText, sanitizeText, generateSecureId } from './securityUtils';

export interface ServiceCategoryDef {
  id: string;
  label: string;
  icon: string; // Lucide icon identifier key (e.g., 'UtensilsCrossed', 'ShoppingBag', 'Shirt', etc.)
  keywords: string[];
  color: string;
  description: string;
  serviceType: 'restaurant' | 'clothing' | 'supermarket' | 'default';
}

/**
 * Standard Lucide Icon mapping for all application categories and activities
 */
export const CATEGORY_LUCIDE_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingBag,
  Pill,
  Shirt,
  Tv,
  Cake,
  Apple,
  Flame,
  Coffee,
  Store,
  Tag,
  Pizza,
  Briefcase,
  Footprints,
  Package,
  Gift,
  Watch,
  Glasses,
  Car,
  Scissors,
  Sparkles,
  Layers,
  Folder,
  Globe
};

/**
 * Resolves icon string to a valid Lucide icon key, with 'Tag' as safe fallback
 */
export function resolveCategoryIconKey(icon?: string): string {
  if (!icon || !icon.trim()) return 'Tag';
  const clean = sanitizeText(icon.trim());
  if (CATEGORY_LUCIDE_MAP[clean]) return clean;

  // Keyword-based fallback if someone passes a descriptive name or old key
  const lower = clean.toLowerCase();
  if (lower.includes('globe') || lower.includes('عالم') || lower.includes('دولي') || lower.includes('amazon') || lower.includes('shein') || lower.includes('aliexpress')) return 'Globe';
  if (lower.includes('bag') || lower.includes('حقائب') || lower.includes('شنط')) return 'Briefcase';
  if (lower.includes('shoe') || lower.includes('أحذية') || lower.includes('جزم')) return 'Footprints';
  if (lower.includes('shirt') || lower.includes('ملابس') || lower.includes('أزياء')) return 'Shirt';
  if (lower.includes('super') || lower.includes('بقالة') || lower.includes('تموين')) return 'ShoppingBag';
  if (lower.includes('food') || lower.includes('مطعم') || lower.includes('وجبات')) return 'UtensilsCrossed';
  if (lower.includes('pill') || lower.includes('صيدل') || lower.includes('علاج')) return 'Pill';
  if (lower.includes('tv') || lower.includes('إلكترون') || lower.includes('جوال')) return 'Tv';
  if (lower.includes('cake') || lower.includes('حلويات') || lower.includes('مخبز')) return 'Cake';
  if (lower.includes('apple') || lower.includes('عصير') || lower.includes('مرطبات')) return 'Apple';
  if (lower.includes('flame') || lower.includes('بهارات') || lower.includes('مشاوي')) return 'Flame';
  if (lower.includes('coffee') || lower.includes('قهوة') || lower.includes('كافيه')) return 'Coffee';
  if (lower.includes('gift') || lower.includes('هدايا') || lower.includes('ورد')) return 'Gift';
  if (lower.includes('watch') || lower.includes('ساعات')) return 'Watch';
  if (lower.includes('glasses') || lower.includes('بصريات')) return 'Glasses';
  if (lower.includes('car') || lower.includes('سيارات') || lower.includes('توصيل')) return 'Car';
  if (lower.includes('scissors') || lower.includes('خياطة')) return 'Scissors';
  if (lower.includes('sparkles') || lower.includes('عطور') || lower.includes('تجميل')) return 'Sparkles';

  return 'Tag';
}

/**
 * Returns the React Lucide icon component safely
 */
export function getCategoryLucideComponent(iconName?: string): LucideIcon {
  const key = resolveCategoryIconKey(iconName);
  return CATEGORY_LUCIDE_MAP[key] || Tag;
}

/**
 * Helper React Component to render any Category Vector Icon safely
 */
export const CategoryVectorIcon: React.FC<{ icon?: string; className?: string }> = ({ 
  icon, 
  className = "w-4 h-4" 
}) => {
  const IconComp = getCategoryLucideComponent(icon);
  return React.createElement(IconComp, { className });
};

/**
 * Standard Canonical Categories (Single source of truth matching initial database, without any emojis)
 */
export const CANONICAL_CATEGORIES: ServiceCategoryDef[] = [
  {
    id: 'cat-1',
    label: 'محلات عصائر ومرطبات',
    icon: 'Apple',
    keywords: ['عصير', 'عصائر', 'مرطبات', 'كوكتيل', 'آيس كريم', 'ميلك شيك', 'سموذي', 'مشروبات'],
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'إدارة محلات العصائر الطبيعية الطازجة، الكوكتيلات والمشروبات الباردة والساخنة',
    serviceType: 'restaurant'
  },
  {
    id: 'cat-2',
    label: 'سوبرماركت وبقالة',
    icon: 'ShoppingBag',
    keywords: ['سوبر', 'سوبرماركت', 'بقالة', 'تموينات', 'ماركت', 'غذائية', 'تموين'],
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'إدارة مراكز التموين، السوبرماركت والمواد الغذائية والاحتياجات اليومية',
    serviceType: 'supermarket'
  },
  {
    id: 'cat-3',
    label: 'محلات ملابس وموضة',
    icon: 'Shirt',
    keywords: ['ملابس', 'موضة', 'أزياء', 'فستان', 'بوتيك', 'قميص', 'بنطلون', 'أناقة', 'رجالي', 'نسائي', 'أطفال', 'عباية', 'فاشن'],
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'إدارة محلات الملابس، الأزياء الراقية، البوتيكات والفساتين',
    serviceType: 'clothing'
  },
  {
    id: 'cat-4',
    label: 'مطاعم ومقاهي',
    icon: 'UtensilsCrossed',
    keywords: ['مطعم', 'مطاعم', 'وجبة', 'وجبات', 'مأكولات', 'سريعة', 'برجر', 'شيباني', 'بيك', 'مقاهي', 'شعبية', 'مشويات', 'فحسة', 'سلتة', 'كافيه'],
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'إدارة واستعراض جميع المطاعم، محلات البرجر، الوجبات السريعة والمأكولات الشعبية',
    serviceType: 'restaurant'
  },
  {
    id: 'cat-5',
    label: 'مخابز وحلويات',
    icon: 'Cake',
    keywords: ['حلو', 'حلويات', 'مخبز', 'مخابز', 'كيك', 'معجنات', 'بقلاوة', 'تورتة', 'معمول'],
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    description: 'إدارة المخابز، المخبوزات الطازجة، الحلويات الشرقية وكيك المناسبات',
    serviceType: 'restaurant'
  },
  {
    id: 'cat-6',
    label: 'صيدليات ومستلزمات طبية',
    icon: 'Pill',
    keywords: ['صيدل', 'صيدلية', 'صيدليات', 'طب', 'دواء', 'علاج', 'مستلزمات', 'صحية', 'فيتامين'],
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'إدارة وتصفح الصيدليات المعتمدة وتوفير المستلزمات والأدوية الطارئة',
    serviceType: 'default'
  },
  {
    id: 'cat-7',
    label: 'إلكترونيات وجوالات',
    icon: 'Tv',
    keywords: ['إلكترون', 'إلكترونيات', 'جوال', 'هاتف', 'أجهزة', 'شواحن', 'سماعات', 'كمبيوتر'],
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'إدارة محلات الهواتف الذكية، الأجهزة الإلكترونية والملحقات الأصلية',
    serviceType: 'default'
  },
  {
    id: 'cat-8',
    label: 'بهارات وعطارة',
    icon: 'Flame',
    keywords: ['بهار', 'بهارات', 'عطارة', 'قهوة', 'توابل', 'مكسرات', 'عسل', 'بخور', 'حبوب'],
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'إدارة محلات العطارة، القهوة اليمنية الأصيلة، التوابل والمكسرات',
    serviceType: 'default'
  },
  {
    id: 'cat-global',
    label: 'المتاجر العالمية',
    icon: 'Globe',
    keywords: ['عالمي', 'عالمية', 'متاجر عالمية', 'أمازون', 'شي إن', 'علي إكسبريس', 'نون', 'amazon', 'shein', 'aliexpress', 'noon', 'global', 'شحن دولي', 'تسوق دولي', 'شراء دولي'],
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'إدارة واستعراض المتاجر العالمية المعتمدة وطلبات الشحن والتسوق الدولي المباشر (Amazon, SHEIN, AliExpress)',
    serviceType: 'default'
  }
];

export const SERVICE_CATEGORIES = CANONICAL_CATEGORIES;

/**
 * Returns all active service categories dynamically merged and strictly deduplicated by ID and normalized slug.
 */
export function getAllServiceCategories(
  categories: Category[] = [],
  stores: { categoryId?: string; categoryName?: string; activityType?: string }[] = []
): ServiceCategoryDef[] {
  const result: ServiceCategoryDef[] = [];
  const seenIds = new Set<string>();
  const seenNormalizedSlugs = new Set<string>();

  const makeSlug = (text: string) => {
    return normalizeArabicText(text).toLowerCase().replace(/[\s\-_]+/g, '');
  };

  // Helper to append a category safely
  const appendCategory = (
    id: string,
    label: string,
    icon: string,
    description?: string,
    serviceType?: 'restaurant' | 'clothing' | 'supermarket' | 'default',
    color?: string
  ) => {
    const cleanLabel = sanitizeText(label);
    if (!cleanLabel) return;

    const slug = makeSlug(cleanLabel);
    const cleanId = (id || '').trim().toLowerCase();

    if (seenIds.has(cleanId) || seenNormalizedSlugs.has(slug)) {
      return;
    }

    const secureId = cleanId || generateSecureId('cat');
    const resolvedIconKey = resolveCategoryIconKey(icon);
    const resolvedType = serviceType || inferCategoryServiceType(cleanLabel);

    result.push({
      id: secureId,
      label: cleanLabel,
      icon: resolvedIconKey,
      keywords: [slug, cleanLabel.toLowerCase()],
      color: color || getCategoryColor(resolvedType),
      description: description ? sanitizeText(description) : `إدارة واستعراض محلات وأنشطة قسم ${cleanLabel}`,
      serviceType: resolvedType
    });

    seenIds.add(secureId.toLowerCase());
    seenNormalizedSlugs.add(slug);
  };

  // 1. Process Database / State Categories first
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      const rawLabel = cat.name || cat.label || cat.serviceName || '';
      const resolvedType = (cat.serviceType === 'restaurant' || cat.serviceType === 'clothing' || cat.serviceType === 'supermarket')
        ? cat.serviceType
        : 'default';
      appendCategory(
        cat.id,
        rawLabel,
        cat.icon || 'Tag',
        cat.description,
        resolvedType,
        undefined
      );
    }
  }

  // 1b. Process LocalStorage custom categories
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const customLocal = JSON.parse(localStorage.getItem('jahez_custom_categories') || '[]');
      if (Array.isArray(customLocal)) {
        for (const localCat of customLocal) {
          const rawLabel = localCat.name || localCat.label || localCat.serviceName || '';
          if (rawLabel) {
            appendCategory(
              localCat.id,
              rawLabel,
              localCat.icon || 'Tag',
              localCat.description,
              localCat.serviceType,
              undefined
            );
          }
        }
      }
    }
  } catch (e) {
    // Ignore localStorage read errors
  }

  // 2. Fallback to Canonical Base Categories if empty or to ensure standard sections exist
  for (const canonical of CANONICAL_CATEGORIES) {
    const slug = makeSlug(canonical.label);
    if (!seenNormalizedSlugs.has(slug) && !seenIds.has(canonical.id.toLowerCase())) {
      appendCategory(
        canonical.id,
        canonical.label,
        canonical.icon,
        canonical.description,
        canonical.serviceType,
        canonical.color
      );
    }
  }

  // 3. Process any extra dynamic store activity types
  for (const store of stores) {
    const rawName = store.activityType || store.categoryName || '';
    if (!rawName) continue;
    const slug = makeSlug(rawName);
    if (!seenNormalizedSlugs.has(slug)) {
      const generatedId = store.categoryId || `cat_${slug.slice(0, 12)}`;
      appendCategory(
        generatedId,
        rawName,
        'Store',
        `إدارة محلات وأنشطة ${rawName}`,
        'default',
        'bg-slate-50 text-slate-700 border-slate-200'
      );
    }
  }

  return result;
}

function getCategoryColor(type: 'restaurant' | 'clothing' | 'supermarket' | 'default'): string {
  switch (type) {
    case 'restaurant': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'clothing': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'supermarket': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-sky-50 text-sky-700 border-sky-200';
  }
}

/**
 * Infer serviceType strictly.
 * New custom categories (e.g. 'الحقائب والأحذية', 'عطور', 'إلكترونيات') strictly default to 'default'.
 */
function inferCategoryServiceType(categoryName: string): 'restaurant' | 'clothing' | 'supermarket' | 'default' {
  const norm = normalizeArabicText(categoryName).toLowerCase();
  
  if (
    norm.includes('مطعم') || 
    norm.includes('مطاعم') || 
    norm.includes('وجبات') || 
    norm.includes('برجر') || 
    norm.includes('مشويات') ||
    norm.includes('عصائر') ||
    norm.includes('مرطبات') ||
    norm.includes('مخبز') ||
    norm.includes('حلويات')
  ) {
    return 'restaurant';
  }

  if (
    norm.includes('ملابس') || 
    norm.includes('أزياء') || 
    norm.includes('بوتيك') || 
    norm.includes('فساتين') ||
    norm.includes('عبايات')
  ) {
    return 'clothing';
  }

  if (
    norm.includes('سوبرماركت') || 
    norm.includes('بقالة') || 
    norm.includes('تموينات')
  ) {
    return 'supermarket';
  }

  // Strictly default to Generic Form
  return 'default';
}

export function findServiceCategory(
  filterOrName?: string,
  categories: Category[] = []
): ServiceCategoryDef | undefined {
  if (!filterOrName || filterOrName === 'all') return undefined;
  const term = sanitizeText(filterOrName).toLowerCase();
  const normalizedTerm = normalizeArabicText(filterOrName);
  const allCategories = getAllServiceCategories(categories);

  // 1. Direct match by ID
  let match = allCategories.find(sc => sc.id.toLowerCase() === term);
  if (match) return match;

  // 2. Match by normalized label
  match = allCategories.find(sc => normalizeArabicText(sc.label) === normalizedTerm);
  if (match) return match;

  // 3. Match by keywords
  match = allCategories.find(sc => 
    sc.keywords.some(kw => normalizeArabicText(kw) === normalizedTerm || kw.includes(term) || term.includes(kw))
  );
  if (match) return match;

  // 4. Dynamic match for any custom created category to completely prevent fallback/reset to default
  const cleanLabel = sanitizeText(filterOrName);
  const resolvedType = inferCategoryServiceType(cleanLabel);
  return {
    id: filterOrName,
    label: cleanLabel,
    icon: resolveCategoryIconKey(cleanLabel),
    keywords: [cleanLabel.toLowerCase(), normalizedTerm],
    color: getCategoryColor(resolvedType),
    description: `إدارة واستعراض محلات وأنشطة قسم ${cleanLabel}`,
    serviceType: resolvedType
  };
}

export function isStoreInServiceCategory(
  store: { 
    categoryId?: string; 
    categoryName?: string; 
    activityType?: string;
    isGlobalStore?: boolean;
    storeType?: string;
    serviceType?: string;
  },
  serviceFilter?: string,
  categories: Category[] = []
): boolean {
  if (!serviceFilter || serviceFilter === 'all') return true;

  const filterLower = (serviceFilter || '').toLowerCase();
  const isGlobalFilter = 
    filterLower === 'cat-global' || 
    filterLower === 'global' || 
    filterLower === 'global_stores' || 
    serviceFilter === 'المتاجر العالمية' ||
    normalizeArabicText(serviceFilter || '') === normalizeArabicText('المتاجر العالمية');

  const isStoreGlobal = Boolean(
    store.isGlobalStore ||
    store.storeType === 'global' ||
    (store.categoryId && (store.categoryId.toLowerCase() === 'cat-global' || store.categoryId.toLowerCase() === 'global')) ||
    store.serviceType === 'global' ||
    (store.categoryName && (store.categoryName.includes('عالمي') || store.categoryName.toLowerCase().includes('global'))) ||
    (store.activityType && (store.activityType.includes('عالمي') || store.activityType.toLowerCase().includes('global')))
  );

  // If the filter specifically requested global stores
  if (isGlobalFilter) {
    return isStoreGlobal;
  }

  // If the store is a global store, it should only appear when the filter is 'all' or 'cat-global'
  if (isStoreGlobal) {
    return false;
  }

  const servDef = findServiceCategory(serviceFilter, categories);
  
  const actName = sanitizeText(store.activityType || store.categoryName || '');
  const catId = (store.categoryId || '').toLowerCase();
  const normalizedAct = normalizeArabicText(actName);
  const normalizedFilter = normalizeArabicText(serviceFilter);

  if (servDef) {
    if (catId === servDef.id.toLowerCase()) return true;
    if (normalizedAct === normalizeArabicText(servDef.label)) return true;
    if (servDef.keywords.some(kw => normalizedAct.includes(normalizeArabicText(kw)))) return true;
  }

  return normalizedAct.includes(normalizedFilter) || catId === serviceFilter.toLowerCase();
}

/**
 * Determines which specialized product form layout to render.
 * Critical Rule: Custom/New Categories (like 'الحقائب والأحذية') strictly route to 'default' (النموذج القياسي الافتراضي للمنتجات)
 * and NEVER default to restaurants!
 */
export function getProductFormType(
  categoryId?: string,
  categoryName?: string,
  categories: Category[] = []
): 'restaurant' | 'clothing' | 'supermarket' | 'default' {
  const cleanCatName = sanitizeText(categoryName || '');
  const normName = normalizeArabicText(cleanCatName).toLowerCase();
  const catId = (categoryId || '').toLowerCase();

  // Check Category object in db/state if it explicitly defines serviceType
  const catObj = categories.find(c => c.id === categoryId || normalizeArabicText(c.name) === normName);
  if (catObj && catObj.serviceType) {
    if (catObj.serviceType === 'restaurant' || catObj.serviceType === 'clothing' || catObj.serviceType === 'supermarket') {
      return catObj.serviceType;
    }
  }

  // Exact ID checks for pre-defined services
  if (catId === 'cat-1' || catId === 'cat-4' || catId === 'cat-5' || catId === 'restaurants' || catId === 'juices' || catId === 'sweets' || catId === 'meats') {
    return 'restaurant';
  }
  if (catId === 'cat-3' || catId === 'fashion') {
    return 'clothing';
  }
  if (catId === 'cat-2' || catId === 'supermarkets') {
    return 'supermarket';
  }

  // Specific restaurant keywords
  if (
    normName.includes('مطعم') || 
    normName.includes('مطاعم') || 
    normName.includes('وجبات سريعه') || 
    normName.includes('مشويات') || 
    normName.includes('برجر') ||
    normName.includes('مشروبات') ||
    normName.includes('عصائر') ||
    normName.includes('مخبز') ||
    normName.includes('حلويات')
  ) {
    return 'restaurant';
  }

  // Specific clothing/fashion keywords
  if (
    normName === 'ملابس' || 
    normName === 'محلات ملابس وموضة' ||
    normName.includes('ازياء') || 
    normName.includes('بوتيك') || 
    normName.includes('فساتين') ||
    normName.includes('عبايات')
  ) {
    return 'clothing';
  }

  // Specific grocery/supermarket keywords
  if (
    normName.includes('سوبرماركت') || 
    normName.includes('بقاله') || 
    normName.includes('تموينات')
  ) {
    return 'supermarket';
  }

  // ALL other categories (including Bags & Footwear, Electronics, Accessories, Pharmacies, Custom Categories)
  // strictly route to the DEFAULT GENERIC FORM.
  return 'default';
}

export const CATEGORY_DEFAULT_LOGOS: Record<string, string> = {
  'المطاعم والوجبات السريعة': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'مطاعم ومقاهي': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'المطاعم': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'مشاريع منزلية': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  'الملابس والموضة': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  'محلات ملابس وموضة': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  'محلات عصائر ومرطبات': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  'آيس كريم وعصائر': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  'الصيدليات والمستلزمات الطبية': 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=600&q=80',
  'صيدليات ومستلزمات طبية': 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=600&q=80',
  'السوبرماركت والتموينات': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  'سوبرماركت وبقالة': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  'السوبر ماركت': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  'الإلكترونيات والهواتف': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
  'إلكترونيات وجوالات': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
  'البهارات والمكسرات والقهوة': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  'بهارات وعطارة': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  'الورود والهدايا': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
  'عطور ومستحضرات تجميل': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
  'الحلويات والمخبوزات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  'مخابز وحلويات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  'اللحوم والأسماك الطازجة': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
  'محلات الحقائب والأحذية': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
  'المتاجر العالمية': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
  'المتاجر العالمية (Amazon/Shein)': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80'
};

export const CATEGORY_DEFAULT_SUBTITLES: Record<string, string> = {
  'المتاجر العالمية': 'تسوق وشحن دولي مباشر ومضمون (Amazon, SHEIN, AliExpress)',
  'المطاعم': 'أشهى الأطباق من مطاعمك المفضلة',
  'مطاعم ومقاهي': 'أشهى الأطباق من مطاعمك المفضلة',
  'المطاعم والوجبات السريعة': 'أشهى الأطباق من مطاعمك المفضلة',
  'مشاريع منزلية': 'أكل بيتي بطعم الحب والمذاق',
  'السوبر ماركت': 'كل احتياجاتك من مكان واحد',
  'سوبرماركت وبقالة': 'كل احتياجاتك من مكان واحد',
  'السوبرماركت والتموينات': 'كل احتياجاتك من مكان واحد',
  'آيس كريم وعصائر': 'انتعاش ولذة في كل لحظة',
  'محلات عصائر ومرطبات': 'انتعاش ولذة في كل لحظة',
  'صيدليات ومستلزمات طبية': 'رعاية صحية وتوصيل علاجي آمن',
  'الصيدليات والمستلزمات الطبية': 'رعاية صحية وتوصيل علاجي آمن',
  'محلات ملابس وموضة': 'أحدث صيحات الموضة والأزياء الراقية',
  'الملابس والموضة': 'أحدث صيحات الموضة والأزياء الراقية',
  'إلكترونيات وجوالات': 'أجهزة ذكية وملحقات أصلية',
  'عطور ومستحضرات تجميل': 'أرقى العطور ومستحضرات الجمال',
  'مخابز وحلويات': 'مخبوزات طازجة وحلويات مميزة',
  'بهارات وعطارة': 'توابل يمنية أصيلة ونكهات تراثية',
  'محلات الحقائب والأحذية': 'أحدث موديلات الحقائب والأحذية الجلدية'
};

export const DEFAULT_STORE_LOGO = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
export const DEFAULT_CATEGORY_BANNER = 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80';

export function getCategoryImageUrl(
  category?: Partial<Category> | null,
  categoryName?: string,
  categories: Category[] = []
): string {
  if (category) {
    if (category.imageUrl && category.imageUrl.trim()) return category.imageUrl.trim();
    if (category.categoryImageUrl && category.categoryImageUrl.trim()) return category.categoryImageUrl.trim();
    if (category.category_image_url && category.category_image_url.trim()) return category.category_image_url.trim();
    if (category.coverUrl && category.coverUrl.trim()) return category.coverUrl.trim();
  }

  const name = (category?.name || categoryName || '').trim();
  if (name && CATEGORY_DEFAULT_LOGOS[name]) {
    return CATEGORY_DEFAULT_LOGOS[name];
  }

  // Keyword lookup
  const norm = normalizeArabicText(name).toLowerCase();
  if (norm.includes('مطعم') || norm.includes('برجر') || norm.includes('وجب')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
  }
  if (norm.includes('منزل') || norm.includes('بيتي') || norm.includes('طبخ')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  }
  if (norm.includes('سوبر') || norm.includes('بقال') || norm.includes('تموين')) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
  }
  if (norm.includes('عصير') || norm.includes('ايس كريم') || norm.includes('مرطب')) {
    return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80';
  }
  if (norm.includes('صيدل') || norm.includes('دواء') || norm.includes('طب')) {
    return 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=600&q=80';
  }
  if (norm.includes('ملابس') || norm.includes('ازياء') || norm.includes('فاشن')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80';
  }
  if (norm.includes('الكترون') || norm.includes('جوال') || norm.includes('هاتف')) {
    return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
  }

  return DEFAULT_STORE_LOGO;
}

export function getCategorySubtitle(
  category?: Partial<Category> | null,
  categoryName?: string
): string {
  if (category?.subtitle && category.subtitle.trim()) {
    return category.subtitle.trim();
  }
  if (category?.description && category.description.trim()) {
    // If description is short, use it
    if (category.description.length <= 40) return category.description.trim();
  }
  const name = (category?.name || categoryName || '').trim();
  if (name && CATEGORY_DEFAULT_SUBTITLES[name]) {
    return CATEGORY_DEFAULT_SUBTITLES[name];
  }
  const norm = normalizeArabicText(name).toLowerCase();
  if (norm.includes('مطعم') || norm.includes('برجر')) return 'أشهى الأطباق من مطاعمك المفضلة';
  if (norm.includes('منزل') || norm.includes('بيتي')) return 'أكل بيتي بطعم الحب والمذاق';
  if (norm.includes('سوبر') || norm.includes('بقال')) return 'كل احتياجاتك من مكان واحد';
  if (norm.includes('عصير') || norm.includes('ايس')) return 'انتعاش ولذة في كل لحظة';
  return 'خدمات متميزة وتوصيل سريع';
}

export function getCategoryDefaultLogo(
  categoryId?: string,
  categoryName?: string,
  categories: Category[] = []
): string {
  const category = categories.find(c => c.id === categoryId || c.name === categoryName);
  return getCategoryImageUrl(category, categoryName, categories);
}

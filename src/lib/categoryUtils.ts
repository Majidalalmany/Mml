import { Category } from '../types';

export interface ServiceCategoryDef {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  color: string;
  description: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  { 
    id: 'restaurants', 
    label: 'المطاعم والوجبات السريعة', 
    icon: '🍔', 
    keywords: ['مطعم', 'مطاعم', 'وجبة', 'وجبات', 'مأكولات', 'سريعة', 'برجر', 'شيباني', 'بيك', 'مقاهي', 'شعبية', 'مشويات', 'فحسة', 'سلتة'],
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'إدارة واستعراض جميع المطاعم، محلات البرجر، الوجبات السريعة والمأكولات الشعبية'
  },
  { 
    id: 'pharmacies', 
    label: 'الصيدليات والمستلزمات الطبية', 
    icon: '💊', 
    keywords: ['صيدل', 'صيدلية', 'صيدليات', 'طب', 'دواء', 'علاج', 'مستلزمات', 'صحية', 'فيتامين'],
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'إدارة وتصفح الصيدليات المعتمدة وتوفير المستلزمات والأدوية الطارئة'
  },
  { 
    id: 'supermarkets', 
    label: 'السوبرماركت والتموينات', 
    icon: '🛒', 
    keywords: ['سوبر', 'سوبرماركت', 'بقالة', 'تموينات', 'ماركت', 'غذائية', 'منزلية', 'خضار'],
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'إدارة مراكز التموين، السوبرماركت والمواد الغذائية والاحتياجات اليومية'
  },
  { 
    id: 'electronics', 
    label: 'الإلكترونيات والهواتف', 
    icon: '📱', 
    keywords: ['إلكترون', 'إلكترونيات', 'جوال', 'هاتف', 'أجهزة', 'شواحن', 'سماعات', 'كمبيوتر'],
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'إدارة محلات الهواتف الذكية، الأجهزة الإلكترونية والملحقات الأصلية'
  },
  { 
    id: 'spices', 
    label: 'البهارات والمكسرات والقهوة', 
    icon: '🌶️', 
    keywords: ['بهار', 'بهارات', 'عطارة', 'قهوة', 'توابل', 'مكسرات', 'عسل', 'بخور', 'حبوب'],
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'إدارة محلات العطارة، القهوة اليمنية الأصيلة، التوابل والمكسرات'
  },
  { 
    id: 'flowers', 
    label: 'الورود والهدايا', 
    icon: '🌸', 
    keywords: ['ورد', 'وردة', 'ورود', 'هدية', 'هدايا', 'زهور', 'مناسبات', 'باقات'],
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'إدارة محلات زهور الزينة، باقات الورود وتنسيق الهدايا للمناسبات'
  },
  { 
    id: 'sweets', 
    label: 'الحلويات والمخبوزات', 
    icon: '🧁', 
    keywords: ['حلو', 'حلويات', 'مخبز', 'مخابز', 'كيك', 'معجنات', 'بقلاوة', 'تورتة', 'معمول'],
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    description: 'إدارة المخابز، المخبوزات الطازجة، الحلويات الشرقية وكيك المناسبات'
  },
  { 
    id: 'meats', 
    label: 'اللحوم والأسماك الطازجة', 
    icon: '🥩', 
    keywords: ['لحم', 'لحوم', 'سمك', 'أسماك', 'دواجن', 'دجاج', 'جزارة', 'مواشي'],
    color: 'bg-red-50 text-red-700 border-red-200',
    description: 'إدارة محلات الجزارة، اللحوم البلدية والأسماك والدواجن الطازجة'
  }
];

export function findServiceCategory(filterOrName?: string): ServiceCategoryDef | undefined {
  if (!filterOrName || filterOrName === 'all') return undefined;
  const term = filterOrName.trim().toLowerCase();

  // 1. Direct match by ID
  let match = SERVICE_CATEGORIES.find(sc => sc.id.toLowerCase() === term);
  if (match) return match;

  // 2. Direct match by exact label
  match = SERVICE_CATEGORIES.find(sc => sc.label.toLowerCase() === term);
  if (match) return match;

  // 3. Keyword match
  match = SERVICE_CATEGORIES.find(sc => 
    sc.keywords.some(kw => term.includes(kw) || kw.includes(term))
  );
  if (match) return match;

  // 4. Label includes term or term includes label
  match = SERVICE_CATEGORIES.find(sc => 
    sc.label.toLowerCase().includes(term) || term.includes(sc.label.toLowerCase())
  );
  return match;
}

export function isStoreInServiceCategory(
  store: { categoryId?: string; categoryName?: string; activityType?: string },
  serviceFilter?: string
): boolean {
  if (!serviceFilter || serviceFilter === 'all') return true;
  const servDef = findServiceCategory(serviceFilter);
  
  const actName = (store.activityType || store.categoryName || '').toLowerCase();
  const catId = (store.categoryId || '').toLowerCase();

  if (servDef) {
    if (catId === servDef.id.toLowerCase()) return true;
    if (actName === servDef.label.toLowerCase()) return true;
    if (servDef.keywords.some(kw => actName.includes(kw))) return true;
  }

  // Fallback direct text comparison
  const filterLower = serviceFilter.toLowerCase();
  return actName.includes(filterLower) || catId === filterLower || filterLower.includes(actName);
}

export const CATEGORY_DEFAULT_LOGOS: Record<string, string> = {
  'المطاعم والوجبات السريعة': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  'مطاعم ومقاهي': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  'الصيدليات والمستلزمات الطبية': 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=400&q=80',
  'السوبرماركت والتموينات': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
  'الإلكترونيات والهواتف': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80',
  'البهارات والمكسرات والقهوة': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
  'الورود والهدايا': 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80',
  'الحلويات والمخبوزات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
  'اللحوم والأسماك الطازجة': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80'
};

export const DEFAULT_STORE_LOGO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';

export function getCategoryDefaultLogo(
  categoryId?: string,
  categoryName?: string,
  categories: Category[] = []
): string {
  // 1. Check Service Category definitions first
  const servDef = findServiceCategory(categoryId) || findServiceCategory(categoryName);
  if (servDef && CATEGORY_DEFAULT_LOGOS[servDef.label]) {
    return CATEGORY_DEFAULT_LOGOS[servDef.label];
  }

  // 2. Try finding by category object
  const category = categories.find(c => c.id === categoryId || c.name === categoryName);
  if (category) {
    if (category.coverUrl) return category.coverUrl;
    if (CATEGORY_DEFAULT_LOGOS[category.name]) {
      return CATEGORY_DEFAULT_LOGOS[category.name];
    }
  }

  // 3. Try by categoryName string
  if (categoryName && CATEGORY_DEFAULT_LOGOS[categoryName]) {
    return CATEGORY_DEFAULT_LOGOS[categoryName];
  }

  // 4. Fallback search by keyword matching
  if (categoryName) {
    const lower = categoryName.toLowerCase();
    if (lower.includes('عصير') || lower.includes('مشروب')) return CATEGORY_DEFAULT_LOGOS['محلات عصائر ومرطبات'] || DEFAULT_STORE_LOGO;
    if (lower.includes('سوبر') || lower.includes('بقالة')) return CATEGORY_DEFAULT_LOGOS['السوبرماركت والتموينات'];
    if (lower.includes('مطعم') || lower.includes('برجر') || lower.includes('وجبات') || lower.includes('مأكولات')) return CATEGORY_DEFAULT_LOGOS['المطاعم والوجبات السريعة'];
    if (lower.includes('مخبز') || lower.includes('حلويات') || lower.includes('كيك')) return CATEGORY_DEFAULT_LOGOS['الحلويات والمخبوزات'];
    if (lower.includes('صيدل') || lower.includes('دواء') || lower.includes('طب')) return CATEGORY_DEFAULT_LOGOS['الصيدليات والمستلزمات الطبية'];
    if (lower.includes('إلكترون') || lower.includes('جوال')) return CATEGORY_DEFAULT_LOGOS['الإلكترونيات والهواتف'];
    if (lower.includes('بهار') || lower.includes('عطارة') || lower.includes('توابل')) return CATEGORY_DEFAULT_LOGOS['البهارات والمكسرات والقهوة'];
    if (lower.includes('ورد') || lower.includes('هدية')) return CATEGORY_DEFAULT_LOGOS['الورود والهدايا'];
    if (lower.includes('لحم') || lower.includes('سمك')) return CATEGORY_DEFAULT_LOGOS['اللحوم والأسماك الطازجة'];
  }

  return DEFAULT_STORE_LOGO;
}


import { GlobalStore, GlobalStoreCategory, GlobalProduct, GlobalStoreConfig, GlobalCartItem } from '../types';
import { db, collection, addDoc } from './firebase';

export const DEFAULT_GLOBAL_CONFIG: GlobalStoreConfig = {
  currencyRate: 535, // 1 USD = 535 YER (Standard trade rate)
  shippingProfit: 4000, // Base freight + service profit in YER
  roundTo: 50
};

export const GLOBAL_STORES_CONFIG_KEY = 'jahez_global_stores_config';
export const GLOBAL_CART_STORAGE_KEY = 'jahez_global_cart_items';

/**
 * Get current global stores pricing configuration from localStorage or default
 */
export const getGlobalStoreConfig = (): GlobalStoreConfig => {
  try {
    const saved = localStorage.getItem(GLOBAL_STORES_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_GLOBAL_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading global store config:', e);
  }
  return DEFAULT_GLOBAL_CONFIG;
};

/**
 * Save global stores pricing configuration
 */
export const saveGlobalStoreConfig = (config: Partial<GlobalStoreConfig>): GlobalStoreConfig => {
  const current = getGlobalStoreConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(GLOBAL_STORES_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving global store config:', e);
  }
  return updated;
};

/**
 * EXACT USER PRICING FORMULA:
 * Displayed_Price = Math.ceil(((Original_Price * Currency_Rate) + Shipping_Profit) / 50) * 50
 * Hides original price and outputs clean rounded local price in Yemeni Rials.
 */
export const calculateDisplayedPrice = (
  originalPriceUsd: number,
  customConfig?: Partial<GlobalStoreConfig>
): number => {
  const config = { ...getGlobalStoreConfig(), ...customConfig };
  const rawLocalTotal = (originalPriceUsd * config.currencyRate) + config.shippingProfit;
  const rounded = Math.ceil(rawLocalTotal / 50) * 50;
  return Math.max(50, rounded);
};

export const GLOBAL_STORES: GlobalStore[] = [
  {
    id: 'shein',
    name: 'شي إن',
    nameEn: 'SHEIN',
    slug: 'shein',
    logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    themeColor: '#000000',
    badgeColor: 'bg-black text-white',
    description: 'أحدث صيحات الموضة العالمية، الأزياء العصرية، الفساتين والإكسسوارات بأسعار مميزة وجودة عالية.',
    deliveryDays: '7 - 12 يوم عمل',
    rating: 4.8,
    trustedBadge: 'متجر عالمي معتمد 100%',
    defaultCategory: 'clothing',
    availableCategories: ['clothing', 'beauty', 'shoes_bags', 'electronics']
  },
  {
    id: 'amazon',
    name: 'أمازون',
    nameEn: 'Amazon Global',
    slug: 'amazon',
    logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    themeColor: '#FF9900',
    badgeColor: 'bg-amber-500 text-slate-950',
    description: 'أكبر متجر للتسوق في العالم: إلكترونيات أصلية، حواسيب، هواتف، أجهزة منزلية ومستلزمات متكاملة.',
    deliveryDays: '6 - 10 أيام عمل',
    rating: 4.9,
    trustedBadge: 'شحن مضمون وضمان الوكيل',
    defaultCategory: 'electronics',
    availableCategories: ['electronics', 'clothing', 'shoes_bags', 'beauty']
  },
  {
    id: 'aliexpress',
    name: 'علي إكسبريس',
    nameEn: 'AliExpress',
    slug: 'aliexpress',
    logo: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80',
    themeColor: '#FF4747',
    badgeColor: 'bg-red-500 text-white',
    description: 'ملايين المنتجات المباشرة من المصانع العالمية بأسعار الجملة، مستلزمات ذكية، إكسسوارات وسلع حصرية.',
    deliveryDays: '10 - 15 يوم عمل',
    rating: 4.7,
    trustedBadge: 'حماية المشتري وضمان الاسترجاع',
    defaultCategory: 'electronics',
    availableCategories: ['electronics', 'clothing', 'beauty', 'shoes_bags']
  }
];

export const GLOBAL_CATEGORIES: { id: GlobalStoreCategory; label: string; icon: string; count: string }[] = [
  { id: 'clothing', label: 'الملابس والأزياء', icon: 'Shirt', count: '+12,000 صنف' },
  { id: 'electronics', label: 'الإلكترونيات والذكاء', icon: 'Laptop', count: '+8,500 صنف' },
  { id: 'beauty', label: 'التجميل والعناية', icon: 'Sparkles', count: '+5,400 صنف' },
  { id: 'shoes_bags', label: 'الأحذية والحقائب', icon: 'ShoppingBag', count: '+4,800 صنف' }
];

// Rich Curated Datasets for Instant, High-Fidelity Catalog Navigation
export const BASE_GLOBAL_PRODUCTS: Omit<GlobalProduct, 'displayedPrice'>[] = [
  // SHEIN - Clothing
  {
    id: 'sh-c-1',
    storeId: 'shein',
    storeName: 'شي إن (SHEIN)',
    title: 'فستان ماكسي أنيق بياقة V مع حزام خصر وتطريز أكمام دانتيل فرنسي',
    titleEn: 'French Lace Long Sleeve Wrap Maxi Dress with Waist Belt',
    originalPriceUsd: 22.50,
    currency: 'USD',
    rating: 4.85,
    reviewsCount: 1420,
    salesCount: 6840,
    category: 'clothing',
    badge: 'الأكثر مبيعاً 🔥',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['S (صغير)', 'M (وسط)', 'L (كبير)', 'XL (كبير جداً)', 'XXL'],
    colors: [
      { name: 'أسود ملكي', hex: '#111827' },
      { name: 'أخضر زمردي', hex: '#065F46' },
      { name: 'عنابي دافئ', hex: '#831843' },
      { name: 'بيج كلاسيكي', hex: '#D1D5DB' }
    ],
    specs: [
      { label: 'الخامة والقماش', value: 'بوليستر ناعم عالي الجودة 95% + 5% ألياف مرنة' },
      { label: 'النمط', value: 'كاجوال ورسمي للمناسبات والطلعات' },
      { label: 'طريقة الغسيل', value: 'غسيل آلي بماء بارد أو غسيل جاف' },
      { label: 'المستورد الأصلي', value: 'SHEIN Global Direct Warehouses' }
    ],
    description: 'فستان أنيق بتصميم عصري راقٍ يمنحك إطلالة ساحرة في مختلف المناسبات، مزود بحزام خصر مرن وأكمام دانتيل كلاسيكية مريحة تسمح بالتنفس.',
    inStock: true,
    sourceUrl: 'https://www.shein.com/ar/French-Lace-Wrap-Maxi-Dress-p-1092837.html'
  },
  {
    id: 'sh-c-2',
    storeId: 'shein',
    storeName: 'شي إن (SHEIN)',
    title: 'طقم رجالي كاجوال مكون من قميص كوري بأزرار مخفية وبنطال مريح',
    titleEn: 'Men 2-Piece Breathable Korean Collar Shirt & Trousers Set',
    originalPriceUsd: 28.00,
    currency: 'USD',
    rating: 4.78,
    reviewsCount: 950,
    salesCount: 3410,
    category: 'clothing',
    badge: 'تشكيلة الموسم ✨',
    imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['M (وسط)', 'L (كبير)', 'XL (كبير جداً)', 'XXL (2XL)'],
    colors: [
      { name: 'كحلي داكن', hex: '#1E3A8A' },
      { name: 'رمادي حجري', hex: '#4B5563' },
      { name: 'بيج رملي', hex: '#E5E7EB' }
    ],
    specs: [
      { label: 'الخامة', value: 'كتان طبيعي ومزيج قطن مريح ضد التعرق' },
      { label: 'المقاس والقصة', value: 'قصة منتظمة (Regular Fit)' },
      { label: 'المنشأ', value: 'SHEIN Man Luxury Line' }
    ],
    description: 'طقم رجالي صيفي متناسق يجمع بين راحة الاستخدام والأناقة العصرية، مناسب للدوام، المقابلات، واللقاءات الاجتماعية.',
    inStock: true,
    sourceUrl: 'https://www.shein.com/ar/Men-Casual-2-Piece-Suit-p-238491.html'
  },
  {
    id: 'sh-c-3',
    storeId: 'shein',
    storeName: 'شي إن (SHEIN)',
    title: 'عباية إسلامية مودرن بأكمام واسعة وتطريز يدوي فاخر',
    titleEn: 'Modern Modest Abaya with Embellished Bell Sleeves',
    originalPriceUsd: 34.90,
    currency: 'USD',
    rating: 4.92,
    reviewsCount: 2100,
    salesCount: 8900,
    category: 'clothing',
    badge: 'الأعلى تقييماً ⭐',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['52 (طول 132سم)', '54 (طول 137سم)', '56 (طول 142سم)', '58 (طول 147سم)'],
    colors: [
      { name: 'أسود فاحم', hex: '#000000' },
      { name: 'رمادي داكن', hex: '#374151' }
    ],
    specs: [
      { label: 'القماش', value: 'كريب كوري حريري غير شفاف' },
      { label: 'الملحقات', value: 'شيلة متناسقة بنفس التطريز مجاناً' }
    ],
    description: 'عباية راقية بتطريز أنيق على الأكمام، تتميز بخفة الوزن وانسيابية القماش وسهولة الكي والارتداء.',
    inStock: true,
    sourceUrl: 'https://www.shein.com/ar/Embellished-Bell-Sleeves-Abaya-p-482910.html'
  },

  // SHEIN - Beauty
  {
    id: 'sh-b-1',
    storeId: 'shein',
    storeName: 'شي إن (SHEIN)',
    title: 'مجموعة فرش مكياج احترافية 18 قطعة مع حقيبة جلدية مقاومة للماء',
    titleEn: '18-Piece Professional Makeup Brush Set with Leather Pouch',
    originalPriceUsd: 14.50,
    currency: 'USD',
    rating: 4.88,
    reviewsCount: 3100,
    salesCount: 15400,
    category: 'beauty',
    badge: 'عرض خاص 🎁',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['مجموعة كاملة (18 قطعة)'],
    colors: [
      { name: 'وردي ذهبي (Rose Gold)', hex: '#FB7185' },
      { name: 'أسود غير لامع (Matte Black)', hex: '#18181B' },
      { name: 'رخامي أبيض', hex: '#F3F4F6' }
    ],
    specs: [
      { label: 'نوع الشعيرات', value: 'ألياف صناعية ناعمة فائقة النعومة ومضادة للبكتيريا' },
      { label: 'المقبض', value: 'خشب طبيعي مطلي بطبقة واقية غير قابلة للانزلاق' }
    ],
    description: 'مجموعة متكاملة تلبي جميع احتياجات دمج وتوزيع كريم الأساس، الكونسيلر، والظلال بدقة متناهية.',
    inStock: true,
    sourceUrl: 'https://www.shein.com/ar/SHEGLAM-18-Brush-Set-p-99482.html'
  },

  // AMAZON - Electronics
  {
    id: 'amz-e-1',
    storeId: 'amazon',
    storeName: 'أمازون (Amazon)',
    title: 'حاسوب محمول فائق النحافة شاشة 15.6 بوصة FHD مع معالج Core i7 وذاكرة 16GB SSD 512GB',
    titleEn: 'Ultra-Slim 15.6" Laptop, Intel Core i7, 16GB RAM, 512GB NVMe SSD, Windows 11 Pro',
    originalPriceUsd: 499.00,
    currency: 'USD',
    rating: 4.91,
    reviewsCount: 5400,
    salesCount: 12800,
    category: 'electronics',
    badge: 'اختيار أمازون (Amazon Choice) ⚡',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['16GB RAM + 512GB SSD', '32GB RAM + 1TB SSD'],
    colors: [
      { name: 'رمادي فضائي (Space Gray)', hex: '#374151' },
      { name: 'فضي لامع (Silver)', hex: '#E5E7EB' }
    ],
    specs: [
      { label: 'المعالج', value: 'Intel Core i7 الجيل الحادي عشر بسرعة تصل إلى 4.7GHz' },
      { label: 'الشاشة', value: '15.6 بوصة IPS بدقة 1920x1080 مضادة للتوهج' },
      { label: 'البطارية', value: 'تدوم حتى 10 ساعات عمل متواصل وشاحن Type-C سريع' },
      { label: 'الوزن', value: '1.45 كجم فقط لسهولة التنقل' },
      { label: 'الضمان', value: 'سنة كاملة مع الشحن المباشر' }
    ],
    description: 'لابتوب عالي الأداء مصمم للمهندسين، الطلاب، ورجال الأعمال. سرعة استجابة فائقة، شاشة ساطعة ومريحة للعين، ولوحة مفاتيح معربة ومضاءة خلفياً.',
    inStock: true,
    sourceUrl: 'https://www.amazon.com/dp/B08N5N152W'
  },
  {
    id: 'amz-e-2',
    storeId: 'amazon',
    storeName: 'أمازون (Amazon)',
    title: 'سماعات رأس لاسلكية عازلة للضوضاء النشط ANC مع صوت نقي وبطارية تدوم 40 ساعة',
    titleEn: 'Active Noise Cancelling Wireless Over-Ear Headphones, Hi-Res Audio, 40H Playtime',
    originalPriceUsd: 59.99,
    currency: 'USD',
    rating: 4.87,
    reviewsCount: 8900,
    salesCount: 22000,
    category: 'electronics',
    badge: 'الأكثر مبيعاً 🎧',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['إصدار قياسي + حقيبة حماية'],
    colors: [
      { name: 'أسود كربوني', hex: '#1F2937' },
      { name: 'أبيض لؤلؤي', hex: '#F9FAFB' },
      { name: 'أزرق ليلي', hex: '#1E3A8A' }
    ],
    specs: [
      { label: 'عزل الضوضاء', value: 'تقنية ANC تعزل 90% من الضجيج المحيط' },
      { label: 'الاتصال', value: 'Bluetooth 5.3 + منفذ AUX 3.5mm سلكي' },
      { label: 'الميكروفون', value: '4 ميكروفونات مدمجة لمكالمات فائقة الوضوح' }
    ],
    description: 'استمتع بنقاء الصوت وعزل الضوضاء المحيطة أثناء السفر أو العمل والدراسة، مع وسائد أذن رغوية ميموري فوم مريحة للاستخدام الطويل.',
    inStock: true,
    sourceUrl: 'https://www.amazon.com/dp/B07NM3R513'
  },
  {
    id: 'amz-e-3',
    storeId: 'amazon',
    storeName: 'أمازون (Amazon)',
    title: 'ساعة ذكية بشاشة AMOLED فائقة السطوع تدعم المكالمات وقياس نبضات القلب والرياضة',
    titleEn: 'AMOLED Smartwatch with Bluetooth Calling, Heart Rate & SpO2 Monitor, 5ATM Waterproof',
    originalPriceUsd: 45.00,
    currency: 'USD',
    rating: 4.82,
    reviewsCount: 3200,
    salesCount: 7600,
    category: 'electronics',
    badge: 'تخفيض حصري ⌚',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['شاشة 1.43 بوصة دائري'],
    colors: [
      { name: 'أسود مع سوار سيليكون', hex: '#0F172A' },
      { name: 'فضي مع سوار ستانلس ستيل', hex: '#94A3B8' },
      { name: 'ذهبي كلاسيكي', hex: '#D97706' }
    ],
    specs: [
      { label: 'الشاشة', value: 'AMOLED Always-on Display بدقة 466x466' },
      { label: 'البطارية', value: 'تدوم حتى 14 يوم استخدام في الشحنة الواحدة' },
      { label: 'مقاومة الماء', value: 'معيار 5ATM مقاومة للسباحة والأمطار' }
    ],
    description: 'ساعة يد ذكية متوافقة مع جميع هواتف أندرويد وآيفون، تتيح لك استقبال المكالمات الهاتفية، وقراءة إشعارات واتساب والرسائل، ومتابعة النشاط البدني.',
    inStock: true,
    sourceUrl: 'https://www.amazon.com/dp/B08XJ8P2LQ'
  },

  // ALIEXPRESS - Shoes & Bags + Gadgets
  {
    id: 'ali-s-1',
    storeId: 'aliexpress',
    storeName: 'علي إكسبريس (AliExpress)',
    title: 'حذاء رياضي مبطن بنعل هيدروليكي ممتص للصدمات للجري والمشي لمسافات طويلة',
    titleEn: 'Pro Cushioning Breathable Air Running Sports Shoes',
    originalPriceUsd: 19.80,
    currency: 'USD',
    rating: 4.79,
    reviewsCount: 6300,
    salesCount: 28000,
    category: 'shoes_bags',
    badge: 'شحن مجاني وسريع 👟',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: [
      { name: 'أحمر ناري ورمادي', hex: '#DC2626' },
      { name: 'أسود كلاسيكي', hex: '#111827' },
      { name: 'أبيض رياضي', hex: '#F3F4F6' }
    ],
    specs: [
      { label: 'النعل', value: 'مطاط مرن ممتص لثقل الجسم مع وسادة هوائية Air' },
      { label: 'السطح الخارجي', value: 'شبك هوائي يسمح بمرور الهواء ويمنع الروائح' }
    ],
    description: 'حذاء خفيف جداً يمنح القدمين راحة استثنائية طوال اليوم، مناسب للتمارين الرياضية، المشي في الدوام، والرحلات الطويلة.',
    inStock: true,
    sourceUrl: 'https://www.aliexpress.com/item/100500482910.html'
  },
  {
    id: 'ali-s-2',
    storeId: 'aliexpress',
    storeName: 'علي إكسبريس (AliExpress)',
    title: 'حقيبة ظهر ذكية مضادة للسرقة والماء مع منفذ شحن USB وقفل أرقام سري',
    titleEn: 'Anti-Theft Waterproof Business Laptop Backpack with USB Charging Port',
    originalPriceUsd: 18.50,
    currency: 'USD',
    rating: 4.86,
    reviewsCount: 4100,
    salesCount: 19500,
    category: 'shoes_bags',
    badge: 'الأكثر طلباً 🎒',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['حجم قياسي يتسع للابتوب 15.6 بوصة', 'حجم كبير يتسع للابتوب 17.3 بوصة'],
    colors: [
      { name: 'رمادي غامق مقاوم للخدش', hex: '#374151' },
      { name: 'أسود فاخر', hex: '#1F2937' },
      { name: 'أزرق كحلي', hex: '#1E3A8A' }
    ],
    specs: [
      { label: 'مقاومة الماء', value: 'قماش أوكسفورد 900D المقاوم للأمطار والسوائل' },
      { label: 'الأمان', value: 'سحابات مخفية من الخلف وقفل TSA مدمج' },
      { label: 'المقصورات', value: 'مقصورة مبطنة للابتوب، جيب للجواز، وجيب للباوربانك' }
    ],
    description: 'حقيبة ظهر مثالية للمسافرين والطلاب وموظفي الشركات، تحمي أجهزتك من الصدمات والسرقة مع إمكانية شحن هاتفك بسهولة.',
    inStock: true,
    sourceUrl: 'https://www.aliexpress.com/item/100500391028.html'
  },
  {
    id: 'ali-e-1',
    storeId: 'aliexpress',
    storeName: 'علي إكسبريس (AliExpress)',
    title: 'باور بانك عملاق سعة 30,000mAh يدعم الشحن السريع PD 65W لشحن الهواتف واللابتوبات',
    titleEn: '65W Fast Charging Power Bank 30000mAh with Digital LED Display',
    originalPriceUsd: 32.00,
    currency: 'USD',
    rating: 4.89,
    reviewsCount: 7800,
    salesCount: 35000,
    category: 'electronics',
    badge: 'طاقة هائلة 🔋',
    imageUrl: 'https://images.unsplash.com/photo-1609592426815-5645398a6eb8?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1609592426815-5645398a6eb8?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['30,000 مللي أمبير (65 واط)'],
    colors: [
      { name: 'أسود مع شاشة رقمية LED', hex: '#000000' },
      { name: 'أبيض عاجي', hex: '#F3F4F6' }
    ],
    specs: [
      { label: 'السعة الحقيقية', value: '30000mAh تكفي لشحن الهاتف من 6 إلى 8 مرات' },
      { label: 'المنافذ', value: '2x Type-C + 2x USB-A لشحن 4 أجهزة بنفس الوقت' },
      { label: 'الشاشة', value: 'عرض رقمي دقيق للنسبة المئوية والواط' }
    ],
    description: 'بطارية متنقلة قوية وعملية جداً تدعم شحن اللابتوبات المحمولة وهواتف آيفون وسامسونج بأقصى سرعة ممكنة مع دوائر حماية من التيارات الزائدة.',
    inStock: true,
    sourceUrl: 'https://www.aliexpress.com/item/100500291039.html'
  }
];

/**
 * Generate a dynamic stream of products for any store, category, or search query
 * Supports Infinite Scroll by producing deterministic paginated products.
 */
export const queryGlobalStoreProducts = (params: {
  storeId?: string;
  category?: GlobalStoreCategory | 'all';
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}): { products: GlobalProduct[]; totalCount: number; hasMore: boolean } => {
  const {
    storeId,
    category = 'all',
    searchQuery = '',
    page = 1,
    pageSize = 12
  } = params;

  const config = getGlobalStoreConfig();

  // 1. Filter base list
  let pool = BASE_GLOBAL_PRODUCTS.map(p => ({
    ...p,
    displayedPrice: calculateDisplayedPrice(p.originalPriceUsd, config)
  }));

  if (storeId && storeId !== 'all') {
    pool = pool.filter(p => p.storeId === storeId);
  }

  if (category && category !== 'all') {
    pool = pool.filter(p => p.category === category);
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    pool = pool.filter(p => 
      p.title.toLowerCase().includes(q) ||
      (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q) ||
      p.storeName.toLowerCase().includes(q) ||
      (p.badge && p.badge.toLowerCase().includes(q))
    );
  }

  // If pool has items, expand it deterministically with variations for infinite scroll simulation
  const expandedList: GlobalProduct[] = [...pool];
  
  // Synthesize realistic search results if query is provided or to support infinite scroll
  const currentStore = GLOBAL_STORES.find(s => s.id === storeId) || GLOBAL_STORES[0];
  const targetCategory: GlobalStoreCategory = (category !== 'all' ? category : 'clothing');

  const baseKeywords = searchQuery.trim() ? [searchQuery.trim()] : [
    'فستان صيفي', 'حقيبة يد جلدية', 'سماعات بلوتوث لاسلكية', 'حذاء كاجوال خفيف',
    'نظارة شمسية بولارايزد', 'ساعة ذكية رياضية', 'طقم نسائي أنيق', 'قميص قطني فاخر',
    'ماكينة حلاقة احترافية', 'باور بانك سريع', 'كريم ترطيب وتفتيح', 'حامل هاتف للسيارة',
    'لوحة مفاتيح ميكانيكية', 'إسوارة فضية كلاسيكية', 'جاكيت شتوي مبطن', 'كفر حماية مغناطيسي'
  ];

  const sampleImages: Record<GlobalStoreCategory, string[]> = {
    clothing: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80'
    ],
    electronics: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'
    ],
    beauty: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80'
    ],
    shoes_bags: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80'
    ]
  };

  // Generate up to 60 deterministic dynamic items to allow infinite scroll
  const catImages = sampleImages[targetCategory] || sampleImages.clothing;
  const storeLabel = currentStore ? currentStore.name : 'المتجر العالمي';
  const prefix = searchQuery.trim() ? searchQuery.trim() : (category !== 'all' ? GLOBAL_CATEGORIES.find(c => c.id === category)?.label : 'منتج مميز');

  for (let i = 1; i <= 48; i++) {
    const rawPrice = Number((12.5 + (i * 3.4) % 65).toFixed(2));
    const imgUrl = catImages[i % catImages.length];
    const generatedId = `gen-${storeId || 'all'}-${targetCategory}-${i}`;
    
    // Check if already in list
    if (!expandedList.some(item => item.id === generatedId)) {
      expandedList.push({
        id: generatedId,
        storeId: (storeId as any) || (i % 3 === 0 ? 'shein' : i % 3 === 1 ? 'amazon' : 'aliexpress'),
        storeName: (storeId ? storeLabel : (i % 3 === 0 ? 'شي إن' : i % 3 === 1 ? 'أمازون' : 'علي إكسبريس')),
        title: `${prefix} - موديل فاخر إصدار ${2024 + (i % 3)} بتصميم أصلي فائق الجودة (${i})`,
        titleEn: `Premium ${prefix} Luxury Edition Model ${i}`,
        originalPriceUsd: rawPrice,
        currency: 'USD',
        displayedPrice: calculateDisplayedPrice(rawPrice, config),
        rating: Number((4.5 + (i % 5) * 0.1).toFixed(1)),
        reviewsCount: 150 + i * 42,
        salesCount: 400 + i * 95,
        category: targetCategory,
        badge: i % 4 === 0 ? 'الأكثر مبيعاً 🔥' : i % 4 === 1 ? 'خصم حصري 🏷️' : i % 4 === 2 ? 'شحن سريع ✈️' : undefined,
        imageUrl: imgUrl,
        galleryImages: [imgUrl, catImages[(i + 1) % catImages.length], catImages[(i + 2) % catImages.length]],
        sizes: targetCategory === 'shoes_bags' ? ['39', '40', '41', '42', '43', '44'] : ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [
          { name: 'أسود أنيق', hex: '#111827' },
          { name: 'كحلي داكن', hex: '#1E3A8A' },
          { name: 'رمادي فاتح', hex: '#9CA3AF' }
        ],
        specs: [
          { label: 'الضمان', value: 'فحص أصالة وجودة وضمان سلامة الشحن' },
          { label: 'مدة الوصول لليمن', value: currentStore?.deliveryDays || '7 - 12 يوم' },
          { label: 'الوزن التقريبي', value: `${(0.3 + (i % 5) * 0.2).toFixed(1)} كجم` }
        ],
        description: `منتج عالي الجودة مستورد ومضمون من ${storeLabel}. يخضع لفحص الجودة والتغليف الآمن قبل الشحن لليمن مباشرة حتى باب منزلك.`,
        inStock: true,
        sourceUrl: `https://${storeId || 'global'}.com/item/${generatedId}`
      });
    }
  }

  // Paging
  const totalCount = expandedList.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = expandedList.slice(0, startIndex + pageSize);
  const hasMore = paginated.length < totalCount;

  return {
    products: paginated,
    totalCount,
    hasMore
  };
};

/**
 * Local Cart Helpers
 */
export const getLocalCart = (): GlobalCartItem[] => {
  try {
    const data = localStorage.getItem(GLOBAL_CART_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error loading global cart:', e);
  }
  return [];
};

export const saveLocalCart = (items: GlobalCartItem[]): void => {
  try {
    localStorage.setItem(GLOBAL_CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('jahez_cart_updated'));
  } catch (e) {
    console.warn('Error saving global cart:', e);
  }
};

export const addToGlobalCart = (product: GlobalProduct, options: {
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}): GlobalCartItem[] => {
  const cart = getLocalCart();
  const existingIdx = cart.findIndex(
    item => item.productId === product.id && 
            item.selectedSize === options.selectedSize && 
            item.selectedColor === options.selectedColor
  );

  if (existingIdx !== -1) {
    cart[existingIdx].quantity += options.quantity;
    cart[existingIdx].totalPrice = cart[existingIdx].quantity * cart[existingIdx].displayedPrice;
  } else {
    const newItem: GlobalCartItem = {
      productId: product.id,
      productTitle: product.title,
      storeId: product.storeId,
      storeName: product.storeName,
      imageUrl: product.imageUrl,
      selectedSize: options.selectedSize,
      selectedColor: options.selectedColor,
      quantity: options.quantity,
      displayedPrice: product.displayedPrice,
      totalPrice: product.displayedPrice * options.quantity,
      sourceUrl: product.sourceUrl
    };
    cart.push(newItem);
  }

  saveLocalCart(cart);
  return cart;
};

export const removeFromGlobalCart = (index: number): GlobalCartItem[] => {
  const cart = getLocalCart();
  cart.splice(index, 1);
  saveLocalCart(cart);
  return cart;
};

export const clearGlobalCart = (): void => {
  saveLocalCart([]);
};

/**
 * Submit Global Store Order to Firestore 'orders' collection
 * Strictly saves: product link, size, color, calculated price, and customer details.
 */
export const submitGlobalStoreOrder = async (payload: {
  customerName: string;
  customerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  notes?: string;
  items: GlobalCartItem[];
  paymentMethod?: string;
}): Promise<{ success: boolean; orderNumber: string; orderId?: string }> => {
  const orderNumber = `GLB-${Math.floor(100000 + Math.random() * 900000)}`;
  const totalAmount = payload.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const orderDocData = {
    orderNumber,
    orderScope: 'international',
    serviceType: 'global_store',
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    deliveryAddress: `${payload.deliveryCity} - ${payload.deliveryAddress}`.trim(),
    pickupAddress: `مستودعات الشحن الدولي (${payload.items.map(i => i.storeName).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`,
    orderType: `طلب متجر عالمي (${payload.items.length} أصناف)`,
    status: 'new',
    items: payload.items.map(item => ({
      name: item.productTitle,
      productName: item.productTitle,
      productId: item.productId,
      storeName: item.storeName,
      storeId: item.storeId,
      productUrl: item.sourceUrl,
      sourceUrl: item.sourceUrl,
      size: item.selectedSize,
      color: item.selectedColor,
      quantity: item.quantity,
      price: item.displayedPrice,
      totalPrice: item.totalPrice,
      imageUrl: item.imageUrl
    })),
    total: totalAmount,
    totalPrice: totalAmount,
    itemsTotal: totalAmount,
    deliveryFee: 0, // Included in calculated price
    paymentMethod: payload.paymentMethod || 'cash_on_delivery',
    paymentStatus: 'pending',
    notes: payload.notes || 'طلب مباشر من واجهة المتاجر العالمية مع روابط السلع والمقاسات والألوان المحددة.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, 'orders'), orderDocData);
    clearGlobalCart();
    return {
      success: true,
      orderNumber,
      orderId: docRef.id
    };
  } catch (err) {
    console.warn('Firestore direct write fallback (saving to localStorage / API):', err);
    // Backup locally
    try {
      const localOrders = JSON.parse(localStorage.getItem('jahez_saved_orders') || '[]');
      localOrders.unshift({ ...orderDocData, id: `local-${Date.now()}` });
      localStorage.setItem('jahez_saved_orders', JSON.stringify(localOrders));
    } catch (e) {
      console.warn('Error saving order backup:', e);
    }
    clearGlobalCart();
    return {
      success: true,
      orderNumber
    };
  }
};

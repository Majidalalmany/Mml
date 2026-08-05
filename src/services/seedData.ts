import { db, collection, addDoc, getDocs, writeBatch, doc } from '../lib/firebase';

export const INITIAL_CATEGORIES = [
  {
    name: 'محلات عصائر ومرطبات',
    nameEn: 'Juice & Beverage Shops',
    icon: 'Apple',
    coverUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    order: 1,
    status: 'active',
    description: 'عصائر طبيعية طازجة، كوكتيلات ملوكي، وآيس كريم'
  },
  {
    name: 'سوبرماركت وبقالة',
    nameEn: 'Supermarket & Grocery',
    icon: 'ShoppingBag',
    coverUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    order: 2,
    status: 'active',
    description: 'المواد الغذائية، الخضروات، الألبان والاحتياجات اليومية'
  },
  {
    name: 'محلات ملابس وموضة',
    nameEn: 'Clothing & Fashion',
    icon: 'Shirt',
    coverUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    order: 3,
    status: 'active',
    description: 'أحدث صيحات الملابس الجاهزة، الرجالي والنسائي والأطفال'
  },
  {
    name: 'مطاعم ومقاهي',
    nameEn: 'Restaurants & Cafes',
    icon: 'UtensilsCrossed',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    order: 4,
    status: 'active',
    description: 'أفضل المطاعم اليمانية، البرجر، المشويات والوجبات السريعة'
  },
  {
    name: 'مخابز وحلويات',
    nameEn: 'Bakeries & Sweets',
    icon: 'Cake',
    coverUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    order: 5,
    status: 'active',
    description: 'كيك المناسبات، بقلاوة، وحلويات شرقية وغربية طازجة'
  },
  {
    name: 'صيدليات ومستلزمات طبية',
    nameEn: 'Pharmacies & Health',
    icon: 'Pill',
    coverUrl: 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=800&q=80',
    order: 6,
    status: 'active',
    description: 'أدوية، فيتامينات ومستلزمات صحية وطبية طارئة'
  },
  {
    name: 'إلكترونيات وجوالات',
    nameEn: 'Electronics & Mobile',
    icon: 'Tv',
    coverUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    order: 7,
    status: 'active',
    description: 'هواتف ذكية، ملحقات أصلية وأجهزة إلكترونية'
  },
  {
    name: 'بهارات وعطارة',
    nameEn: 'Spices & Seasonings',
    icon: 'Flame',
    coverUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    order: 8,
    status: 'active',
    description: 'بهارات يمنية، عسل سدر حر، توابل وبخور'
  }
];

export const INITIAL_STORES = [
  {
    name: 'عصائر ومرطبات الفردوس',
    description: 'أفضل العصائر الطبيعية والكوكتيلات الملوكية الطازجة بالكامل',
    address: 'شارع حدة - صنعاء',
    phone: '777888999',
    categoryName: 'محلات عصائر ومرطبات',
    logoUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    workingHours: '08:00 ص - 01:00 ص',
    serviceType: 'both',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 400,
    status: 'open',
    sections: ['عصائر طبيعية', 'كوكتيلات ملوكي', 'آيس كريم وشيكات', 'مشروبات ساخنة']
  },
  {
    name: 'بوتيك الأناقة للملابس الجاهزة',
    description: 'أرقى الأزياء والملابس الرجالية والنسائية الرسمية والكاجوال',
    address: 'شارع الزبيري - صنعاء',
    phone: '776543210',
    categoryName: 'محلات ملابس وموضة',
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    workingHours: '09:00 ص - 10:00 م',
    serviceType: 'both',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 600,
    status: 'open',
    sections: ['ملابس رجالي', 'ملابس نسائي', 'ملابس أطفال', 'إكسسوارات وحقائب']
  },
  {
    name: 'سوبر ماركت الوفاء التجاري',
    description: 'كل احتياجات المنزل والمطبخ بأسعار الجملة وتوصيل فوري',
    address: 'شارع الستين - صنعاء',
    phone: '773456789',
    categoryName: 'سوبرماركت وبقالة',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    workingHours: '07:00 ص - 11:30 م',
    serviceType: 'both',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 400,
    status: 'open',
    sections: ['مواد غذائية أساسية', 'ألبان وأجبان', 'خضروات وفواكه', 'منظفات منزلية']
  },
  {
    name: 'مطعم الشيباني الفاخر',
    description: 'أشهر وجبات السلتة والفرمة والمشويات اليمانية الأصيلة',
    address: 'شارع الزبيري - صنعاء',
    phone: '777111222',
    categoryName: 'مطاعم ومقاهي',
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    workingHours: '09:00 ص - 12:00 م',
    serviceType: 'both',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 500,
    status: 'open',
    sections: ['سلتة وفحسة', 'مشويات بلدي', 'عصائر طازجة', 'حلويات شعبية']
  },
  {
    name: 'مخبز وحلويات الروضة الملكية',
    description: 'كيك المناسبات، بقلاوة يمنية بالفستق والمعجنات الطازجة يومياً',
    address: 'شارع بغداد - صنعاء',
    phone: '772223344',
    categoryName: 'مخابز وحلويات',
    logoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    workingHours: '07:00 ص - 11:00 م',
    serviceType: 'both',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 400,
    status: 'open',
    sections: ['حلويات شرقية', 'كيك ومناسبات', 'معجنات وفطائر', 'مشروبات دافئة']
  },
  {
    name: 'صيدلية ابن حيان الكبرى',
    description: 'خدمة دواء وتوفير مستلزمات طبية 24/7 مع التوصيل السريع',
    address: 'شارع حدة - صنعاء',
    phone: '771234567',
    categoryName: 'صيدليات ومستلزمات طبية',
    logoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=800&q=80',
    workingHours: 'على مدار 24 ساعة',
    serviceType: 'delivery',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 300,
    status: 'open',
    sections: ['أدوية ومسكنات', 'فيتامينات ومكملات', 'عناية بشرة وشعر', 'مستلزمات أطفال']
  },
  {
    name: 'مركز المدينة للإلكترونيات والجوالات',
    description: 'أحدث الهواتف الذكية، الشواحن والسماعات الأصلية مع الضمان',
    address: 'شارع صخر - صنعاء',
    phone: '778899000',
    categoryName: 'إلكترونيات وجوالات',
    logoUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    workingHours: '09:00 ص - 09:30 م',
    serviceType: 'both',
    deliveryFeeType: 'fixed',
    fixedDeliveryFee: 500,
    status: 'open',
    sections: ['جوالات وملحقات', 'سماعات وشواحن', 'أجهزة منزلية']
  }
];

export const INITIAL_PRODUCTS = [
  {
    name: 'كوكتيل الإمبراطور بالعسل والمكسرات',
    description: 'طبقات المانجو والفركاسي والقشطة البلدي مع المكسرات المحمصة والعسل الحر',
    price: 1500,
    originalPrice: 1800,
    categoryName: 'محلات عصائر ومرطبات',
    storeName: 'عصائر ومرطبات الفردوس',
    sectionName: 'كوكتيلات ملوكي',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-JUICE-01',
    discountPercent: 15,
    prices: [
      { name: 'حجم عادي', price: 1500 },
      { name: 'حجم كبير جامبو', price: 2200 }
    ]
  },
  {
    name: 'عصير فركاسي مانجو وجوافة طازج',
    description: 'عصير طازج 100% بدون أي إضافات حافظة، يعصر فور الطلب',
    price: 1000,
    originalPrice: 1200,
    categoryName: 'محلات عصائر ومرطبات',
    storeName: 'عصائر ومرطبات الفردوس',
    sectionName: 'عصائر طبيعية',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-JUICE-02'
  },
  {
    name: 'ثوب رجالي يمني فاخر تطريز يدوي',
    description: 'ثوب قطن ممتاز خامة ممتازة مع تطريز رقبة وجيب أنيق ورسمي',
    price: 18000,
    originalPrice: 22000,
    categoryName: 'محلات ملابس وموضة',
    storeName: 'بوتيك الأناقة للملابس الجاهزة',
    sectionName: 'ملابس رجالي',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-CLOTH-01',
    prices: [
      { name: 'مقاس M', price: 18000 },
      { name: 'مقاس L', price: 18000 },
      { name: 'مقاس XL', price: 19500 }
    ]
  },
  {
    name: 'وجبة برجر دبل تشيز فاخر',
    description: 'برجر لحم بلدي طازج قطعتين مع جبنة شيدر مضاعفة، صلصة جاهز الخاصة، بصل مكرمل وخس طازج مع بطاطس ومشروب',
    price: 3500,
    originalPrice: 4200,
    categoryName: 'مطاعم ومقاهي',
    storeName: 'مطعم الشيباني الفاخر',
    sectionName: 'مشويات بلدي',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-BURGER-01',
    discountPercent: 15,
    prices: [
      { name: 'حجم سينجل', price: 2500 },
      { name: 'حجم دبل تشيز', price: 3500 },
      { name: 'وجبة عائلية مع عصير', price: 5000 }
    ]
  },
  {
    name: 'فحسة يماني بلدي باللحم المفروم',
    description: 'فحسة ساخنة في المقلى الفخاري مع الحلبة والكبسة واللحم البلدي الطازج مع الخبز الرشوش',
    price: 3800,
    originalPrice: 4500,
    categoryName: 'مطاعم ومقاهي',
    storeName: 'مطعم الشيباني الفاخر',
    sectionName: 'سلتة وفحسة',
    imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-FAHSA-01',
    prices: [
      { name: 'حجم عادي', price: 3800 },
      { name: 'حجم كبير ملوكي', price: 5500 }
    ]
  },
  {
    name: 'كيكة الشوكولاتة والمكسرات الفاخرة',
    description: 'كيكة الشوكولاتة الألمانية الهشة المغطاة بصلصة الشوكولاتة والمكسرات لجميع المناسبات',
    price: 7500,
    originalPrice: 9000,
    categoryName: 'مخابز وحلويات',
    storeName: 'مخبز وحلويات الروضة الملكية',
    sectionName: 'كيك ومناسبات',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-CAKE-01'
  },
  {
    name: 'فيتامين C 1000 ملجم فوار',
    description: 'مكمل غذائي لتقوية المناعة ومقاومة الزكام والإنفلونزا (20 قرص)',
    price: 1800,
    originalPrice: 2200,
    categoryName: 'صيدليات ومستلزمات طبية',
    storeName: 'صيدلية ابن حيان الكبرى',
    sectionName: 'فيتامينات ومكملات',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-MED-01',
    discountPercent: 10
  },
  {
    name: 'أرز بشاور هندي فاخر 5 كيلو',
    description: 'أرز بسمتي طويل الحبة ممتاز ومناسب للعزائم والوجبات العائلية',
    price: 9500,
    originalPrice: 11000,
    categoryName: 'سوبرماركت وبقالة',
    storeName: 'سوبر ماركت الوفاء التجاري',
    sectionName: 'مواد غذائية أساسية',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-RICE-05'
  },
  {
    name: 'سماعة لاسلكية عازلة للضوضاء',
    description: 'سماعة بلوتوث 5.3 ذات بطارية تدوم 30 ساعة صوت نقي وباس قوي',
    price: 8500,
    originalPrice: 10000,
    categoryName: 'إلكترونيات وجوالات',
    storeName: 'مركز المدينة للإلكترونيات والجوالات',
    sectionName: 'سماعات وشواحن',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    status: 'active',
    sku: 'PRD-ELEC-01'
  }
];

export const INITIAL_ADMIN_USERS = [
  {
    name: 'مجد الألماني (المدير العام المباشر)',
    email: 'majdallmany3@gmail.com',
    password: 'admin123',
    phone: '777000111',
    role: 'super_admin',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'إدارة النظام العامة',
    email: 'admin@gmail.com',
    password: 'admin123',
    phone: '771111111',
    role: 'super_admin',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'محمد اليماني (نائب المدير)',
    email: 'moh@jahez.com',
    password: 'password123',
    phone: '773333333',
    role: 'vice_admin',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'رؤى الحيمي (بيانات المطاعم)',
    email: 'Roaa@jahez.com',
    password: 'password123',
    phone: '774444444',
    role: 'stores_manager',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'خدمة العملاء والطلبات',
    email: 'cs@jahez.com',
    password: 'password123',
    phone: '775555555',
    role: 'customer_service',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'أحمد الإدارة المالية',
    email: 'finance@jahez.com',
    password: 'password123',
    phone: '776666666',
    role: 'finance_manager',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'كاتب المحتوى والصور',
    email: 'content@jahez.com',
    password: 'password123',
    phone: '777777777',
    role: 'content_writer',
    status: 'active',
    storeId: 'all',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
  }
];

export const INITIAL_ORDERS = [
  {
    orderNumber: 'ORD-1040',
    customerName: 'أحمد بن علي العولقي',
    customerPhone: '777123456',
    storeName: 'عصائر ومرطبات الفردوس',
    total: 4400,
    deliveryFee: 400,
    status: 'new',
    itemsCount: 3,
    items: [
      { productName: 'كوكتيل الإمبراطور بالعسل والمكسرات', price: 1500, quantity: 2, options: ['حجم عادي', 'زيادة عسل'] },
      { productName: 'عصير فركاسي مانجو وجوافة طازج', price: 1000, quantity: 1, options: ['بدون سكر'] }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    address: 'صنعاء - شارع حدة بجانب برج الأمل',
    notes: 'يرجى الاتصال عند الوصول',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
  },
  {
    orderNumber: 'ORD-1041',
    customerName: 'محمد عبده الشامي',
    customerPhone: '773998877',
    storeName: 'مطعم الشيباني الفاخر',
    total: 7500,
    deliveryFee: 500,
    status: 'preparing',
    itemsCount: 2,
    items: [
      { productName: 'سلتة يمنية باللحم البلدي والحلبه', price: 2500, quantity: 1, options: ['حلبة زيادة'] },
      { productName: 'وجبة مشويات بلدي مشكل مع الملوح', price: 4500, quantity: 1 }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    address: 'صنعاء - شارع الزبيري عمائر الروضة',
    notes: 'الرجاء تسليم الملوح ساخن جداً',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() // 35 mins ago
  },
  {
    orderNumber: 'ORD-1042',
    customerName: 'سارة عبد الله الحكيمي',
    customerPhone: '771554433',
    storeName: 'مخبز وحلويات الروضة الملكية',
    total: 18400,
    deliveryFee: 400,
    status: 'delivering',
    itemsCount: 2,
    items: [
      { productName: 'تورته كيك مناسبات شوكولاتة وكرز', price: 12000, quantity: 1, notes: ['كتابة: مبروك النجاح'] },
      { productName: 'بقلاوة يمنية بالفستق الحلبي (1 كيلو)', price: 6000, quantity: 1 }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    address: 'صنعاء - شارع بغداد مقابل جامعة العلوم والتكنولوجيا',
    notes: 'الطلب مدفوع إلكترونياً ببطاقة تضامن',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() // 55 mins ago
  },
  {
    orderNumber: 'ORD-1043',
    customerName: 'خالد بن عثمان الريمي',
    customerPhone: '775667788',
    storeName: 'سوبر ماركت الوفاء التجاري',
    total: 18600,
    deliveryFee: 400,
    status: 'delivered',
    itemsCount: 3,
    items: [
      { productName: 'كرتون حليب مدهش بودرة 2.5 كجم', price: 4200, quantity: 1 },
      { productName: 'كيس أرز بنجاب هندي فاخر 10 كيلو', price: 14000, quantity: 1 }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    address: 'صنعاء - شارع الستين الجنوبي جوار محطة الجرداء',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hours ago
  },
  {
    orderNumber: 'ORD-1044',
    customerName: 'طارق زياد الكبسي',
    customerPhone: '770112233',
    storeName: 'مركز المدينة للإلكترونيات والجوالات',
    total: 10000,
    deliveryFee: 500,
    status: 'cancelled',
    itemsCount: 1,
    items: [
      { productName: 'سماعات بلوتوث أصلية لاسلكية Pro', price: 9500, quantity: 1 }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    address: 'صنعاء - شارع صخر',
    notes: 'تم إلغاء الطلب بناءً على رغبة العميل لعدم توفر اللون الأسود',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  },
  {
    orderNumber: 'ORD-1045',
    customerName: 'فاطمة أحمد باعباد',
    customerPhone: '772445566',
    storeName: 'بوتيك الأناقة للملابس الجاهزة',
    total: 18600,
    deliveryFee: 600,
    status: 'returned',
    itemsCount: 1,
    items: [
      { productName: 'ثوب رجالي يمني فاخر تطريز يدوي', price: 18000, quantity: 1, options: ['مقاس L'] }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    address: 'صنعاء - شارع الزبيري',
    notes: 'تم إرجاع المنتج وتبديل المقاس بموجب سند المرتجع',
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    action: 'تعديل حالة طلب',
    performedBy: 'مجد الألماني (المدير العام)',
    userEmail: 'majdallmany3@gmail.com',
    userRole: 'super_admin',
    targetType: 'order',
    targetName: 'ORD-1042',
    details: 'تم تغيير حالة الطلب ORD-1042 إلى (قيد التوصيل) وإشعار السائق بنجاح',
    severity: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    action: 'إضافة متجر جديد',
    performedBy: 'رؤى الحيمي (إدارة المطاعم)',
    userEmail: 'Roaa@jahez.com',
    userRole: 'stores_manager',
    targetType: 'store',
    targetName: 'عصائر ومرطبات الفردوس',
    details: 'تم تسجيل متجر عصائر الفردوس وربطه بتصنيف العصائر والمرطبات',
    severity: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    action: 'تنبيه مشكلة في الدفع',
    performedBy: 'نظام مراقبة الفواتير',
    userEmail: 'system@jahez.com',
    userRole: 'system',
    targetType: 'system',
    targetName: 'بوابة تضامن باي',
    details: 'تم العثور على تأخر في استجابة بوابة الدفع لمدة 1.2 ثانية. تم الحفظ والإعادة تلقائياً',
    severity: 'warning',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    action: 'تحديث صلاحيات مستخدم',
    performedBy: 'مجد الألماني (المدير العام)',
    userEmail: 'majdallmany3@gmail.com',
    userRole: 'super_admin',
    targetType: 'user',
    targetName: 'خدمة العملاء والطلبات',
    details: 'منح صلاحية تعديل حالة الطلبات المباشرة لموظف خدمة العملاء',
    severity: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  }
];

export const INITIAL_SUPPORT_TICKETS = [
  {
    ticketNumber: 'MOD-901',
    title: 'طلب إضافة قسم الخصومات السريعة في الواجهة الرئيسية',
    requesterName: 'محمد عبده (مدير التسويق)',
    requesterEmail: 'moh@jahez.com',
    targetAdminEmail: 'majdallmany3@gmail.com',
    category: 'feature',
    status: 'in_progress',
    priority: 'high',
    messages: [
      {
        id: 'msg-1',
        senderName: 'محمد عبده (نائب المدير)',
        senderEmail: 'moh@jahez.com',
        text: 'أبشر أستاذ مجد، يرجى تفعيل قسم إضافي للتخفيضات الكبرى أعلى شاشة المطاعم.',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      },
      {
        id: 'msg-2',
        senderName: 'مجد الألماني (المدير العام المباشر)',
        senderEmail: 'majdallmany3@gmail.com',
        text: 'أبشر جاري تنفيذ التعديل المطلوب وإعادة جدولة الفئات وتكبير الخطوط.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isManagerReply: true
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  }
];

export async function seedInitialFirestoreData(): Promise<boolean> {
  try {
    // 1. Categories Seeding
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoryIdMap: Record<string, string> = {};

    if (categoriesSnapshot.empty) {
      for (const cat of INITIAL_CATEGORIES) {
        const docRef = await addDoc(collection(db, 'categories'), {
          ...cat,
          createdAt: new Date().toISOString()
        });
        categoryIdMap[cat.name] = docRef.id;
      }
    } else {
      categoriesSnapshot.docs.forEach(d => {
        const data = d.data();
        categoryIdMap[data.name] = d.id;
      });
    }

    // 2. Stores Seeding
    const storesSnapshot = await getDocs(collection(db, 'stores'));
    const storeIdMap: Record<string, string> = {};

    if (storesSnapshot.empty) {
      for (const st of INITIAL_STORES) {
        const catId = categoryIdMap[st.categoryName] || Object.values(categoryIdMap)[0] || '';
        const docRef = await addDoc(collection(db, 'stores'), {
          ...st,
          categoryId: catId,
          createdAt: new Date().toISOString()
        });
        storeIdMap[st.name] = docRef.id;
      }
    } else {
      storesSnapshot.docs.forEach(d => {
        const data = d.data();
        storeIdMap[data.name] = d.id;
      });
    }

    // 3. Products Seeding
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (productsSnapshot.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        const categoryId = categoryIdMap[prod.categoryName] || Object.values(categoryIdMap)[0] || 'default';
        const storeId = storeIdMap[prod.storeName] || Object.values(storeIdMap)[0] || 'default';
        await addDoc(collection(db, 'products'), {
          ...prod,
          categoryId,
          storeId,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Admin Users Seeding
    const usersSnapshot = await getDocs(collection(db, 'adminUsers'));
    if (usersSnapshot.empty) {
      for (const user of INITIAL_ADMIN_USERS) {
        await addDoc(collection(db, 'adminUsers'), {
          ...user,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 5. Orders Seeding
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    if (ordersSnapshot.empty) {
      for (const order of INITIAL_ORDERS) {
        const storeId = storeIdMap[order.storeName || ''] || '';
        await addDoc(collection(db, 'orders'), {
          ...order,
          storeId,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 6. Audit Logs Seeding
    const auditSnapshot = await getDocs(collection(db, 'audit_logs'));
    if (auditSnapshot.empty) {
      for (const logItem of INITIAL_AUDIT_LOGS) {
        await addDoc(collection(db, 'audit_logs'), logItem);
      }
    }

    // 7. Support Tickets Seeding
    const ticketsSnapshot = await getDocs(collection(db, 'support_tickets'));
    if (ticketsSnapshot.empty) {
      for (const tck of INITIAL_SUPPORT_TICKETS) {
        await addDoc(collection(db, 'support_tickets'), tck);
      }
    }

    return true;
  } catch (error) {
    console.error('Error seeding Firebase Firestore data:', error);
    return false;
  }
}

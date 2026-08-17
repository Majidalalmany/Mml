import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Package, 
  Check, 
  DollarSign, 
  Image as ImageIcon, 
  Tag, 
  FileText, 
  Barcode, 
  Store as StoreIcon, 
  Layers, 
  Plus, 
  Trash2, 
  Sliders,
  Sparkles,
  Shirt,
  Smartphone,
  UtensilsCrossed,
  ShieldCheck,
  HardDrive,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Percent,
  Palette,
  Flame,
  ShoppingBag,
  Scale,
  Footprints,
  Briefcase,
  Gift,
  HelpCircle,
  Layers2,
  Table,
  CheckSquare,
  Wand2,
  Box,
  Hash
} from 'lucide-react';
import { 
  Product, 
  Category, 
  Store, 
  ProductPriceOption, 
  ProductExtraOption, 
  ClothingSizeOption, 
  SupermarketWeightOption,
  PricingStrategyMode,
  ProductAttribute,
  ProductAttributeType,
  SingleAttributePriceItem,
  ProductVariantCombination
} from '../types';
import { compressImageFile } from '../lib/imageUtils';
import { getProductFormType } from '../lib/categoryUtils';
import { sanitizeText } from '../lib/securityUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  stores?: Store[];
  initialStoreId?: string;
  initialSectionName?: string;
}

const SAMPLE_IMAGES = [
  { name: 'وجبات ومطاعم', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { name: 'ملابس وأزياء', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80' },
  { name: 'حقائب وأحذية', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80' },
  { name: 'سوبرماركت وغذاء', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80' },
  { name: 'عصير ومرطبات', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80' },
  { name: 'حلويات وكيك', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
  { name: 'عطور وتجميل', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80' },
  { name: 'هواتف وإلكترونيات', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' }
];

// Preset suggestions for quick attribute values
const PRESET_ATTRIBUTE_VALUES: Record<ProductAttributeType, string[]> = {
  size: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size', '38', '39', '40', '41', '42', '43', '44'],
  color: ['أسود', 'أبيض', 'كحلي', 'رمادي', 'بيج', 'أحمر', 'أزرق', 'زيتي', 'بني', 'عنابي', 'وردي', 'ذهبي', 'فضي'],
  flavor: ['شوكولاتة', 'فانيلا', 'فراولة', 'توت مشكل', 'كراميل', 'ليمون ونعناع', 'مانجو', 'فستق', 'سادة'],
  weight: ['حبة واحدة', 'عبوة صغيرة', '500 جرام', '1 كجم', '2 كجم', '5 كجم', 'شدّة (6 حبات)', 'كرتون (12 حبة)', 'كرتون (24 حبة)'],
  storage: ['64GB', '128GB', '256GB', '512GB', '1TB', '30ml', '50ml', '100ml', '150ml', '200ml'],
  material: ['قطن 100%', 'كتان طبيعي', 'حرير طبيعي', 'صوف فاخر', 'جلد طبيعي', 'بوليستر', 'دينيم / جينز'],
  custom: ['عادي', 'ممتاز', 'خاص', 'إصدار محدود', 'حار', 'بارد', 'بدون سكر']
};

const ATTRIBUTE_TYPE_CONFIG: Record<ProductAttributeType, { label: string; defaultName: string; icon: any }> = {
  size: { label: 'المقاسات (Sizes)', defaultName: 'المقاس', icon: Shirt },
  color: { label: 'الألوان (Colors)', defaultName: 'اللون', icon: Palette },
  flavor: { label: 'النكهات (Flavors)', defaultName: 'النكهة', icon: Coffee },
  weight: { label: 'الأوزان والعبوات (Weights/Packaging)', defaultName: 'العبوة / الوزن', icon: Scale },
  storage: { label: 'السعة / الذاكرة / الحجم (Volume/Storage)', defaultName: 'السعة', icon: HardDrive },
  material: { label: 'نوع الخامة / القماش (Material)', defaultName: 'الخامة', icon: Tag },
  custom: { label: 'خاصية مخصصة (Custom Attribute)', defaultName: 'الخاصية', icon: Sliders }
};

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  stores = [],
  initialStoreId,
  initialSectionName
}) => {
  // 1. Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(3500);
  const [hasBaseDiscount, setHasBaseDiscount] = useState<boolean>(false);
  const [baseDiscountPrice, setBaseDiscountPrice] = useState<number | ''>('');

  const [categoryId, setCategoryId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [sectionName, setSectionName] = useState('وجبات رئيسية');
  
  // 2. Images
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // 3. Status & SKU
  const [inStock, setInStock] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number>(100);

  // 4. Universal Product Variant System
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategyMode>('flat');
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [newAttributeType, setNewAttributeType] = useState<ProductAttributeType>('size');
  const [attributeValueInputs, setAttributeValueInputs] = useState<Record<string, string>>({});

  // Single Attribute Driver Mode
  const [pricingDriverAttributeId, setPricingDriverAttributeId] = useState<string>('');
  const [singleAttributePrices, setSingleAttributePrices] = useState<SingleAttributePriceItem[]>([]);

  // Matrix Pricing Mode
  const [variantCombinations, setVariantCombinations] = useState<ProductVariantCombination[]>([]);
  const [bulkMatrixPriceInput, setBulkMatrixPriceInput] = useState<number>(3500);

  // 5. Food Add-ons & Modifiers (Optional for restaurants / cafes)
  const [extraOptions, setExtraOptions] = useState<ProductExtraOption[]>([]);
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);

  // 6. General Specs & Features
  const [techSpecs, setTechSpecs] = useState<string>('');
  const [warranty, setWarranty] = useState<string>('ضمان سنة كاملة');
  const [generalFeatures, setGeneralFeatures] = useState<string[]>(['جودة عالية وتصميم متميز', 'أصلي 100% مع ضمان الجودة']);
  const [newFeatureText, setNewFeatureText] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Selected Store and Category
  const currentStore = stores.find(s => s.id === storeId);
  const activeCategory = categories.find(c => c.id === categoryId);
  const activeCategoryName = activeCategory?.name || currentStore?.activityType || currentStore?.categoryName || '';
  const formType = getProductFormType(categoryId, activeCategoryName, categories);
  const isRestaurant = formType === 'restaurant';
  const isClothing = formType === 'clothing';
  const isSupermarket = formType === 'supermarket';

  // Initialize or reset form state
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setBasePrice(product.price ?? 3500);
      
      const hasD = Boolean(
        product.hasDiscount || 
        (product.discountPrice && product.discountPrice > 0) ||
        (product.originalPrice && product.originalPrice > product.price)
      );
      setHasBaseDiscount(hasD);
      setBaseDiscountPrice(product.discountPrice || (product.originalPrice && product.originalPrice > product.price ? product.price : ''));

      setCategoryId(product.categoryId || (categories[0]?.id || ''));
      setStoreId(product.storeId || initialStoreId || (stores[0]?.id || ''));
      setSectionName(product.sectionName || initialSectionName || 'وجبات رئيسية');
      setImageUrl(product.imageUrl || '');
      setGalleryImages(product.galleryImages || (product.imageUrl ? [product.imageUrl] : []));
      setInStock(product.inStock ?? true);
      setStatus(product.status || 'active');
      setSku(product.sku || `PRD-${Math.floor(1000 + Math.random() * 9000)}`);
      setStockQuantity(product.stockQuantity || 100);

      // Load or reconstruct Universal Attributes
      if (product.productAttributes && product.productAttributes.length > 0) {
        setProductAttributes(product.productAttributes);
        setPricingStrategy(product.pricingStrategy || 'flat');
        setPricingDriverAttributeId(product.pricingDriverAttributeId || product.productAttributes[0]?.id || '');
        setSingleAttributePrices(product.singleAttributePrices || []);
        setVariantCombinations(product.variantCombinations || []);
      } else if (product.prices && product.prices.length > 0) {
        // Reconstruct from Food Sizes
        const sizeAttr: ProductAttribute = {
          id: 'attr-sizes',
          name: 'حجم الوجبة',
          type: 'size',
          values: product.prices.map(p => p.name)
        };
        setProductAttributes([sizeAttr]);
        setPricingStrategy('single_attribute');
        setPricingDriverAttributeId('attr-sizes');
        setSingleAttributePrices(product.prices.map(p => ({
          value: p.name,
          price: p.price,
          hasDiscount: p.hasDiscount,
          discountPrice: p.discountPrice,
          inStock: true
        })));
      } else if (product.clothingSizes && product.clothingSizes.length > 0) {
        // Reconstruct from Clothing Sizes & Colors
        const attrs: ProductAttribute[] = [
          {
            id: 'attr-clothing-sizes',
            name: 'المقاس',
            type: 'size',
            values: product.clothingSizes
          }
        ];
        if (product.colors && product.colors.length > 0) {
          attrs.push({
            id: 'attr-clothing-colors',
            name: 'اللون',
            type: 'color',
            values: product.colors
          });
        }
        setProductAttributes(attrs);
        if (product.clothingPriceType === 'custom' && product.clothingSizePrices && product.clothingSizePrices.length > 0) {
          setPricingStrategy('single_attribute');
          setPricingDriverAttributeId('attr-clothing-sizes');
          setSingleAttributePrices(product.clothingSizePrices.map(csp => ({
            value: csp.size,
            price: csp.price,
            hasDiscount: csp.hasDiscount,
            discountPrice: csp.discountPrice,
            inStock: true
          })));
        } else if (attrs.length > 1) {
          setPricingStrategy('matrix');
        } else {
          setPricingStrategy('flat');
        }
      } else if (product.supermarketWeights && product.supermarketWeights.length > 0) {
        // Reconstruct from Supermarket Weights
        const weightAttr: ProductAttribute = {
          id: 'attr-weights',
          name: 'العبوة / الوزن',
          type: 'weight',
          values: product.supermarketWeights.map(w => w.unit)
        };
        setProductAttributes([weightAttr]);
        setPricingStrategy('single_attribute');
        setPricingDriverAttributeId('attr-weights');
        setSingleAttributePrices(product.supermarketWeights.map(w => ({
          value: w.unit,
          price: w.price,
          hasDiscount: w.hasDiscount,
          discountPrice: w.discountPrice,
          inStock: true
        })));
      } else {
        setProductAttributes([]);
        setPricingStrategy('flat');
      }

      // Modifiers & Extras
      setExtraOptions(product.options || []);
      setSelectedDrinks(product.mealOptions || []);
      setTechSpecs(product.techSpecs || '');
      setWarranty(product.warranty || 'ضمان سنة كاملة');
      setGeneralFeatures(product.generalFeatures || ['جودة عالية وتصميم متميز', 'أصلي 100% مع ضمان الجودة']);
    } else {
      // Default New Product setup
      setName('');
      setDescription('');
      setBasePrice(3500);
      setHasBaseDiscount(false);
      setBaseDiscountPrice('');
      
      const defStore = stores.find(s => s.id === initialStoreId) || stores[0];
      setStoreId(initialStoreId || defStore?.id || '');
      
      const defCatId = defStore?.categoryId || categories[0]?.id || '';
      setCategoryId(defCatId);
      
      const availableSecs = defStore?.sections || ['وجبات رئيسية', 'أصناف مختارة'];
      setSectionName(initialSectionName || availableSecs[0] || 'وجبات رئيسية');
      
      setImageUrl(SAMPLE_IMAGES[0].url);
      setGalleryImages([SAMPLE_IMAGES[0].url]);
      setInStock(true);
      setStatus('active');
      setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
      setStockQuantity(100);

      // Auto-apply intelligent initial templates based on store type
      if (isRestaurant) {
        applyTemplate('restaurant');
      } else if (isClothing) {
        applyTemplate('clothing');
      } else if (isSupermarket) {
        applyTemplate('supermarket');
      } else {
        setProductAttributes([]);
        setPricingStrategy('flat');
      }

      setExtraOptions([]);
      setSelectedDrinks([]);
      setTechSpecs('');
      setWarranty('ضمان سنة كاملة');
      setGeneralFeatures(['جودة عالية وتصميم متميز', 'أصلي 100% مع ضمان الجودة']);
    }
    setError('');
  }, [product, categories, stores, isOpen, initialStoreId, initialSectionName]);

  // Template Quick-Appliers
  const applyTemplate = (type: 'restaurant' | 'clothing' | 'supermarket' | 'electronics' | 'flat') => {
    if (type === 'restaurant') {
      const sizeAttr: ProductAttribute = {
        id: `attr-${Date.now()}-1`,
        name: 'حجم الوجبة',
        type: 'size',
        values: ['حجم صغير', 'حجم وسط', 'حجم كبير']
      };
      setProductAttributes([sizeAttr]);
      setPricingStrategy('single_attribute');
      setPricingDriverAttributeId(sizeAttr.id);
      setSingleAttributePrices([
        { value: 'حجم صغير', price: 2000, hasDiscount: false, inStock: true },
        { value: 'حجم وسط', price: 3000, hasDiscount: false, inStock: true },
        { value: 'حجم كبير', price: 4500, hasDiscount: false, inStock: true }
      ]);
      setExtraOptions([
        {
          title: 'خيارات الإضافات والصلصات',
          required: false,
          items: [
            { name: 'جبنة شيدر إضافية', extraPrice: 500 },
            { name: 'صلصة حارة خاصة', extraPrice: 200 }
          ]
        }
      ]);
    } else if (type === 'clothing') {
      const sizeAttr: ProductAttribute = {
        id: `attr-${Date.now()}-1`,
        name: 'المقاس',
        type: 'size',
        values: ['S', 'M', 'L', 'XL']
      };
      const colorAttr: ProductAttribute = {
        id: `attr-${Date.now()}-2`,
        name: 'اللون',
        type: 'color',
        values: ['أسود', 'كحلي', 'أبيض']
      };
      setProductAttributes([sizeAttr, colorAttr]);
      setPricingStrategy('matrix');
    } else if (type === 'supermarket') {
      const weightAttr: ProductAttribute = {
        id: `attr-${Date.now()}-1`,
        name: 'العبوة / الوزن',
        type: 'weight',
        values: ['حبة واحدة', 'كرتون (12 حبة)']
      };
      setProductAttributes([weightAttr]);
      setPricingStrategy('single_attribute');
      setPricingDriverAttributeId(weightAttr.id);
      setSingleAttributePrices([
        { value: 'حبة واحدة', price: 1500, hasDiscount: false, inStock: true },
        { value: 'كرتون (12 حبة)', price: 16500, hasDiscount: false, inStock: true }
      ]);
    } else if (type === 'electronics') {
      const storageAttr: ProductAttribute = {
        id: `attr-${Date.now()}-1`,
        name: 'سعة الذاكرة',
        type: 'storage',
        values: ['128GB', '256GB', '512GB']
      };
      const colorAttr: ProductAttribute = {
        id: `attr-${Date.now()}-2`,
        name: 'اللون',
        type: 'color',
        values: ['فضي', 'رمادي فلكي']
      };
      setProductAttributes([storageAttr, colorAttr]);
      setPricingStrategy('single_attribute');
      setPricingDriverAttributeId(storageAttr.id);
      setSingleAttributePrices([
        { value: '128GB', price: 35000, hasDiscount: false, inStock: true },
        { value: '256GB', price: 42000, hasDiscount: false, inStock: true },
        { value: '512GB', price: 51000, hasDiscount: false, inStock: true }
      ]);
    } else {
      setProductAttributes([]);
      setPricingStrategy('flat');
    }
  };

  // Sync Single Attribute Prices when pricingDriverAttribute or its values change
  const activeDriverAttribute = useMemo(() => {
    return productAttributes.find(a => a.id === pricingDriverAttributeId) || productAttributes[0];
  }, [productAttributes, pricingDriverAttributeId]);

  useEffect(() => {
    if (pricingStrategy === 'single_attribute' && activeDriverAttribute) {
      setSingleAttributePrices(prev => {
        return activeDriverAttribute.values.map(val => {
          const existing = prev.find(p => p.value === val);
          if (existing) return existing;
          return {
            value: val,
            price: basePrice || 3500,
            hasDiscount: false,
            discountPrice: undefined,
            sku: `${sku}-${val.replace(/\s+/g, '')}`,
            stock: 50,
            inStock: true
          };
        });
      });
    }
  }, [pricingStrategy, activeDriverAttribute, basePrice, sku]);

  // Compute Full Matrix Combinations (Cartesian Product)
  useEffect(() => {
    if (pricingStrategy === 'matrix' && productAttributes.length > 0) {
      // Cartesian product calculation
      const generateCartesian = (attrs: ProductAttribute[]) => {
        if (attrs.length === 0) return [];
        return attrs.reduce<Record<string, string>[]>((acc, attr) => {
          if (attr.values.length === 0) return acc;
          if (acc.length === 0) {
            return attr.values.map(v => ({ [attr.name]: v }));
          }
          const next: Record<string, string>[] = [];
          for (const item of acc) {
            for (const v of attr.values) {
              next.push({ ...item, [attr.name]: v });
            }
          }
          return next;
        }, []);
      };

      const rawCombos = generateCartesian(productAttributes);
      setVariantCombinations(prevCombos => {
        return rawCombos.map((comboObj, idx) => {
          const comboTitle = Object.values(comboObj).join(' / ');
          const comboId = `var-${Object.entries(comboObj).map(([k, v]) => `${k}_${v}`).join('-')}`;
          const existing = prevCombos.find(c => c.title === comboTitle || c.id === comboId);
          if (existing) return existing;
          return {
            id: comboId,
            title: comboTitle,
            options: comboObj,
            price: basePrice || 3500,
            hasDiscount: false,
            discountPrice: undefined,
            sku: `${sku || 'PRD'}-${idx + 1}`,
            stock: 25,
            inStock: true
          };
        });
      });
    }
  }, [pricingStrategy, productAttributes, basePrice, sku]);

  // Add a new dynamic attribute
  const handleAddAttribute = () => {
    const config = ATTRIBUTE_TYPE_CONFIG[newAttributeType];
    const newId = `attr-${Date.now()}`;
    const newAttr: ProductAttribute = {
      id: newId,
      name: config.defaultName,
      type: newAttributeType,
      values: PRESET_ATTRIBUTE_VALUES[newAttributeType].slice(0, 3)
    };
    setProductAttributes(prev => [...prev, newAttr]);
    if (!pricingDriverAttributeId) {
      setPricingDriverAttributeId(newId);
    }
  };

  // Remove an attribute
  const handleRemoveAttribute = (attrId: string) => {
    setProductAttributes(prev => {
      const filtered = prev.filter(a => a.id !== attrId);
      if (pricingDriverAttributeId === attrId && filtered.length > 0) {
        setPricingDriverAttributeId(filtered[0].id);
      } else if (filtered.length === 0) {
        setPricingStrategy('flat');
      }
      return filtered;
    });
  };

  // Add a value to an attribute
  const handleAddAttributeValue = (attrId: string, customVal?: string) => {
    const valToAdd = (customVal || attributeValueInputs[attrId] || '').trim();
    if (!valToAdd) return;

    setProductAttributes(prev => prev.map(attr => {
      if (attr.id === attrId && !attr.values.includes(valToAdd)) {
        return { ...attr, values: [...attr.values, valToAdd] };
      }
      return attr;
    }));

    setAttributeValueInputs(prev => ({ ...prev, [attrId]: '' }));
  };

  // Remove a value from an attribute
  const handleRemoveAttributeValue = (attrId: string, valToRemove: string) => {
    setProductAttributes(prev => prev.map(attr => {
      if (attr.id === attrId) {
        return { ...attr, values: attr.values.filter(v => v !== valToRemove) };
      }
      return attr;
    }));
  };

  // Bulk Apply Matrix Base Price
  const handleBulkApplyMatrixPrice = () => {
    if (!bulkMatrixPriceInput || bulkMatrixPriceInput <= 0) return;
    setVariantCombinations(prev => prev.map(c => ({
      ...c,
      price: bulkMatrixPriceInput
    })));
  };

  // Store Change
  const handleStoreChange = (newStoreId: string) => {
    setStoreId(newStoreId);
    const targetStore = stores.find(s => s.id === newStoreId);
    if (targetStore) {
      if (targetStore.categoryId) {
        setCategoryId(targetStore.categoryId);
      }
      if (targetStore.sections && targetStore.sections.length > 0) {
        setSectionName(targetStore.sections[0]);
      }
    }
  };

  // Multi-image upload
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        setError('');
        const newImages: string[] = [];
        for (let i = 0; i < Math.min(files.length, 5); i++) {
          const compressed = await compressImageFile(files[i], 600, 600, 0.8);
          newImages.push(compressed);
        }
        setGalleryImages(prev => {
          const merged = [...prev, ...newImages].slice(0, 5);
          if (!imageUrl && merged.length > 0) setImageUrl(merged[0]);
          return merged;
        });
      } catch (err) {
        setError('تعذر تحميل الصور، يرجى المحاولة بصيغة أخرى');
      }
    }
  };

  const handleRemoveGalleryImage = (idxToRemove: number) => {
    setGalleryImages(prev => {
      const filtered = prev.filter((_, idx) => idx !== idxToRemove);
      if (imageUrl === prev[idxToRemove]) {
        setImageUrl(filtered[0] || '');
      }
      return filtered;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeText(name);
    if (!cleanName) {
      setError('يرجى إدخال اسم المنتج أو الصنف');
      return;
    }

    if (!storeId) {
      setError('يرجى اختيار المتجر التابع له المنتج');
      return;
    }

    const numericPrice = typeof basePrice === 'number' && basePrice > 0 ? basePrice : 3500;
    
    // Determine overall effective discount for the product card
    let effectiveHasDiscount = false;
    let effectiveDiscountPrice: number | undefined = undefined;

    if (pricingStrategy === 'flat') {
      if (hasBaseDiscount && baseDiscountPrice && typeof baseDiscountPrice === 'number' && baseDiscountPrice < numericPrice) {
        effectiveHasDiscount = true;
        effectiveDiscountPrice = baseDiscountPrice;
      }
    } else if (pricingStrategy === 'single_attribute') {
      const discountedItem = singleAttributePrices.find(p => p.hasDiscount && p.discountPrice && p.discountPrice < p.price);
      if (discountedItem && discountedItem.discountPrice) {
        effectiveHasDiscount = true;
        effectiveDiscountPrice = discountedItem.discountPrice;
      }
    } else if (pricingStrategy === 'matrix') {
      const discountedVar = variantCombinations.find(v => v.hasDiscount && v.discountPrice && v.discountPrice < v.price);
      if (discountedVar && discountedVar.discountPrice) {
        effectiveHasDiscount = true;
        effectiveDiscountPrice = discountedVar.discountPrice;
      }
    }

    const selectedStore = stores.find(s => s.id === storeId);
    const selectedCategory = categories.find(c => c.id === categoryId);

    // Build Backward Compatible Legacy Fields for smooth rendering across existing app modules
    const legacyPrices: ProductPriceOption[] = singleAttributePrices.map(p => ({
      name: p.value,
      price: p.price,
      hasDiscount: p.hasDiscount,
      discountPrice: p.discountPrice
    }));

    const sizeAttr = productAttributes.find(a => a.type === 'size');
    const colorAttr = productAttributes.find(a => a.type === 'color');
    const weightAttr = productAttributes.find(a => a.type === 'weight');

    const legacyClothingSizes = sizeAttr?.values || [];
    const legacyClothingColors = colorAttr?.values || [];
    const legacySupermarketWeights: SupermarketWeightOption[] = (weightAttr?.values || []).map(w => {
      const sp = singleAttributePrices.find(p => p.value === w);
      return {
        unit: w,
        price: sp?.price || numericPrice,
        hasDiscount: sp?.hasDiscount,
        discountPrice: sp?.discountPrice
      };
    });

    const payload: Partial<Product> = {
      name: cleanName,
      description: sanitizeText(description) || undefined,
      price: numericPrice,
      hasDiscount: effectiveHasDiscount,
      discountPrice: effectiveDiscountPrice,
      originalPrice: effectiveHasDiscount ? numericPrice : undefined,
      categoryId: categoryId || (selectedStore?.categoryId || categories[0]?.id || 'default'),
      categoryName: selectedCategory?.name || selectedStore?.categoryName || 'عام',
      storeId,
      storeName: selectedStore?.name || 'متجر',
      sectionName: sanitizeText(sectionName) || 'وجبات رئيسية',
      imageUrl: imageUrl.trim() || galleryImages[0] || SAMPLE_IMAGES[0].url,
      galleryImages: galleryImages.length > 0 ? galleryImages : [imageUrl.trim() || SAMPLE_IMAGES[0].url],
      inStock,
      status,
      sku: sanitizeText(sku) || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      stockQuantity: Number(stockQuantity) || 100,

      // Universal Product Variant Engine
      pricingStrategy,
      productAttributes,
      pricingDriverAttributeId,
      singleAttributePrices: pricingStrategy === 'single_attribute' ? singleAttributePrices : undefined,
      variantCombinations: pricingStrategy === 'matrix' ? variantCombinations : undefined,

      // Food Modifiers & Extras
      options: extraOptions.length > 0 ? extraOptions : undefined,
      mealOptions: selectedDrinks.length > 0 ? selectedDrinks : undefined,

      // Legacy Compatibility Maps
      prices: pricingStrategy === 'single_attribute' ? legacyPrices : undefined,
      clothingSizes: legacyClothingSizes.length > 0 ? legacyClothingSizes : undefined,
      colors: legacyClothingColors.length > 0 ? legacyClothingColors : undefined,
      supermarketWeights: legacySupermarketWeights.length > 0 ? legacySupermarketWeights : undefined,
      clothingPriceType: pricingStrategy === 'single_attribute' ? 'custom' : 'unified',
      clothingSizePrices: pricingStrategy === 'single_attribute' && sizeAttr ? singleAttributePrices.map(s => ({
        size: s.value,
        price: s.price,
        hasDiscount: s.hasDiscount,
        discountPrice: s.discountPrice
      })) : undefined,

      techSpecs: sanitizeText(techSpecs) || undefined,
      warranty: sanitizeText(warranty) || undefined,
      generalFeatures: generalFeatures.map(f => sanitizeText(f)).filter(Boolean)
    };

    try {
      setIsSubmitting(true);
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentStoreObj = stores.find(s => s.id === storeId);
  const availableSections = currentStoreObj?.sections && currentStoreObj.sections.length > 0 
    ? currentStoreObj.sections 
    : ['وجبات رئيسية', 'مقبلات', 'مشروبات', 'ملابس رجالية', 'ملابس نسائية', 'أحذية وحقائب', 'أجهزة وإلكترونيات', 'أصناف عامة'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 my-4 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Package className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {product ? 'تعديل بيانات المنتج وتشكيلاته' : 'إضافة منتج وتشكيلات جديدة'}
                </h3>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                  نظام التشكيلات العالمي
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">
                المتجر: <strong className="text-white">{currentStore?.name || 'متجر مختار'}</strong> | القسم: <strong className="text-white">{sectionName}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Template Switcher Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Wand2 className="w-3.5 h-3.5 text-blue-600" />
              <span>قوالب سريعة مقترحة للنشاط:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyTemplate('restaurant')}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                <span>مطاعم (أحجام + إضافات)</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('clothing')}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Shirt className="w-3 h-3 text-purple-600" />
                <span>أزياء (مقاس + لون)</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('supermarket')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Scale className="w-3 h-3 text-emerald-600" />
                <span>سوبرماركت (أوزان وعبوات)</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('electronics')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <HardDrive className="w-3 h-3 text-blue-600" />
                <span>إلكترونيات (سعات + ضمان)</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('flat')}
                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                منتج بسيط (بدون خيارات)
              </button>
            </div>
          </div>

          {/* Section 1: Target Store & Internal Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <StoreIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>المتجر التابع له <span className="text-red-500">*</span></span>
              </label>
              <select
                value={storeId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-900"
                required
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.activityType || s.categoryName || 'متجر'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>القسم الداخلي بالمتجر <span className="text-red-500">*</span></span>
              </label>
              <select
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-900"
              >
                {availableSections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Name & Description */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                اسم المنتج / الصنف <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: برجر دبل كرسبي / فستان صيفي كتان / قهوة مختصة 250جم / سماعة بلوتوث"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                وصف وتفاصيل ومكونات المنتج
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="اكتب وصفاً جذاباً للمنتج ومواصفاته..."
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Section 3: Multi-Images Upload (Up to 5) */}
          <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>صور المنتج (حتى 5 صور عالية الدقة)</span>
              </label>
              <span className="text-[11px] text-blue-700 font-medium">
                {galleryImages.length} من 5 صور
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl border-2 border-blue-300 overflow-hidden shrink-0 group shadow-2xs">
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(idx)}
                    className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {galleryImages.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-300 bg-white hover:bg-blue-50 flex flex-col items-center justify-center text-blue-600 cursor-pointer shrink-0 transition-colors shadow-2xs">
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-bold mt-0.5">رفع صورة</span>
                  <input type="file" accept="image/*" multiple onChange={handleMultiImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pt-1 custom-scrollbar">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">نماذج جاهزة:</span>
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample.url);
                    if (!galleryImages.includes(sample.url)) {
                      setGalleryImages(prev => [sample.url, ...prev].slice(0, 5));
                    }
                  }}
                  className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-700 rounded text-[10px] border border-blue-200 shrink-0 font-medium transition-colors cursor-pointer"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CORE SECTION: DYNAMIC ATTRIBUTES BUILDER (Shopify Standard)               */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span className="text-sm">1. خيارات وخصائص المنتج (Product Attributes)</span>
              </div>

              {/* Add Option Trigger */}
              <div className="flex items-center gap-2">
                <select
                  value={newAttributeType}
                  onChange={(e) => setNewAttributeType(e.target.value as ProductAttributeType)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(ATTRIBUTE_TYPE_CONFIG).map(([typeKey, cfg]) => (
                    <option key={typeKey} value={typeKey}>
                      + {cfg.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddAttribute}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة خاصية</span>
                </button>
              </div>
            </div>

            {/* List of Configured Attributes */}
            {productAttributes.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-dashed border-gray-300 text-center space-y-1 text-slate-500">
                <p className="font-bold text-slate-700">لم يتم تحديد أي خصائص للمنتج (منتج موحد السعر)</p>
                <p className="text-[11px] text-slate-400">
                  انقر على "+ إضافة خاصية" بالأعلى لاختيار مقاسات، ألوان، أوزان، نكهات، أو سعات.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {productAttributes.map((attr, attrIdx) => {
                  const cfg = ATTRIBUTE_TYPE_CONFIG[attr.type] || ATTRIBUTE_TYPE_CONFIG.custom;
                  const IconComp = cfg.icon;
                  const presetValues = PRESET_ATTRIBUTE_VALUES[attr.type] || [];

                  return (
                    <div key={attr.id} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">
                            {attrIdx + 1}
                          </span>
                          <IconComp className="w-4 h-4 text-blue-600" />
                          <input 
                            type="text"
                            value={attr.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setProductAttributes(prev => prev.map(a => a.id === attr.id ? { ...a, name: newName } : a));
                            }}
                            className="font-bold text-slate-800 text-xs border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                            placeholder="اسم الخاصية (مثال: المقاس)"
                          />
                          <span className="text-[10px] text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {cfg.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(attr.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف هذه الخاصية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Attribute Values Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {attr.values.map(val => (
                          <span 
                            key={val}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 transition-all"
                          >
                            <span>{val}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttributeValue(attr.id, val)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Value Input + Presets */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                          <input 
                            type="text"
                            value={attributeValueInputs[attr.id] || ''}
                            onChange={(e) => setAttributeValueInputs(prev => ({ ...prev, [attr.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAttributeValue(attr.id);
                              }
                            }}
                            placeholder={`أدخل قيمة جديدة لـ ${attr.name} واضغط Enter...`}
                            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAttributeValue(attr.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            + إضافة
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                          <span className="text-[10px] text-slate-400 shrink-0">مقترحات:</span>
                          {presetValues.filter(p => !attr.values.includes(p)).slice(0, 5).map(presetVal => (
                            <button
                              key={presetVal}
                              type="button"
                              onClick={() => handleAddAttributeValue(attr.id, presetVal)}
                              className="px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[10px] border border-gray-200 shrink-0 font-medium transition-colors cursor-pointer"
                            >
                              + {presetVal}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CORE SECTION 2: PRICING STRATEGY MODE (Flexibility for all Business Models)*/}
          {/* ========================================================================= */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">2. إستراتيجية وطريقة تسعير المنتج (Pricing Strategy)</span>
              </div>

              {/* Pricing Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPricingStrategy('flat')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    pricingStrategy === 'flat' 
                      ? 'bg-white text-blue-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أ. سعر موحد
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPricingStrategy('single_attribute');
                    if (!pricingDriverAttributeId && productAttributes.length > 0) {
                      setPricingDriverAttributeId(productAttributes[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    pricingStrategy === 'single_attribute' 
                      ? 'bg-white text-blue-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ب. تسعير بحسب خاصية (Delta)
                </button>

                <button
                  type="button"
                  onClick={() => setPricingStrategy('matrix')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    pricingStrategy === 'matrix' 
                      ? 'bg-white text-blue-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ج. مصفوفة شاملة (Full Matrix)
                </button>
              </div>
            </div>

            {/* --- STRATEGY A: FLAT PRICING --- */}
            {pricingStrategy === 'flat' && (
              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">
                    السعر الأساسي الموحد لجميع الخيارات والتشكيلات
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full font-bold">
                    سعر موحد
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">السعر الأساسي (ريال) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">ريال</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>الخصم والعرض الترويجي</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHasBaseDiscount(!hasBaseDiscount);
                          if (hasBaseDiscount) setBaseDiscountPrice('');
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                          hasBaseDiscount ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                        }`}
                      >
                        {hasBaseDiscount ? '✓ الخصم مفعّل' : '+ تفعيل خصم'}
                      </button>
                    </label>

                    {hasBaseDiscount ? (
                      <div className="relative">
                        <input 
                          type="number"
                          min="0"
                          value={baseDiscountPrice}
                          onChange={(e) => setBaseDiscountPrice(Number(e.target.value))}
                          placeholder="السعر بعد الخصم"
                          className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs font-bold text-rose-700 font-sans focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 text-xs">ريال</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-lg bg-gray-100 text-slate-400 text-xs">
                        لا يوجد خصم مفعّل
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- STRATEGY B: SINGLE ATTRIBUTE DRIVER DELTA --- */}
            {pricingStrategy === 'single_attribute' && (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-amber-900 text-xs block">
                      الخاصية المتحكمة بالسعر والخصومات (Pricing Driver Attribute)
                    </span>
                    <span className="text-[11px] text-amber-700">
                      بقية الخصائص (كاللون أو النكهة) لن تؤثر على السعر.
                    </span>
                  </div>

                  {/* Driver Selector */}
                  <select
                    value={pricingDriverAttributeId}
                    onChange={(e) => setPricingDriverAttributeId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {productAttributes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.values.length} خيارات)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Table of Driver Attribute Prices */}
                {singleAttributePrices.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg border border-amber-200 text-center text-amber-800 text-xs">
                    يرجى إضافة قيم للخاصية المحددة لتوليد جدول التسعير.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs bg-white rounded-xl overflow-hidden border border-amber-200 shadow-2xs">
                      <thead>
                        <tr className="bg-amber-100/70 text-amber-950 font-bold border-b border-amber-200 text-[11px]">
                          <th className="p-2.5">قيمة {activeDriverAttribute?.name}</th>
                          <th className="p-2.5">السعر الأساسي (ريال)</th>
                          <th className="p-2.5">تفعيل خصم؟</th>
                          <th className="p-2.5">السعر بعد الخصم</th>
                          <th className="p-2.5 text-center">التوفر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {singleAttributePrices.map((item, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/40">
                            <td className="p-2.5 font-bold text-slate-800">
                              {item.value}
                            </td>
                            <td className="p-2.5">
                              <input 
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSingleAttributePrices(prev => prev.map((p, i) => i === idx ? { ...p, price: val } : p));
                                }}
                                className="w-24 px-2 py-1 border border-gray-200 rounded text-xs font-bold font-sans bg-gray-50 focus:bg-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSingleAttributePrices(prev => prev.map((p, i) => i === idx ? { ...p, hasDiscount: !p.hasDiscount } : p));
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                  item.hasDiscount ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-slate-600'
                                }`}
                              >
                                {item.hasDiscount ? '✓ خصم' : 'بدون'}
                              </button>
                            </td>
                            <td className="p-2.5">
                              {item.hasDiscount ? (
                                <input 
                                  type="number"
                                  value={item.discountPrice || ''}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSingleAttributePrices(prev => prev.map((p, i) => i === idx ? { ...p, discountPrice: val } : p));
                                  }}
                                  placeholder="سعر مخفض"
                                  className="w-24 px-2 py-1 border border-rose-300 rounded text-xs font-bold text-rose-700 font-sans bg-rose-50/30"
                                />
                              ) : (
                                <span className="text-slate-300 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSingleAttributePrices(prev => prev.map((p, i) => i === idx ? { ...p, inStock: !p.inStock } : p));
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  item.inStock !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.inStock !== false ? 'متوفر' : 'غير متوفر'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* --- STRATEGY C: FULL COMBINATION MATRIX PRICING (Shopify Style) --- */}
            {pricingStrategy === 'matrix' && (
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-purple-950 text-xs block">
                      مصفوفة التشكيلات والأسعار الشاملة (Full Matrix Combinations)
                    </span>
                    <span className="text-[11px] text-purple-700">
                      تم توليد {variantCombinations.length} تشكيلة مستقلة قابلة للتسعير وإدارة المخزون.
                    </span>
                  </div>

                  {/* Bulk Apply Action */}
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number"
                      value={bulkMatrixPriceInput}
                      onChange={(e) => setBulkMatrixPriceInput(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-purple-300 rounded-lg text-xs font-bold font-sans bg-white"
                      placeholder="السعر الموحد"
                    />
                    <button
                      type="button"
                      onClick={handleBulkApplyMatrixPrice}
                      className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      تطبيق على كل التشكيلات
                    </button>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto max-h-64 custom-scrollbar">
                  <table className="w-full text-right text-xs bg-white rounded-xl overflow-hidden border border-purple-200 shadow-2xs">
                    <thead className="sticky top-0 bg-purple-100/90 backdrop-blur-xs text-purple-950 font-bold border-b border-purple-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">اسم التشكيلة</th>
                        <th className="p-2.5">السعر الأساسي (ريال)</th>
                        <th className="p-2.5">السعر بعد الخصم</th>
                        <th className="p-2.5">رمز SKU</th>
                        <th className="p-2.5">المخزون</th>
                        <th className="p-2.5 text-center">التوفر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {variantCombinations.map((v, vIdx) => (
                        <tr key={v.id || vIdx} className="hover:bg-purple-50/40">
                          <td className="p-2.5 font-bold text-slate-800">
                            {v.title}
                          </td>
                          <td className="p-2.5">
                            <input 
                              type="number"
                              value={v.price}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVariantCombinations(prev => prev.map((item, i) => i === vIdx ? { ...item, price: val } : item));
                              }}
                              className="w-20 px-2 py-1 border border-gray-200 rounded text-xs font-bold font-sans bg-gray-50 focus:bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input 
                              type="number"
                              value={v.discountPrice || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVariantCombinations(prev => prev.map((item, i) => i === vIdx ? { 
                                  ...item, 
                                  discountPrice: val || undefined,
                                  hasDiscount: Boolean(val && val > 0)
                                } : item));
                              }}
                              placeholder="خصم"
                              className="w-20 px-2 py-1 border border-gray-200 rounded text-xs font-bold font-sans bg-gray-50 focus:bg-white text-rose-700"
                            />
                          </td>
                          <td className="p-2.5">
                            <input 
                              type="text"
                              value={v.sku || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariantCombinations(prev => prev.map((item, i) => i === vIdx ? { ...item, sku: val } : item));
                              }}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-xs font-mono bg-gray-50 focus:bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input 
                              type="number"
                              value={v.stock || 25}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVariantCombinations(prev => prev.map((item, i) => i === vIdx ? { ...item, stock: val } : item));
                              }}
                              className="w-16 px-2 py-1 border border-gray-200 rounded text-xs font-sans bg-gray-50 focus:bg-white"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setVariantCombinations(prev => prev.map((item, i) => i === vIdx ? { ...item, inStock: !item.inStock } : item));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                v.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {v.inStock ? 'متوفر' : 'غير متوفر'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: FOOD EXTRAS & MODIFIERS (Optional for Restaurants)             */}
          {/* ========================================================================= */}
          {(isRestaurant || extraOptions.length > 0) && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                  <span>خيارات الإضافات والصلصات للمطاعم (Extras & Surcharges)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExtraOptions(prev => [
                      ...prev,
                      {
                        title: 'مجموعة إضافات جديدة',
                        required: false,
                        items: [{ name: 'إضافة 1', extraPrice: 300 }]
                      }
                    ]);
                  }}
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة مجموعة إضافات</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {extraOptions.map((group, gIdx) => (
                  <div key={gIdx} className="p-3 bg-white rounded-xl border border-amber-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <input 
                        type="text"
                        value={group.title}
                        onChange={(e) => {
                          const updated = [...extraOptions];
                          updated[gIdx].title = e.target.value;
                          setExtraOptions(updated);
                        }}
                        className="font-bold text-slate-800 text-xs border-b border-amber-200 px-1 py-0.5 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setExtraOptions(prev => prev.filter((_, i) => i !== gIdx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {group.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...extraOptions];
                            updated[gIdx].items[itemIdx].name = e.target.value;
                            setExtraOptions(updated);
                          }}
                          placeholder="اسم الإضافة (مثلاً: جبنة إضافية)"
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50"
                        />
                        <div className="relative w-28">
                          <input 
                            type="number"
                            value={item.extraPrice}
                            onChange={(e) => {
                              const updated = [...extraOptions];
                              updated[gIdx].items[itemIdx].extraPrice = Number(e.target.value);
                              setExtraOptions(updated);
                            }}
                            placeholder="السعر الإضافي"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-bold font-sans bg-gray-50"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ريال</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...extraOptions];
                            updated[gIdx].items = updated[gIdx].items.filter((_, i) => i !== itemIdx);
                            setExtraOptions(updated);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...extraOptions];
                        updated[gIdx].items.push({ name: 'إضافة جديدة', extraPrice: 500 });
                        setExtraOptions(updated);
                      }}
                      className="text-[10px] text-amber-800 font-bold hover:underline block pt-1"
                    >
                      + إضافة عنصر داخل المجموعة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: GENERAL SPECS, WARRANTY, INVENTORY                             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-blue-600" />
                <span>رمز الباركود / SKU العام للمنتج</span>
              </label>
              <input 
                type="text" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PRD-1001"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                حالة توفر المنتج العام للطلب
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setInStock(true)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                    inStock 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                      : 'bg-white border-gray-200 text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  ✓ متوفر للطلب
                </button>
                <button
                  type="button"
                  onClick={() => setInStock(false)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                    !inStock 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-2xs' 
                      : 'bg-white border-gray-200 text-slate-600 hover:bg-rose-50'
                  }`}
                >
                  ✕ غير متوفر حالياً
                </button>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : (product ? 'حفظ التعديلات' : 'إضافة المنتج والتشكيلات')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  Truck, 
  ExternalLink, 
  Check, 
  ShoppingBag, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { GlobalProduct, GlobalStore } from '../../types';
import { GLOBAL_STORES, addToGlobalCart } from '../../lib/globalStoreService';

interface GlobalProductModalProps {
  product: GlobalProduct | null;
  onClose: () => void;
  onOpenCart: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const GlobalProductModal: React.FC<GlobalProductModalProps> = ({
  product,
  onClose,
  onOpenCart,
  onShowToast
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'قياسي');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || 'افتراضي');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const storeInfo: GlobalStore = GLOBAL_STORES.find(s => s.id === product.storeId) || GLOBAL_STORES[0];
  const images = product.galleryImages && product.galleryImages.length > 0 
    ? product.galleryImages 
    : [product.imageUrl];

  const handleAddToCart = (instantCheckout: boolean = false) => {
    setIsAdding(true);
    addToGlobalCart(product, {
      selectedSize,
      selectedColor,
      quantity
    });

    onShowToast(`تمت إضافة "${product.title.slice(0, 30)}..." إلى سلة مشتريات المتاجر العالمية`, 'success');
    
    setTimeout(() => {
      setIsAdding(false);
      if (instantCheckout) {
        onClose();
        onOpenCart();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 dir-rtl animate-in fade-in" dir="rtl">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${storeInfo.badgeColor}`}>
              {product.storeName}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              منتج مستورد مع ضمان الجودة والشحن لليمن
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Gallery (md:col-span-5) */}
          <div className="md:col-span-5 space-y-3">
            {/* Main Active Image Display */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square border border-gray-200 shadow-inner group">
              <img
                src={images[activeImageIndex] || product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {product.badge && (
                <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  {product.badge}
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="w-8 h-8 rounded-full bg-white/90 shadow-md text-slate-800 flex items-center justify-center hover:bg-white cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="w-8 h-8 rounded-full bg-white/90 shadow-md text-slate-800 flex items-center justify-center hover:bg-white cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Ribbon */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-blue-600 scale-95 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Delivery & Assurance Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>الشحن المباشر لليمن: {storeInfo.deliveryDays}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>شامل فحص الجودة والتغليف الجمركي الآمن</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>تسليم مباشر حتى العنوان المحدد في مدينتك</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Variants (md:col-span-7) */}
          <div className="md:col-span-7 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Product Title */}
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {product.title}
                </h1>
                {product.titleEn && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5 dir-ltr text-right">
                    {product.titleEn}
                  </p>
                )}
              </div>

              {/* Rating & Sales Row */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-slate-400">({product.reviewsCount.toLocaleString()} تقييم عميل)</span>
                {product.salesCount && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      تم طلب {product.salesCount.toLocaleString()} قطعة
                    </span>
                  </>
                )}
              </div>

              {/* Strict Dynamic Calculated Price Banner (Hiding Original Price) */}
              <div className="p-4 rounded-2xl bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">السعر النهائي الشامل لليمن:</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
                      {product.displayedPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-blue-900">ريال يمني (YER)</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="inline-block bg-white/90 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-blue-200 shadow-2xs">
                    شامل الشحن والجمارك ✓
                  </span>
                </div>
              </div>

              {/* Variant Selector: Size */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    المقاس المتاح: <span className="text-blue-600 font-bold">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-gray-50 text-slate-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variant Selector: Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    اللون المختار: <span className="text-blue-600 font-bold">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          selectedColor === c.name
                            ? 'bg-blue-50 text-blue-900 border-blue-500 ring-2 ring-blue-500/20 font-bold'
                            : 'bg-white text-slate-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Counter */}
              <div className="flex items-center gap-4 pt-1">
                <label className="text-xs font-bold text-slate-700">الكمية المطلوبة:</label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-slate-700 font-bold text-sm flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-slate-700 font-bold text-sm flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-xs text-slate-500 mr-auto">
                  الإجمالي: <strong className="font-mono text-slate-900 text-sm">{(product.displayedPrice * quantity).toLocaleString()}</strong> ر.ي
                </div>
              </div>

              {/* Specifications Table */}
              {product.specs && product.specs.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>مواصفات السلعة من المصدر:</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/80 space-y-1.5 text-[11px]">
                    {product.specs.map((spec, i) => (
                      <div key={i} className="flex items-start justify-between border-b border-gray-200/50 last:border-0 pb-1 last:pb-0">
                        <span className="text-slate-500 font-medium">{spec.label}:</span>
                        <span className="text-slate-800 font-semibold max-w-[65%] text-left">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                <p>{product.description}</p>
              </div>

              {/* Source Link Reference */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>رابط السلعة بالمصدر:</span>
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold underline truncate max-w-[200px]"
                >
                  <span>عرض السلعة الأصلية</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={isAdding}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>إضافة إلى سلة التسوق</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={isAdding}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>الشراء الفوري وإتمام الطلب</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

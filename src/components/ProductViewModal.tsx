import React from 'react';
import { 
  X, 
  Tag, 
  Package, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Layers, 
  Flame,
  Shirt,
  Palette,
  Coffee,
  HardDrive,
  ShieldCheck,
  Smartphone,
  Sliders,
  Scale,
  Sparkles,
  UtensilsCrossed,
  Percent
} from 'lucide-react';
import { Product } from '../types';

interface ProductViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const hasDiscount = Boolean(
    product.hasDiscount && product.discountPrice && product.discountPrice < product.price
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-200 transform transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-200" />
            <h3 className="text-base font-bold">تفاصيل المنتج والخيارات</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Image banner */}
          <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner group">
            <img 
              src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1.5 ${
                product.inStock 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-rose-600 text-white'
              }`}>
                {product.inStock ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {product.inStock ? 'متوفر بالمخزون' : 'غير متوفر'}
              </span>
            </div>

            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Flame className="w-3.5 h-3.5" />
                <span>عرض مخفض</span>
              </div>
            )}

            {product.sku && (
              <div className="absolute bottom-3 right-3 bg-slate-900/80 text-orange-300 text-[10px] font-mono px-2.5 py-1 rounded-md backdrop-blur-xs">
                رمز المنتج: {product.sku}
              </div>
            )}
          </div>

          {/* Gallery thumbnails */}
          {product.galleryImages && product.galleryImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {product.galleryImages.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt="" 
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" 
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}

          {/* Titles & Pricing */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">{product.name}</h4>
              <div className="text-left shrink-0 font-sans">
                {hasDiscount && product.discountPrice ? (
                  <div>
                    <div className="text-lg font-bold text-rose-700">
                      {product.discountPrice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ريال</span>
                    </div>
                    <div className="text-xs text-slate-400 line-through">
                      {product.price.toLocaleString()} ريال
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-bold text-blue-700">
                    {product.price.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ريال</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-lg font-medium">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                {product.categoryName || 'غير محدد'}
              </span>
              {product.sectionName && (
                <span className="bg-gray-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                  قسم: {product.sectionName}
                </span>
              )}
              {product.storeName && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-lg font-medium">
                  متجر: {product.storeName}
                </span>
              )}
            </div>
          </div>

          {/* Universal Attributes & Pricing Mode Display */}
          {product.productAttributes && product.productAttributes.length > 0 && (
            <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-950 font-bold">
                  <Sliders className="w-4 h-4 text-indigo-700" />
                  <span>خصائص وتشكيلات المنتج (Universal Variants)</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  {product.pricingStrategy === 'matrix' ? 'مصفوفة شاملة' : product.pricingStrategy === 'single_attribute' ? 'تسعير مخصص' : 'سعر موحد'}
                </span>
              </div>

              {/* Attributes Chips */}
              <div className="space-y-1.5">
                {product.productAttributes.map((attr) => (
                  <div key={attr.id} className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-bold text-slate-800">{attr.name}:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {attr.values.map((v) => (
                        <span key={v} className="bg-white text-indigo-900 font-bold px-2 py-0.5 rounded border border-indigo-200 text-[10px] shadow-2xs">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Matrix Table Preview if available */}
              {product.pricingStrategy === 'matrix' && product.variantCombinations && product.variantCombinations.length > 0 && (
                <div className="overflow-x-auto max-h-48 custom-scrollbar pt-1">
                  <table className="w-full text-right text-[11px] bg-white rounded-lg overflow-hidden border border-indigo-100">
                    <thead className="bg-indigo-100/60 text-indigo-950 font-bold">
                      <tr>
                        <th className="p-2">التشكيلة</th>
                        <th className="p-2">السعر</th>
                        <th className="p-2">الخصم</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50">
                      {product.variantCombinations.map((v, i) => (
                        <tr key={v.id || i}>
                          <td className="p-2 font-bold text-slate-800">{v.title}</td>
                          <td className="p-2 font-sans font-bold text-blue-700">{v.price.toLocaleString()} ريال</td>
                          <td className="p-2 font-sans text-rose-700">
                            {v.hasDiscount && v.discountPrice ? `${v.discountPrice.toLocaleString()} ريال` : '-'}
                          </td>
                          <td className="p-2 font-mono text-[10px] text-slate-400">{v.sku || '-'}</td>
                          <td className="p-2 text-center">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${v.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {v.inStock ? 'متوفر' : 'نفذ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Single Attribute Prices Table Preview */}
              {product.pricingStrategy === 'single_attribute' && product.singleAttributePrices && product.singleAttributePrices.length > 0 && (
                <div className="overflow-x-auto max-h-48 custom-scrollbar pt-1">
                  <table className="w-full text-right text-[11px] bg-white rounded-lg overflow-hidden border border-indigo-100">
                    <thead className="bg-indigo-100/60 text-indigo-950 font-bold">
                      <tr>
                        <th className="p-2">الخيار</th>
                        <th className="p-2">السعر</th>
                        <th className="p-2">سعر الخصم</th>
                        <th className="p-2 text-center">التوفر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50">
                      {product.singleAttributePrices.map((sp, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold text-slate-800">{sp.value}</td>
                          <td className="p-2 font-sans font-bold text-blue-700">{sp.price.toLocaleString()} ريال</td>
                          <td className="p-2 font-sans text-rose-700">
                            {sp.hasDiscount && sp.discountPrice ? `${sp.discountPrice.toLocaleString()} ريال` : '-'}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${sp.inStock !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {sp.inStock !== false ? 'متوفر' : 'نفذ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Mode B: Clothing Sizes & Colors */}
          {product.clothingSizes && product.clothingSizes.length > 0 && (
            <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                <Shirt className="w-4 h-4 text-purple-700" />
                <span>المقاسات والألوان المتاحة</span>
              </div>
              
              {/* Custom Size Prices */}
              {product.clothingPriceType === 'custom' && product.clothingSizePrices && product.clothingSizePrices.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {product.clothingSizePrices.map((sp) => (
                    <div key={sp.size} className="bg-white p-1.5 rounded-lg border border-purple-100 flex items-center justify-between">
                      <span className="font-bold text-purple-900 text-xs">{sp.size}</span>
                      <div className="text-left font-sans">
                        {sp.hasDiscount && sp.discountPrice ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-rose-700 text-xs">{sp.discountPrice.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 line-through">{sp.price.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-800 text-xs">{sp.price.toLocaleString()} ريال</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {product.clothingSizes.map(sz => (
                    <span key={sz} className="bg-white text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                      {sz}
                    </span>
                  ))}
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.colors.map(col => (
                    <span key={col} className="bg-white text-slate-800 px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium">
                      {col}
                    </span>
                  ))}
                </div>
              )}

              {product.material && (
                <div className="text-[11px] text-purple-900 pt-1">
                  <strong>الخامة:</strong> {product.material}
                </div>
              )}
            </div>
          )}

          {/* Mode C: Supermarket Weights */}
          {product.supermarketWeights && product.supermarketWeights.length > 0 && (
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>خيارات العبوات والأوزان</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.supermarketWeights.map((w, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">{w.unit}</span>
                    <div className="text-left font-sans">
                      {w.hasDiscount && w.discountPrice && w.discountPrice < w.price ? (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-rose-700 text-xs">{w.discountPrice.toLocaleString()} ريال</span>
                          <span className="text-[10px] text-slate-400 line-through">{w.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800 text-xs">{w.price.toLocaleString()} ريال</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode D: General Features */}
          {product.generalFeatures && product.generalFeatures.length > 0 && (
            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-900 font-bold">
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span>المواصفات والمميزات الأساسية</span>
              </div>
              <ul className="space-y-1">
                {product.generalFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Food options / modifiers */}
          {product.options && product.options.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>خيارات وإضافات الوجبة</span>
              </div>
              {product.options.map((opt, i) => (
                <div key={i} className="text-[11px] text-slate-700">
                  <span className="font-bold text-blue-800">{opt.title}: </span>
                  {opt.items.map(it => `${it.name} (+${it.extraPrice} ريال)`).join(' ، ')}
                </div>
              ))}
            </div>
          )}

          {/* Tech specs / Warranty */}
          {(product.techSpecs || product.warranty) && (
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                <Smartphone className="w-4 h-4 text-blue-700" />
                <span>المواصفات والضمان</span>
              </div>
              {product.techSpecs && (
                <p className="text-[11px] text-slate-700 font-mono">{product.techSpecs}</p>
              )}
              {product.warranty && (
                <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{product.warranty}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-slate-700 leading-relaxed">
              <h5 className="font-bold text-slate-800 mb-0.5">وصف المنتج:</h5>
              {product.description}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Tag, Package, Calendar, CheckCircle, XCircle, DollarSign, Layers } from 'lucide-react';
import { Product } from '../types';

interface ProductViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-200 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-200" />
            <h3 className="text-lg font-bold">تفاصيل المنتج</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Image banner */}
          <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner group">
            <img 
              src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute top-3 right-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 ${
                product.inStock 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}>
                {product.inStock ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {product.inStock ? 'متوفر بالمخزون' : 'غير متوفر'}
              </span>
            </div>
            {product.sku && (
              <div className="absolute bottom-3 right-3 bg-slate-900/80 text-orange-300 text-[11px] font-mono px-2.5 py-1 rounded-md backdrop-blur-xs">
                رمز المنتج: {product.sku}
              </div>
            )}
          </div>

          {/* Titles & Pricing */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-xl font-bold text-slate-800 leading-snug">{product.name}</h4>
              <div className="text-left shrink-0">
                <div className="text-xl font-bold text-green-600 font-sans">
                  {product.price.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ريال</span>
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-xs text-slate-400 line-through font-sans">
                    {product.originalPrice.toLocaleString()} ريال
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-lg font-medium">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                {product.categoryName || 'غير محدد'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                product.status === 'active' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-slate-600'
              }`}>
                الحالة: {product.status === 'active' ? 'نشط' : 'غير نشط'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-sm text-slate-700 leading-relaxed">
              <h5 className="font-bold text-slate-800 text-xs mb-1">وصف المنتج:</h5>
              {product.description}
            </div>
          )}

          {/* Details Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-slate-400 block mb-0.5">معرّف المنتج (ID):</span>
              <span className="font-mono text-slate-700 text-[11px] break-all">{product.id}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-slate-400 block mb-0.5">معرّف التصنيف:</span>
              <span className="font-mono text-slate-700 text-[11px] break-all">{product.categoryId}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

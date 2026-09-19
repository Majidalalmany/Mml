import React from 'react';
import { AlertTriangle, Trash2, X, RefreshCw, Layers, Store as StoreIcon, Package } from 'lucide-react';
import { Category, Store } from '../types';

interface CascadeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemType: 'category' | 'store';
  item: Category | Store | null;
  affectedStoresCount?: number;
  affectedProductsCount?: number;
  isDeleting: boolean;
}

export const CascadeDeleteModal: React.FC<CascadeDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  item,
  affectedStoresCount = 0,
  affectedProductsCount = 0,
  isDeleting
}) => {
  if (!isOpen || !item) return null;

  const isCategory = itemType === 'category';
  const itemName = item.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-5 text-right dir-rtl animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Title & Warning */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            تأكيد حذف {isCategory ? 'الفئة' : 'المتجر'} نهائياً
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            أنت على وشك حذف <strong className="text-slate-900 font-bold">"{itemName}"</strong> من النظام. هذا الإجراء متسلسل ولا يمكن التراجع عنه.
          </p>
        </div>

        {/* Cascade Impact Card */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2.5">
          <span className="text-[11px] font-bold text-rose-900 block">
            ⚠️ العناصر التابعة التي سيتم حذفها تلقائياً (Cascade Delete):
          </span>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {isCategory && (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rose-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <StoreIcon className="w-4 h-4 text-rose-500" />
                  <span>المتاجر التابعة لهذه الفئة:</span>
                </div>
                <span className="font-bold font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  {affectedStoresCount} متجر
                </span>
              </div>
            )}

            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rose-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Package className="w-4 h-4 text-rose-500" />
                <span>المنتجات والأصناف المرتبطة:</span>
              </div>
              <span className="font-bold font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                {affectedProductsCount} صنف ومنتج
              </span>
            </div>
          </div>

          <p className="text-[10px] text-rose-800 leading-tight">
            * سيتم تنفيذ العملية في قاعدة البيانات كدفعة واحدة ذرية (writeBatch) لضمان عدم بقاء أي سجلات يتيمة.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            إلغاء الإجراء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري الحذف الذري...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف متسلسل نهائي</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

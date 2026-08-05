import React, { useState, useEffect } from 'react';
import { X, Tag, Check, UtensilsCrossed, Flame, Pizza, Coffee, Cake, ShoppingBag, Pill, Sparkles, Tv, BookOpen, Layers, Apple, Shirt, Store } from 'lucide-react';
import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>) => Promise<void>;
  category?: Category | null;
}

const CATEGORY_PRESETS = [
  { name: 'محلات عصائر ومرطبات', nameEn: 'Juice & Beverage Shops', icon: 'Apple', coverUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
  { name: 'سوبرماركت وبقالة', nameEn: 'Supermarket & Grocery', icon: 'ShoppingBag', coverUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' },
  { name: 'محلات ملابس وموضة', nameEn: 'Clothing & Fashion', icon: 'Shirt', coverUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80' },
  { name: 'مطاعم ومقاهي', nameEn: 'Restaurants & Cafes', icon: 'UtensilsCrossed', coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' },
  { name: 'مخابز وحلويات', nameEn: 'Bakeries & Sweets', icon: 'Cake', coverUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
  { name: 'صيدليات ومستلزمات طبية', nameEn: 'Pharmacies & Health', icon: 'Pill', coverUrl: 'https://images.unsplash.com/photo-1586015555751-63c3d0c29676?auto=format&fit=crop&w=800&q=80' },
  { name: 'إلكترونيات وجوالات', nameEn: 'Electronics & Gadgets', icon: 'Tv', coverUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80' },
  { name: 'بهارات وعطارة', nameEn: 'Spices & Seasonings', icon: 'Flame', coverUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80' }
];

const AVAILABLE_ICONS = [
  { id: 'Apple', label: 'عصائر', Icon: Apple },
  { id: 'ShoppingBag', label: 'سوبرماركت', Icon: ShoppingBag },
  { id: 'Shirt', label: 'ملابس', Icon: Shirt },
  { id: 'UtensilsCrossed', label: 'مطاعم', Icon: UtensilsCrossed },
  { id: 'Cake', label: 'مخابز', Icon: Cake },
  { id: 'Pill', label: 'صيدليات', Icon: Pill },
  { id: 'Tv', label: 'إلكترونيات', Icon: Tv },
  { id: 'Flame', label: 'بهارات', Icon: Flame },
  { id: 'Sparkles', label: 'عطور', Icon: Sparkles },
  { id: 'BookOpen', label: 'قرطاسية', Icon: BookOpen },
  { id: 'Coffee', label: 'كافيهات', Icon: Coffee },
  { id: 'Store', label: 'متجر عام', Icon: Store }
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [icon, setIcon] = useState('UtensilsCrossed');
  const [coverUrl, setCoverUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setNameEn(category.nameEn || '');
      setIcon(category.icon || 'UtensilsCrossed');
      setCoverUrl(category.coverUrl || '');
      setOrder(category.order || 1);
      setStatus(category.status || 'active');
      setDescription(category.description || '');
    } else {
      setName('');
      setNameEn('');
      setIcon('UtensilsCrossed');
      setCoverUrl(CATEGORY_PRESETS[0].coverUrl);
      setOrder(1);
      setStatus('active');
      setDescription('');
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const applyPreset = (preset: typeof CATEGORY_PRESETS[0]) => {
    setName(preset.name);
    setNameEn(preset.nameEn);
    setIcon(preset.icon);
    setCoverUrl(preset.coverUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم التصنيف');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        nameEn: nameEn.trim(),
        icon,
        coverUrl: coverUrl.trim(),
        order: Number(order),
        status,
        description: description.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التصنيف في Firestore');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-200" />
            <h3 className="text-lg font-bold">
              {category ? 'تعديل بيانات التصنيف' : 'إضافة تصنيف جديد (مطاعم/صيدليات/سوبرماركت...)'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              اختيار مسبق سريع للتصنيفات الرئيسية
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORY_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-bold rounded-lg border border-gray-200 shrink-0 transition-colors"
                >
                  + {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Category Name Arabic */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              اسم التصنيف (بالعربي) <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مطاعم / صيدليات / سوبر ماركت / بهارات"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              required
            />
          </div>

          {/* Category Name English */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              الاسم باللغة الإنجليزية
            </label>
            <input 
              type="text" 
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Example: Restaurants & Food"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              رابط صورة غلاف التصنيف (Cover Image)
            </label>
            <input 
              type="text" 
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ترتيب ظهور التصنيف في تطبيق المستهلك
            </label>
            <input 
              type="number" 
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              min="1"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              الأيقونة المرافقة
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.Icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs' 
                        : 'bg-gray-50 border-gray-200 text-slate-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComp className="w-4 h-4 mb-0.5 text-blue-600" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              حالة التفعيل والتظليل
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            >
              <option value="active">نشط (يظهر بالواجهة الرئيسية)</option>
              <option value="inactive">مخفي (إيقاف مؤقت)</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{category ? 'حفظ التعديلات' : 'إضافة التصنيف'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

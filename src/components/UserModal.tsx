import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Check, Lock, Building, Phone, Mail, User, Key } from 'lucide-react';
import { AdminUser, Store, RoleType } from '../types';
import { ROLE_DEFINITIONS, ALL_MODULES } from '../lib/permissions';
import { checkDuplicateUserPhone } from '../lib/phoneUtils';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<AdminUser>) => Promise<void>;
  user?: AdminUser | null;
  stores: Store[];
  users?: AdminUser[];
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  stores,
  users = []
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<RoleType>('stores_manager');
  const [storeId, setStoreId] = useState<string>('all');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPassword('');
      setPhone(user.phone || '');
      setRole(user.role || 'stores_manager');
      setStoreId(user.storeId || 'all');
      setStatus(user.status || 'active');
      setPermissions(user.permissions || ROLE_DEFINITIONS[user.role || 'custom']?.defaultPermissions || {});
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('stores_manager');
      setStoreId('all');
      setStatus('active');
      setPermissions(ROLE_DEFINITIONS.stores_manager.defaultPermissions);
    }
    setError(null);
  }, [user, isOpen]);

  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    if (ROLE_DEFINITIONS[newRole]) {
      setPermissions(ROLE_DEFINITIONS[newRole].defaultPermissions);
    }
  };

  const handlePermissionToggle = (modId: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    setPermissions(prev => {
      const current = prev[modId] || { view: false, create: false, edit: false, delete: false };
      const updated = { ...current, [action]: !current[action] };
      if ((action === 'create' || action === 'edit' || action === 'delete') && updated[action]) {
        updated.view = true;
      }
      return { ...prev, [modId]: updated };
    });
    setRole('custom');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('يرجى ادخال اسم الموظف / المستخدم');
      return;
    }

    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف / الجوال (المعرف الأساسي والوحيد الإجباري)');
      return;
    }

    const dupCheck = checkDuplicateUserPhone(phone, users, user?.id);
    if (dupCheck.isDuplicate) {
      setError(`⚠️ رقم الهاتف (${phone.trim()}) مسجل مسبقاً لموظف/مستخدم آخر باسم "${dupCheck.existingName}". يرجى استخدام رقم هاتف آخر لتجنب أخطاء تكرار البيانات.`);
      return;
    }

    if (email.trim() && !email.includes('@')) {
      setError('يرجى ادخال بريد إلكتروني صحيح عند إدخاله (البريد اختياري)');
      return;
    }

    if (!user && !password.trim()) {
      setError('يرجى تعيين كلمة مرور للحساب الجديد');
      return;
    }

    if (password.trim() && password.trim().length < 8) {
      setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        email: email.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
        phone: phone.trim(),
        role,
        storeId,
        status,
        permissions
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات المستخدم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-gray-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-200" />
            <h3 className="text-lg font-bold">
              {user ? 'تعديل بيانات ورتبة وصلاحيات الموظف' : 'إضافة موظف جديد وتعيين الصلاحية'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Basic User Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                اسم الموظف الكامل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله اليماني"
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                رقم الهاتف / الجوال (المعرف الإجباري) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="77XXXXXXX"
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                البريد الإلكتروني <span className="text-slate-400 text-[10px] font-normal">(اختياري)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@jahez.com (اختياري)"
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                كلمة المرور {user
                  ? <span className="text-slate-400 text-[10px] font-normal">(اتركها فارغة للإبقاء على الحالية)</span>
                  : <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                حالة الحساب
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-700 font-bold"
              >
                <option value="active">نشط ومستمر (Active)</option>
                <option value="suspended">موقوف مؤقتاً (Suspended)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                نطاق المتجر المخصص
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-slate-700"
              >
                <option value="all">كافة المتاجر والفروع (صلاحية عامة)</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.categoryName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Presets Selection (13 Roles) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                اختيار رتبة الموظف (13 دور معتمد في المنظومة):
              </label>
              <span className="text-[11px] text-blue-600 font-bold">
                {ROLE_DEFINITIONS[role]?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50/50 custom-scrollbar">
              {Object.values(ROLE_DEFINITIONS).map((roleItem) => {
                const isSelected = role === roleItem.id;
                return (
                  <button
                    key={roleItem.id}
                    type="button"
                    onClick={() => handleRoleChange(roleItem.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-gray-200 text-slate-700 hover:bg-blue-50/50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block truncate">{roleItem.label}</span>
                      <span className={`text-[10px] line-clamp-2 mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {roleItem.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular RBAC Checkbox Matrix */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800">مصفوفة الصلاحيات الجراحية (RBAC Matrix)</h4>
                <p className="text-[11px] text-slate-400">
                  تحديد دقيق لعمليات (عرض، إضافة، تعديل، حذف) لكل وحدة في القائمة الجانبية
                </p>
              </div>
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 font-bold px-2.5 py-1 rounded-full">
                {role === 'custom' ? 'صلاحية مخصصة' : ROLE_DEFINITIONS[role]?.label}
              </span>
            </div>

            <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-slate-500 border-b border-gray-200 text-[11px] font-bold sticky top-0 z-10">
                    <th className="p-3">وحدة النظام</th>
                    <th className="p-3 text-center w-20">عرض (View)</th>
                    <th className="p-3 text-center w-20">إضافة (Create)</th>
                    <th className="p-3 text-center w-20">تعديل (Edit)</th>
                    <th className="p-3 text-center w-20">حذف (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60 bg-white">
                  {ALL_MODULES.map((mod) => {
                    const p = permissions[mod.id] || { view: false, create: false, edit: false, delete: false };

                    return (
                      <tr key={mod.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-2.5 font-semibold text-slate-800">
                          {mod.label}
                        </td>
                        
                        {/* View */}
                        <td className="p-2.5 text-center">
                          <input 
                            type="checkbox"
                            checked={!!p.view}
                            onChange={() => handlePermissionToggle(mod.id, 'view')}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Create */}
                        <td className="p-2.5 text-center">
                          <input 
                            type="checkbox"
                            checked={!!p.create}
                            onChange={() => handlePermissionToggle(mod.id, 'create')}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Edit */}
                        <td className="p-2.5 text-center">
                          <input 
                            type="checkbox"
                            checked={!!p.edit}
                            onChange={() => handlePermissionToggle(mod.id, 'edit')}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Delete */}
                        <td className="p-2.5 text-center">
                          <input 
                            type="checkbox"
                            checked={!!p.delete}
                            onChange={() => handlePermissionToggle(mod.id, 'delete')}
                            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>جاري الحفظ في Firestore...</span>
              ) : (
                <span>حفظ بيانات الحساب والحقوق</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

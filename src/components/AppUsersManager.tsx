import React, { useState } from 'react';
import { Users, User, Phone, Edit2, Plus, Search, ShieldCheck, CheckCircle2, UserCheck, X } from 'lucide-react';
import { AppUser, AdminUser } from '../types';
import { checkDuplicateUserPhone } from '../lib/phoneUtils';

interface AppUsersManagerProps {
  users: AppUser[];
  currentUser: AdminUser | null;
  isLoading: boolean;
  onSaveUser: (userData: Partial<AppUser>) => Promise<void>;
}

export const AppUsersManager: React.FC<AppUsersManagerProps> = ({
  users = [],
  currentUser,
  isLoading,
  onSaveUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeUsers = users || [];

  const filteredUsers = safeUsers.filter(user => {
    if (genderFilter !== 'all' && user.gender !== genderFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = user.name?.toLowerCase().includes(term);
      const phoneMatch = user.phone?.toLowerCase().includes(term);
      const emailMatch = user.email?.toLowerCase().includes(term);
      if (!nameMatch && !phoneMatch && !emailMatch) return false;
    }
    return true;
  });

  const handleOpenModal = (user: AppUser) => {
    setError(null);
    setEditingUser(user);
    setName(user.name);
    setPhone(user.phone);
    setGender(user.gender || 'male');
    setEmail(user.email || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('يرجى ملء الاسم ورقم الهاتف بالكامل');
      return;
    }

    // Check duplicate phone
    const dupCheck = checkDuplicateUserPhone(phone, users, editingUser?.id);
    if (dupCheck.isDuplicate) {
      setError(`⚠️ رقم الهاتف (${phone.trim()}) مسجل مسبقاً لعميل آخر باسم "${dupCheck.existingName}". يرجى إدخال رقم هاتف آخر.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveUser({
        ...(editingUser ? { id: editingUser.id } : {}),
        name: name.trim(),
        phone: phone.trim(),
        gender,
        email: email.trim()
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving customer profile:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">سجل وحسابات عملاء التطبيق</h2>
              <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-200">
                إدارة وسجل الحسابات
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              استعراض حسابات العملاء المسجلين وتعديل ملفاتهم الشخصية (الاسم، رقم الهاتف، والنوع).
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-xl max-w-md text-xs text-emerald-950 flex items-start gap-2 shadow-2xs">
          <span className="text-base shrink-0">🔒</span>
          <div>
            <span className="font-bold block mb-0.5 text-emerald-950">عزل أمني تام (Collection Isolation):</span>
            <span>
              بيانات العملاء محفوظة حصراً في مجموعة <strong>clients</strong>، ومندوبو التوصيل في مجموعة <strong>drivers</strong>، والمدراء في مجموعة <strong>adminUsers</strong> مع حظر عابر لمجموعات الحسابات.
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني للعميل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="w-full md:w-48 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الأنواع (الكل)</option>
            <option value="male">ذكور 👨</option>
            <option value="female">إناث 👩</option>
          </select>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                  user.gender === 'female' ? 'bg-pink-500' : 'bg-blue-600'
                }`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono dir-ltr block">{user.phone}</span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                user.gender === 'female'
                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {user.gender === 'female' ? 'أنثى 👩' : 'ذكر 👨'}
              </span>
            </div>

            {user.email && (
              <p className="text-xs text-slate-500 bg-gray-50 p-2 rounded-lg font-mono">
                {user.email}
              </p>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px]">
                مسجل منذ: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-YE') : 'سابقاً'}
              </span>

              <button
                onClick={() => handleOpenModal(user)}
                className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>تعديل الملف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                تعديل ملف العميل الشخصي
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="font-bold text-slate-700 block mb-1">الاسم الكامل (الاسم):</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: أحمد بن علي المقالح"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم الهاتف (Phone):</label>
                <input 
                  type="text" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="770000000"
                  className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">النوع / الجنس (Gender):</label>
                <select 
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                >
                  <option value="male">ذكر 👨</option>
                  <option value="female">أنثى 👩</option>
                  <option value="other">آخر / غير محدد</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">البريد الإلكتروني (اختياري):</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {isSubmitting ? 'حفظ...' : 'حفظ بيانات الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

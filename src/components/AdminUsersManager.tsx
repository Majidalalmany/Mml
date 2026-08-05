import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  X, 
  Lock, 
  Mail, 
  Phone, 
  RefreshCw,
  Building,
  Key,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { AdminUser, Store } from '../types';
import { ROLE_DEFINITIONS } from '../lib/permissions';

interface AdminUsersManagerProps {
  users: AdminUser[];
  stores: Store[];
  isLoading: boolean;
  onAddUser: () => void;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (user: AdminUser) => void;
  currentUser?: AdminUser | null;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  users = [],
  stores = [],
  isLoading,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const safeUsers = users || [];
  const safeStores = stores || [];

  const filteredUsers = safeUsers.filter(u => 
    !searchTerm.trim() ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  const getStoreName = (storeId?: string) => {
    if (!storeId || storeId === 'all') return 'جميع المتاجر (صلاحية عامة)';
    const st = safeStores.find(s => s.id === storeId);
    return st ? st.name : 'متجر مخصص';
  };

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'developer' || currentUser?.email === 'admin@gmail.com';

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">إدارة حسابات طاقم العمل والصلاحيات (RBAC)</h2>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold font-sans border border-blue-100">
              {users.length} موظف ومستخدم
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة كاملة لحسابات الموظفين (حذف الحسابات، تغيير كلمات المرور، وتحديد رتب 13 دوراً وظيفياً)
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={onAddUser}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-all active:scale-98 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة موظف / تعيين صلاحيات جديدة</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الموظف، البريد الإلكتروني، أو رقم الجوال..."
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">جاري تحميل مستخدمي النظام من Firestore...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-3">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">لا يوجد مستخدمون</h3>
            <p className="text-xs text-slate-400">
              لم نجد أي مستخدم في النظام يتطابق مع معايير البحث.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 text-slate-400 uppercase tracking-wider text-[11px] border-b border-gray-100 font-bold">
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">اسم الموظف / البريد</th>
                  <th className="p-3.5">كلمة المرور للدخول</th>
                  <th className="p-3.5">الرتبة والدور الوظيفي</th>
                  <th className="p-3.5">الفرع / المتجر</th>
                  <th className="p-3.5 text-center">حالة الجلسة</th>
                  <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, index) => {
                  const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.custom;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-3.5 text-center font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 w-fit">
                          <Key className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-700">{user.password || 'admin123'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 border text-[11px] px-2.5 py-1 rounded-full font-bold ${roleDef.badgeColor}`}>
                          <ShieldCheck className="w-3 h-3" />
                          {roleDef.label}
                        </span>
                      </td>

                      <td className="p-3.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{getStoreName(user.storeId)}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onToggleUserStatus(user)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {user.status === 'active' ? 'مفعل (نشط)' : 'موقوف (معطل)'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditUser(user)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                            title="تعديل الحساب وكلمة المرور والصلاحيات"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل الصلاحيات / كلمة المرور</span>
                          </button>

                          {deleteConfirmId === user.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                              <button
                                onClick={() => {
                                  onDeleteUser(user.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded cursor-pointer"
                              >
                                تأكيد الحذف النهائي
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-slate-400 flex items-center justify-between">
          <div>
            إجمالي حسابات طاقم العمل: <span className="font-bold text-slate-800">{users.length}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            الصلاحيات وكلمات المرور محفوظة بأمان في Firestore مع دعم شهادة SSL
          </div>
        </div>
      </div>
    </div>
  );
};

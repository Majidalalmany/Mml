import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, Database, ShieldCheck, Lock, LogOut, User, MapPin, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { AdminUser } from '../types';
import { ROLE_DEFINITIONS } from '../lib/permissions';

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  onSeedData: () => void;
  isSeeding: boolean;
  activeTabLabel: string;
  currentUser: AdminUser | null;
  onLogout: () => void;
  onSwitchUser?: (u: AdminUser) => void;
  users?: AdminUser[];
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  selectedBranch,
  setSelectedBranch,
  onSeedData,
  isSeeding,
  activeTabLabel,
  currentUser,
  onLogout,
  onSwitchUser,
  users = []
}) => {
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const branches = ['الفرع: صنعاء', 'الفرع: عدن', 'الفرع: تعز', 'الفرع: الحديدة', 'الكل (جميع الفروع)'];
  const roleDef = currentUser ? (ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.custom) : null;

  return (
    <header className="bg-white text-slate-800 border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        
        {/* Right Section: Sidebar toggle button + Active tab indicator */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onToggleSidebar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-all shadow-2xs active:scale-95"
            title="فتح / إغلاق القائمة الجانبية"
          >
            <Menu className="w-4 h-4 text-blue-700" />
            <span>القائمة الجانبية</span>
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight hidden sm:block">جاهز</h2>
            <span className="text-gray-300 text-xs hidden sm:inline">|</span>
            <span className="text-blue-700 text-xs font-semibold bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
              {activeTabLabel}
            </span>
          </div>

          {/* SSL Lock Badge */}
          <div className="hidden xl:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال SSL آمن</span>
          </div>
        </div>

        {/* Center / Left Controls */}
        <div className="flex items-center gap-3">

          {/* Branch Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200"
            >
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{selectedBranch}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showBranchMenu && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white text-slate-800 rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                {branches.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setSelectedBranch(b);
                      setShowBranchMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-2 text-xs font-medium hover:bg-gray-50 flex items-center justify-between ${
                      selectedBranch === b ? 'text-blue-600 font-bold bg-blue-50/70' : 'text-slate-700'
                    }`}
                  >
                    <span>{b}</span>
                    {selectedBranch === b && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>



          {/* Firestore Seed / Sync Button */}
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-gray-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-200 shadow-2xs disabled:opacity-50"
            title="إعادة تهيئة البيانات الأولية في Firestore"
          >
            <Database className={`w-3.5 h-3.5 text-blue-600 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'جاري التحميل...' : 'تحديث البيانات'}</span>
          </button>

          {/* User Profile Dropdown */}
          {currentUser && (
            <div className="relative border-r border-gray-200 pr-3 mr-1">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-blue-200 shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-right text-xs">
                  <div className="font-bold text-slate-800 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-blue-600 font-semibold">{roleDef?.label || currentUser.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 bg-gray-50 rounded-xl mb-2 text-right">
                    <div className="font-bold text-xs text-slate-800">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                    {roleDef && (
                      <span className={`inline-flex items-center gap-1 border text-[10px] px-2 py-0.5 rounded-full font-bold mt-1.5 ${roleDef.badgeColor}`}>
                        <ShieldCheck className="w-3 h-3" />
                        {roleDef.label}
                      </span>
                    )}
                  </div>

                  {/* Switch User List */}
                  {users.length > 0 && onSwitchUser && (
                    <div className="space-y-1 mb-2">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1">تبديل الحساب السريع:</div>
                      <div className="max-h-36 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                              u.email === currentUser.email ? 'font-bold text-blue-700 bg-blue-50/70' : 'text-slate-700'
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {ROLE_DEFINITIONS[u.role]?.label || u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-right px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <span>تسجيل الخروج</span>
                      <LogOut className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

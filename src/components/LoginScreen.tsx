import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowLeft,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { AdminUser } from '../types';

interface LoginScreenProps {
  users?: AdminUser[];
  onLoginSuccess: (user: AdminUser, rememberMe?: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users = [],
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setError('يرجى كتابة البريد الإلكتروني');
      return;
    }

    if (!cleanPass) {
      setError('يرجى كتابة كلمة المرور');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Search in registered users (added by Admin or seeded)
      const foundUser = (users || []).find(u => u?.email && u.email.toLowerCase() === cleanEmail);

      if (foundUser) {
        if (foundUser.status === 'suspended') {
          setError('حسابك موقوف مؤقتاً. يرجى التواصل مع المدير العام.');
          setIsLoading(false);
          return;
        }

        // Verify password
        const expectedPass = foundUser.password || 'admin123';
        if (expectedPass !== cleanPass) {
          setError('كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.');
          setIsLoading(false);
          return;
        }

        onLoginSuccess(foundUser, rememberMe);
        setIsLoading(false);
        return;
      }

      // Default fallback for initial Super Admin
      if (cleanEmail === 'admin@gmail.com' && cleanPass === 'admin123') {
        const defaultSuperAdmin: AdminUser = {
          id: 'super-admin-default',
          name: 'المدير العام',
          email: 'admin@gmail.com',
          role: 'super_admin',
          status: 'active',
          storeId: 'all'
        };
        onLoginSuccess(defaultSuperAdmin, rememberMe);
        setIsLoading(false);
        return;
      }

      setError('لم يتم العثور على حساب بهذا البريد الإلكتروني أو أن كلمة المرور غير صحيحة. تواصل مع المسؤول لإضافة حسابك.');
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans dir-rtl relative overflow-hidden" dir="rtl">
      
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Security Banner (SSL Notification) */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 py-2.5 px-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تشفير آمن مفعّل SSL / HTTPS</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-mono text-[11px]">https://jahezye.com</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              256-bit TLS Encrypted
            </span>
            <span className="hidden md:inline text-slate-500">نظام إدارة جاهز الموحد v2.4</span>
          </div>
        </div>
      </header>

      {/* Main Login Workspace - Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-auto">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                <div className="w-5 h-5 border-2 border-white rounded-xs" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">جاهز | Jahez</h1>
                <span className="text-xs text-blue-400 block font-medium">تسجيل الدخول للنظام</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1 rounded-full text-[11px] font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>SSL Secured</span>
            </div>
          </div>

          {/* Intro description */}
          <p className="text-xs text-slate-400">
            أدخل البريد الإلكتروني وكلمة المرور الخاصة بك والمخصصة لك من قبل إدارة النظام لدخول حسابك.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                البريد الإلكتروني <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  كلمة المرور <span className="text-rose-400">*</span>
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>تذكرني في هذا الجهاز</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>جاري التحقق من الحساب...</span>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Security Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 gap-2">
          <div>جميع الحقوق محفوظة منصة جاهز © 2026</div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>سياسة الخصوصية</span>
            <span>•</span>
            <span>اتفاقية الاستخدام</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> SSL Secured Domain
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};


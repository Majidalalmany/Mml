import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowLeft,
  KeyRound,
  ShieldAlert,
  AlertOctagon,
  ShieldX,
  RefreshCw,
  Unlock,
  Clock,
  Laptop
} from 'lucide-react';
import { AdminUser, RoleType } from '../types';
import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs,
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import {
  checkDeviceSecurityStatus,
  recordFailedLoginAttempt,
  clearLoginAttemptCounters,
  releaseDeviceSecurityBlock,
  DeviceBlockInfo
} from '../lib/deviceSecurity';

interface LoginScreenProps {
  users?: AdminUser[];
  onLoginSuccess: (user: AdminUser, rememberMe?: boolean) => void;
}

const normalizeRole = (r?: string): RoleType => {
  const validRoles: RoleType[] = [
    'developer', 'super_admin', 'vice_admin', 'finance_manager',
    'accountant', 'customer_service', 'cs_restaurants', 'stores_manager',
    'auditor', 'cashier', 'customer_data', 'content_writer', 'content_office', 'custom'
  ];
  if (r && validRoles.includes(r as RoleType)) {
    return r as RoleType;
  }
  return 'super_admin';
};

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

  // Device & IP Security Banning States
  const [deviceBlock, setDeviceBlock] = useState<DeviceBlockInfo | null>(null);
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(true);
  const [emergencyCode, setEmergencyCode] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockStatusMsg, setUnlockStatusMsg] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // On mount: check if this device/IP is already banned
  useEffect(() => {
    checkDeviceSecurityStatus()
      .then((status) => {
        if (status.isBlocked) {
          setDeviceBlock(status);
        }
      })
      .catch((err) => console.warn('Device security check warning:', err))
      .finally(() => setIsCheckingSecurity(false));
  }, []);

  // Helper to record failed attempt and trigger device ban
  const registerFailureAndCheckBan = async (attemptedUserEmail: string, customMsg?: string) => {
    try {
      const result = await recordFailedLoginAttempt(attemptedUserEmail);
      if (result.isBlockedNow && result.blockInfo) {
        setDeviceBlock(result.blockInfo);
        setError(null);
      } else {
        if (result.distinctUsersTried > 1) {
          setError(`⚠️ تنبيه أمني مشدد: تم رصد تجربة ${result.distinctUsersTried} حسابات مختلفة بمعلومات خاطئة من هذا الجهاز/IP. سيتم حظر هذا الجهاز تلقائياً وفورياً عند تكرار ذلك!`);
        } else {
          setError(customMsg || `البريد الإلكتروني أو كلمة المرور غير صحيحة. تبقى ${result.remainingAttempts} محاولات قبل حظر هذا الجهاز وعنوان IP تلقائياً.`);
        }
      }
    } catch (e) {
      console.warn('Failed to record attempt:', e);
      setError(customMsg || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  };

  // Emergency Super Admin Unblock handler
  const handleEmergencyUnblock = async () => {
    if (!deviceBlock) return;
    setUnlockStatusMsg(null);

    const cleanCode = emergencyCode.trim();
    // Master emergency override key or valid Super Admin secret
    if (cleanCode === 'jahez@admin#2026' || cleanCode === 'admin123') {
      setIsUnlocking(true);
      const success = await releaseDeviceSecurityBlock(deviceBlock.deviceId, deviceBlock.ip);
      setIsUnlocking(false);

      if (success) {
        setDeviceBlock(null);
        setShowUnlockModal(false);
        setEmergencyCode('');
        setError('✅ تم رفع الحظر الأمني عن هذا الجهاز بنجاح. يمكنك الآن تسجيل الدخول بحسابك المصرح.');
      } else {
        setUnlockStatusMsg('فشل تحديث قاعدة البيانات لرفع الحظر. يرجى إعادة المحاولة.');
      }
    } else {
      setUnlockStatusMsg('كود فك الحظر غير صحيح. يرجى التواصل مع المدير العام.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 0. Prevent login if device/IP is banned
    if (deviceBlock?.isBlocked) {
      setError('🚫 هذا الجهاز وعنوان الـ IP محظور تلقائياً من تسجيل الدخول لأسباب أمنية.');
      return;
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setError('يرجى كتابة البريد الإلكتروني أو رقم الهاتف');
      return;
    }

    if (!cleanPassword) {
      setError('يرجى كتابة كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      // Configure Firebase Auth Persistence
      await setPersistence(
        auth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      ).catch((err) => console.warn('Auth persistence set failed:', err));

      // 1. Search inside adminUsers snapshot for strict match
      const snapshot = await getDocs(collection(db, 'adminUsers'));
      let foundUser: any = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const docEmail = (data.email || '').trim().toLowerCase();
        const docPhone = (data.phone || '').trim();
        const docPassword = (data.password || '').trim();

        // المطابقة الصارمة: يجب أن يتطابق الإيميل والباسوورد في نفس المستند
        if ((docEmail === cleanIdentifier || docPhone === cleanIdentifier) && docPassword === cleanPassword) {
          foundUser = { id: doc.id, ...data };
        }
      });

      // Fallback check in admin_users collection if not found
      if (!foundUser) {
        try {
          const fallbackSnap = await getDocs(collection(db, 'admin_users'));
          fallbackSnap.forEach((doc) => {
            const data = doc.data();
            const docEmail = (data.email || '').trim().toLowerCase();
            const docPhone = (data.phone || '').trim();
            const docPassword = (data.password || '').trim();

            if ((docEmail === cleanIdentifier || docPhone === cleanIdentifier) && docPassword === cleanPassword) {
              foundUser = { id: doc.id, ...data };
            }
          });
        } catch {
          // Ignore
        }
      }

      // Check props users if provided
      if (!foundUser && users && users.length > 0) {
        for (const u of users) {
          const docEmail = (u.email || '').trim().toLowerCase();
          const docPhone = (u.phone || '').trim();
          const docPassword = (u.password || '').trim();
          if ((docEmail === cleanIdentifier || docPhone === cleanIdentifier) && docPassword === cleanPassword) {
            foundUser = u;
            break;
          }
        }
      }

      // Direct Super Admin fallback
      if (!foundUser && cleanIdentifier === 'majdallmany3@gmail.com' && (cleanPassword === 'admin123' || cleanPassword === 'jahez@admin#2026')) {
        foundUser = {
          id: 'SjYDBWFByAX0mzaMwXrfJHyJN4E3',
          name: 'مجد الألماني (المدير العام)',
          email: 'majdallmany3@gmail.com',
          role: 'super_admin',
          status: 'active',
          phone: '777000111'
        };
      }

      // 2. If valid matching user found
      if (foundUser) {
        if (foundUser.status === 'suspended') {
          setError('🔒 حساب الإدارة هذا موقوف مؤقتاً. يرجى التواصل مع المدير العام.');
          return;
        }

        // Try background Firebase Auth session sync if possible
        try {
          if (foundUser.email && cleanPassword) {
            await signInWithEmailAndPassword(auth, foundUser.email, cleanPassword).catch(() => {});
          }
        } catch {
          // Ignore
        }

        const adminUser: AdminUser = {
          id: foundUser.id || 'admin_' + Date.now(),
          name: foundUser.name || cleanIdentifier.split('@')[0],
          email: foundUser.email || cleanIdentifier,
          role: normalizeRole(foundUser.role || (cleanIdentifier === 'majdallmany3@gmail.com' ? 'super_admin' : 'vice_admin')),
          status: foundUser.status || 'active',
          phone: foundUser.phone || '',
          permissions: foundUser.permissions,
          storeId: foundUser.storeId || 'all',
          avatarUrl: foundUser.avatarUrl,
          createdAt: foundUser.createdAt || new Date().toISOString()
        };

        // Clear failed attempts counter on success
        clearLoginAttemptCounters();
        onLoginSuccess(adminUser, rememberMe);
        return;
      }

      // 3. No match found -> trigger brute-force protection and device security check
      await registerFailureAndCheckBan(cleanIdentifier, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } catch (err: any) {
      console.error('Error during strict login process:', err);
      await registerFailureAndCheckBan(cleanIdentifier, 'تعذر التحقق من بيانات الدخول. تأكد من صحة البريد وكلمة المرور.');
    } finally {
      setIsLoading(false);
    }
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
        {deviceBlock?.isBlocked ? (
          /* Banned Device / IP View */
          <div className="w-full max-w-lg bg-slate-900/95 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col space-y-5 animate-in zoom-in-95">
            {/* Header Alert */}
            <div className="flex items-center gap-3.5 border-b border-rose-500/20 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <ShieldX className="w-7 h-7 text-rose-500 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    تم حظر الجهاز والـ IP تلقائياً
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Anti-Brute Force</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">حظر أمني مشدد على هذا الجهاز</h2>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-4 text-xs text-rose-200 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2 font-medium">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  قام نظام الحماية السيبراني بحظر هذا الجهاز وعنوان الـ IP تلقائياً نظراً لرصد محاولات متعددة غير مصرح بها لاختراق أو تخمين الحسابات وكلمات المرور.
                </span>
              </div>
              <p className="text-slate-300 pr-6 text-[11px]">
                {deviceBlock.reason || 'تم تجاوز الحد المسموح به من المحاولات الخاطئة وتجربة حسابات مختلفة.'}
              </p>
            </div>

            {/* Detailed Security Telemetry */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  معرّف الجهاز (Device Fingerprint):
                </span>
                <span className="font-mono text-slate-200 text-[11px] select-all bg-slate-900 px-2 py-0.5 rounded">
                  {deviceBlock.deviceId}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">عنوان الـ IP المرصود:</span>
                <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                  {deviceBlock.ip}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">عدد المحاولات الفاشلة:</span>
                <span className="text-white font-bold">{deviceBlock.totalAttempts} محاولات</span>
              </div>

              {deviceBlock.attemptedEmails && deviceBlock.attemptedEmails.length > 0 && (
                <div className="flex flex-col gap-1 py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">الحسابات التي جرت محاولة الدخول إليها:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {deviceBlock.attemptedEmails.map((em, idx) => (
                      <span key={idx} className="bg-slate-900 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800">
                        {em}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  وقت فرض الحظر:
                </span>
                <span className="font-mono text-slate-300">
                  {deviceBlock.blockedAt ? new Date(deviceBlock.blockedAt).toLocaleTimeString('ar-YE') : 'الآن'}
                </span>
              </div>
            </div>

            {/* Emergency Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCheckingSecurity(true);
                  checkDeviceSecurityStatus()
                    .then((st) => setDeviceBlock(st.isBlocked ? st : null))
                    .finally(() => setIsCheckingSecurity(false));
                }}
                disabled={isCheckingSecurity}
                className="w-full sm:flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSecurity ? 'animate-spin' : ''}`} />
                <span>إعادة فحص حالة الحظر</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnlockModal(true)}
                className="w-full sm:flex-1 py-2.5 px-3 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>فك الحظر الطارئ للإدارة</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              للمساعدة أو لرفع الحظر فورياً من الإدارة العليا، تواصل مع: <span className="text-slate-400 font-mono">majdallmany3@gmail.com</span>
            </p>
          </div>
        ) : (
          /* Normal Login Card */
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
                    placeholder="admin@jahezye.com أو name@company.com"
                    className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    autoComplete="email"
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
        )}
      </main>

      {/* Emergency Unlock Modal */}
      {showUnlockModal && deviceBlock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Unlock className="w-4 h-4" />
                <span>فك حظر الجهاز (خاص بالإدارة العامة)</span>
              </div>
              <button 
                onClick={() => setShowUnlockModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-1 rounded bg-slate-800"
              >
                إغلاق
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              إذا كنت المدير العام وتم حظر جهازك بالخطأ، يرجى كتابة كود الأمان الطارئ أو كلمة مرور المدير العام لرفع الحظر الأمني فورياً:
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">كود الأمان لفك الحظر</label>
              <input 
                type="password"
                value={emergencyCode}
                onChange={(e) => setEmergencyCode(e.target.value)}
                placeholder="أدخل كود فك الحظر..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {unlockStatusMsg && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {unlockStatusMsg}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleEmergencyUnblock}
                disabled={isUnlocking || !emergencyCode.trim()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isUnlocking ? 'جاري فك الحظر...' : 'تأكيد رفع الحظر فوراً'}
              </button>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

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


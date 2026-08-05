import React from 'react';
import { Loader2 } from 'lucide-react';

export function ViewLoadingFallback() {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center space-y-3 bg-white/60 backdrop-blur-xs rounded-2xl border border-slate-100 min-h-[300px]">
      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 animate-spin">
        <Loader2 className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold text-slate-500">جاري تحميل البيانات والمكونات...</p>
    </div>
  );
}

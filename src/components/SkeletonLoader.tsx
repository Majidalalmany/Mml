import React from 'react';

export const CategorySkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs animate-pulse space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded-md w-3/5" />
        <div className="h-3 bg-slate-100 rounded-md w-2/5" />
      </div>
    </div>
    <div className="h-3 bg-slate-100 rounded-md w-full" />
    <div className="h-3 bg-slate-100 rounded-md w-4/5" />
    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
      <div className="h-6 bg-slate-100 rounded-lg w-20" />
      <div className="h-8 bg-slate-200 rounded-xl w-28" />
    </div>
  </div>
);

export const StoreSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs animate-pulse">
    <div className="h-32 bg-slate-200 w-full" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-300 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-slate-200 rounded-md w-1/2" />
          <div className="h-3 bg-slate-100 rounded-md w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded-md w-full" />
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <div className="h-6 bg-slate-100 rounded-lg w-24" />
        <div className="h-8 bg-slate-200 rounded-xl w-32" />
      </div>
    </div>
  </div>
);

export const OrderSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs animate-pulse space-y-3.5">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="h-5 bg-slate-200 rounded-md w-24" />
        <div className="h-4 bg-slate-200 rounded-md w-36" />
      </div>
      <div className="h-7 bg-slate-200 rounded-xl w-24" />
    </div>

    <div className="p-3 bg-slate-50 rounded-xl space-y-2">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded-md w-32" />
        <div className="h-5 bg-slate-200 rounded-md w-20" />
      </div>
    </div>

    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
      <div className="h-8 bg-slate-100 rounded-xl w-28" />
      <div className="h-8 bg-slate-200 rounded-xl w-36" />
    </div>
  </div>
);

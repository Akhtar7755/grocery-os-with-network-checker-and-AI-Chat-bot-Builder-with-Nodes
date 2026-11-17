import React from 'react';
import { Leaf, FileText } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <FileText className="mr-3 text-indigo-600" /> Grocery Reports
        </h1>
        <p className="text-slate-500 mt-2">Analytics and information regarding store inventory.</p>
      </div>

      <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-4xl mx-auto">
        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">We only deal with Grocery Products</h2>
        <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
          This system is exclusively designed for managing grocery items like fruits, vegetables, dairy, and daily household essentials. All product uploads and reports are strictly filtered to ensure grocery-only inventory management.
        </p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Search, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NetworkChecker() {
  const [number, setNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // UPDATE: Ab condition exactly 4 digits ki hai
    if (number.length !== 4) {
      setError('Please enter exactly 4-digit prefix (e.g., 0345)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/network/check/${number}`);
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Failed to detect network');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <Wifi className="mr-3 text-indigo-600" /> Network Checker
        </h1>
        <p className="text-slate-500 mt-2">Enter a 4-digit code (e.g., 0345) to detect its network provider.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
        <form onSubmit={handleCheck}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Network Prefix</label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                maxLength={4} // <-- Max 4 characters
                required 
                value={number} 
                onChange={e => setNumber(e.target.value.replace(/\D/g, ''))} // Sirf numbers allow
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-lg tracking-widest font-mono" 
                placeholder="0345" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-70"
          >
            {loading ? 'Checking...' : 'Check Network'}
          </button>
        </form>

        {/* RESULT BOX */}
        {result && (
          <div className="mt-6 p-6 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-semibold mb-1">Prefix: {result.number}</p>
              <p className="text-2xl font-extrabold text-emerald-800 flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-2" />
                {result.network}
              </p>
            </div>
          </div>
        )}

        {/* ERROR BOX */}
        {error && (
          <div className="mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start">
            <AlertCircle className="w-5 h-5 text-rose-600 mr-3 mt-0.5" />
            <p className="text-rose-700 text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
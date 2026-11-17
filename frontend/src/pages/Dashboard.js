import React, { useState, useEffect } from 'react';
import { Package, Activity, Users, LayoutDashboard, MessageSquare } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function Dashboard({ user }) {
  const [totalSmsNumbers, setTotalSmsNumbers] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await apiFetch('http://localhost:3000/products?limit=1');
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProductCount(prodData.total);
        }

        if (user.isAdmin) {
          const userRes = await apiFetch('http://localhost:3000/auth/users');
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserCount(userData.length);
          }
        }

        // SMS Numbers count
        const smsRes = await apiFetch('http://localhost:3000/network/total-count');
        if (smsRes.ok) {
          const smsData = await smsRes.json();
          setTotalSmsNumbers(smsData.totalNumbers);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [user.isAdmin]);

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <LayoutDashboard className="mr-3 text-indigo-600" /> Dashboard
        </h1>
        <p className="text-slate-500 mt-2">Overview of your store's performance and activity.</p>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading stats...</div>
      ) : (
        /* GRID: 3 columns on desktop */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Products Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Products</p>
                <p className="text-5xl font-extrabold text-slate-800">{productCount}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-full">
                <Package className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* 2. SMS Numbers Card (NAYA) */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SMS Numbers</p>
                <p className="text-5xl font-extrabold text-slate-800">{totalSmsNumbers}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-full">
                <MessageSquare className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* 3. Users Card (Admin only) ya System Status */}
          {user.isAdmin ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Users</p>
                  <p className="text-5xl font-extrabold text-slate-800">{userCount}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-full">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          ) : (
             <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System Status</p>
                  <p className="text-3xl font-extrabold text-emerald-600 flex items-center mt-2">
                    Online <span className="w-4 h-4 bg-emerald-500 rounded-full ml-3 animate-pulse"></span>
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-full">
                  <Activity className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
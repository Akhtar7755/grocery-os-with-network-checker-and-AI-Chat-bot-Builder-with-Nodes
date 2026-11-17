import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Hexagon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UserControls from './pages/UserControls';
import AddProduct from './pages/AddProduct';
import Products from './pages/Products';
import Reports from './pages/Reports';
import NetworkChecker from './pages/NetworkChecker';
import BulkUpload from './pages/BulkUpload';
import ChatbotBuilder from './pages/ChatbotBuilder';
import ChatbotList from './pages/ChatbotList';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
    } else {
      setMsg(data.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  // --- PREMIUM CENTERED LOGIN SCREEN ---
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">

        {/* Background Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl">

          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 mb-6">
              <Hexagon className="w-8 h-8 text-white fill-white/20" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@test.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-2">
              <input id="remember-me" type="checkbox" className="h-4 w-4 bg-slate-900 border-slate-700 rounded text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit" disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center group"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Error Message */}
          {msg && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl text-center font-medium">
              {msg}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-500">
            Secure login system &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN APP LAYOUT ---
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar user={user} handleLogout={handleLogout} />
        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/network-checker" element={<NetworkChecker />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/bulk-upload" element={<BulkUpload />} />
            <Route path="/chatbot-builder" element={<ChatbotBuilder />} />
            <Route path="/chatbot-builder/:id" element={<ChatbotBuilder />} />
            <Route path="/chatbots" element={<ChatbotList />} />
            {user.isAdmin && <Route path="/users" element={<UserControls token={token} />} />}
            {(user.isAdmin || user.permissions?.includes('add-product')) && <Route path="/add-product" element={<AddProduct />} />}
            {(user.isAdmin || user.permissions?.includes('products')) && <Route path="/products" element={<Products />} />}
            {(user.isAdmin || user.permissions?.includes('reports')) && <Route path="/reports" element={<Reports />} />}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
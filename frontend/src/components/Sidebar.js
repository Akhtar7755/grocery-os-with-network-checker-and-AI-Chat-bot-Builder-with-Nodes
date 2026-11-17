import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, PlusCircle, Package, FileText, Hexagon, Wifi,UploadCloud } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { Bot } from 'lucide-react'; // Import karein

export default function Sidebar({ user, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    handleLogout();
    navigate('/');
  };

  const hasAccess = (page) => user.isAdmin || user.permissions?.includes(page);

  const NavItem = ({ to, icon: Icon, label, pageName }) => {
    if (pageName && !hasAccess(pageName)) return null;
    
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center px-4 py-3 mx-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-200">
      <div className="h-20 flex items-center px-8 border-b border-slate-100">
        <Hexagon className="w-8 h-8 text-indigo-600 mr-3 fill-indigo-100" />
        <span className="text-slate-800 font-extrabold text-xl tracking-tight">GroceryOS</span>
      </div>
      
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        <p className="px-7 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        {user.isAdmin && <NavItem to="/users" icon={Users} label="User Controls" />}
        
        <p className="px-7 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Products</p>
        <NavItem to="/add-product" icon={PlusCircle} label="Add Product" pageName="add-product" />
        <NavItem to="/products" icon={Package} label="Catalog" pageName="products" />
        <NavItem to="/reports" icon={FileText} label="Reports" pageName="reports" />
        <NavItem to="/network-checker" icon={Wifi} label="Network Checker" />
        <NavItem to="/bulk-upload" icon={UploadCloud} label="Bulk Upload" />
        <NavItem to="/chatbot-builder" icon={MessageSquare} label="Chatbot Builder" />
        <NavItem to="/chatbots" icon={Bot} label="My Chatbots" />
      </nav>

      <div className="p-6 border-t border-slate-100">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3 shadow-md">
            {user.email[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm text-slate-800 font-semibold truncate">{user.email}</p>
            <p className="text-xs text-slate-500">{user.isAdmin ? 'Administrator' : 'User'}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors duration-200 border border-slate-200 hover:border-red-200">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
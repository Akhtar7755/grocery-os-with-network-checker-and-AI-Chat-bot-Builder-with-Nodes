import React, { useState, useEffect } from 'react';
import { UserPlus, Power, Edit, X, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../utils/api'; // <-- MAKE SURE THIS IS CORRECT

export default function UserControls() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [msg, setMsg] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('http://localhost:3000/auth/users'); // <-- apiFetch with capital F
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, permissions })
      });
      if (res.ok) {
        setMsg('User created successfully!');
        setEmail(''); setPassword(''); setPermissions([]);
        fetchUsers();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg('User already exists');
      }
    } catch (err) { setMsg('Server error'); }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await apiFetch(`http://localhost:3000/auth/users/${id}/toggle-status`, {
        method: 'PATCH',
      });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPermissions(user.permissions || []);
  };

  const handleSavePermissions = async () => {
    try {
      const res = await apiFetch(`http://localhost:3000/auth/users/${editingUser._id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPermissions })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) { console.error(err); }
  };

  const togglePerm = (perm, isEdit = false) => {
    if (isEdit) {
      setEditPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    } else {
      setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    }
  };

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto relative">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <UserPlus className="mr-3 text-indigo-600" /> User Controls
        </h1>
        <p className="text-slate-500 mt-2">Manage system access and permissions for your team.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Create New User</h2>
        <form onSubmit={handleCreate} autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" placeholder="name@company.com" autoComplete="off" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" placeholder="••••••••" autoComplete="new-password" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Permissions</label>
            <div className="flex flex-wrap gap-4">
              {['add-product', 'products', 'reports'].map(p => (
                <label key={p} className="flex items-center space-x-3 bg-slate-50 px-6 py-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition min-w-[150px]">
                  <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePerm(p)} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="capitalize text-sm font-medium text-slate-700">{p.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-200">
              Create User
            </button>
            {msg && (
              <p className={`text-sm flex items-center font-medium ${msg.includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {msg.includes('success') && <CheckCircle2 className="w-4 h-4 mr-1" />}
                {msg}
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Permissions</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-slate-900">{u.email}</div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    {u.isAdmin ? (
                      <span className="text-indigo-600 font-bold text-sm">Admin</span>
                    ) : u.permissions.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {u.permissions.map(p => (
                          <span key={p} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md capitalize border border-slate-200">
                            {p.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm italic">No access</span>
                    )}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!u.isAdmin && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(u)} className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition" title="Edit Permissions">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(u._id)} className={`p-2 rounded-lg transition ${u.isActive ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' : 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'}`} title="Toggle Status">
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Edit Permissions</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">Modifying access for: <span className="font-semibold text-slate-800">{editingUser.email}</span></p>
            
            <div className="space-y-3 mb-8">
              {['add-product', 'products', 'reports'].map(p => (
                <label key={p} className="flex items-center space-x-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input type="checkbox" checked={editPermissions.includes(p)} onChange={() => togglePerm(p, true)} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="capitalize text-sm font-medium text-slate-800">{p.replace('-', ' ')}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button onClick={handleSavePermissions} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
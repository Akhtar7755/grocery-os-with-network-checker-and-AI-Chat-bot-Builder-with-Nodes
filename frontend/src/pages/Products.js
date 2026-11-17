import React, { useState, useEffect } from 'react';
import { Trash2, PackageOpen, Package, X, Edit, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Image preview & Edit states
  const [previewImage, setPreviewImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const canManage = user.isAdmin || user.permissions?.includes('add-product');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Yahan hum page number URL mein bhej rahe hain
      const res = await apiFetch(`http://localhost:3000/products?page=${page}&limit=10`);
      const result = await res.json();
      
      // Backend ab object bhej raha hai, array nahi
      setProducts(result.data);
      setTotalPages(result.totalPages);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

    // eslint-disable-next-line
  useEffect(() => { 
    fetchProducts(); 
  }, [page]); 
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await apiFetch(`http://localhost:3000/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price);
  };

  const handleUpdate = async () => {
    try {
      const res = await apiFetch(`http://localhost:3000/products/${editingProduct._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, price: Number(editPrice) })
      });
      if (res.ok) {
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <Package className="mr-3 text-indigo-600" /> Product Catalog
        </h1>
        <p className="text-slate-500 mt-2">View and manage all grocery items in your store.</p>
      </div>

      {loading ? (
        <div className="p-8 text-slate-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <PackageOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No products found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Image</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                {canManage && (
                  <th className="px-8 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4">
                    <img 
                      src={p.image} alt={p.name} onClick={() => setPreviewImage(p.image)}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm cursor-pointer hover:scale-110 transition-transform" 
                    />
                  </td>
                  <td className="px-8 py-4 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-8 py-4 font-bold text-indigo-600">${p.price?.toFixed(2) || '0.00'}</td>
                  {canManage && (
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="text-rose-500 hover:text-rose-700 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* NAYA: PAGINATION BAR */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">
              Page <span className="text-slate-800 font-bold">{page}</span> of <span className="text-slate-800 font-bold">{totalPages}</span>
            </span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>
              
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Baqi modals (Preview & Edit) waisay hi rahenge */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 bg-slate-900/50 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition">
              <X className="w-6 h-6" />
            </button>
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-indigo-600" /> Edit Product
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Product Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price ($)</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingProduct(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button onClick={handleUpdate} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center shadow-md shadow-indigo-200">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
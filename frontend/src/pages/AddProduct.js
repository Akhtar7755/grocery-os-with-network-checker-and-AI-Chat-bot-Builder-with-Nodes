import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { apiFetch } from '../utils/api'; // <-- MAKE SURE THIS IS CORRECT

export default function AddProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preview) return setMsg('Please select an image');
    setLoading(true);

    try {
      const res = await apiFetch('http://localhost:3000/products', { // <-- apiFetch with capital F
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), image: preview })
      });

      if (res.ok) {
        setMsg('Product uploaded successfully!');
        setName(''); setPrice(''); setImage(null); setPreview(null);
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg('Failed to upload product');
      }
    } catch (err) { setMsg('Server error'); }
    setLoading(false);
  };

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <PlusCircle className="mr-3 text-indigo-600" /> Add Product
        </h1>
        <p className="text-slate-500 mt-2">Upload new grocery items to your inventory catalog.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Product Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" placeholder="e.g. Apples" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Price ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 font-medium">$</span>
                <input type="number" required min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Product Image</label>
            {!preview ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-colors cursor-pointer relative group bg-slate-50">
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="space-y-2 text-center">
                  <div className="mx-auto h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-7 w-7 text-indigo-500" />
                  </div>
                  <div className="flex text-sm text-slate-600 justify-center">
                    <span className="relative rounded-md font-semibold text-indigo-600 hover:text-indigo-500">Upload a file</span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </div>
            ) : (
              <div className="mt-1 relative rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-6">
                <div className="relative h-24 w-24 flex-shrink-0">
                  <img src={preview} alt="Preview" className="h-24 w-24 object-cover rounded-xl shadow-sm border border-slate-200" />
                  <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition z-20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" /> 
                    {image?.name || 'Image selected'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Ready to upload. Click the X to remove.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Uploading...' : 'Upload Product'}
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
    </div>
  );
}
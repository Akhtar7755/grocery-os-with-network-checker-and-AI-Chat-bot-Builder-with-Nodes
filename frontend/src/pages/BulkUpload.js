import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BulkUpload() {
  const [file, setFile] = useState(null);
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select an Excel file');

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('listName', listName || 'Bulk Upload');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/network/upload-excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setFile(null);
        setListName('');
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <UploadCloud className="mr-3 text-indigo-600" /> Bulk Number Upload
        </h1>
        <p className="text-slate-500 mt-2">Upload an Excel file containing millions of mobile numbers.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">List Name</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
              placeholder="e.g. Jazz Campaign 1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Excel File (.xlsx)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition relative">
              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">
                {file ? file.name : 'Click to browse Excel file'}
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-70"
          >
            {loading ? 'Uploading & Processing...' : 'Upload Excel'}
          </button>
        </form>

        {/* RESULT BOX */}
        {result && (
          <div className="mt-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
            <p className="text-emerald-800 font-bold flex items-center mb-2">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Upload Successful!
            </p>
            <p className="text-sm text-emerald-700 mb-3">
              Total Processed: <b>{result.totalProcessed}</b>
            </p>

            <div className="bg-white/50 p-3 rounded-lg border border-emerald-100">
              <p className="text-sm font-semibold text-emerald-800 mb-2">Networks Breakdown:</p>
              <ul className="text-sm text-emerald-700 space-y-1">
                {Object.entries(result.networkStats || {}).map(([network, count]) => (
                  <li key={network} className="flex justify-between">
                    <span>{network}:</span>
                    <span className="font-bold">{count}</span>
                  </li>
                ))}
              </ul>
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
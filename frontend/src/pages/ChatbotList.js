import React, { useState, useEffect } from 'react';
import { Bot, Copy, CheckCircle2, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:3000';

export default function ChatbotList() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchBots = async () => {
    try {
      const res = await fetch(`${API}/chatbot`);
      if (!res.ok) throw new Error('Could not load chatbots');
      setBots(await res.json());
      setError('');
    } catch (err) {
      setError(err.message || 'Could not reach the server');
    }
    setLoading(false);
  };

  useEffect(() => { fetchBots(); }, []);

  const copyWebhook = (id) => {
    navigator.clipboard.writeText(`${API}/chatbot/${id}/webhook`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (bot) => {
    if (!window.confirm(`Delete "${bot.name || 'Untitled Bot'}"? This cannot be undone.`)) return;
    setDeletingId(bot._id);
    try {
      const res = await fetch(`${API}/chatbot/${bot._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setBots((list) => list.filter((b) => b._id !== bot._id));
    } catch {
      alert('Failed to delete. Please try again.');
    }
    setDeletingId(null);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading workflows...</div>;

  return (
    <div className="p-8 w-full max-w-[1200px] mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
            <Bot className="mr-3 text-indigo-600" /> My Chatbots
          </h1>
          <p className="text-slate-500 mt-2">Open a workflow to edit it, or delete the ones you no longer need.</p>
        </div>
        <Link to="/chatbot-builder" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center shadow-md">
          <Plus className="w-5 h-5 mr-2" /> Create New Bot
        </Link>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

      {!error && bots.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
          <Bot className="w-10 h-10 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">No chatbots yet. Build your first workflow and press Save.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <div key={bot._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800">{bot.name || 'Untitled Bot'}</h3>
              <p className="text-xs text-slate-400 mt-1 break-all">ID: {bot._id}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex-1">
              <p className="text-xs font-semibold text-slate-500 mb-1">Webhook URL:</p>
              <div className="flex justify-between items-center">
                <code className="text-xs text-indigo-600 break-all mr-2">POST {API}/chatbot/{bot._id}/webhook</code>
                <button onClick={() => copyWebhook(bot._id)} className="text-slate-400 hover:text-indigo-600" title="Copy URL">
                  {copiedId === bot._id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 mb-4">
              Created: {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : '-'}
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={() => navigate(`/chatbot-builder/${bot._id}`)}
                className="flex-1 bg-indigo-50 text-indigo-700 font-semibold py-2 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition text-sm">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </button>
              <button onClick={() => handleDelete(bot)} disabled={deletingId === bot._id}
                className="bg-rose-50 text-rose-600 px-4 rounded-lg flex items-center justify-center hover:bg-rose-100 transition disabled:opacity-60" title="Delete">
                {deletingId === bot._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
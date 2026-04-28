import React, { useState, useEffect } from 'react';
import { Shield, Key, Clock, Trash2, LogOut, CheckCircle2, ChevronRight } from 'lucide-react';
import { AccessKey, createAccessKey, validateAccessKey, subscribeToKeys } from '../firebase';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [duration, setDuration] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToKeys((newKeys) => {
      setKeys(newKeys);
    }, (err) => {
      console.error(err);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const label = duration === 1 ? '1 Month' : duration === 2 ? '2 Months' : '6 Months';
      await createAccessKey(duration, label);
    } catch (err) {
      console.error("Failed to create key", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (keyId: string) => {
    navigator.clipboard.writeText(keyId);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full h-screen bg-[#0A0B0E] text-slate-300 flex flex-col font-sans overflow-hidden">
      <nav className="h-16 shrink-0 border-b border-slate-800 px-8 flex items-center justify-between bg-[#0A0B0E]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-500 rounded flex items-center justify-center">
             <Shield size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">STRAT.AI <span className="text-rose-500 font-mono text-sm ml-2">ADMIN</span></span>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Key size={20} className="text-indigo-400" /> Generate Access Key
            </h2>
            <div className="flex items-end gap-4">
               <div className="flex-1">
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Duration</label>
                 <select 
                   value={duration} 
                   onChange={(e) => setDuration(Number(e.target.value))}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                 >
                    <option value={1}>1 Month</option>
                    <option value={2}>2 Months</option>
                    <option value={6}>6 Months</option>
                 </select>
               </div>
               <button 
                 onClick={handleCreate}
                 disabled={loading}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
               >
                 {loading ? 'GENERATING...' : 'CREATE KEY'}
               </button>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Clock size={20} className="text-slate-400" /> Active & Expired Keys
            </h2>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Key ID</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold">Created On</th>
                    <th className="px-6 py-4 font-bold">Expires On</th>
                    <th className="px-6 py-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {keys.map((k) => {
                    const isExpired = Date.now() > k.expiresAt;
                    return (
                      <tr key={k.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-indigo-300 font-semibold">{k.id}</span>
                            <button 
                              onClick={() => copyToClipboard(k.id)}
                              className="text-slate-500 hover:text-white transition-colors"
                              title="Copy Key"
                            >
                              {copiedKey === k.id ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Key size={14} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{k.durationLabel}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(k.expiresAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${isExpired ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {keys.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No keys generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

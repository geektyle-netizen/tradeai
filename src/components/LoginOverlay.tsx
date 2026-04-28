import React, { useState } from 'react';
import { Key } from 'lucide-react';

export function LoginOverlay({ onLoginAdmin, onLoginUser }: { onLoginAdmin: () => void, onLoginUser: (key: string) => Promise<boolean> }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'irshad07') {
      onLoginAdmin();
    } else {
      setError('Invalid admin credentials.');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setError('Please enter an access key.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const isValid = await onLoginUser(accessKey.trim());
      if (!isValid) {
        setError('Invalid or expired Access Key.');
      }
    } catch (err) {
      setError('Failed to validate key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0E] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-4 right-4">
          <button 
            type="button"
            onClick={() => { setIsAdminMode(!isAdminMode); setError(''); setUsername(''); setPassword(''); setAccessKey(''); }}
            className="text-xs text-slate-500 hover:text-indigo-400 font-mono transition-colors"
          >
            {isAdminMode ? 'User Login' : 'Admin Login'}
          </button>
        </div>

        <div className="mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
             <Key size={24} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">STRAT.AI</h1>
          <p className="text-sm text-slate-400 mt-1">{isAdminMode ? 'Admin Portal' : 'Neural Trading Engine'}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        {isAdminMode ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter password"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3.5 mt-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-rose-900/20"
            >
              ACCESS DASHBOARD
            </button>
          </form>
        ) : (
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Access Key</label>
              <input 
                type="text" 
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono placeholder:font-sans focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. STRATAI-XXXX-XXXX"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
            >
              {isLoading ? 'VERIFYING...' : 'INITIALIZE ENGINE'}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              Need access? Contact admin to request a key.
            </p>
          </form>
        )}

      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, TrendingUp, AlertCircle, Crosshair, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { analyzeTradingChart, AnalysisResult } from './services/geminiService';
import { LoginOverlay } from './components/LoginOverlay';
import { AdminDashboard } from './components/AdminDashboard';
import { validateAccessKey } from './firebase';

const STRATEGIES = [
  { id: 'ict-silver-bullet', name: 'ICT Silver Bullet', desc: 'FVG & Liquidity Focus', recommendedTimeframes: ['1M', '3M', '5M'] },
  { id: 'price-action', name: 'Price Action Mastery', desc: 'Core price momentum structure', recommendedTimeframes: ['15M', '1H', '4H'] },
  { id: '1m-scalping', name: '1-Minute Scalping', desc: 'High momentum rapid execution', recommendedTimeframes: ['1M'] },
  { id: 'order-block', name: 'Order Block & Liquidity', desc: 'Smart money concepts', recommendedTimeframes: ['15M', '1H', '4H'] },
  { id: 'bollinger-mean', name: 'Bollinger Mean Reversion', desc: 'Volatility band tracking', recommendedTimeframes: ['5M', '15M', '1H'] },
  { id: 'fib-retracement', name: 'Fibonacci Retracement', desc: 'Golden ratio bounce zones', recommendedTimeframes: ['1H', '4H', '1D'] },
  { id: 'breakout', name: 'Breakout Momentum', desc: 'Volume expansion triggers', recommendedTimeframes: ['15M', '1H', '4H'] },
  { id: 'swing', name: 'Swing Trading (Multi-Day)', desc: 'Higher timeframe trends', recommendedTimeframes: ['4H', '1D', '1W'] },
];

function AppContent({ onLogout }: { onLogout: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<string>(STRATEGIES[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileArray: File[]) => {
    const addedFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (addedFiles.length === 0) {
      setError("Please select valid image files.");
      return;
    }

    setFiles(prev => [...prev, ...addedFiles]);
    setError(null);
    setResult(null);

    const newPreviews = addedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    processFiles(Array.from(newFiles));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        processFiles(pastedFiles);
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Please upload at least one screenshot.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const selectedStrategyObj = STRATEGIES.find(s => s.id === strategy);
      const res = await analyzeTradingChart(files, selectedStrategyObj?.name || strategy);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze the chart. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#0A0B0E] text-slate-300 flex flex-col font-sans overflow-hidden">
      {/* Header Navigation */}
      <nav className="h-16 shrink-0 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between bg-[#0A0B0E]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">STRAT.AI</span>
          <span className="ml-4 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">v2.4.0-STABLE</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs font-medium text-emerald-500">AI ENGINE ONLINE</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"></div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        
        {/* Left Panel: Input & Config */}
        <aside className="w-full md:w-[380px] shrink-0 md:border-r border-b md:border-b-0 border-slate-800 p-4 md:p-6 flex flex-col gap-6 md:overflow-y-auto bg-[#0A0B0E] custom-scrollbar">
          
          {/* Upload Section */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Step 1: Upload Screenshots</h3>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="h-40 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/30 transition-colors"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFiles(e.target.files)} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div className="text-center px-4">
                <p className="text-sm text-slate-300 font-medium">Drag & drop, click, or <span className="text-indigo-400">paste (Ctrl+V)</span></p>
                <p className="text-xs text-slate-500 mt-1">Support JPG, PNG, WEBP</p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {previews.map((src, i) => (
                  <div key={i} className="w-12 h-12 shrink-0 rounded border border-slate-700 bg-slate-800 overflow-hidden relative group">
                    <img src={src} className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 shrink-0 rounded border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-slate-700 cursor-pointer transition-colors text-[20px]"
                >
                  +
                </div>
              </div>
            )}
          </section>

          {/* Strategy Picker */}
          <section className="flex-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Step 2: Select Strategy</h3>
            <div className="space-y-2">
              {STRATEGIES.map((strat) => (
                <label 
                  key={strat.id}
                  className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                    strategy === strat.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50' 
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 shrink-0 rounded-full border ${
                      strategy === strat.id 
                        ? 'border-4 border-indigo-500 bg-slate-900' 
                        : 'border-slate-700 bg-transparent'
                    }`}></div>
                    <div>
                      <div className={`text-sm font-semibold ${
                        strategy === strat.id ? 'text-white' : 'text-slate-400'
                      }`}>
                        {strat.name}
                      </div>
                      {strat.desc && (
                        <div className={`text-[10px] font-mono mt-0.5 ${
                          strategy === strat.id ? 'text-indigo-400' : 'text-slate-500'
                        }`}>
                          {strat.desc}
                        </div>
                      )}
                    </div>
                  </div>
                  <input 
                    type="radio" 
                    name="strategy" 
                    value={strat.id}
                    checked={strategy === strat.id}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </section>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mt-auto">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-px" />
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || files.length === 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold tracking-wide hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-auto"
          >
            {isAnalyzing ? 'ANALYZING...' : 'RUN ANALYSIS'}
          </button>
        </aside>

        {/* Right Panel: AI Analysis Output */}
        <section className="flex-1 shrink-0 md:shrink md:min-h-0 bg-[#0D0F14] relative md:overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-3xl mx-auto flex flex-col min-h-full pb-6 md:pb-10">
            
            {/* Output State: Initial state */}
            {!isAnalyzing && !result && (
               <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="opacity-50 flex flex-col items-center">
                    <div className="w-16 h-16 rounded border border-slate-700 bg-slate-800 flex items-center justify-center mb-4">
                       <ImageIcon size={24} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Ready for input constraints.</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-2">
                      Upload charts and initiate the AI Engine to extract strategy-aligned trading points.
                    </p>
                  </div>
                  
                  <div className="mt-12 p-6 bg-slate-900/50 border border-slate-800 rounded-xl w-full max-w-md animate-in fade-in duration-300">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Recommended Timeframes</h4>
                    <div className="flex flex-wrap justify-center gap-3">
                      {STRATEGIES.find(s => s.id === strategy)?.recommendedTimeframes.map((tf, i) => (
                        <div key={i} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm font-mono font-semibold">
                          {tf}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4">For best results with <span className="text-slate-400 font-semibold">{STRATEGIES.find(s => s.id === strategy)?.name}</span></p>
                  </div>
               </div>
            )}

            {/* Output State: Analyzing */}
            {isAnalyzing && (
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 mb-8 flex items-center justify-center animate-in">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                <div className="w-full h-full flex flex-col items-center justify-center p-8 z-10">
                  <div className="w-64 h-40 border border-slate-700/50 rounded bg-slate-800/20 backdrop-blur flex items-center justify-center relative overflow-hidden">
                     {/* Scanning effect */}
                     <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                     <div className="text-slate-600 text-sm font-mono animate-pulse">SCANNING LIQUIDITY...</div>
                  </div>
                  <div className="mt-8 flex flex-col gap-2 items-center w-full max-w-xs">
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full animate-[progress_15s_ease-out_forwards]"></div>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">Neural Core processing image data</div>
                  </div>
                </div>
              </div>
            )}

            {/* Output State: Result */}
            {result && !isAnalyzing && (
              <div className="animate-in flex flex-col h-full">
                
                {/* Image overview indicator */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 mb-8 min-h-[160px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                  <div className="absolute top-4 left-4 z-10">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur rounded-full border border-white/10 text-[10px] text-slate-400 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                       ANALYSIS COMPLETE
                    </div>
                  </div>
                  <div className="text-center z-10 p-6 pt-12">
                     <div className="text-slate-300 font-mono text-sm">Strategy Match: <span className="text-indigo-400 font-bold">{STRATEGIES.find(s => s.id === strategy)?.name}</span></div>
                     <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{files.length} chart(s) processed by AI Engine</div>
                  </div>
                </div>

                {/* Actionable Data Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group hover:bg-slate-800 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                       <ArrowRight size={64} className="text-indigo-400 -rotate-45" />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Suggested Entry</div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        result.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        result.direction === 'SELL' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {result.direction}
                      </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-mono font-light text-white break-words">{result.entry}</div>
                  </div>
                  
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl ring-1 ring-rose-500/30 relative overflow-hidden group hover:bg-slate-800 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                       <AlertCircle size={64} className="text-rose-500" />
                    </div>
                    <div className="text-[10px] font-bold text-rose-500 uppercase mb-2">Stop Loss (SL)</div>
                    <div className="text-2xl lg:text-3xl font-mono font-light text-white break-words">{result.stopLoss}</div>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl ring-1 ring-emerald-500/30 relative overflow-hidden group hover:bg-slate-800 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                       <Crosshair size={64} className="text-emerald-500" />
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Take Profit (TP)</div>
                    <div className="text-2xl lg:text-3xl font-mono font-light text-white break-words">{result.takeProfit}</div>
                  </div>
                </div>

                {/* Chart Details Extracted */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Asset Pair</span>
                    <span className="text-sm font-bold text-slate-300">{result.pairName}</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Timeframe</span>
                    <span className="text-sm font-bold text-slate-300">{result.timeFrame}</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Context</span>
                    <span className="text-xs font-medium text-slate-400 line-clamp-1" title={result.otherDetails}>{result.otherDetails || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-6 bg-indigo-950/10 border border-indigo-500/20 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/50"></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="pl-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Confidence Report & Setup</span>
                      <p className="text-base text-slate-300 mt-3 leading-relaxed font-serif whitespace-pre-wrap">
                        {result.reasoning}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-indigo-400">AI</div>
                      <div className="text-[10px] text-slate-500 uppercase">Engine</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </section>

      </main>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'login' | 'app' | 'admin'>('login');

  const handleLoginUser = async (key: string) => {
    const isValid = await validateAccessKey(key);
    if (isValid) {
      setView('app');
    }
    return isValid;
  };

  if (view === 'login') {
    return (
      <LoginOverlay 
        onLoginAdmin={() => setView('admin')} 
        onLoginUser={handleLoginUser} 
      />
    );
  }

  if (view === 'admin') {
    return <AdminDashboard onLogout={() => setView('login')} />;
  }

  return <AppContent onLogout={() => setView('login')} />;
}


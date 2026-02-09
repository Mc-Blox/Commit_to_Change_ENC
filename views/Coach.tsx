
import React, { useState } from 'react';
import { Task } from '../types';
import { getAccountabilityCoaching } from '../services/geminiService';

interface CoachProps {
  tasks: Task[];
}

const Coach: React.FC<CoachProps> = ({ tasks }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestAdvice = async () => {
    setLoading(true);
    const history = tasks.map(h => `${h.title}: ${h.streak} day streak`).join(', ');
    try {
      const resp = await getAccountabilityCoaching(history, 2); // Mocking 2 misses
      setAdvice(resp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl shadow-xl shadow-indigo-600/30">
          <i className="fas fa-brain"></i>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Strategic Performance Coach</h2>
        <p className="text-slate-500 max-w-xl mx-auto">Gemini 3 Pro analyzes your task streak data and lead generation performance to provide high-level systemic improvements.</p>
        
        <button 
          onClick={requestAdvice}
          disabled={loading}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <i className="fas fa-circle-notch fa-spin"></i>
              Deep Strategic Thinking...
            </span>
          ) : 'Generate Performance Audit'}
        </button>
      </div>

      {advice && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-slate-900 p-6 flex items-center gap-4 border-b border-slate-800">
            <div className="bg-indigo-500 w-10 h-10 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <h4 className="text-white font-bold">Gemini Performance Analysis</h4>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Thought-Powered Insight</p>
            </div>
          </div>
          <div className="p-10 text-slate-700 leading-relaxed space-y-6">
            {advice.split('\n\n').map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">{para}</p>
            ))}
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <i className="fas fa-lightbulb text-amber-500"></i>
               <span className="text-sm text-slate-500 font-medium italic">"Systems over motivation. Set the baseline, stake the risk."</span>
             </div>
             <button className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline">
               Export Strategy <i className="fas fa-download"></i>
             </button>
          </div>
        </div>
      )}

      {!advice && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
          {[
            { icon: 'fa-chart-pie', label: 'Pipeline Analysis', desc: 'Identify bottlenecks in your DM-to-Call ratio.' },
            { icon: 'fa-history', label: 'Task Resilience', desc: 'Find your failure points during the week.' },
            { icon: 'fa-microchip', label: 'Lead Quality Check', desc: 'Audit whether your persona targeting is too broad.' },
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
              <i className={`fas ${feature.icon} text-2xl text-slate-400 mb-4`}></i>
              <h5 className="font-bold text-slate-900 mb-2">{feature.label}</h5>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Coach;

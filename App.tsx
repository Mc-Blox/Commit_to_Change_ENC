
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import LeadGenerator from './views/LeadGenerator';
import TasksView from './views/TasksView';
import Accountability from './views/Accountability';
import Coach from './views/Coach';
import { Task, Lead } from './types';
import { getTaskAdjustmentAdvice } from './services/geminiService';

const Sidebar = ({ balance }: { balance: number }) => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/leads', icon: 'fa-bullseye', label: 'Lead Agent' },
    { path: '/tasks', icon: 'fa-calendar-check', label: 'Tasks' },
    { path: '/accountability', icon: 'fa-users', label: 'Accountability' },
    { path: '/coach', icon: 'fa-brain', label: 'AI Coach' },
  ];

  return (
    <div className="w-64 glass-sidebar h-screen text-slate-300 fixed left-0 top-0 flex flex-col p-6 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl">
          <i className="fas fa-bolt"></i>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">LeadStreak AI</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all hover:bg-slate-800 group ${
              location.pathname === item.path ? 'active-nav-item text-white bg-slate-800/50' : ''
            }`}
          >
            <i className={`fas ${item.icon} w-6 text-center text-lg ${location.pathname === item.path ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`}></i>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-semibold uppercase mb-1">Staked Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{balance.toFixed(2)}</span>
            <span className="text-sm text-slate-400">SOL <span className="text-slate-500 font-medium">(${(balance * 100).toFixed(2)})</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ walletAddress, onConnect }: { walletAddress: string | null; onConnect: () => void }) => (
  <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <h2 className="text-slate-500 font-medium">Welcome back, <span className="text-slate-900">Alex</span></h2>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <button 
              onClick={onConnect}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-all"
            >
              <i className="fas fa-wallet"></i> Connect Wallet
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          <button className="p-2 text-slate-400 hover:text-slate-600 relative">
            <i className="fas fa-bell"></i>
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shadow-sm">
            <img src="https://picsum.photos/seed/user123/100/100" alt="Avatar" />
          </div>
        </div>
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [balance, setBalance] = useState(4.20);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: '5 Prospect DMs', 
      description: 'Daily outreach to LinkedIn leads', 
      streak: 12, 
      lastCompleted: '2023-10-25', 
      stakeAmount: 0.5, 
      status: 'active', 
      category: 'Leads',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      deadline: new Date(Date.now() + 3600000).toISOString(), // 1h from now
      deadlineReminder: '15m'
    },
  ]);

  const [leads, setLeads] = useState<Lead[]>([]);
  
  const totalLeadsGenerated = useMemo(() => {
    return tasks.filter(t => t.outreachMessage).length;
  }, [tasks]);

  const [missedTaskToResolve, setMissedTaskToResolve] = useState<Task | null>(null);
  const [missedReason, setMissedReason] = useState<string>('Too busy');
  const [isResolving, setIsResolving] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);

  const connectWallet = useCallback(() => {
    setIsConnecting(true);
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const addr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
        setWalletAddress(addr);
        setIsConnecting(false);
        resolve(addr);
      }, 1200);
    });
  }, []);

  const handleDeposit = () => {
    setBalance(prev => prev + 2.0);
    setShowInsufficientFunds(false);
  };

  const validateStaking = useCallback(async (amount: number): Promise<boolean> => {
    let currentAddress = walletAddress;
    if (!currentAddress) {
      currentAddress = await connectWallet();
    }
    
    if (balance < amount) {
      setShowInsufficientFunds(true);
      return false;
    }
    
    return true;
  }, [walletAddress, balance, connectWallet]);

  const convertLeadToTask = async (lead: Lead) => {
    const stake = 0.2;
    const canStake = await validateStaking(stake);
    if (!canStake) return;

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Outreach: ${lead.name}`,
      description: `Send approved message to ${lead.name} at ${lead.company}`,
      streak: 0,
      lastCompleted: null,
      stakeAmount: stake,
      status: 'active',
      category: 'Leads',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 86400000).toISOString(),
      deadlineReminder: '1h',
      contactDetails: lead.contactInfo,
      outreachMessage: lead.personalizedMessage,
      sourcePlatform: lead.platform as any,
      leadId: lead.id
    };
    
    setBalance(prev => prev - stake);
    setTasks(prev => [...prev, newTask]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'approved' } : l));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let updated = false;
      const nextTasks = tasks.map(task => {
        if (task.status !== 'active' || !task.deadline) return task;
        const deadlineTime = new Date(task.deadline).getTime();
        if (task.deadlineReminder && task.deadlineReminder !== 'None' && !task.reminderSent) {
          let offset = 0;
          if (task.deadlineReminder === '15m') offset = 15 * 60 * 1000;
          if (task.deadlineReminder === '1h') offset = 60 * 60 * 1000;
          if (task.deadlineReminder === '1d') offset = 24 * 60 * 60 * 1000;
          if (now >= deadlineTime - offset && now < deadlineTime) {
            alert(`REMINDER: Task "${task.title}" is due soon!`);
            updated = true;
            return { ...task, reminderSent: true };
          }
        }
        if (now > deadlineTime) {
          updated = true;
          setMissedTaskToResolve(task);
          return { ...task, status: 'missed' as const };
        }
        return task;
      });
      if (updated) setTasks(nextTasks);
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleResolveMissed = async () => {
    if (!missedTaskToResolve) return;
    setIsResolving(true);
    try {
      const advice = await getTaskAdjustmentAdvice(missedTaskToResolve, missedReason);
      setAiAdvice(advice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  const acceptAiTask = async () => {
    if (aiAdvice?.suggestedTask) {
      const stake = aiAdvice.suggestedTask.stakeAmount || 0.1;
      const canStake = await validateStaking(stake);
      if (!canStake) return;

      const suggested = aiAdvice.suggestedTask;
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: suggested.title,
        description: suggested.description,
        streak: 0,
        lastCompleted: null,
        stakeAmount: stake,
        status: 'active',
        category: missedTaskToResolve?.category || 'Leads',
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 86400000).toISOString(),
        deadlineReminder: '1h'
      };
      setBalance(prev => prev - stake);
      setTasks(prev => [...prev, newTask]);
    }
    setMissedTaskToResolve(null);
    setAiAdvice(null);
  };

  return (
    <HashRouter>
      <div className="flex min-h-screen">
        <Sidebar balance={balance} />
        <main className="flex-1 ml-64 bg-slate-50">
          <Header walletAddress={walletAddress} onConnect={connectWallet} />
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard tasks={tasks} totalLeadsGenerated={totalLeadsGenerated} />} />
              <Route path="/leads" element={<LeadGenerator leads={leads} setLeads={setLeads} onApproveLead={convertLeadToTask} tasks={tasks} walletAddress={walletAddress} onConnectWallet={connectWallet} />} />
              <Route path="/tasks" element={<TasksView tasks={tasks} setTasks={setTasks} validateStaking={validateStaking} setBalance={setBalance} />} />
              <Route path="/accountability" element={<Accountability tasks={tasks} />} />
              <Route path="/coach" element={<Coach tasks={tasks} />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Missed Task Workflow Modal */}
      {missedTaskToResolve && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-rose-600 p-8 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-1">Task Deadline Missed!</h3>
              <p className="opacity-80 text-sm">Action required for "{missedTaskToResolve.title}"</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">Stake Forfeited</p>
                  <p className="text-xl font-bold text-rose-700">-{missedTaskToResolve.stakeAmount} SOL</p>
                  <p className="text-[10px] text-rose-400 italic">(${(missedTaskToResolve.stakeAmount * 100).toFixed(2)} Lost)</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Social Circle</p>
                  <p className="text-sm font-bold text-slate-700">Failure Alert <i className="fas fa-bell text-rose-500 ml-1"></i></p>
                  <p className="text-[10px] text-slate-400 italic">Contacts Notified</p>
                </div>
              </div>

              {!aiAdvice ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Provide Feedback: Why was this task missed?</label>
                    <select 
                      value={missedReason}
                      onChange={(e) => setMissedReason(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-black font-medium"
                    >
                      <option value="Too busy">I was too busy with other work</option>
                      <option value="Forgot">I simply forgot the deadline</option>
                      <option value="Technical issues">Technical issues prevented completion</option>
                      <option value="Lack of motivation">I lacked motivation today</option>
                      <option value="Underestimated difficulty">The task was harder than expected</option>
                      <option value="Other">Other reason</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleResolveMissed}
                    disabled={isResolving}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isResolving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-brain"></i>}
                    {isResolving ? 'Analyzing with AI...' : 'Submit Feedback & Get Recovery Plan'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 relative">
                    <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded">AI ANALYSIS</div>
                    <p className="text-sm text-indigo-900 leading-relaxed italic">"{aiAdvice.recommendation}"</p>
                  </div>
                  
                  <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 relative">
                    <div className="absolute -top-3 left-6 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded">PROPOSED RECOVERY</div>
                    <h4 className="font-bold text-emerald-900 mb-1">{aiAdvice.suggestedTask.title}</h4>
                    <p className="text-xs text-emerald-700 mb-3">{aiAdvice.suggestedTask.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">New Stake</span>
                      <span className="font-bold text-emerald-900">{aiAdvice.suggestedTask.stakeAmount} SOL</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={acceptAiTask}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                    >
                      Accept Recovery Stake
                    </button>
                    <button 
                      onClick={() => { setMissedTaskToResolve(null); setAiAdvice(null); }}
                      className="px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                    >
                      Close Archive
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Loading Modal */}
      {isConnecting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[201] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-wallet text-2xl animate-bounce"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Connecting Wallet...</h3>
            <p className="text-slate-500 mb-6">Please approve the request in your browser extension.</p>
            <div className="p-4 border border-slate-200 rounded-2xl flex items-center gap-3 opacity-50">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Logo.svg" className="w-6 h-6" alt="Metamask" />
              <span className="font-bold text-slate-900">MetaMask</span>
              <i className="fas fa-spinner fa-spin ml-auto"></i>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Funds Modal */}
      {showInsufficientFunds && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[202] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95">
             <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-coins text-2xl"></i>
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Insufficient Balance</h3>
             <p className="text-slate-500 text-sm mb-8">
               Your staked balance is depleted. Please deposit more SOL to continue creating high-stakes commitments.
             </p>
             <div className="flex flex-col gap-3">
               <button 
                 onClick={handleDeposit}
                 className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
               >
                 <i className="fas fa-plus-circle"></i> Deposit 2.0 SOL
               </button>
               <button 
                 onClick={() => setShowInsufficientFunds(false)}
                 className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 text-xs"
               >
                 Cancel
               </button>
             </div>
          </div>
        </div>
      )}
    </HashRouter>
  );
};

export default App;

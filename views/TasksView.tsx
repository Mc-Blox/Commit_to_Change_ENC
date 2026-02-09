
import React, { useState, useMemo } from 'react';
import { Task } from '../types';

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  validateStaking: (amount: number) => Promise<boolean>;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

const TasksView: React.FC<TasksProps> = ({ tasks, setTasks, validateStaking, setBalance }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<Task | null>(null);
  const [confirmingCompletionId, setConfirmingCompletionId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'deadline' | 'createdAt' | 'stake' | 'category'>('createdAt');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterUpcoming, setFilterUpcoming] = useState(false);
  
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    stake: 0.1,
    category: 'Leads',
    deadline: '',
    reminder: '1h' as 'None' | '15m' | '1h' | '1d',
    leadName: '',
    profileUrl: ''
  });

  const initiateAddTask = () => {
    if (!newTask.leadName || !newTask.profileUrl) {
      alert("All manual commitments must be linked to a lead profile.");
      return;
    }
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title || `Outreach: ${newTask.leadName}`,
      description: newTask.description,
      streak: 0,
      lastCompleted: null,
      stakeAmount: newTask.stake,
      status: 'active',
      category: newTask.category as any,
      createdAt: new Date().toISOString(),
      deadline: newTask.deadline || undefined,
      deadlineReminder: newTask.reminder,
      contactDetails: newTask.profileUrl,
      sourcePlatform: 'Web'
    };
    setConfirmModal(task);
  };

  const finalizeAddTask = async () => {
    if (confirmModal) {
      const success = await validateStaking(confirmModal.stakeAmount);
      if (success) {
        setBalance(prev => prev - confirmModal.stakeAmount);
        setTasks(prev => [...prev, confirmModal]);
        setConfirmModal(null);
        setShowAddModal(false);
        setNewTask({ title: '', description: '', stake: 0.1, category: 'Leads', deadline: '', reminder: '1h', leadName: '', profileUrl: '' });
      }
    }
  };

  const handleFinalCompletion = (id: string) => {
    setTasks(tasks.map(h => {
      if (h.id === id) {
        const isToday = h.lastCompleted === new Date().toISOString().split('T')[0];
        if (isToday) return h;
        return {
          ...h,
          streak: h.streak + 1,
          lastCompleted: new Date().toISOString().split('T')[0],
          status: 'completed'
        };
      }
      return h;
    }));
    setConfirmingCompletionId(null);
  };

  const toggleExpand = (id: string) => {
    if (confirmingCompletionId === id) return;
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => t.status !== 'missed' && t.status !== 'completed');
    if (filterCategory !== 'All') result = result.filter(t => t.category === filterCategory);
    if (filterUpcoming) {
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      result = result.filter(t => t.deadline && new Date(t.deadline).getTime() < tomorrow);
    }
    result.sort((a, b) => {
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'stake') return b.stakeAmount - a.stakeAmount;
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });
    return result;
  }, [tasks, sortBy, filterCategory, filterUpcoming]);

  const missedTasks = tasks.filter(t => t.status === 'missed').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">High Stakes Tasks</h2>
          <p className="text-slate-500">Only tasks linked to generated leads can be managed here.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <i className="fas fa-plus"></i> New Task Commitment
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-slate-100/50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Sort By:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="createdAt">Newest First</option>
            <option value="deadline">Upcoming Deadline</option>
            <option value="stake">Highest Stake</option>
            <option value="category">Category</option>
          </select>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Category:</label>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Leads">Leads Only</option>
            <option value="Marketing">Marketing</option>
            <option value="Product">Product</option>
            <option value="Health">Health</option>
          </select>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className={`w-10 h-5 rounded-full relative transition-all ${filterUpcoming ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${filterUpcoming ? 'left-5.5' : 'left-0.5'}`}></div>
          </div>
          <input type="checkbox" checked={filterUpcoming} onChange={(e) => setFilterUpcoming(e.target.checked)} className="hidden" />
          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase">Due within 24h</span>
        </label>
        <div className="ml-auto text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Showing {filteredAndSortedTasks.length} active tasks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedTasks.map((task) => {
          const isCompletedToday = task.lastCompleted === new Date().toISOString().split('T')[0];
          const isLeadOutreach = task.contactDetails && task.outreachMessage;
          const isConfirming = confirmingCompletionId === task.id;
          const isExpanded = expandedTaskId === task.id || isConfirming;

          return (
            <div 
              key={task.id} 
              className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col h-full hover:border-indigo-200 transition-all group relative overflow-hidden cursor-pointer ${isExpanded ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
              onClick={() => toggleExpand(task.id)}
            >
              {isLeadOutreach && (
                <div className="absolute top-0 right-0 p-2">
                   <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Lead Agent Task</span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100">{task.category}</span>
                <span className="text-2xl font-bold text-emerald-600">{task.streak}🔥</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{task.title}</h3>
              <p className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-day"></i> <span className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</span>
                <span className="text-slate-200">|</span>
                <i className="fas fa-clock"></i> <span className="font-medium">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
              <p className={`text-slate-500 text-sm mb-6 ${isExpanded ? '' : 'line-clamp-2'}`}>{task.description}</p>
              {isExpanded && !isConfirming && (
                <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Detailed Context</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                  </div>
                  {isLeadOutreach && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Message to Send</p>
                        <p className="text-[11px] text-slate-700 leading-relaxed italic">"{task.outreachMessage}"</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isConfirming && (
                <div className="space-y-4 mb-6 animate-in zoom-in-95 duration-200">
                   <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Rewards Summary</p>
                      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase">Stake Returned</span>
                            <span className="text-sm font-bold text-slate-900">{task.stakeAmount} SOL</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase">Circle Alert</span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1"><i className="fas fa-paper-plane"></i> Sending Success Ping</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase">Next Streak</span>
                            <span className="text-sm font-bold text-amber-600">{task.streak + 1} Days 🔥</span>
                         </div>
                      </div>
                   </div>
                </div>
              )}
              {!isConfirming && (
                <div className={`p-4 rounded-2xl mb-6 shadow-inner bg-rose-50 border border-rose-100 mt-auto`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold uppercase text-rose-600`}>Collateral Stake</span>
                    <span className="text-sm font-bold text-slate-900">{task.stakeAmount} SOL <span className="text-xs font-normal text-slate-400">(${(task.stakeAmount * 100).toFixed(2)})</span></span>
                  </div>
                  {task.deadline && (
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-[10px] font-bold text-rose-600`}>
                        Expires: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2">
                 {isConfirming ? (
                   <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFinalCompletion(task.id); }}
                        className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-200 hover:bg-emerald-700 text-sm flex items-center justify-center gap-2"
                      >
                         <i className="fas fa-check-circle"></i> Confirm Completion
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setConfirmingCompletionId(null); }}
                        className="px-4 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all text-sm"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                   </div>
                 ) : (
                   <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmingCompletionId(task.id); }}
                    disabled={isCompletedToday}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isCompletedToday 
                      ? 'bg-emerald-50 text-emerald-600 cursor-default shadow-none border border-emerald-100' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isCompletedToday ? (
                      <><i className="fas fa-check-double"></i> Verified Outreach</>
                    ) : (
                      <><i className="fas fa-bolt"></i> Complete Task</>
                    )}
                  </button>
                 )}
                {!isConfirming && (
                  <button className="w-full text-[10px] font-bold text-slate-400 uppercase hover:text-indigo-600 transition-colors">
                    {isExpanded ? 'Collapse Details' : 'View Strategy & Details'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {missedTasks.length > 0 && (
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="flex justify-between items-center mb-6 text-slate-400 uppercase tracking-widest font-bold">
            <h3 className="flex items-center gap-3"><i className="fas fa-archive"></i> Missed Tasks Archive</h3>
            <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full">{missedTasks.length} Archived</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {missedTasks.map((task) => (
              <div key={task.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 opacity-75 grayscale hover:grayscale-0 transition-all group scale-95 origin-top-left flex flex-col">
                <div className="flex justify-between items-start mb-3">
                   <span className="text-[8px] font-bold text-rose-600 uppercase border border-rose-200 px-1.5 py-0.5 rounded">Missed</span>
                   <span className="text-sm font-bold text-slate-400">{task.stakeAmount} SOL</span>
                </div>
                <h4 className="font-bold text-slate-700 text-sm mb-1 truncate">{task.title}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 mb-3 flex-1">{task.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">New Task Commitment</h3>
            <p className="text-xs text-slate-400 mb-6">Manual commitments must be linked to a lead profile.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Lead Name</label>
                  <input type="text" value={newTask.leadName} onChange={(e) => setNewTask({...newTask, leadName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black placeholder:italic" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Profile URL</label>
                  <input type="text" value={newTask.profileUrl} onChange={(e) => setNewTask({...newTask, profileUrl: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black placeholder:italic" placeholder="e.g. linkedin.com/in/johndoe" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Task Details</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black h-24 placeholder:italic" placeholder="What is the outreach strategy?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stake (SOL)</label>
                  <input type="number" value={newTask.stake} onChange={(e) => setNewTask({...newTask, stake: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Deadline</label>
                  <input type="datetime-local" value={newTask.deadline} onChange={(e) => setNewTask({...newTask, deadline: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black" />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button onClick={initiateAddTask} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Review Stake</button>
                <button onClick={() => setShowAddModal(false)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 border border-slate-100">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-lock text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Confirm Staking</h3>
            <p className="text-slate-500 text-center text-sm mb-6 px-4">You are about to lock <b>{confirmModal.stakeAmount} SOL</b> in smart-contract escrow.</p>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <div className="flex justify-between items-center mb-3 text-[10px] font-bold text-slate-400 uppercase">
                <span>Penalty Risk</span>
                <span className="text-sm font-bold text-rose-600">Donation on Failure</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                <span>Linked Lead</span>
                <span className="text-xs font-bold text-slate-700">{confirmModal.title}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={finalizeAddTask} className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"><i className="fas fa-lock"></i> Stake & Lock Escrow</button>
              <button onClick={() => setConfirmModal(null)} className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;

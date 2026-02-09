
import React, { useState } from 'react';
import { Task } from '../types';

interface HabitsProps {
  // Fixed: Habit was not defined in types.ts, replaced with Task
  habits: Task[];
  setHabits: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Habits: React.FC<HabitsProps> = ({ habits, setHabits }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    stake: 0.1,
    category: 'Leads'
  });

  const addHabit = () => {
    // Fixed: Habit type replacement
    // Added missing createdAt property to satisfy Task interface
    const habit: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newHabit.title,
      description: newHabit.description,
      streak: 0,
      lastCompleted: null,
      stakeAmount: newHabit.stake,
      status: 'active',
      category: newHabit.category as any,
      createdAt: new Date().toISOString()
    };
    setHabits([...habits, habit]);
    setShowAddModal(false);
    setNewHabit({ title: '', description: '', stake: 0.1, category: 'Leads' });
  };

  const toggleComplete = (id: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const isToday = h.lastCompleted === new Date().toISOString().split('T')[0];
        if (isToday) return h;
        return {
          ...h,
          streak: h.streak + 1,
          lastCompleted: new Date().toISOString().split('T')[0]
        };
      }
      return h;
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Habit Streaks</h2>
          <p className="text-slate-500">Commit to daily actions and stake capital as collateral.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
        >
          <i className="fas fa-plus"></i> New Commitment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => {
          const isCompletedToday = habit.lastCompleted === new Date().toISOString().split('T')[0];
          return (
            <div key={habit.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col h-full hover:border-indigo-200 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">{habit.category}</span>
                <span className="text-2xl font-bold text-emerald-600">{habit.streak}🔥</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{habit.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex-1">{habit.description}</p>
              
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-rose-600 uppercase">Collateral</span>
                  <span className="text-sm font-bold text-slate-900">{habit.stakeAmount} SOL</span>
                </div>
                <p className="text-[10px] text-rose-500">Failure to complete by EOD results in instant donation.</p>
              </div>

              <button 
                onClick={() => toggleComplete(habit.id)}
                disabled={isCompletedToday}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isCompletedToday 
                  ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isCompletedToday ? (
                  <><i className="fas fa-check-double"></i> Verified Today</>
                ) : (
                  <><i className="fas fa-fist-raised"></i> Mark Complete</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">New Streak Commitment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Habit Name</label>
                <input 
                  type="text" 
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Daily Lead Outreach"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                <textarea 
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({...newHabit, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="What specifically needs to happen?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stake (SOL)</label>
                  <input 
                    type="number" 
                    value={newHabit.stake}
                    onChange={(e) => setNewHabit({...newHabit, stake: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                  <select 
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({...newHabit, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option>Leads</option>
                    <option>Marketing</option>
                    <option>Product</option>
                    <option>Health</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button 
                  onClick={addHabit}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                >
                  Stake & Start Streak
                </button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habits;

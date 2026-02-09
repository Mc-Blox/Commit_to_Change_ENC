
import React, { useState } from 'react';
import { Task } from '../types';

interface AccountabilityProps {
  tasks: Task[];
}

interface GroupMember {
  name: string;
  role: string;
  email: string;
  inviteLink: string;
  streak: number;
  status: 'Active' | 'Missed';
}

const Accountability: React.FC<AccountabilityProps> = ({ tasks }) => {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([
    { name: 'Sarah Chen', role: 'SaaS Founder', email: 'sarah@founder.io', inviteLink: 'streak.ai/join/sarah', streak: 45, status: 'Active' },
    { name: 'Marcus Wright', role: 'Solo Consultant', email: 'marcus@wright.com', inviteLink: 'streak.ai/join/marcus', streak: 12, status: 'Active' },
    { name: 'Elena Rodriguez', role: 'Freelance Designer', email: 'elena@creative.net', inviteLink: 'streak.ai/join/elena', streak: 0, status: 'Missed' },
  ]);

  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    inviteLink: ''
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const member: GroupMember = {
      ...newMember,
      streak: 0,
      status: 'Active'
    };

    setMembers([...members, member]);
    setNewMember({ name: '', role: '', email: '', inviteLink: '' });
    setIsManageModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Social Accountability</h2>
        <p className="text-slate-500">Connect with other entrepreneurs. They'll be notified if you win or lose your stakes on daily tasks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">Your Circle</h3>
            <button 
              onClick={() => setIsManageModalOpen(true)}
              className="text-indigo-600 text-sm font-bold hover:underline"
            >
              Manage Group
            </button>
          </div>
          
          <div className="space-y-6">
            {members.map((friend, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {friend.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{friend.name}</h4>
                    <p className="text-xs text-slate-500">{friend.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{friend.streak} 🔥</p>
                  <p className={`text-[10px] uppercase font-bold ${friend.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>{friend.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4">Notification Settings</h3>
            <p className="text-slate-400 text-sm mb-8">Choose who gets alerted when you miss a task deadline.</p>
            
            <div className="space-y-4 mb-auto">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer text-white">
                <div className="flex items-center gap-3">
                  <i className="fab fa-slack text-indigo-400 text-xl"></i>
                  <span className="font-medium">Slack Channel</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-emerald-500" />
              </label>
              
              <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer text-white">
                <div className="flex items-center gap-3">
                  <i className="fab fa-discord text-blue-400 text-xl"></i>
                  <span className="font-medium">Discord Server</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-emerald-500" />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer text-white">
                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-slate-400 text-xl"></i>
                  <span className="font-medium">Direct Email to Group</span>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded accent-emerald-500" />
              </label>
            </div>

            <div className="mt-8 bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl text-white">
              <p className="text-xs text-emerald-300 font-bold mb-1 italic">Last Alert Sent:</p>
              <p className="text-sm text-white">"Alex successfully completed all tasks yesterday. Current streak: 12 days."</p>
            </div>
          </div>
          <i className="fas fa-satellite-dish absolute -right-8 -top-8 text-9xl text-white/5 rotate-12"></i>
        </div>
      </div>

      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Manage Circle Members</h3>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Title / Role</label>
                <input 
                  type="text" 
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                  placeholder="e.g. Accountability Partner"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="john@example.com"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Invitation Link URL</label>
                <input 
                  type="url" 
                  value={newMember.inviteLink}
                  onChange={(e) => setNewMember({...newMember, inviteLink: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-medium transition-all"
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i> Add to Accountability Circle
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Adding a member allows them to receive status pings and streak updates.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accountability;


import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../types';

interface DashboardProps {
  tasks: Task[];
  totalLeadsGenerated: number;
}

const AnalyticsGraph = ({ tasks }: { tasks: Task[] }) => {
  // Generate real data from tasks for the last 7 days
  const graphData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const now = new Date();
    
    // Create 7 buckets for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(23, 59, 59, 999); // End of the day for snapshot
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      
      // Completed on this specific day
      const completedOnDay = tasks.filter(t => t.lastCompleted === dateStr).length;
      
      // Tasks that were "Active" at the end of this day
      // (Created on or before this day, and not yet completed or missed)
      const activeOnDay = tasks.filter(t => {
        const createdDate = new Date(t.createdAt).getTime();
        const isCreated = createdDate <= d.getTime();
        
        // If it was completed, was it completed AFTER this day?
        const isNotYetCompleted = !t.lastCompleted || new Date(t.lastCompleted).getTime() > d.getTime();
        
        // If it was missed, was it missed AFTER this day?
        const isNotYetMissed = t.status !== 'missed' || (t.deadline && new Date(t.deadline).getTime() > d.getTime());
        
        return isCreated && isNotYetCompleted && isNotYetMissed;
      }).length;

      // Total USD staked for tasks that were "at risk" (active) at the end of this day
      const riskUsdOnDay = tasks
        .filter(t => {
          const createdDate = new Date(t.createdAt).getTime();
          const isCreated = createdDate <= d.getTime();
          const isAtRisk = t.status === 'active' || (t.deadline && new Date(t.deadline).getTime() > d.getTime() && t.status !== 'completed');
          return isCreated && isAtRisk;
        })
        .reduce((sum, t) => sum + (t.stakeAmount * 100), 0);
      
      result.push({
        day: dayName,
        completed: completedOnDay,
        active: activeOnDay,
        stakedUsdAtRisk: riskUsdOnDay
      });
    }
    return result;
  }, [tasks]);

  const maxTasks = Math.max(...graphData.map(d => d.completed + d.active), 5);
  const maxUsd = Math.max(...graphData.map(d => d.stakedUsdAtRisk), 100);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Performance Analytics</h3>
          <p className="text-xs text-slate-500 font-medium">Task Volatility vs. USD Capital At Risk</p>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 text-black"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Completed</div>
          <div className="flex items-center gap-2 text-black"><span className="w-3 h-3 rounded-full bg-indigo-200"></span> Active Streaks</div>
          <div className="flex items-center gap-2 text-indigo-600"><span className="w-3 h-1 bg-indigo-600"></span> Stake At Risk ($)</div>
        </div>
      </div>

      <div className="relative h-64 w-full">
        {/* Y-Axis Labels (Primary: Task Count) */}
        <div className="absolute left-0 h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-6 pr-2 text-right w-6">
          <span>{maxTasks}</span>
          <span>{Math.round(maxTasks / 2)}</span>
          <span>0</span>
        </div>

        {/* Y-Axis Labels (Secondary: USD at Risk) */}
        <div className="absolute right-0 h-full flex flex-col justify-between text-[10px] font-bold text-indigo-500 pb-6 pl-2 w-10">
          <span>${Math.round(maxUsd)}</span>
          <span>${Math.round(maxUsd / 2)}</span>
          <span>$0</span>
        </div>

        {/* Graph Area */}
        <div className="ml-8 mr-12 h-full flex flex-col justify-between border-b border-slate-100 pb-6">
          <div className="relative flex-1 flex items-end justify-between px-4">
            {graphData.map((data, i) => {
              const compHeight = (data.completed / maxTasks) * 100;
              const activeHeight = (data.active / maxTasks) * 100;
              const usdTop = 100 - (data.stakedUsdAtRisk / maxUsd) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                  {/* Bars */}
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div 
                      className="w-4 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:brightness-110" 
                      style={{ height: `${compHeight}%` }}
                    ></div>
                    <div 
                      className="w-4 bg-indigo-100 rounded-t-sm transition-all duration-500 hover:brightness-110" 
                      style={{ height: `${activeHeight}%` }}
                    ></div>
                  </div>
                  
                  {/* USD Line Point */}
                  <div 
                    className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-md z-20 pointer-events-none transition-all duration-500"
                    style={{ left: '50%', transform: 'translateX(-50%)', top: `${usdTop}%` }}
                  ></div>
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-16 bg-slate-900 text-white text-[9px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                    <span className="text-emerald-400 font-bold">Done: {data.completed}</span><br/>
                    <span className="text-indigo-300 font-bold">Active: {data.active}</span><br/>
                    <span className="text-white font-bold">At Risk: ${data.stakedUsdAtRisk.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}

            {/* SVG Line for Secondary Axis (USD Staked at Risk) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <path
                d={`M ${0 + 35} ${100 - (graphData[0].stakedUsdAtRisk / maxUsd) * 100}% ` + 
                   graphData.slice(1).map((_, i) => {
                     const idx = i + 1;
                     const xPos = (idx / (graphData.length - 1)) * (100);
                     return `L ${xPos}% ${100 - (graphData[idx].stakedUsdAtRisk / maxUsd) * 100}%`;
                   }).join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90 drop-shadow-sm"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          
          {/* X-Axis Labels */}
          <div className="flex justify-between px-2 pt-2 border-t border-slate-100">
            {graphData.map((data, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 w-full text-center">{data.day}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Calendar = ({ tasks }: { tasks: Task[] }) => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  const monthName = today.toLocaleString('default', { month: 'long' });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getTaskForDay = (day: number) => {
    return tasks.filter(t => {
      const date = t.deadline ? new Date(t.deadline) : new Date(t.createdAt);
      return date.getDate() === day && date.getMonth() === today.getMonth();
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900">{monthName} {today.getFullYear()}</h3>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50"><i className="fas fa-chevron-left"></i></button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50"><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const tasksToday = getTaskForDay(day);
          const isToday = day === today.getDate();
          return (
            <div 
              key={day} 
              className={`h-10 flex flex-col items-center justify-center rounded-xl text-sm font-medium relative transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {day}
              {tasksToday.length > 0 && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-indigo-400'}`}></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SocialAccountabilityActivity = () => {
  const friends = [
    { name: 'Sarah Chen', streak: 45, img: 'https://picsum.photos/seed/sarah/100/100' },
    { name: 'Marcus Wright', streak: 12, img: 'https://picsum.photos/seed/marcus/100/100' },
    { name: 'Elena Rodriguez', streak: 31, img: 'https://picsum.photos/seed/elena/100/100' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900">Social Accountability Activity</h3>
        <Link to="/accountability" className="text-xs font-bold text-indigo-600 hover:underline">View Circle</Link>
      </div>
      <div className="space-y-4">
        {friends.map((friend, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={friend.img} className="w-8 h-8 rounded-full" alt="" />
              <span className="text-sm font-medium text-slate-700">{friend.name}</span>
            </div>
            <span className="text-xs font-bold text-emerald-600">{friend.streak}🔥</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-slate-400 font-medium italic border-t border-slate-50 pt-3 text-center">
        Your group is averaging a 29-day streak!
      </p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ tasks, totalLeadsGenerated }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  const totalStaked = useMemo(() => tasks.reduce((acc, h) => {
    // Only count stake for tasks that aren't completed or missed
    if (h.status === 'active' || (h.deadline && new Date(h.deadline).getTime() > Date.now() && h.status !== 'completed')) {
      return acc + h.stakeAmount;
    }
    return acc;
  }, 0), [tasks]);
  
  const nearestDeadlineTask = useMemo(() => {
    const sorted = [...tasks]
      .filter(t => t.deadline && t.status !== 'completed' && t.status !== 'missed')
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    return sorted[0];
  }, [tasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (nearestDeadlineTask && nearestDeadlineTask.deadline) {
        const diff = new Date(nearestDeadlineTask.deadline).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('EXPIRED');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${mins}m ${secs}s`);
        }
      } else {
        setTimeLeft('No active deadlines');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nearestDeadlineTask]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <i className="fas fa-user-plus text-xl"></i>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Leads Generated</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalLeadsGenerated} Leads</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400">Calculated from AI-agent approved outreach.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <i className="fas fa-lock text-xl"></i>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Staked at Risk</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalStaked.toFixed(2)} SOL <span className="text-xs font-normal text-slate-400">(${(totalStaked * 100).toFixed(2)})</span></h3>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <i className="fas fa-exclamation-circle"></i> Penalty Active
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${timeLeft === 'EXPIRED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              <i className="fas fa-hourglass-half mr-1"></i> {timeLeft}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="fas fa-trophy text-xl"></i>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Monthly Target</p>
              <h3 className="text-2xl font-bold text-slate-900">85% Complete</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full w-[85%]"></div>
          </div>
        </div>
      </div>

      <AnalyticsGraph tasks={tasks} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Active Task Streaks</h3>
            <Link to="/tasks" className="text-xs font-bold text-indigo-600 hover:underline">View All Tasks <i className="fas fa-arrow-right ml-1"></i></Link>
          </div>
          {tasks.filter(t => t.status === 'active' || (t.deadline && new Date(t.deadline).getTime() > Date.now() && t.status !== 'completed')).slice(0, 5).map((task) => (
            <Link 
              to={`/tasks`} 
              key={task.id} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-400 hover:shadow-md transition-all block"
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${task.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase font-bold">Streak</p>
                  <p className="text-xl font-bold text-emerald-600">{task.streak}🔥</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase font-bold">Risk</p>
                  <p className="text-lg font-bold text-slate-900">{task.stakeAmount} SOL</p>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            </Link>
          ))}

          {/* Social Accountability Activity Section */}
          <SocialAccountabilityActivity />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Calendar</h3>
          <Calendar tasks={tasks} />

          <div className="bg-indigo-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg shadow-indigo-200">
            <div className="relative z-10">
              <p className="text-indigo-200 text-sm mb-4">AI found 5 new high-intent leads across X and Facebook.</p>
              <Link to="/leads" className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-slate-100 inline-block">
                View Leads
              </Link>
            </div>
            <i className="fas fa-robot absolute -right-4 -bottom-4 text-8xl text-indigo-800 opacity-50 rotate-12"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

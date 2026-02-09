
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lead, Task } from '../types';
import { generateLeads, refineLeadDetails, generatePersonalizedMessage, analyzeInboxForLead, generateFollowUpMessage } from '../services/geminiService';

interface LeadGeneratorProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onApproveLead: (lead: Lead) => void;
  tasks?: Task[]; 
  walletAddress: string | null;
  onConnectWallet: () => void;
}

const LeadGenerator: React.FC<LeadGeneratorProps> = ({ leads, setLeads, onApproveLead, tasks = [], walletAddress, onConnectWallet }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'generate' | 'followup'>('generate');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [outreachGoal, setOutreachGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [showSentModal, setShowSentModal] = useState(false);

  const [followUpAnalysis, setFollowUpAnalysis] = useState<any>(null);
  const [followUpTemplate, setFollowUpTemplate] = useState(
    "Hi [Name], just checking in regarding [Discussion Points]. Any thoughts on how [Company] could benefit from our adspace? Best, [User]"
  );

  const handleSearch = async () => {
    if (!niche || !location || !outreachGoal) {
      setStatus('Please enter Niche, Location, and Outreach Goal.');
      return;
    }
    setLoading(true);
    setStatus(`Agent scouting social platforms for top leads...`);
    try {
      const results = await generateLeads(niche, location, outreachGoal);
      setSources(results.sources || []);
      
      setStatus('Analyzing profiles and cross-referencing platforms...');
      const refined = await refineLeadDetails(results.text);
      
      const newLeads: Lead[] = refined.map((r: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...r,
        status: 'pending',
        personalizedMessage: '',
        followUpCount: 0
      }));

      setLeads(prev => [...prev, ...newLeads]);
      setStatus('');
    } catch (error) {
      console.error(error);
      setStatus('An error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalize = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoading(true);
    setStatus(`Drafting personalized outreach for ${lead.name}...`);
    try {
      const msg = await generatePersonalizedMessage(
        lead.name, 
        lead.company, 
        lead.summary, 
        outreachGoal || "Helping business owners automate growth with AI-driven systems.",
        lead.platform
      );
      setDraftMessage(msg);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleApproveAndSave = () => {
    if (selectedLead) {
      // Wallet check is handled inside onApproveLead (convertLeadToTask)
      onApproveLead({ 
        ...selectedLead, 
        personalizedMessage: draftMessage, 
        status: 'approved' 
      });
      setSelectedLead(null);
      setFollowUpAnalysis(null);
    }
  };

  const handleEmailLead = (lead: Lead) => {
    const subject = encodeURIComponent(`Regarding your ${lead.company} outreach`);
    const body = encodeURIComponent(lead.personalizedMessage);
    const email = lead.email || 'contact@prospect.io'; 
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setShowSentModal(true);
  };

  const completedLeadIds = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.leadId)
      .map(t => t.leadId);
  }, [tasks]);

  const followUpLeads = useMemo(() => {
    return leads.filter(l => completedLeadIds.includes(l.id));
  }, [leads, completedLeadIds]);

  const handleRunFollowUpAgent = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoading(true);
    setStatus(`Agent accessing your ${lead.platform} inbox for activity...`);
    try {
      const analysis = await analyzeInboxForLead(lead.name, lead.platform);
      setFollowUpAnalysis(analysis);
      
      setStatus(`Generating strategic follow-up recommendation...`);
      const msg = await generateFollowUpMessage(
        lead.name,
        lead.company,
        analysis.status,
        analysis.analysis,
        lead.platform,
        followUpTemplate
      );
      setDraftMessage(msg);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button 
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'generate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <i className="fas fa-plus-circle mr-2"></i> Lead Discovery
        </button>
        <button 
          onClick={() => setActiveTab('followup')}
          className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'followup' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <i className="fas fa-sync-alt mr-2"></i> Follow-up Agent
          {followUpLeads.length > 0 && <span className="ml-2 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px]">{followUpLeads.length}</span>}
        </button>
      </div>

      {activeTab === 'generate' ? (
        <>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Lead Agent Intelligence</h3>
              <p className="text-slate-500 mb-8">AI scouts LinkedIn, X, and Facebook simultaneously to find your best prospects.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Ideal Lead Profile</label>
                  <input 
                    type="text" 
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black placeholder:italic placeholder:text-slate-400 shadow-inner"
                    placeholder=" e.g. Saas Founder"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Location (Country, City)</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black placeholder:italic placeholder:text-slate-400 shadow-inner"
                    placeholder=" e.g. USA, New York"
                  />
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Outreach Goal</h4>
                <input 
                  type="text" 
                  value={outreachGoal}
                  onChange={(e) => setOutreachGoal(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black shadow-inner placeholder:italic placeholder:text-slate-400"
                  placeholder="e.g. looking for people to buy adspace on my blog"
                />
              </div>

              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-200"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search-dollar"></i>}
                {loading ? 'Agent Scouting...' : 'Generate New Prospects'}
              </button>
            </div>
          </div>

          {status && (
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4 text-indigo-700 animate-pulse">
              <i className="fas fa-satellite text-xl"></i>
              <span className="font-bold text-sm tracking-tight">{status}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.filter(l => l.status === 'pending' || l.status === 'approved').map((lead) => {
              const isApproved = lead.status === 'approved';
              return (
                <div key={lead.id} className={`bg-white rounded-2xl border ${isApproved ? 'border-emerald-200 shadow-emerald-50' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col hover:border-indigo-200 transition-all group`}>
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                        <img src={`https://picsum.photos/seed/${lead.name}/100/100`} alt={lead.name} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${lead.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600' : lead.platform === 'X' ? 'bg-slate-100 text-slate-900' : 'bg-indigo-50 text-indigo-700'}`}>
                          <i className={`fab fa-${lead.platform === 'X' ? 'x-twitter' : lead.platform?.toLowerCase()}`}></i>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-bold text-slate-900 text-lg leading-tight">{lead.name}</h4>
                       {isApproved && <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">Staked</span>}
                    </div>
                    <p className="text-slate-400 text-sm mb-4 font-medium">{lead.title} @ <span className="font-bold text-slate-600">{lead.company}</span></p>
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 italic border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all leading-relaxed">
                      "{lead.summary}"
                    </div>
                  </div>
                  <div className="p-6 pt-0 mt-auto flex flex-col gap-2">
                    {isApproved ? (
                      <>
                        <button 
                          onClick={() => handleEmailLead(lead)}
                          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-paper-plane"></i> Email Lead
                        </button>
                        <Link 
                          to="/tasks"
                          className="w-full py-2.5 bg-slate-50 text-slate-500 rounded-xl font-bold text-[10px] uppercase text-center hover:bg-slate-100 transition-all"
                        >
                          View Task on Board
                        </Link>
                      </>
                    ) : (
                      <button 
                        onClick={() => handlePersonalize(lead)}
                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-bolt"></i> Personalize Outreach
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Nurture Agent</h3>
              <p className="text-emerald-100/70 max-w-xl text-sm leading-relaxed mb-6">
                The Follow-up Agent automatically scans your social inboxes to track outcomes of initial outreach. If a lead hasn't responded, it drafts a high-value nudge.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 text-xs font-medium">
                    <i className="fas fa-envelope-open-text text-lg text-emerald-400"></i>
                    <span>Agent has access to <b>3 Active Platforms</b> for inbox monitoring.</span>
                 </div>
                 
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-2">Follow-up Email Template</label>
                    <textarea 
                      value={followUpTemplate}
                      onChange={(e) => setFollowUpTemplate(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-white text-xs min-h-[80px] resize-none leading-relaxed placeholder:text-white/20"
                      placeholder="Draft your master follow-up template here..."
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                       <span className="text-[8px] font-bold bg-white/10 px-1.5 py-0.5 rounded cursor-default">[Name]</span>
                       <span className="text-[8px] font-bold bg-white/10 px-1.5 py-0.5 rounded cursor-default">[Company]</span>
                       <span className="text-[8px] font-bold bg-white/10 px-1.5 py-0.5 rounded cursor-default">[Discussion Points]</span>
                    </div>
                 </div>
              </div>
            </div>
            <i className="fas fa-paper-plane absolute -right-6 -bottom-6 text-9xl text-white opacity-5 rotate-12"></i>
          </div>

          {status && status.includes('inbox') && (
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4 text-emerald-700 animate-pulse">
              <i className="fas fa-microchip text-xl"></i>
              <span className="font-bold text-sm tracking-tight">{status}</span>
            </div>
          )}

          {followUpLeads.length === 0 ? (
            <div className="py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
              <i className="fas fa-history text-4xl mb-4 opacity-30"></i>
              <p className="font-bold">No leads ready for follow-up yet.</p>
              <p className="text-xs">Complete outreach tasks first to enable the Nurture Agent.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followUpLeads.map((lead) => (
                <div key={lead.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-emerald-200 transition-all group">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                        <img src={`https://picsum.photos/seed/${lead.name}/100/100`} alt={lead.name} />
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg bg-emerald-50 text-emerald-600`}>
                        <i className={`fab fa-${lead.platform === 'X' ? 'x-twitter' : lead.platform?.toLowerCase()}`}></i>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{lead.name}</h4>
                    <p className="text-slate-400 text-sm mb-4 font-medium">{lead.company}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Outreach Completed</span>
                    </div>
                  </div>
                  <div className="p-6 pt-0 mt-auto">
                    <button 
                      onClick={() => handleRunFollowUpAgent(lead)}
                      className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-brain"></i> Scan Inbox & Nurture
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showSentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 border border-slate-100">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-check text-2xl"></i>
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Outreach Triggered!</h3>
             <p className="text-slate-500 text-sm mb-8">
               Great work! Now, make sure to <b>verify</b> this task on the board to avoid the deadline penalty and activate your rewards.
             </p>
             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => { setShowSentModal(false); navigate('/tasks'); }}
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
               >
                 Go to Tasks Board
               </button>
               <button 
                 onClick={() => setShowSentModal(false)}
                 className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 text-xs"
               >
                 Close Notification
               </button>
             </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${selectedLead.platform === 'LinkedIn' ? 'bg-blue-600 text-white' : selectedLead.platform === 'X' ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'}`}>
                  <i className={`fab fa-${selectedLead.platform === 'X' ? 'x-twitter' : selectedLead.platform?.toLowerCase()}`}></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 leading-none">
                    {followUpAnalysis ? 'Follow-up Strategy' : 'Outreach Strategy'}
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-wider">Prospect: {selectedLead.name}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedLead(null); setFollowUpAnalysis(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {!walletAddress && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                  <i className="fas fa-wallet text-amber-600"></i>
                  <p className="text-xs text-amber-700 font-medium">Connect your crypto wallet to start staking and approve this lead.</p>
                  <button 
                    onClick={onConnectWallet}
                    className="ml-auto bg-amber-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-amber-700"
                  >
                    Connect
                  </button>
                </div>
              )}

              {followUpAnalysis && (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-emerald-200 text-emerald-700 p-2 rounded-xl">
                    <i className="fas fa-envelope-open-text text-xl"></i>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Inbox Scan Results</h5>
                    <p className="text-sm font-bold text-emerald-900 mb-1">Status: {followUpAnalysis.status === 'responded' ? 'REPLY DETECTED' : followUpAnalysis.status === 'declined' ? 'DECLINED' : 'NO RESPONSE'}</p>
                    <p className="text-xs text-emerald-700 leading-relaxed italic">"{followUpAnalysis.analysis}"</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3">AI {followUpAnalysis ? 'Follow-up' : 'Discovery'} Draft</label>
                <textarea 
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-800 min-h-[140px] resize-none leading-relaxed font-medium italic"
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                />
              </div>

              <div className={`p-4 rounded-2xl border text-[11px] flex items-start gap-4 ${followUpAnalysis ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                <div className={`p-2 rounded-lg ${followUpAnalysis ? 'bg-emerald-100' : 'bg-indigo-100'}`}><i className="fas fa-shield-alt text-lg"></i></div>
                <p className="leading-relaxed">Staking <b>0.20 SOL ($20.00)</b> for this outreach. Verification required by the deadline or stake is donated.</p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={handleApproveAndSave}
                  className={`flex-1 text-white py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700`}
                >
                  <i className="fas fa-lock"></i> {followUpAnalysis ? 'Stake & Create Follow-up' : 'Stake & Approve Task'}
                </button>
                <button 
                   onClick={() => followUpAnalysis ? handleRunFollowUpAgent(selectedLead!) : handlePersonalize(selectedLead!)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  <i className="fas fa-magic"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadGenerator;

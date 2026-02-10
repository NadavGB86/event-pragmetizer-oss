import React, { useState } from 'react';
import { ScoredPlan, JudgeVerdict, SoftJudgeVerdict, ParticipantProfile, DateInfo } from '../types';
import { ChevronLeft, Calendar, MapPin, CreditCard, Send, Sparkles, OctagonAlert, ExternalLink, Hotel, Search, Globe, Loader2 } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { getComponentLinks, extractDestination } from '../utils/links';

interface ExecutionViewProps {
  plan: ScoredPlan;
  onBack: () => void;
  onUpdatePlan?: (instruction: string) => void;
  onFinalize?: () => void;
  judgeFeedback?: JudgeVerdict | null;
  softJudgeFeedback?: SoftJudgeVerdict | null;
  isSoftJudging?: boolean;
  participants?: ParticipantProfile;
  dateInfo?: DateInfo;
}

const ExecLinkIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'map': return <MapPin size={12} />;
    case 'hotel': return <Hotel size={12} />;
    case 'search': return <Search size={12} />;
    default: return <ExternalLink size={12} />;
  }
};

const ExecutionView: React.FC<ExecutionViewProps> = ({ plan, onBack, onUpdatePlan, onFinalize, judgeFeedback, softJudgeFeedback, isSoftJudging, participants, dateInfo }) => {
  const [refinementText, setRefinementText] = useState("");
  const destination = extractDestination(plan.components);
  const [isRefining, setIsRefining] = useState(false);


  // Auto-scroll to bottom of chat if we had a chat history list (future feature)
  // For now, we just want to focus input or show feedback.

  const handleRefine = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!refinementText.trim() || !onUpdatePlan) return;

      setIsRefining(true);
      
      // Call parent to handle logic
      await onUpdatePlan(refinementText);
      
      setRefinementText("");
      setIsRefining(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
      
      {/* Scrollable Plan Content */}
      <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 md:p-10">
            
            {/* Header / Back */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 md:mb-8">
                <button
                  onClick={onBack}
                  className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  <div className="p-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-100 transition-colors">
                      <ChevronLeft size={18} />
                  </div>
                  <span>Back to Options</span>
                </button>

                <button
                  onClick={async () => {
                      if (!onFinalize) return;
                      const btn = document.getElementById('finalize-btn');
                      if (btn) btn.innerText = "Locking...";
                      onFinalize();
                  }}
                  id="finalize-btn"
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   <Sparkles size={16} /> Finalize Plan
                </button>
            </div>

            {/* Plan Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-12">
                {/* Hero Banner */}
                <div className="relative bg-slate-900 text-white p-6 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 translate-y-1/2 -translate-x-1/4"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start gap-6">
                            <div>
                                <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight tracking-tight">{plan.title}</h1>
                                <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">{plan.summary}</p>
                            </div>
                            <div className="hidden md:block">
                                <div className={`px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md bg-white/5 flex flex-col items-center gap-1`}>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Feasibility</span>
                                    <span className={`text-2xl font-bold ${plan.computed_score.overall_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {plan.computed_score.overall_score}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/10">
                            <div className="flex items-center gap-2 md:gap-3 bg-white/5 px-3 md:px-4 py-2 rounded-lg border border-white/5">
                                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                                <span className="font-mono text-base md:text-xl font-medium">{getCurrencySymbol(plan.display_currency?.code || 'USD')} {plan.total_estimated_budget.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 bg-white/5 px-3 md:px-4 py-2 rounded-lg border border-white/5">
                                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                                <span className="text-lg">{(() => {
                                    const days = plan.components.map(c => c.itinerary_day || 1);
                                    const maxDay = days.length > 0 ? Math.max(...days) : 1;
                                    return `${maxDay} Day${maxDay !== 1 ? 's' : ''}`;
                                })()}</span>
                            </div>
                             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                <MapPin className="w-5 h-5 text-rose-400" />
                                <span className="text-lg">{(() => {
                                    const transport = plan.components.find(c => c.type === 'transport');
                                    if (transport) {
                                        const match = transport.title.match(/to\s+(.+)/i);
                                        if (match) return match[1];
                                    }
                                    const accom = plan.components.find(c => c.type === 'accommodation');
                                    return accom?.title || plan.title;
                                })()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Itinerary List */}
                <div className="p-4 md:p-12 bg-white">
                    <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                        <Sparkles size={20} className="text-indigo-500" />
                        Your Itinerary
                    </h3>

                    <div className="space-y-0 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-6 top-4 bottom-10 w-0.5 bg-slate-100"></div>

                        {plan.components.map((comp, idx) => (
                            <div key={`${comp.type}-${comp.title}-${idx}`} className="relative pl-12 md:pl-16 py-3 md:py-4 group first:pt-0 last:pb-0">
                                {/* Number Bubble */}
                                <div className="absolute left-0 md:left-2 top-3 md:top-4 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white border-4 border-slate-50 text-slate-400 font-bold text-xs md:text-sm flex items-center justify-center shadow-sm z-10 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                                    {idx + 1}
                                </div>

                                {/* Content Card */}
                                <div className="p-4 md:p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                let colorClass = 'bg-indigo-100 text-indigo-700';
                                                switch (comp.type) {
                                                    case 'transport': colorClass = 'bg-sky-100 text-sky-700'; break;
                                                    case 'accommodation': colorClass = 'bg-fuchsia-100 text-fuchsia-700'; break;
                                                    case 'dining': colorClass = 'bg-orange-100 text-orange-700'; break;
                                                    case 'activity': colorClass = 'bg-emerald-100 text-emerald-700'; break;
                                                    case 'logistics': colorClass = 'bg-slate-100 text-slate-700'; break;
                                                }
                                                return (
                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${colorClass}`}>
                                                        {comp.type}
                                                    </span>
                                                );
                                            })()}

                                            {comp.flexibility === 'fixed' && (
                                                <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">Fixed</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-900 transition-colors">{comp.title}</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{comp.details}</p>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 md:pt-4 border-t border-slate-200/50">
                                        <div className="text-xs font-mono text-slate-500 flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                            <span className="font-bold text-slate-700">{getCurrencySymbol(plan.display_currency?.code || 'USD')}</span>
                                            Est. {comp.cost_estimate.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {getComponentLinks(comp, destination, participants, dateInfo).map((link) => (
                                                <a
                                                  key={link.url}
                                                  href={link.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                                                  title={link.label}
                                                >
                                                  <ExecLinkIcon type={link.icon} />
                                                  {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Soft Judge Advisory Panel */}
            {(isSoftJudging || softJudgeFeedback) && (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 md:p-8">
                {isSoftJudging && !softJudgeFeedback ? (
                  <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Evaluating plan quality...</span>
                  </div>
                ) : softJudgeFeedback && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Plan Advisory</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        softJudgeFeedback.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        softJudgeFeedback.score >= 60 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {softJudgeFeedback.score}/100
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{softJudgeFeedback.summary}</p>

                    {softJudgeFeedback.date_alignment && (
                      <p className="text-xs text-indigo-600 mb-3 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {softJudgeFeedback.date_alignment}
                      </p>
                    )}

                    {softJudgeFeedback.grounding_notes.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Globe size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Facts</span>
                        </div>
                        <ul className="space-y-0.5">
                          {softJudgeFeedback.grounding_notes.map((note, i) => (
                            <li key={`gn-${i}`} className="text-xs text-slate-500 flex items-start gap-1.5">
                              <span className="text-slate-300 mt-0.5 shrink-0">&#8226;</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {softJudgeFeedback.suggestions.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Suggestions (click to apply)</span>
                        <div className="flex flex-wrap gap-2">
                          {softJudgeFeedback.suggestions.map((s, i) => (
                            <button
                              key={`sug-${i}`}
                              onClick={() => setRefinementText(s)}
                              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer font-medium"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

        </div>
      </div>

      {/* Refinement Bar (Fixed Bottom) */}
      <div className="shrink-0 z-50 bg-white border-t border-indigo-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-3 md:p-6 pb-safe">
         <div className="max-w-4xl mx-auto">
             
             {/* Judge Feedback Banner */}
             {judgeFeedback && !judgeFeedback.pass && (
                 <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
                     <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                         <OctagonAlert size={20} /> 
                     </div>
                     <div>
                         <h4 className="text-red-800 font-bold mb-1">Judge Rejected Plan</h4>
                         <p className="text-red-700 text-sm mb-2 font-medium">{judgeFeedback.reasoning}</p>
                         <ul className="list-disc list-inside text-xs text-red-600 space-y-1 pl-1">
                             {judgeFeedback.feedback.map((f) => <li key={`fb-${f}`}>{f}</li>)}
                         </ul>
                     </div>
                 </div>
             )}

             <form onSubmit={handleRefine} className="relative flex items-center gap-2 md:gap-3">
                 <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Sparkles size={18} />
                    </div>
                    <input
                        type="text"
                        value={refinementText}
                        onChange={(e) => setRefinementText(e.target.value)}
                        placeholder="Ask for changes..."
                        disabled={isRefining || !onUpdatePlan}
                        className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm md:text-base text-slate-700 placeholder:text-slate-400"
                    />
                 </div>
                 
                 <button
                    type="submit"
                    disabled={isRefining || !refinementText.trim() || !onUpdatePlan}
                    className={`
                        h-12 md:h-14 px-4 md:px-8 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0
                        ${isRefining || !refinementText.trim() 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-600/30'}
                    `}
                 >
                    {isRefining ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Refining...</span>
                        </>
                    ) : (
                        <>
                            <span className="hidden md:inline">Update Plan</span>
                            <Send size={18} />
                        </>
                    )}
                 </button>
             </form>
             <div className="text-center mt-3">
                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    AI-Powered Refinement • Updates Scores Instantly
                 </p>
             </div>
         </div>
      </div>
    </div>
  );
};

export default ExecutionView;

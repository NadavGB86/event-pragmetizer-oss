import React from 'react';
import { ScoredPlan, JudgeVerdict, ParticipantProfile, DateInfo } from '../types';
import { CheckCircle, Share2, Printer, Lock, ShieldCheck, MessageSquareText, MapPin, ExternalLink, Hotel, Search, Globe, Calendar } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { getComponentLinks, extractDestination } from '../utils/links';
import { downloadPlanHtml } from '../utils/shareHtml';

interface FinalViewProps {
  plan: ScoredPlan;
  onRestart: () => void;
  judgeVerdict?: JudgeVerdict | null;
  participants?: ParticipantProfile;
  dateInfo?: DateInfo;
}

const LinkIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'map': return <MapPin size={12} />;
    case 'hotel': return <Hotel size={12} />;
    case 'search': return <Search size={12} />;
    default: return <ExternalLink size={12} />;
  }
};

const FinalItineraryView: React.FC<FinalViewProps> = ({ plan, onRestart, judgeVerdict, participants, dateInfo }) => {
  const destination = extractDestination(plan.components);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-12">
       <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
             <div className="relative z-10">
                 <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-emerald-500/30">
                    <CheckCircle size={16} />
                    Approved & Finalized
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold mb-4">{plan.title}</h1>
                 <p className="text-slate-400 text-lg">Ready for booking. This itinerary is locked.</p>
                 {dateInfo?.tier === 'exact' && dateInfo.start_date && dateInfo.end_date && (
                   <div className="flex items-center justify-center gap-2 mt-3 text-indigo-300 text-sm">
                     <Calendar size={14} />
                     <span>{new Date(dateInfo.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} &ndash; {new Date(dateInfo.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                   </div>
                 )}
             </div>
          </div>

          {/* Action Bar */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
             <div className="flex gap-2 items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Lock size={12} />
                Immutable Mode
             </div>
             <div className="flex gap-3">
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                    <Printer size={16} /> Print
                </button>
                <button
                    onClick={() => downloadPlanHtml(plan, judgeVerdict, participants, dateInfo)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                    <Share2 size={16} /> Share as HTML
                </button>
             </div>
          </div>

          {/* Content Placeholder for Rich Itinerary */}
          <div className="p-12 space-y-12">
              <div className="prose prose-slate max-w-none">
                  <h3>Executive Summary</h3>
                  <p>{plan.summary}</p>
                  
                  <hr className="my-8" />
                  
                  <h3>Detailed Schedule</h3>
                  <div className="not-prose space-y-8">
                       {/* Group items by day (excluding logistics) */
                        (() => {
                        const grouped: Record<string, typeof plan.components> = {};
                        plan.components.filter(c => c.type !== 'logistics').forEach(comp => {
                            const day = String(comp.itinerary_day || 1);
                            if (!grouped[day]) grouped[day] = [];
                            grouped[day].push(comp);
                        });
                        return Object.entries(grouped);
                        })()
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([dayNum, components]) => (
                            <div key={dayNum} className="relative">
                                <div className="sticky top-0 z-10 bg-slate-50 py-2 mb-4 border-b border-slate-200">
                                    <h4 className="text-xl font-bold text-indigo-900">Day {dayNum}</h4>
                                </div>
                                
                                <div className="space-y-6 pl-4 border-l-2 border-indigo-100 ml-2">
                                    {components.map((comp, idx) => (
                                       <div key={`${comp.type}-${comp.title}-${idx}`} className="flex gap-4 relative">
                                           <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
                                           <div className="flex-1 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                               <div className="flex justify-between items-start">
                                                   <h5 className="font-bold text-slate-800">{comp.title}</h5>
                                                   <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                       {getCurrencySymbol(plan.display_currency?.code || 'USD')}{comp.cost_estimate.toLocaleString()}
                                                   </span>
                                              </div>
                                              <p className="text-sm text-slate-600 mt-1">{comp.details}</p>
                                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                                                      {comp.type}
                                                  </span>
                                                  {getComponentLinks(comp, destination, participants, dateInfo).map((link) => (
                                                      <a
                                                        key={link.url}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                                                      >
                                                        <LinkIcon type={link.icon} />
                                                        {link.label}
                                                      </a>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                   ))}
                               </div>
                           </div>
                       ))
                      }
                  </div>

                  {/* Judge Verdict */}
                  {judgeVerdict && (
                    <div className="mt-12 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-start gap-3 mb-4">
                        <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-emerald-900 font-bold">Feasibility Verdict</h4>
                            <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                              {judgeVerdict.score}/100
                            </span>
                          </div>
                          <p className="text-sm text-emerald-800 leading-relaxed">{judgeVerdict.reasoning}</p>
                        </div>
                      </div>
                      {judgeVerdict.feedback.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <div className="flex items-center gap-1.5 mb-2">
                            <MessageSquareText size={14} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Considerations</span>
                          </div>
                          <ul className="space-y-1">
                            {judgeVerdict.feedback.map((f) => (
                              <li key={`jf-${f}`} className="text-sm text-emerald-700 flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">&#8226;</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {judgeVerdict.grounding_notes && judgeVerdict.grounding_notes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Globe size={14} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified Facts</span>
                          </div>
                          <ul className="space-y-1">
                            {judgeVerdict.grounding_notes.map((note, i) => (
                              <li key={`gn-${i}`} className="text-sm text-emerald-700 flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">&#8226;</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!judgeVerdict && (
                    <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="text-slate-900 font-bold mb-2">Notes from the Pragmetizer</h4>
                      <p className="text-sm text-slate-600">
                          This plan has passed our strict feasibility check. Prices are estimates based on standard rates for the season.
                          Booking early is recommended.
                      </p>
                    </div>
                  )}
              </div>

              <div className="text-center pt-12">
                  <button onClick={onRestart} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                      Start a New Plan
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default FinalItineraryView;

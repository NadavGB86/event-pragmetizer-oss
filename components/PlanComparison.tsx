import React from 'react';
import { ScoredPlan, CandidatePlan } from '../types';
import { Check, ArrowRight, AlertTriangle, BarChart3, Info } from 'lucide-react';

interface PlanComparisonProps {
  plans: ScoredPlan[];
  onSelect: (plan: CandidatePlan) => void;
  onRegenerate: () => void;
  onEditConstraints: () => void;
}

const PlanComparison: React.FC<PlanComparisonProps> = ({ plans, onSelect, onRegenerate, onEditConstraints }) => {
  
  if (plans.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-red-50 p-6 rounded-full mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Plans Generated</h3>
            <p className="text-slate-600 max-w-md mb-8">
                The AI Analyst couldn't synthesize a valid plan for your request. This might happen if the constraints are too strict or the service timed out.
            </p>
            <div className="flex gap-4">
                <button onClick={onEditConstraints} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50">
                    Edit Constraints
                </button>
                <button onClick={onRegenerate} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg">
                    Try Again
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Synthesized Candidates</h2>
            <p className="text-slate-500 mt-2">Comparison based on feasibility and desire fulfillment.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onEditConstraints}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Edit Profile
            </button>
            <button 
              onClick={onRegenerate}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
            >
              <span className="text-lg">↻</span> Regenerate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const score = plan.computed_score;
            const isFeasible = score.is_valid_hard;

            return (
              <div key={plan.id} className={`
                relative flex flex-col rounded-2xl shadow-sm border transition-all duration-300
                ${isFeasible ? 'bg-white border-slate-200 hover:border-indigo-300' : 'bg-red-50 border-red-200 opacity-90'}
              `}>
                
                {/* Feasibility Badge */}
                <div className="absolute top-4 right-4 z-10">
                   {/* Logic extracted for readability */}
                   {(() => {
                       const isHighScoring = score.overall_score >= 80;
                       
                       let badgeClass = 'bg-red-100 text-red-700'; // Default fail
                       if (isFeasible) {
                           badgeClass = isHighScoring ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
                       }

                       let scoreColor = 'text-red-500';
                       if (plan.computed_score.overall_score >= 80) scoreColor = 'text-green-600';
                       else if (plan.computed_score.overall_score >= 60) scoreColor = 'text-amber-600';

                       return (
                           <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ${badgeClass}`}>
                               <span className={`text-2xl font-bold ${scoreColor}`}>
                                   {plan.computed_score.overall_score}%
                               </span>
                               {isFeasible ? <Check size={12}/> : <AlertTriangle size={12}/>}
                               {score.overall_score}% Match
                           </div>
                       );
                   })()}
                </div>

                {/* Header */}
                <div className="p-6 border-b border-slate-100/50 pb-4">
                  <h3 className="text-xl font-bold text-slate-800 leading-tight pr-20">{plan.title}</h3>
                  <div className="mt-4 flex flex-col gap-2">
                    {/* Budget Score Line */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            {plan.display_currency?.code || 'USD'}
                        </span>
                        <span>Budget Fit</span>
                      </div>
                      <span className={`font-medium ${score.dimensions.budget.score < 100 ? 'text-red-500' : 'text-slate-700'}`}>
                        {score.dimensions.budget.reason}
                      </span>
                    </div>
                     {/* Experience Score Line */}
                     <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <BarChart3 size={14} />
                        <span>Experience</span>
                      </div>
                      <span className="font-medium text-slate-700">
                        {Math.round(score.dimensions.experience.score)}%
                      </span>
                    </div>

                     {/* Sanity / Constraints Line - Show only if issue */}
                     {score.dimensions.constraints.score < 100 && (
                        <div className="bg-red-50 p-2 rounded text-xs text-red-700 mt-2 flex items-start gap-1">
                            <Info size={12} className="mt-0.5 shrink-0" />
                            {score.dimensions.constraints.reason}
                        </div>
                     )}
                  </div>
                </div>

                {/* Summary */}
                <div className="px-6 py-4">
                  <p className="text-sm text-slate-600 line-clamp-3">{plan.summary}</p>
                </div>

                {/* Components Preview */}
                <div className="px-6 pb-4 flex-1 space-y-3">
                   {plan.components.slice(0, 3).map((comp, idx) => (
                      <div key={`${comp.type}-${idx}`} className="flex gap-3 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                          <div>
                              <p className="text-xs font-bold text-slate-500 uppercase">{comp.type}</p>
                              <p className="text-sm text-slate-800 leading-snug">{comp.title}</p>
                          </div>
                      </div>
                   ))}
                </div>

                {/* Action */}
                <div className="p-6 mt-auto">
                  <button
                    onClick={() => onSelect(plan)}
                    className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors
                      ${isFeasible 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}
                    `}
                  >
                    {isFeasible ? 'Select & Refine' : 'Review Issues'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanComparison;

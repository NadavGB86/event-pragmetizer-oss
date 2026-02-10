import React from 'react';
import { UserProfile, Constraint, Target } from '../types';
import {  ShieldAlert, Target as TargetIcon, Wallet, Clock, Heart, BrainCircuit, Calendar } from 'lucide-react';

interface ProfileSidebarProps {
  profile: UserProfile;
  className?: string;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ profile, className }) => {
  const { needs, goals } = profile;

  const renderConstraint = (c: Constraint, idx: number) => {
    let icon = <ShieldAlert className="w-4 h-4 text-slate-500" />;
    if (c.type === 'budget') icon = <Wallet className="w-4 h-4 text-emerald-600" />;
    if (c.type === 'time') icon = <Clock className="w-4 h-4 text-blue-600" />;

    return (
      <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded shadow-sm border border-slate-100 text-sm">
        <div className="mt-0.5">{icon}</div>
        <div>
          <span className="font-medium text-slate-700">{c.type.toUpperCase()}: </span>
          <span className="text-slate-600">{c.value}</span>
          <div className="text-xs text-slate-400 capitalize">{c.flexibility} constraint</div>
        </div>
      </div>
    );
  };

  const renderTarget = (t: Target, idx: number) => (
    <div key={idx} className="flex items-center gap-2 bg-indigo-50 p-2 rounded text-sm border border-indigo-100">
      <TargetIcon className="w-3 h-3 text-indigo-600" />
      <span className="text-indigo-900">{t.description}</span>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-slate-50 border-l border-slate-200 overflow-y-auto ${className}`}>
      <div className="p-6 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Live Context</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Real-time extraction from conversation
        </p>
      </div>

      <div className="p-4 space-y-6">

        {/* Participants Section */}
        <section className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
            <div>
                <h3 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">Trip Party</h3>
                <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
                    <span>{needs.participants.adults} Adults</span>
                    {needs.participants.children > 0 && <span>• {needs.participants.children} Kids</span>}
                    <span className="text-indigo-400">|</span>
                    <span>{needs.participants.room_count} Room{needs.participants.room_count > 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-indigo-400 mt-0.5">{needs.participants.description}</p>
            </div>
            <Heart className="w-5 h-5 text-indigo-300" />
        </section>

        {/* Travel Dates Section */}
        <section className="bg-sky-50 border border-sky-100 rounded-lg p-3 flex items-center justify-between">
            <div>
                <h3 className="text-xs font-semibold text-sky-900 uppercase tracking-wider mb-1">Travel Dates</h3>
                {profile.date_info?.tier === 'exact' && profile.date_info.start_date && profile.date_info.end_date ? (
                  <p className="text-sky-700 text-sm font-medium">
                    {new Date(profile.date_info.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &ndash; {new Date(profile.date_info.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                ) : profile.date_info?.tier === 'proximity' ? (
                  <div>
                    <p className="text-sky-700 text-sm font-medium">{profile.date_info.hint || 'Approximate window'}</p>
                    {profile.date_info.earliest && profile.date_info.latest && (
                      <p className="text-xs text-sky-400 mt-0.5">
                        {new Date(profile.date_info.earliest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &ndash; {new Date(profile.date_info.latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sky-400 text-sm italic">No dates set yet</p>
                )}
            </div>
            <Calendar className="w-5 h-5 text-sky-300" />
        </section>

        {/* Needs Section */}
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Global Needs & Constraints
          </h3>
          
          <div className="space-y-2">
            {needs.constraints.length === 0 && needs.standards.length === 0 && (
              <p className="text-sm text-slate-400 italic">Listening for constraints...</p>
            )}
            {needs.constraints.map(renderConstraint)}
            
            {needs.standards.length > 0 && (
                <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-slate-500">Standards:</p>
                    <div className="flex flex-wrap gap-1">
                        {needs.standards.map((s, i) => (
                            <span key={`${s}-${i}`} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-full">{s}</span>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </section>

        {/* Goals Section */}
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            Event Goals <Heart className="w-3 h-3 text-pink-400" />
          </h3>
          
          <div className="space-y-2">
            {goals.targets.length === 0 && goals.declared_wants.length === 0 && goals.visions.length === 0 && (
                 <p className="text-sm text-slate-400 italic">Listening for desires...</p>
            )}
            
            {goals.visions.length > 0 && (
                 <div className="mb-3 p-3 bg-amber-50 rounded border border-amber-100">
                    <p className="text-xs font-medium text-amber-700 mb-1">Vision & Vibe:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {goals.visions.map((v) => (
                          <li key={`vision-${v.description}`} className="text-xs text-amber-800 italic">{v.description}</li>
                      ))}
                    </ul>
                </div>
            )}

            {goals.targets.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Targets:</p>
                {goals.targets.map(renderTarget)}
              </div>
            )}
            
            {goals.declared_wants.length > 0 && (
                 <div className="mt-2">
                    <p className="text-xs font-medium text-slate-500 mb-1">Wants:</p>
                    <div className="flex flex-wrap gap-1">
                        {goals.declared_wants.map((w) => (
                             <span key={`want-${w}`} className="px-2 py-1 bg-pink-50 text-pink-700 border border-pink-100 text-xs rounded-full">{w}</span>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProfileSidebar;
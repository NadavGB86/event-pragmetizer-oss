import React, { useState, useEffect } from 'react';
import { AppPhase, ChatMessage, UserProfile, CandidatePlan, ScoredPlan, AppState, SoftJudgeVerdict } from './types';
import { INITIAL_USER_PROFILE } from './constants';
import * as GeminiService from './services/geminiService';
import { softEvaluatePlan, evaluatePlan } from './services/judgeService';
import { assessReadiness } from './utils/readiness';
import { mergeProfile } from './utils/profileMerge';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useAuth } from './context/AuthContext';
import { savePlan } from './services/storageService';

import ChatInterface from './components/ChatInterface';
import ProfileSidebar from './components/ProfileSidebar';
import PlanComparison from './components/PlanComparison';
import ExecutionView from './components/ExecutionView';
import FinalItineraryView from './components/FinalItineraryView';
import AuthAwareHeader from './components/AuthAwareHeader';
import LoginModal from './components/auth/LoginModal';
import CloudLoadModal from './components/persistence/CloudLoadModal';
import { exportState, validateAndParseState } from './utils/persistence';
import ErrorBoundary from './components/ErrorBoundary';
import { Sparkles, KeyRound, ExternalLink, BrainCircuit, X } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  // --- State with Persistence ---
  
  // --- Consolidated State with Undo/Redo ---
  
  // Helper to load legacy or new state, with migration for new fields
  const loadInitialState = (): AppState => {
      let state: AppState | null = null;

      // Try new single-key state
      const v2 = localStorage.getItem('ep_app_v2');
      if (v2) {
          try { state = JSON.parse(v2); } catch { /* corrupt localStorage */ }
      }

      if (!state) {
        // Fallback to legacy individual keys
        const load = <T,>(key: string, def: T): T => {
            const s = localStorage.getItem(key);
            if (!s) return def;
            try { return JSON.parse(s); } catch { return def; }
        };

        state = {
            phase: load<AppPhase>('ep_phase', AppPhase.INTAKE),
            messages: load<ChatMessage[]>('ep_messages', [{
                id: 'init',
                role: 'model',
                content: "Hi! I'm your Event Pragmetizer. I'm here to turn your vague ideas into a solid plan. What kind of event are we planning today?",
                timestamp: 0
            }]),
            userProfile: load<UserProfile>('ep_userProfile', INITIAL_USER_PROFILE),
            generatedPlans: load<ScoredPlan[]>('ep_generatedPlans', []),
            selectedPlan: load<CandidatePlan | null>('ep_selectedPlan', null),
            judgeFeedback: null,
            softJudgeFeedback: null,
        };
      }

      // Migration: ensure new M3.0 fields exist on old localStorage
      if (!state.userProfile.date_info) {
        state.userProfile = { ...state.userProfile, date_info: { tier: 'none' } };
      }
      if (state.softJudgeFeedback === undefined) {
        state.softJudgeFeedback = null;
      }

      return state;
  };

  const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo<AppState>(loadInitialState());
  const [isProcessing, setIsProcessing] = useState(false); // Transient UI state, no undo
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCloudLoadOpen, setIsCloudLoadOpen] = useState(false);
  const [showDatePivot, setShowDatePivot] = useState(false); // Transient, not undoable
  const [isSoftJudging, setIsSoftJudging] = useState(false); // Transient, not undoable
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar drawer
  const { user } = useAuth();

  // Destructure for easier usage below (read-only)
  const { phase, messages, userProfile, generatedPlans, selectedPlan, judgeFeedback, softJudgeFeedback } = state;

  // Setters wrappers for Undo/Redo compat
  const setPhase = (p: AppPhase | ((prev: AppPhase) => AppPhase)) => 
      setState(prev => ({ ...prev, phase: typeof p === 'function' ? p(prev.phase) : p }));
  
  const setMessages = (m: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => 
      setState(prev => ({ ...prev, messages: typeof m === 'function' ? m(prev.messages) : m }));

  const setUserProfile = (p: UserProfile | ((prev: UserProfile) => UserProfile)) => 
      setState(prev => ({ ...prev, userProfile: typeof p === 'function' ? p(prev.userProfile) : p }));
      
  const setGeneratedPlans = (p: ScoredPlan[]) => 
      setState(prev => ({ ...prev, generatedPlans: p }));
      
  const setSelectedPlan = (p: CandidatePlan | null) => 
      setState(prev => ({ ...prev, selectedPlan: p }));

  const setJudgeFeedback = (f: import('./types').JudgeVerdict | null) =>
      setState(prev => ({ ...prev, judgeFeedback: f }));

  const setSoftJudgeFeedback = (f: SoftJudgeVerdict | null) =>
      setState(prev => ({ ...prev, softJudgeFeedback: f }));

  // Soft judge trigger — async, non-blocking (fire-and-forget)
  const triggerSoftJudge = (plan: ScoredPlan) => {
    setIsSoftJudging(true);
    setSoftJudgeFeedback(null);
    softEvaluatePlan(plan, userProfile)
      .then(verdict => setSoftJudgeFeedback(verdict))
      .catch(() => setSoftJudgeFeedback(null))
      .finally(() => setIsSoftJudging(false));
  };

  // Persistence Effect (Single Source of Truth)
  useEffect(() => {
      localStorage.setItem('ep_app_v2', JSON.stringify(state));
      // Legacy backup for safety (optional, maybe skip to clean up)
  }, [state]);

  // Reset Function
  const handleReset = () => {
      localStorage.clear();
      globalThis.location.reload();
  };

  // Import/Export Handlers (New Feature)
  const handleExport = () => {
    exportState(phase, messages, userProfile, generatedPlans, selectedPlan);
  };

  const handleImportClick = () => {
     document.getElementById('import-input')?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     try {
       const data = await validateAndParseState(file);
       if (confirm(`Load backup from ${new Date(file.lastModified).toLocaleDateString()}? This will replace your current session.`)) {
          setPhase(data.phase);
          setMessages(data.messages);
          setUserProfile(data.userProfile);
          setGeneratedPlans(data.generatedPlans);
          setSelectedPlan(data.selectedPlan);
          alert("Backup loaded successfully.");
       }
     } catch (err) {
       alert("Failed to load backup: " + (err as Error).message);
     }
     e.target.value = ''; // Reset
  };

  // Cloud Handlers
  const handleCloudSave = async () => {
    if (!user) return;
    const title = prompt('Name this plan:');
    if (!title) return;

    const { error } = await savePlan(user.id, title, state);
    if (error) {
      alert('Cloud save failed: ' + error);
    } else {
      alert('Plan saved to cloud.');
    }
  };

  const handleCloudLoad = (data: AppState) => {
    setState(data);
  };

  // Derived State
  const readiness = assessReadiness(userProfile);

  // --- Handlers ---

  const handleSendMessage = async (text: string) => {
    // Optimistic UI update
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsProcessing(true);

    // Call API
    const result = await GeminiService.sendMessageToAnalyst(updatedHistory, userProfile);

    // Update Profile if new data extracted
    if (result.profileUpdate) {
       setUserProfile(prev => mergeProfile(prev, result.profileUpdate!));
    }

    // Add Model Response
    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: result.text,
      timestamp: Date.now()
    };
    setMessages([...updatedHistory, modelMsg]);
    setIsProcessing(false);
  };

  const handleGeneratePlans = async () => {
    // Date pivot: if no dates set, show inline prompt first
    if (userProfile.date_info.tier === 'none' && !showDatePivot) {
      setShowDatePivot(true);
      return;
    }
    setShowDatePivot(false);

    setIsProcessing(true);
    setPhase(AppPhase.SYNTHESIS);

    const plans = await GeminiService.generateCandidatePlans(userProfile);
    setGeneratedPlans(plans);
    setPhase(AppPhase.MATCHING);
    setIsProcessing(false);
  };

  const handleContinueWithoutDates = () => {
    setShowDatePivot(false);
    // Proceed directly to generation
    setIsProcessing(true);
    setPhase(AppPhase.SYNTHESIS);
    GeminiService.generateCandidatePlans(userProfile).then(plans => {
      setGeneratedPlans(plans);
      setPhase(AppPhase.MATCHING);
      setIsProcessing(false);
    });
  };

  const handleSelectPlan = (plan: CandidatePlan) => {
    setSelectedPlan(plan);
    setJudgeFeedback(null);
    setSoftJudgeFeedback(null);
    setPhase(AppPhase.EXECUTION);
    triggerSoftJudge(plan as ScoredPlan);
  };

  const handleJudgeRejectionBack = () => {
    setJudgeFeedback(null);
    setSoftJudgeFeedback(null);
    setSelectedPlan(null);
    setPhase(AppPhase.MATCHING);
  };

  const handleRefinePlan = async (instruction: string) => {
      if (!selectedPlan) return;

      const current = selectedPlan as ScoredPlan;
      setSoftJudgeFeedback(null);

      const refined = await GeminiService.refinePlan(current, instruction, userProfile);
      setSelectedPlan(refined);
      triggerSoftJudge(refined);
  };

  // --- Render Logic ---

  const handleFinalizePlan = async () => {
      if (!selectedPlan) return;
      
      // 1. Call Judge
      setIsProcessing(true); // Show spinner/overlay ideally
      
      try {
        const verdict = await evaluatePlan(selectedPlan as ScoredPlan, userProfile);
        
        setIsProcessing(false);

        if (verdict.pass) {
            setJudgeFeedback(verdict); // Keep verdict for display on final view
            setPhase(AppPhase.FINAL_EXECUTION);
        } else {
            setJudgeFeedback(verdict); // Show UI error
        }
      } catch (err) {
          console.error("Judge Failure", err);
          setIsProcessing(false);
          alert("Could not reach the judge. Please try again.");
      }
  };

  // --- Render Logic ---

  // API key check — show setup screen if Gemini API key is not configured
  if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <KeyRound className="text-amber-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Welcome to Event Pragmetizer</h1>
              <p className="text-sm text-slate-500">API key required to get started</p>
            </div>
          </div>
          <div className="space-y-4 text-sm text-slate-600">
            <p>This app uses the Google Gemini API to power its AI features. To get started:</p>
            <ol className="list-decimal list-inside space-y-2 pl-1">
              <li>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
                >
                  Get a free Gemini API key <ExternalLink size={12} />
                </a>
              </li>
              <li>Copy <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.example</code> to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code></li>
              <li>Add your key: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">GEMINI_API_KEY=your_key</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-mono">cp .env.example .env.local</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-screen h-[100dvh] bg-slate-100 overflow-hidden">
      
      {/* App Header */}
      <AuthAwareHeader
        phase={phase}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={undo}
        redo={redo}
        onExport={handleExport}
        onImportClick={handleImportClick}
        onReset={handleReset}
        onCloudSave={handleCloudSave}
        onCloudLoad={() => setIsCloudLoadOpen(true)}
        onLogin={() => setIsLoginOpen(true)}
      />
      <input
        type="file"
        id="import-input"
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Phase 1: Intake View */}
        {phase === AppPhase.INTAKE && (
          <>
            {/* Chat Column */}
            <div className="flex-1 flex flex-col relative z-0">
               <ChatInterface
                 messages={messages}
                 onSendMessage={handleSendMessage}
                 isProcessing={isProcessing}
               />


               {/* Floating Generate Button Area */}
               <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex flex-col items-center gap-2">
                 {/* Readiness Feedback */}
                 {!readiness.isReady && messages.length > 2 && (
                    <div className="bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-full shadow-sm border border-amber-200 animate-fade-in">
                      Still needed: {readiness.missingCritical.join(', ')}
                    </div>
                 )}

                 {/* Date Pivot */}
                 {showDatePivot && (
                   <div className="bg-white border border-indigo-200 rounded-xl shadow-lg p-4 w-full animate-fade-in">
                     <p className="text-sm text-slate-700 mb-3 text-center font-medium">
                       No travel dates set yet. Plans will use off-peak estimates.
                     </p>
                     <div className="flex gap-2 justify-center">
                       <button
                         onClick={handleContinueWithoutDates}
                         className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                       >
                         Continue without dates
                       </button>
                       <button
                         onClick={() => setShowDatePivot(false)}
                         className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                       >
                         Add a date window
                       </button>
                     </div>
                   </div>
                 )}

                 <button
                   onClick={handleGeneratePlans}
                   disabled={isProcessing || !readiness.isReady}
                   className={`
                     flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all font-semibold
                     ${readiness.isReady
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                   `}
                 >
                   <Sparkles size={18} />
                   Generate Plans
                 </button>
               </div>

               {/* Mobile: floating sidebar toggle */}
               <button
                 onClick={() => setSidebarOpen(true)}
                 className="md:hidden absolute top-3 right-3 z-10 p-2.5 bg-white rounded-full shadow-lg border border-slate-200 text-indigo-600 active:bg-indigo-50"
               >
                 <BrainCircuit size={20} />
               </button>
            </div>

            {/* Sidebar Column — desktop */}
            <div className="w-80 lg:w-96 shrink-0 hidden md:block h-full shadow-xl z-10">
              <ProfileSidebar profile={userProfile} className="h-full" />
            </div>

            {/* Sidebar Drawer — mobile */}
            {sidebarOpen && (
              <div className="md:hidden fixed inset-0 z-40 flex">
                <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
                <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white shadow-2xl animate-slide-in-right">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full text-slate-400 hover:text-slate-600 active:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
                  <ProfileSidebar profile={userProfile} className="h-full" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Phase 2: Synthesis (Loading) */}
        {phase === AppPhase.SYNTHESIS && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-center px-6">
                 <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                 <h2 className="text-xl font-semibold text-slate-800">Synthesizing Options...</h2>
                 <p className="text-slate-500 mt-2">The Analyst is reviewing your constraints against possibilities.</p>
             </div>
        )}

        {/* Phase 3: Matching / Selection */}
        {phase === AppPhase.MATCHING && (
          <div className="w-full h-full">
            <PlanComparison 
              plans={generatedPlans} 
              onSelect={handleSelectPlan}
              onRegenerate={handleGeneratePlans}
              onEditConstraints={() => setPhase(AppPhase.INTAKE)}
            />
          </div>
        )}

        {/* Phase 4: Execution (Refinement) */}
        {phase === AppPhase.EXECUTION && selectedPlan && (
           <div className="w-full h-full">
             <ExecutionView
               plan={selectedPlan as ScoredPlan}
               onBack={() => setPhase(AppPhase.MATCHING)}
               onBackToOptions={handleJudgeRejectionBack}
               onUpdatePlan={(instruction) => handleRefinePlan(instruction)}
               onFinalize={handleFinalizePlan}
               judgeFeedback={judgeFeedback}
               softJudgeFeedback={softJudgeFeedback}
               isSoftJudging={isSoftJudging}
               participants={userProfile.needs.participants}
               dateInfo={userProfile.date_info}
             />
           </div>
        )}

        {/* Phase 5: Final Execution (Immutable) */}
        {phase === AppPhase.FINAL_EXECUTION && selectedPlan && (
            <div className="w-full h-full">
                <FinalItineraryView
                    plan={selectedPlan as ScoredPlan}
                    onRestart={handleReset}
                    judgeVerdict={judgeFeedback}
                    participants={userProfile.needs.participants}
                    dateInfo={userProfile.date_info}
                />
            </div>
        )}

      </main>
    </div>
    <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    {user && (
      <CloudLoadModal
        isOpen={isCloudLoadOpen}
        onClose={() => setIsCloudLoadOpen(false)}
        userId={user.id}
        onLoad={handleCloudLoad}
      />
    )}
    </ErrorBoundary>
  );
};

export default App;

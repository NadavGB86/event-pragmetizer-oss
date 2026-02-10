import React from 'react';
import { AppPhase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck, Trash2, Download, Upload,
  Undo2, Redo2, Cloud, CloudDownload, LogIn, LogOut,
} from 'lucide-react';

interface AuthAwareHeaderProps {
  phase: AppPhase;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onReset: () => void;
  onCloudSave: () => void;
  onCloudLoad: () => void;
  onLogin: () => void;
}

const AuthAwareHeader: React.FC<AuthAwareHeaderProps> = ({
  phase,
  canUndo,
  canRedo,
  undo,
  redo,
  onExport,
  onImportClick,
  onReset,
  onCloudSave,
  onCloudLoad,
  onLogin,
}) => {
  const { user, signOut, cloudAvailable } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-2">
        <CalendarCheck className="w-6 h-6 text-indigo-600" />
        <h1 className="font-bold text-slate-800 tracking-tight">Event Pragmetizer</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Phase Indicator */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500 mr-4">
          <span className={phase === AppPhase.INTAKE ? 'text-indigo-600' : ''}>1. Profile</span>
          <span>→</span>
          <span className={phase === AppPhase.MATCHING ? 'text-indigo-600' : ''}>2. Match</span>
          <span>→</span>
          <span className={phase === AppPhase.EXECUTION ? 'text-indigo-600' : ''}>3. Refine</span>
          <span>→</span>
          <span className={phase === AppPhase.FINAL_EXECUTION ? 'text-emerald-600 font-bold' : ''}>4. Finalize</span>
        </div>

        {/* Undo/Redo Controls */}
        <div className="flex items-center gap-1 border-l pl-4 border-slate-200 mr-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded transition-colors ${canUndo ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded transition-colors ${canRedo ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
        </div>

        {/* Cloud Actions (auth required + Supabase configured) */}
        {cloudAvailable && user && (
          <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
            <button
              onClick={onCloudSave}
              className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Save to Cloud"
            >
              <Cloud size={18} />
            </button>
            <button
              onClick={onCloudLoad}
              className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Load from Cloud"
            >
              <CloudDownload size={18} />
            </button>
          </div>
        )}

        {/* Local Persistence Actions */}
        <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
          <button onClick={onExport} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors" title="Export Backup">
            <Upload size={18} />
          </button>
          <button onClick={onImportClick} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors" title="Import Backup">
            <Download size={18} />
          </button>
          <button onClick={onReset} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Reset All Data">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Auth Status (only when Supabase is configured) */}
        {cloudAvailable && (
          <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
            {user ? (
              <>
                <span className="text-xs text-slate-500 hidden lg:inline max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
              >
                <LogIn size={14} />
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default AuthAwareHeader;

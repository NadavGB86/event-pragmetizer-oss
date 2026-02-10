import React, { useState, useRef, useEffect } from 'react';
import { AppPhase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck, Trash2, Download, Upload,
  Undo2, Redo2, Cloud, CloudDownload, LogIn, LogOut,
  Menu, X,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const menuAction = (fn: () => void) => {
    fn();
    setMenuOpen(false);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
      <div className="flex items-center gap-2">
        <CalendarCheck className="w-6 h-6 text-indigo-600" />
        <h1 className="font-bold text-slate-800 tracking-tight text-sm md:text-base">Event Pragmetizer</h1>
        {/* Mobile phase indicator */}
        <span className="md:hidden text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          {phase === AppPhase.INTAKE ? 'Profile' : phase === AppPhase.MATCHING ? 'Match' : phase === AppPhase.EXECUTION ? 'Refine' : 'Final'}
        </span>
      </div>

      {/* Desktop controls — hidden on mobile */}
      <div className="hidden md:flex items-center gap-4">
        {/* Phase Indicator */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mr-4">
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

      {/* Mobile: undo/redo + hamburger */}
      <div className="flex md:hidden items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2.5 rounded transition-colors ${canUndo ? 'text-slate-500 active:bg-slate-100' : 'text-slate-300'}`}
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2.5 rounded transition-colors ${canRedo ? 'text-slate-500 active:bg-slate-100' : 'text-slate-300'}`}
        >
          <Redo2 size={18} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded text-slate-600 active:bg-slate-100 transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
              {/* Phase indicator */}
              <div className="px-4 py-2 text-xs font-medium text-slate-400 border-b border-slate-100 mb-1">
                Phase: {phase === AppPhase.INTAKE ? '1. Profile' : phase === AppPhase.MATCHING ? '2. Match' : phase === AppPhase.EXECUTION ? '3. Refine' : '4. Finalize'}
              </div>

              {/* Cloud actions */}
              {cloudAvailable && user && (
                <>
                  <button onClick={() => menuAction(onCloudSave)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100">
                    <Cloud size={16} className="text-slate-400" /> Save to Cloud
                  </button>
                  <button onClick={() => menuAction(onCloudLoad)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100">
                    <CloudDownload size={16} className="text-slate-400" /> Load from Cloud
                  </button>
                </>
              )}

              {/* Local persistence */}
              <button onClick={() => menuAction(onExport)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100">
                <Upload size={16} className="text-slate-400" /> Export Backup
              </button>
              <button onClick={() => menuAction(onImportClick)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100">
                <Download size={16} className="text-slate-400" /> Import Backup
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button onClick={() => menuAction(onReset)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100">
                <Trash2 size={16} /> Reset All Data
              </button>

              {/* Auth */}
              {cloudAvailable && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  {user ? (
                    <>
                      <div className="px-4 py-1.5 text-xs text-slate-400 truncate">{user.email}</div>
                      <button onClick={() => menuAction(signOut)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100">
                        <LogOut size={16} className="text-slate-400" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <button onClick={() => menuAction(onLogin)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100">
                      <LogIn size={16} /> Sign In
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AuthAwareHeader;

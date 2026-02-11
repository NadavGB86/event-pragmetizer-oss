import React, { useState } from 'react';
import { X, KeyRound, Zap, Cloud, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { getUserApiKey, setUserApiKey, getUserUsageMode, setUserUsageMode, type UsageMode } from '../services/proxyClient';
import { useAuth } from '../context/AuthContext';
import { supabaseConfigured } from '../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange: (hasKey: boolean) => void;
  onLogin: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onKeyChange, onLogin }) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [usageMode, setMode] = useState<UsageMode>(getUserUsageMode);
  const { user, signOut, cloudAvailable } = useAuth();

  const currentKey = getUserApiKey();
  const maskedKey = currentKey ? `${currentKey.slice(0, 8)}...${currentKey.slice(-4)}` : '';

  const handleSaveKey = () => {
    const key = keyInput.trim();
    if (!key) return;
    setUserApiKey(key);
    setKeyInput('');
    onKeyChange(true);
  };

  const handleRemoveKey = () => {
    if (!confirm('Remove your API key? You will need to enter it again to use the app.')) return;
    setUserApiKey('');
    onKeyChange(false);
    onClose();
  };

  const handleModeChange = (mode: UsageMode) => {
    setMode(mode);
    setUserUsageMode(mode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold text-slate-800 mb-5">Settings</h2>

        {/* API Key Section */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">API Key</h3>
          </div>
          {currentKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <code className="text-xs font-mono text-slate-600 flex-1">
                  {showKey ? currentKey : maskedKey}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-2 flex-1">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Replace with new key..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  />
                  {keyInput.trim() && (
                    <button
                      onClick={handleSaveKey}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemoveKey}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove key
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-2">
                Enter your Gemini API key to start using the app.{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline inline-flex items-center gap-0.5"
                >
                  Get a free key <ExternalLink size={10} />
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your key (AIzaSy...)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                />
                <button
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Stored locally in your browser. Never sent to any server.</p>
            </div>
          )}
        </section>

        {/* Usage Mode Section */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Usage Mode</h3>
          </div>
          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${usageMode === 'lite' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <input type="radio" name="settingsUsageMode" checked={usageMode === 'lite'} onChange={() => handleModeChange('lite')} className="mt-0.5 accent-indigo-600" />
              <div>
                <span className="text-sm font-medium text-slate-800">Lite</span>
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">$0</span>
                <p className="text-xs text-slate-500 mt-0.5">Best for free API keys — generous rate limits (~1,000 req/day).</p>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${usageMode === 'standard' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <input type="radio" name="settingsUsageMode" checked={usageMode === 'standard'} onChange={() => handleModeChange('standard')} className="mt-0.5 accent-indigo-600" />
              <div>
                <span className="text-sm font-medium text-slate-800">Standard</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">$0</span>
                <p className="text-xs text-slate-500 mt-0.5">Better quality, tighter limits (~250 req/day).</p>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${usageMode === 'pro' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <input type="radio" name="settingsUsageMode" checked={usageMode === 'pro'} onChange={() => handleModeChange('pro')} className="mt-0.5 accent-indigo-600" />
              <div>
                <span className="text-sm font-medium text-slate-800">Pro</span>
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">pay-per-use</span>
                <p className="text-xs text-slate-500 mt-0.5">Best quality — Pro model for plans. Requires billing-enabled key.</p>
              </div>
            </label>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {usageMode === 'pro'
              ? 'Paid tier: Google does not use your data for model training.'
              : 'Free tier: Google may use your prompts to improve their models.'}
          </p>
        </section>

        {/* Cloud Sync Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Cloud Sync</h3>
          </div>
          {cloudAvailable ? (
            <div className="space-y-2">
              {user ? (
                <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Connected</p>
                    <p className="text-xs text-emerald-600 truncate max-w-[200px]">{user.email}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                  <p className="text-xs text-slate-500">Sign in to save plans to the cloud</p>
                  <button
                    onClick={() => { onClose(); onLogin(); }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400">Cloud sync lets you save and load plans across devices.</p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
              <p className="text-xs text-slate-500">
                Cloud sync is not configured. All data is stored locally in your browser.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Self-hosters: set <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> to enable.{' '}
                <a
                  href="https://github.com/NadavGB86/event-pragmetizer-oss#cloud-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline inline-flex items-center gap-0.5"
                >
                  Learn more <ExternalLink size={10} />
                </a>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SettingsModal;

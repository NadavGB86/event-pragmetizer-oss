import React, { useState, useEffect } from 'react';
import type { CloudPlanHeader, AppState } from '../../types';
import { getPlans, loadPlan, deletePlan } from '../../services/storageService';
import { X, Cloud, Trash2, Loader2, FolderOpen } from 'lucide-react';

interface CloudLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLoad: (data: AppState) => void;
}

const CloudLoadModal: React.FC<CloudLoadModalProps> = ({ isOpen, onClose, userId, onLoad }) => {
  const [plans, setPlans] = useState<CloudPlanHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    const { plans: p, error: err } = await getPlans(userId);
    setPlans(p);
    setError(err);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const handleLoad = async (planId: string) => {
    setLoadingPlanId(planId);
    const { data, error: err } = await loadPlan(planId);
    setLoadingPlanId(null);

    if (err || !data) {
      setError(err ?? 'Failed to load plan.');
      return;
    }

    onLoad(data);
    onClose();
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this saved plan? This cannot be undone.')) return;

    const { error: err } = await deletePlan(planId);
    if (err) {
      setError(err);
      return;
    }
    setPlans(prev => prev.filter(p => p.id !== planId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative max-h-[80vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Cloud size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Saved Plans</h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FolderOpen size={32} className="mx-auto mb-2" />
              <p className="text-sm">No saved plans yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{plan.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(plan.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => handleLoad(plan.id)}
                      disabled={loadingPlanId === plan.id}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      {loadingPlanId === plan.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Load'
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudLoadModal;

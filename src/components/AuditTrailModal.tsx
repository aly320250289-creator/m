import React from 'react';
import { X, History, UserCheck, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Correction } from '../types';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrections: Correction[];
  projectName: string;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  corrections,
  projectName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Extraction Audit Trail History
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  PostgreSQL Logs
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full traceability & user corrections for {projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {corrections.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No manual overrides recorded</h4>
              <p className="text-xs text-slate-500 mt-1">
                All AI extractions remain verified at high confidence. When you inline-edit an extraction value, the full audit log will appear here.
              </p>
            </div>
          ) : (
            corrections.map((cor) => (
              <div
                key={cor.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-amber-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-300 dark:border-amber-800">
                      {cor.elementId || 'ELEM'}
                    </span>
                    <span className="text-slate-400">Ref ID: #{cor.extractionId.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                      <strong className="text-slate-700 dark:text-slate-300">{cor.correctedBy}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(cor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date(cor.timestamp).toLocaleDateString()})
                    </span>
                  </div>
                </div>

                {/* Diff Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-mono break-words">
                    <div className="text-[10px] uppercase font-sans font-bold text-rose-600 dark:text-rose-400 mb-1">Original OCR Value</div>
                    {cor.originalValue}
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-mono break-words">
                    <div className="text-[10px] uppercase font-sans font-bold text-emerald-600 dark:text-emerald-400 mb-1">Corrected & Audited Value</div>
                    {cor.correctedValue}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500">
          <span>Table: <code className="text-amber-600 dark:text-amber-400">public.corrections</code> indexed by timestamp</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Close Logs
          </button>
        </div>

      </div>
    </div>
  );
};

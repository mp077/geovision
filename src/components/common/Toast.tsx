import React from 'react';
import { useSpecimens } from '../../context/SpecimenContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSpecimens();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        let borderClass = 'border-[#E4E0D6]';
        let bgClass = 'bg-[#FFFFFF]';
        let icon = <Info className="w-4 h-4 text-[#57606A] flex-shrink-0 mt-0.5" />;

        if (toast.type === 'success') {
          borderClass = 'border-[#CCE2D5]';
          bgClass = 'bg-[#FAFDFB]';
          icon = <CheckCircle2 className="w-4 h-4 text-[#2B5742] flex-shrink-0 mt-0.5" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-[#F8DFC0]';
          bgClass = 'bg-[#FFFDF9]';
          icon = <AlertTriangle className="w-4 h-4 text-[#9A5B13] flex-shrink-0 mt-0.5" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-[#F8D2CE]';
          bgClass = 'bg-[#FFFBFB]';
          icon = <AlertCircle className="w-4 h-4 text-[#9C382C] flex-shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border shadow-sm p-3.5 transition-all duration-200 flex items-start gap-3 text-sm ${bgClass} ${borderClass}`}
            role="status"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#1C2127] leading-tight">{toast.title}</div>
              {toast.message && (
                <div className="text-xs text-[#57606A] mt-1 leading-relaxed">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#848D97] hover:text-[#1C2127] p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

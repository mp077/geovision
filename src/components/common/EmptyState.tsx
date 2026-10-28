import React from 'react';
import { Compass, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Compass,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#DCD7CD] rounded-xl bg-[#FAF9F6] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#EFEBE3] text-[#71685B] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="font-serif-title text-lg font-medium text-[#1C2127] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[#57606A] max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2B5742] bg-[#EBF3EE] hover:bg-[#DCEAE1] border border-[#CCE2D5] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B5742]/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

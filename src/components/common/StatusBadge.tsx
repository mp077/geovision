import React from 'react';
import { getCategoryBadgeColor, getConfidenceBadgeColor, formatPercentage } from '../../lib/formatters';
import { Sparkles, Camera, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '', size = 'sm' }) => {
  const colors = getCategoryBadgeColor(category);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {category}
    </span>
  );
};

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
  showIcon?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '', showIcon = true }) => {
  const colors = getConfidenceBadgeColor(confidence);

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono-data text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {showIcon && <Sparkles className="w-3 h-3 opacity-75" />}
      {formatPercentage(confidence)}
    </span>
  );
};

interface InputMethodBadgeProps {
  method: 'upload' | 'scanner';
  className?: string;
}

export const InputMethodBadge: React.FC<InputMethodBadgeProps> = ({ method, className = '' }) => {
  const isScanner = method === 'scanner';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
        isScanner
          ? 'bg-[#EBF3EE] text-[#244B3B] border-[#CCE2D5]'
          : 'bg-[#F2EFE9] text-[#57606A] border-[#E4E0D6]'
      } ${className}`}
    >
      {isScanner ? <Camera className="w-3 h-3" /> : <UploadCloud className="w-3 h-3" />}
      {isScanner ? 'Live Scan' : 'Image Upload'}
    </span>
  );
};

interface StatusPillProps {
  status: 'cataloged' | 'analyzed' | 'flagged';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'cataloged':
      return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#244B3B] border border-[#CCE2D5] ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-[#2B5742]" /> Cataloged
        </span>
      );
    case 'flagged':
      return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FBF1F1] text-[#9C382C] border border-[#F8D2CE] ${className}`}>
          <AlertCircle className="w-3 h-3 text-[#9C382C]" /> Flagged
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F2EFE9] text-[#57606A] border border-[#E4E0D6] ${className}`}>
          Analyzed
        </span>
      );
  }
};

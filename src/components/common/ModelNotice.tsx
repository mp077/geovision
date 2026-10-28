import React from 'react';
import { Link2Off } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModelNoticeProps {
  title?: string;
  message?: string;
  showSettingsLink?: boolean;
  className?: string;
}

export const ModelNotice: React.FC<ModelNoticeProps> = ({
  title = 'Inference Offline',
  message = 'FastAPI ML backend is not connected.',
  showSettingsLink = true,
  className = ''
}) => {
  return (
    <div
      className={`rounded-lg border border-[#F8DFC0] bg-[#FEF7EE] p-3 text-[#9A5B13] flex items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Link2Off className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold">{title}:</span>
        <span className="truncate">{message}</span>
      </div>
      {showSettingsLink && (
        <Link
          to="/settings"
          className="font-medium underline whitespace-nowrap text-[#2B5742]"
        >
          Configure
        </Link>
      )}
    </div>
  );
};

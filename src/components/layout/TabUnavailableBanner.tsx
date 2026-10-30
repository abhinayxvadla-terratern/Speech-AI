import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TabUnavailableBannerProps {
  title?: string;
  reason?: string;
}

export const TabUnavailableBanner: React.FC<TabUnavailableBannerProps> = ({
  title = 'Section Temporarily Unavailable',
  reason = 'This training module is currently disabled for routine platform maintenance. Please check back shortly or select another section.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
        {title}
      </h2>

      <p className="text-xs text-slate-600 font-body leading-relaxed max-w-md mx-auto">
        {reason}
      </p>

      <div className="pt-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

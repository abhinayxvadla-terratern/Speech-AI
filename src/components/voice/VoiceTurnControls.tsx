import React, { useState } from 'react';
import { RotateCcw, Volume1, BookOpen, X } from 'lucide-react';

export interface VoiceTurnControlsProps {
  onSlower: () => void;
  onRepeat: () => void;
  onHint?: () => void;
  hintText?: string | null;
  showHint?: boolean;
  disabled?: boolean;
  className?: string;
}

export const VoiceTurnControls: React.FC<VoiceTurnControlsProps> = ({
  onSlower,
  onRepeat,
  onHint,
  hintText,
  showHint = false,
  disabled = false,
  className = '',
}) => {
  const [hintVisible, setHintVisible] = useState<boolean>(false);

  const handleHintClick = () => {
    setHintVisible((prev) => !prev);
    if (!hintVisible && onHint) {
      onHint();
    }
  };

  return (
    <div className={`flex flex-col items-center gap-1.5 pointer-events-auto ${className}`}>
      {/* Pop-up Hint Tooltip if visible */}
      {showHint && hintVisible && hintText && (
        <div className="max-w-md w-full px-3 animate-fadeIn">
          <div className="p-2.5 rounded-2xl bg-amber-50/95 backdrop-blur-md border border-amber-200/90 shadow-sm text-xs text-amber-950 flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800 block">
                  Meaning & Context:
                </span>
                <p className="font-medium text-amber-950 leading-relaxed text-xs">
                  {hintText}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHintVisible(false)}
              className="p-1 rounded-md text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Close note"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons Pill */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-[0_4px_16px_rgba(0,33,92,0.08)]">
        <button
          type="button"
          onClick={onSlower}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 hover:text-[#00215C] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Play pronunciation slowly"
        >
          <Volume1 className="w-3.5 h-3.5 text-[#255CC1]" />
          <span>Slower</span>
        </button>

        <span className="w-px h-3 bg-slate-200" />

        <button
          type="button"
          onClick={onRepeat}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 hover:text-[#00215C] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Repeat the German phrase"
        >
          <RotateCcw className="w-3 h-3 text-[#255CC1]" />
          <span>Repeat</span>
        </button>

        {showHint && (
          <>
            <span className="w-px h-3 bg-slate-200" />
            <button
              type="button"
              onClick={handleHintClick}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                hintVisible
                  ? 'bg-amber-100 text-amber-900 shadow-2xs'
                  : 'text-slate-700 hover:text-amber-800 hover:bg-amber-50'
              }`}
              title="View sentence meaning"
            >
              <BookOpen className={`w-3 h-3 ${hintVisible ? 'text-amber-700' : 'text-slate-500'}`} />
              <span>Meaning</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

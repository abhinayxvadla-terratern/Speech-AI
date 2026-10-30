import React from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface PWAInstallInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallInstructionsModal: React.FC<PWAInstallInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200/80 space-y-4 text-[#111111]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-extrabold text-base text-[#00215C]">
              Install SpeechAI
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#00215C]">
              <Monitor className="w-3.5 h-3.5 text-[#255CC1]" />
              <span>On Desktop (Chrome or Edge):</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Click the <strong>Install</strong> icon in the address bar (top right) or select <strong>Menu (⋮) → Install SpeechAI</strong>.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#00215C]">
              <Smartphone className="w-3.5 h-3.5 text-[#255CC1]" />
              <span>On Mobile (iOS or Android):</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Tap the <strong>Share</strong> button (Safari) or <strong>⋮ Menu</strong> (Chrome), then tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

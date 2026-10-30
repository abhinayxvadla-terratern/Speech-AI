import React from 'react';
import { X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 space-y-5 text-[#111111]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#00215C]">
                Install SpeechAI on iOS
              </h3>
              <p className="text-[11px] text-slate-500">Fast access right from your home screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAFBFF] border border-blue-50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#00215C] block">1. Tap the Share icon</span>
              <span className="text-slate-500 text-[11px]">
                In Safari, tap the Share button in the bottom menu bar.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFBFF] border border-blue-50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#00215C] block">2. Tap "Add to Home Screen"</span>
              <span className="text-slate-500 text-[11px]">
                Scroll down in the action sheet and select "Add to Home Screen".
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFBFF] border border-blue-50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#00215C] block">3. Confirm "Add"</span>
              <span className="text-slate-500 text-[11px]">
                Tap Add in the top-right corner. The app icon will appear on your iPhone/iPad!
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-xs transition-colors shadow-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

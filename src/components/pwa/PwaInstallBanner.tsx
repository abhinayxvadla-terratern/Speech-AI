import React from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { IosInstallModal } from './IosInstallModal';
import { AppLogo } from '../common/AppLogo';
import { Download, X, Share, Sparkles } from 'lucide-react';

interface PwaInstallBannerProps {
  className?: string;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ className = '' }) => {
  const {
    isStandalone,
    hasNativePrompt,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    promptInstall,
    isBannerDismissed,
    dismissHomeBanner,
  } = usePwaInstall();

  // If already running standalone or user dismissed banner, hide completely
  if (isStandalone || isBannerDismissed) {
    return null;
  }

  // If on a browser where beforeinstallprompt hasn't fired and not iOS, we can still show install invitation
  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00215C] via-[#143471] to-[#255CC1] p-4 sm:p-5 text-white shadow-md border border-blue-900/30 animate-fadeIn ${className}`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 shrink-0">
              <AppLogo size="sm" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#f1c819] text-[#00215C]">
                  {isIOS ? 'iOS Home Screen' : 'App Available'}
                </span>
                <span className="text-white/60 text-xs hidden sm:inline flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#f1c819]" /> Fast & Offline Shell
                </span>
              </div>

              <h3 className="font-heading font-extrabold text-sm sm:text-base text-white leading-snug">
                {isIOS ? 'Install SpeechAI on your iPhone / iPad' : 'Install SpeechAI for Quick Access'}
              </h3>

              <p className="text-xs text-white/80 font-normal leading-relaxed max-w-lg">
                {isIOS ? (
                  <span>
                    Tap <Share className="w-3 h-3 inline mx-0.5" /> <strong>Share</strong> then select{' '}
                    <strong>"Add to Home Screen"</strong> for full-screen German practice.
                  </span>
                ) : (
                  <span>
                    Install as a standalone app on your home screen or desktop for instantaneous loads and zero browser clutter.
                  </span>
                )}
              </p>

              <div className="pt-2 flex items-center gap-2.5">
                {isIOS ? (
                  <button
                    onClick={() => setShowIOSModal(true)}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-white text-[#00215C] hover:bg-slate-100 font-bold text-xs shadow-xs transition-colors"
                  >
                    <Share className="w-3.5 h-3.5" />
                    <span>How to Install</span>
                  </button>
                ) : (
                  <button
                    onClick={() => promptInstall()}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#f1c819] text-[#00215C] hover:bg-[#e6bd0d] font-bold text-xs shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{hasNativePrompt ? 'Install App' : 'Add to Device'}</span>
                  </button>
                )}

                <button
                  onClick={dismissHomeBanner}
                  className="text-xs text-white/70 hover:text-white underline font-medium py-1 px-2 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissHomeBanner}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <IosInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  );
};

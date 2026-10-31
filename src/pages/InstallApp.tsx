import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Monitor, 
  Share, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Mic, 
  ChevronRight
} from 'lucide-react';
import { AppLogo } from '../components/common/AppLogo';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { PWAInstallInstructionsModal } from '../components/pwa/PWAInstallInstructionsModal';

export const InstallApp: React.FC = () => {
  const { isInstalled, installApp, showInstructionsModal, setShowInstructionsModal, isIOS } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'ios' | 'android' | 'desktop'>('auto');

  // Device detection
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

  const effectivePlatform = 
    activeTab !== 'auto' 
      ? activeTab 
      : isIOS 
      ? 'ios' 
      : isAndroid 
      ? 'android' 
      : isMobile 
      ? 'android' 
      : 'desktop';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#FAFBFF] text-[#111111] flex flex-col justify-between py-6 px-4 sm:px-6 antialiased selection:bg-[#255CC1]/20 selection:text-[#00215C]">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <AppLogo size="sm" className="drop-shadow-xs group-hover:scale-105 transition-transform" />
          <span className="font-heading font-extrabold text-xl text-[#00215C] tracking-tight">
            Speech<span className="text-[#255CC1]">AI</span>
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#00215C] hover:bg-[#EBF2FF] border border-slate-200/80 hover:border-blue-200 transition-colors"
        >
          <span>Open Web App</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Content Container */}
      <main className="max-w-xl mx-auto w-full space-y-6 animate-fadeIn flex-1 flex flex-col justify-center">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#00215C] via-[#052d75] to-[#0a3a96] rounded-3xl p-6 sm:p-8 text-white shadow-card border border-[#00215C]/20 relative overflow-hidden text-center space-y-5">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* App Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 mx-auto flex items-center justify-center shadow-lg relative">
            <AppLogo size={48} className="drop-shadow-sm" />
          </div>

          {/* Headline & Description */}
          <div className="space-y-2 relative">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              Get SpeechAI App
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 max-w-md mx-auto leading-relaxed font-normal">
              Install SpeechAI on your device for fast 1-tap access, zero browser clutter, and optimal microphone capture.
            </p>
          </div>

          {/* Installation Action Button */}
          <div className="pt-2 space-y-3 relative">
            {isInstalled ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Already installed on this device</span>
                </div>
                <div>
                  <Link
                    to="/"
                    className="w-full sm:w-auto min-w-[220px] py-3.5 px-8 rounded-xl bg-white hover:bg-blue-50 text-[#00215C] font-extrabold text-sm inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span>Launch SpeechAI</span>
                    <ArrowRight className="w-4 h-4 text-[#255CC1]" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={installApp}
                  className="w-full sm:w-auto min-w-[240px] py-3.5 px-8 rounded-xl bg-white hover:bg-blue-50 text-[#00215C] font-extrabold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer group"
                >
                  <Download className="w-4 h-4 text-[#255CC1] group-hover:translate-y-0.5 transition-transform" />
                  <span>Install App Now</span>
                </button>
                <p className="text-[11px] text-blue-200/80">
                  No App Store or Play Store account required
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Guided Device Instructions Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <h2 className="font-heading font-bold text-sm text-[#00215C]">
              Installation Instructions
            </h2>

            {/* Platform Toggle Pills */}
            <div className="flex rounded-full bg-slate-100 p-0.5 border border-slate-200/60 text-xs">
              <button
                onClick={() => setActiveTab('ios')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  effectivePlatform === 'ios' ? 'bg-white text-[#00215C] shadow-2xs' : 'text-slate-500'
                }`}
              >
                iPhone
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  effectivePlatform === 'android' ? 'bg-white text-[#00215C] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Android
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  effectivePlatform === 'desktop' ? 'bg-white text-[#00215C] shadow-2xs' : 'text-slate-500'
                }`}
              >
                PC / Mac
              </button>
            </div>
          </div>

          {/* Platform Specific Instruction Steps */}
          {effectivePlatform === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C]">Open in Safari</p>
                  <p className="text-slate-500">Ensure you are opening this link in Safari browser on iOS.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C] flex items-center gap-1">
                    <span>Tap the Share Button</span>
                    <Share className="w-3.5 h-3.5 text-[#255CC1] inline" />
                  </p>
                  <p className="text-slate-500">At the bottom of your Safari screen, tap the Share icon (square with upward arrow).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C]">Select &ldquo;Add to Home Screen&rdquo;</p>
                  <p className="text-slate-500">Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right.</p>
                </div>
              </div>
            </div>
          )}

          {effectivePlatform === 'android' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C]">Tap &ldquo;Install App Now&rdquo;</p>
                  <p className="text-slate-500">Click the install button above to trigger Android's native installation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C]">Or use Chrome Menu (⋮)</p>
                  <p className="text-slate-500">Tap the three dots (⋮) in the top right of Chrome and select <strong>&ldquo;Install App&rdquo;</strong>.</p>
                </div>
              </div>
            </div>
          )}

          {effectivePlatform === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C]">Click &ldquo;Install App Now&rdquo;</p>
                  <p className="text-slate-500">In Chrome or Edge, click the install button above to download the desktop shell.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFBFF] border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#00215C]">Or look for the Address Bar Icon</p>
                  <p className="text-slate-500">Click the computer/down-arrow install icon in your browser's address bar on the top-right.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <Mic className="w-4 h-4 text-[#255CC1] mx-auto" />
            <h3 className="font-heading font-bold text-[11px] text-[#00215C]">Full Mic Access</h3>
            <p className="text-[10px] text-slate-400">Zero audio lag</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <Sparkles className="w-4 h-4 text-[#255CC1] mx-auto" />
            <h3 className="font-heading font-bold text-[11px] text-[#00215C]">1-Tap Launch</h3>
            <p className="text-[10px] text-slate-400">Direct from home screen</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <Monitor className="w-4 h-4 text-[#255CC1] mx-auto" />
            <h3 className="font-heading font-bold text-[11px] text-[#00215C]">No URL Bars</h3>
            <p className="text-[10px] text-slate-400">Native distraction-free</p>
          </div>
        </div>

        {/* Direct Link to Web App */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-[#00215C] transition-colors inline-flex items-center gap-1"
          >
            <span>Don&apos;t want to install? Continue in browser</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pt-6 text-[11px] text-slate-400 max-w-xl mx-auto w-full">
        <p>&copy; {new Date().getFullYear()} TerraTern SpeechAI. Professional German Spoken Training.</p>
      </footer>

      {/* Instructions Modal */}
      <PWAInstallInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </div>
  );
};

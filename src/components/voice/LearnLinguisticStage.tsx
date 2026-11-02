import React, { useState } from 'react';
import { Volume2, BookOpen, Sparkles, ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';
import { SentenceLinguisticAnalysis, WordLinguisticBreakdown } from '../../services/germanLinguisticsService';
import { voiceAdapter, VoiceSessionHandle } from '../../services/voice';

interface LearnLinguisticStageProps {
  analysis: SentenceLinguisticAnalysis;
  sessionHandle?: VoiceSessionHandle | null;
  className?: string;
}

export const LearnLinguisticStage: React.FC<LearnLinguisticStageProps> = ({
  analysis,
  sessionHandle,
  className = '',
}) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [showFullExplanation, setShowFullExplanation] = useState<boolean>(true);

  const handlePronounceWord = async (word: WordLinguisticBreakdown) => {
    if (!sessionHandle || !voiceAdapter.speak) return;
    try {
      setPlayingWord(word.cleanWord);
      // Speak the individual word slowly (-25% rate) for clean articulation practice
      await voiceAdapter.speak(sessionHandle, word.cleanWord, { rate: '-25%' });
    } catch (err) {
      console.warn('Word pronunciation failed:', err);
    } finally {
      setPlayingWord(null);
    }
  };

  return (
    <div className={`space-y-3 animate-fadeIn ${className}`}>
      {/* 1. WORD BREAKDOWN & PRONUNCIATION SECTION */}
      {analysis.words && analysis.words.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#255CC1]">
              <Layers className="w-3.5 h-3.5" />
              <span>Word Breakdown & Pronunciation</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">
              tap to hear slow syllable audio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.words.map((w, idx) => {
              const isPlaying = playingWord === w.cleanWord;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-blue-100/90 shadow-2xs hover:border-[#255CC1]/50 transition-all flex flex-col justify-between gap-1.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-heading font-extrabold text-sm sm:text-base text-[#00215C] tracking-wide">
                          {w.syllables}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#255CC1] tracking-wider block mt-0.5">
                        {w.phonetics}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePronounceWord(w)}
                      disabled={isPlaying}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                        isPlaying
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 hover:bg-blue-100 text-[#255CC1] border border-blue-200/60'
                      }`}
                      title={`Listen to pronunciation of ${w.cleanWord}`}
                    >
                      <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-pulse' : ''}`} />
                      <span>{isPlaying ? 'Playing...' : 'Pronounce'}</span>
                    </button>
                  </div>

                  {w.meaning && (
                    <p className="text-[11px] text-slate-600 font-medium leading-snug pt-0.5 border-t border-slate-100">
                      {w.meaning}
                    </p>
                  )}

                  {w.tip && (
                    <p className="text-[10px] text-amber-800 font-normal italic">
                      💡 {w.tip}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SENTENCE EXPLANATION & GRAMMATICAL STRUCTURE */}
      <div className="rounded-xl border border-slate-200/80 bg-white/95 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowFullExplanation((prev) => !prev)}
          className="w-full p-2.5 px-3 flex items-center justify-between text-left bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#255CC1]" />
            <span className="text-xs font-bold text-[#00215C] uppercase tracking-wider">
              Sentence Structure & Explanation
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
            <span>{showFullExplanation ? 'Hide' : 'Explain'}</span>
            {showFullExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showFullExplanation && (
          <div className="p-3 sm:p-3.5 space-y-2 text-xs animate-fadeIn border-t border-slate-100">
            {/* Meaning in context */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Full English Meaning:
              </span>
              <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                &ldquo;{analysis.english}&rdquo;
              </p>
            </div>

            {/* Grammar Structure Rule */}
            <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 text-slate-800 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#255CC1]">
                <Sparkles className="w-3 h-3" />
                <span>Word Order & Verb Placement</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                {analysis.structureNote}
              </p>
            </div>

            {/* Politeness / Register Insight */}
            <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{analysis.politenessNote}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

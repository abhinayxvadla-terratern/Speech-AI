import React, { useState } from 'react';
import { Volume2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  SentenceLinguisticAnalysis, 
  WordLinguisticBreakdown, 
  getWordPronunciationAudioPrompt 
} from '../../services/germanLinguisticsService';
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
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [showStructureNote, setShowStructureNote] = useState<boolean>(false);

  // Play word with parallel English meaning
  const handlePronounceWithMeaning = async (word: WordLinguisticBreakdown, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!sessionHandle || !voiceAdapter.speak) return;
    try {
      setPlayingWord(word.cleanWord);
      const spokenText = getWordPronunciationAudioPrompt(word);
      await voiceAdapter.speak(sessionHandle, spokenText, { rate: '-20%' });
    } catch (err) {
      console.warn('Word assistance speech error:', err);
    } finally {
      setPlayingWord(null);
    }
  };

  const selectedWord = activeWordIndex !== null && analysis.words ? analysis.words[activeWordIndex] : null;

  return (
    <div className={`space-y-2 animate-fadeIn ${className}`}>
      {/* 1. COMPACT INTERACTIVE WORD CHIPS ROW */}
      {analysis.words && analysis.words.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Key Words:
          </span>
          {analysis.words.map((w, idx) => {
            const isSelected = activeWordIndex === idx;
            const isPlaying = playingWord === w.cleanWord;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveWordIndex(isSelected ? null : idx)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00215C] text-white shadow-2xs'
                    : 'bg-white hover:bg-blue-50 text-[#00215C] border border-slate-200/80'
                }`}
                title={`Tap to see breakdown and hear pronunciation of ${w.cleanWord}`}
              >
                <span>{w.cleanWord}</span>
                <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-blue-200' : 'text-[#255CC1]'}`} />
              </button>
            );
          })}

          {/* Discreet Sentence Structure pill button */}
          <button
            type="button"
            onClick={() => setShowStructureNote((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ml-auto ${
              showStructureNote
                ? 'bg-blue-100 text-[#00215C]'
                : 'text-slate-500 hover:text-[#00215C] hover:bg-slate-100'
            }`}
            title="Toggle sentence structure explanation"
          >
            <BookOpen className="w-3 h-3 text-[#255CC1]" />
            <span>Structure</span>
            {showStructureNote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* 2. DYNAMIC FOCUSED WORD CARD (Parallel Word Breakdown + Spoken Meaning) */}
      {selectedWord && (
        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 shadow-2xs text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-heading font-extrabold text-sm sm:text-base text-[#00215C]">
                  {selectedWord.syllables}
                </span>
                <span className="text-[11px] font-bold text-[#255CC1]">
                  {selectedWord.phonetics}
                </span>
              </div>
              {selectedWord.meaning && (
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  <strong className="text-[#00215C]">Meaning:</strong> {selectedWord.meaning}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => handlePronounceWithMeaning(selectedWord, e)}
              disabled={playingWord === selectedWord.cleanWord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#255CC1] hover:bg-[#1a4799] text-white text-[11px] font-bold shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Hear slow pronunciation followed by English meaning"
            >
              <Volume2 className={`w-3.5 h-3.5 ${playingWord === selectedWord.cleanWord ? 'animate-pulse' : ''}`} />
              <span>{playingWord === selectedWord.cleanWord ? 'Speaking...' : 'Pronounce & Meaning'}</span>
            </button>
          </div>

          {selectedWord.tip && (
            <p className="text-[11px] text-amber-900 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60 font-medium">
              💡 {selectedWord.tip}
            </p>
          )}
        </div>
      )}

      {/* 3. ON-DEMAND SENTENCE STRUCTURE DRAWER */}
      {showStructureNote && (
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-[#00215C]">
            <BookOpen className="w-3.5 h-3.5 text-[#255CC1]" />
            <span>Sentence Grammar & Word Order</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {analysis.structureNote}
          </p>
          {analysis.politenessNote && (
            <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-1 font-normal">
              {analysis.politenessNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

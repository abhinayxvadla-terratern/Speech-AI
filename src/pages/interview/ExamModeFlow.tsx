import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ExamSpeakingPrompt, ExamSpeakingPromptText } from '../../lib/database.types';
import { ActiveInterviewSession } from './ActiveInterviewSession';
import { 
  ArrowLeft, 
  Headphones, 
  Mic, 
  BookOpen, 
  PenTool, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  Sparkles,
  Loader2 
} from 'lucide-react';

interface ExamModeFlowProps {
  cefrLevel: string;
  onExit: () => void;
}

type ExamSection = 'listening' | 'speaking' | 'reading' | 'writing' | 'completed';

export const ExamModeFlow: React.FC<ExamModeFlowProps> = ({ cefrLevel, onExit }) => {
  const [currentSection, setCurrentSection] = useState<ExamSection>('listening');
  const [speakingPart, setSpeakingPart] = useState<1 | 2 | 3>(1);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
  const [examPrompts, setExamPrompts] = useState<ExamSpeakingPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState<boolean>(true);

  const targetLevel = (cefrLevel === 'B2' || cefrLevel === 'C1' || cefrLevel === 'C2') ? 'B2' : 'B1';

  // Load exam speaking prompts for current CEFR level
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoadingPrompts(true);
        const { data, error } = await supabase
          .from('exam_speaking_prompts')
          .select('*')
          .eq('level', targetLevel)
          .order('set_number', { ascending: true })
          .order('part', { ascending: true });

        if (error) throw error;
        setExamPrompts((data as ExamSpeakingPrompt[]) || []);
      } catch (err) {
        console.error('Error loading exam speaking prompts:', err);
      } finally {
        setLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, [targetLevel]);

  const sections = [
    { id: 'listening', title: 'Listening', icon: Headphones },
    { id: 'speaking', title: 'Speaking', icon: Mic },
    { id: 'reading', title: 'Reading', icon: BookOpen },
    { id: 'writing', title: 'Writing', icon: PenTool },
  ];

  const getSectionIndex = (sec: ExamSection) => {
    switch (sec) {
      case 'listening': return 0;
      case 'speaking': return 1;
      case 'reading': return 2;
      case 'writing': return 3;
      case 'completed': return 4;
    }
  };

  const currentIndex = getSectionIndex(currentSection);

  // If currently in speaking section, render the full ActiveInterviewSession
  if (currentSection === 'speaking') {
    if (loadingPrompts) {
      return (
        <div className="py-24 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
          <p className="text-xs font-medium">Loading official {targetLevel} speaking exam prompts...</p>
        </div>
      );
    }

    const currentPrompt = examPrompts.find(
      (p) => p.set_number === currentSetNumber && p.part === speakingPart
    );

    const partTitles: Record<number, string> = {
      1: 'Joint Planning',
      2: 'Topic Presentation',
      3: 'Discussion & Feedback',
    };

    const promptText = (currentPrompt?.prompt_text as ExamSpeakingPromptText) || {
      german: 'Offizielle Prüfungsaufgabe',
      english: 'Official exam task',
      bullet_points: [],
    };

    return (
      <div className="space-y-4 max-w-3xl mx-auto text-[#111111]">
        {/* Exam Part Progress Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#00215C] uppercase tracking-wider">
              Speaking Exam {targetLevel}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">
              Set {currentSetNumber} of 8: <strong>{currentPrompt?.topic_title || 'Exam Topic'}</strong>
            </span>
          </div>

          {/* Stepper indicator: Part 1 -> Part 2 -> Part 3 */}
          <div className="flex items-center gap-1.5 font-bold">
            {[1, 2, 3].map((pNum) => (
              <span
                key={pNum}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  speakingPart === pNum
                    ? 'bg-[#00215C] text-white shadow-xs'
                    : speakingPart > pNum
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                Part {pNum}
              </span>
            ))}
          </div>
        </div>

        <ActiveInterviewSession
          interviewTypeName={`Part ${speakingPart}: ${partTitles[speakingPart]} (${currentPrompt?.topic_title || ''})`}
          description={promptText.german}
          mode="practice"
          pressureMode="High-Pressure"
          durationMinutes={speakingPart === 3 ? 3 : 4}
          isExamMode={true}
          examPromptText={promptText}
          onBack={() => {
            if (speakingPart === 1) {
              setCurrentSection('listening');
            } else if (speakingPart === 2) {
              setSpeakingPart(1);
            } else {
              setSpeakingPart(2);
            }
          }}
          onCompleted={() => {
            if (speakingPart === 1) {
              setSpeakingPart(2);
            } else if (speakingPart === 2) {
              setSpeakingPart(3);
            } else {
              setCurrentSection('reading');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Exam Mode</span>
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 uppercase tracking-wider">
          telc / Goethe {cefrLevel} Format
        </span>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-4 gap-2">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={sec.id}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isCurrent
                    ? 'border-[#255CC1] bg-[#EBF2FF]/70 shadow-xs'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                    : 'border-slate-200/70 bg-slate-50/60 text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${
                    isCurrent
                      ? 'bg-[#255CC1] text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-bold truncate max-w-full">{sec.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 1: Listening */}
      {currentSection === 'listening' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/60">
            <Headphones className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Section 1 of 4 • Listening
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] mt-1 tracking-tight">
              German Listening Section
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed font-normal">
              Official telc/Goethe listening comprehension test containing short dialogue clips, train station announcements, and radio reports.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 max-w-sm mx-auto">
            <Sparkles className="w-4 h-4 text-[#255CC1] mx-auto mb-1.5" />
            <p className="font-semibold text-[#00215C]">Audio tracks coming in upcoming release</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Proceed to the interactive Speaking section.</p>
          </div>

          {/* Speaking Exam Set Picker */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-left max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#00215C] uppercase tracking-wider">
                Assigned Speaking Exam Set:
              </span>
              <span className="text-slate-500 font-medium">
                Set {currentSetNumber} of 8
              </span>
            </div>

            <select
              value={currentSetNumber}
              onChange={(e) => {
                setCurrentSetNumber(Number(e.target.value));
                setSpeakingPart(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#00215C] focus:outline-none focus:ring-1 focus:ring-[#255CC1]"
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => {
                const part1 = examPrompts.find((p) => p.set_number === num && p.part === 1);
                const title = part1 ? `${part1.topic_title}` : `Exam Set ${num}`;
                return (
                  <option key={num} value={num}>
                    Set {num}: {title}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500 leading-normal font-normal">
              Includes Part 1 (Planning), Part 2 (Presentation), and Part 3 (Discussion & Feedback) in official format.
            </p>
          </div>

          <button
            onClick={() => setCurrentSection('speaking')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
          >
            <span>Proceed to Speaking Section (Live AI)</span>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      )}

      {/* Section 3: Reading */}
      {currentSection === 'reading' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#255CC1] flex items-center justify-center mx-auto border border-blue-100">
            <BookOpen className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider">
              Section 3 of 4 • Reading
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] mt-1 tracking-tight">
              German Reading Section
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed font-normal">
              Reading comprehension passages from German newspapers, workplace contracts, and public health guidelines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 max-w-sm mx-auto">
            <Sparkles className="w-4 h-4 text-[#255CC1] mx-auto mb-1.5" />
            <p className="font-semibold text-[#00215C]">Reading passages coming in upcoming release</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Proceed to the final Writing section.</p>
          </div>

          <button
            onClick={() => setCurrentSection('writing')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
          >
            <span>Proceed to Writing Section</span>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      )}

      {/* Section 4: Writing */}
      {currentSection === 'writing' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-100">
            <PenTool className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Section 4 of 4 • Writing
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] mt-1 tracking-tight">
              German Writing Section
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed font-normal">
              Formal letter and email composition (application, complaint, or official letter).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 max-w-sm mx-auto">
            <Sparkles className="w-4 h-4 text-[#255CC1] mx-auto mb-1.5" />
            <p className="font-semibold text-[#00215C]">Writing prompts coming in upcoming release</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Complete exam simulation.</p>
          </div>

          <button
            onClick={() => setCurrentSection('completed')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Complete Exam</span>
          </button>
        </div>
      )}

      {/* Exam Completed Screen */}
      {currentSection === 'completed' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <Award className="w-7 h-7" />
          </div>

          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
            Exam Simulation Finished!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-normal">
            You completed the 4-section telc / Goethe {cefrLevel} exam flow with live spoken performance diagnostics saved to your learning record.
          </p>

          <button
            onClick={onExit}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00215C] text-white font-semibold text-sm hover:bg-[#143471] transition-colors shadow-xs"
          >
            Return to Interview Hub
          </button>
        </div>
      )}
    </div>
  );
};

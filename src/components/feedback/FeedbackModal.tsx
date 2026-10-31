import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquarePlus,
  Bug,
  Sparkles,
  HelpCircle,
  FileText,
  Star,
  Check,
} from 'lucide-react';
import { FeedbackCategory } from '../../lib/database.types';
import { submitUserFeedback } from '../../services/feedbackService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FeedbackCategory;
  sessionId?: string | null;
}

const RATING_LABELS: Record<number, { title: string; desc: string; textClass: string }> = {
  1: { title: 'Poor', desc: 'Disappointing or frustrating experience', textClass: 'text-rose-600' },
  2: { title: 'Needs Work', desc: 'Noticeable issues or speech recognition friction', textClass: 'text-orange-600' },
  3: { title: 'Fair', desc: 'Acceptable practice, but room for improvement', textClass: 'text-amber-600' },
  4: { title: 'Good', desc: 'Very helpful conversational simulation', textClass: 'text-blue-600' },
  5: { title: 'Excellent', desc: 'Outstanding German practice & feedback!', textClass: 'text-emerald-600' },
};

const CATEGORIES: Array<{
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: 'Content issue',
    label: 'Content issue',
    icon: FileText,
    description: 'Recap mistake, phrasing question, or inaccurate correction',
  },
  {
    value: 'Bug',
    label: 'Bug / Issue',
    icon: Bug,
    description: 'Audio, microphone, loading, or UI malfunction',
  },
  {
    value: 'Feature request',
    label: 'Feature request',
    icon: Sparkles,
    description: 'New domain, exam mode, or scenario suggestion',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: HelpCircle,
    description: 'General support inquiry or learning comment',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  sessionId = null,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lock background body scroll whenever the modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(null);
      setSelectedCategories(defaultCategory ? [defaultCategory] : []);
      setMessage('');
      setSubmitting(false);
      setSubmitted(false);
      setErrorMsg(null);
    }
  }, [isOpen, defaultCategory]);

  if (!isOpen) return null;

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;
  const ratingMeta = RATING_LABELS[activeDisplayRating] || RATING_LABELS[5];

  const toggleCategory = (catValue: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catValue) ? prev.filter((c) => c !== catValue) : [...prev, catValue]
    );
  };

  const handleClose = () => {
    setMessage('');
    setSelectedCategories([]);
    setSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setErrorMsg('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitUserFeedback({
        rating,
        categories: selectedCategories,
        category: selectedCategories.length > 0 ? selectedCategories.join(', ') : 'General',
        message: message.trim(),
        session_id: sessionId,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Feedback submission failed:', err);
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 text-[#111111] flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[min(90dvh,640px)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header: Always visible at top */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 id="feedback-modal-title" className="font-heading font-extrabold text-sm sm:text-base text-[#00215C] leading-tight">
                Rate & Send Feedback
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Direct channel to the engineering & curriculum team
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Confirmation View */
          <div className="p-6 sm:p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
              <h4 className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C]">
                {rating >= 4 ? 'Thank you for your rating!' : "We'll look into this immediately"}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {rating >= 4
                  ? 'Your rating and feedback help us prioritize natural dialogue practice and authentic workplace roleplays.'
                  : 'We take critical feedback seriously to improve speech recognition, latency, and grammatical accuracy.'}
              </p>
            </div>

            {sessionId && (
              <p className="text-[10px] text-slate-400 font-mono">
                Session ID: {sessionId.slice(0, 8)}... attached
              </p>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-6 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Feedback & Rating Form */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Session Context Banner */}
              {sessionId && (
                <div className="p-2.5 rounded-xl bg-[#FAFBFF] border border-blue-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-bold text-[#00215C]">Attached Session:</span>
                    <span className="font-mono text-slate-500">{sessionId.slice(0, 8)}...</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-linked
                  </span>
                </div>
              )}

              {/* 1. Star Rating Widget */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#FAFBFF] to-white border border-blue-100/80 text-center space-y-1.5">
                <label className="text-xs font-bold text-[#00215C] block">
                  {sessionId
                    ? 'How would you rate this simulation session?'
                    : 'How would you rate your experience with SpeechAI?'}
                </label>

                {/* Stars */}
                <div className="flex items-center justify-center gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeDisplayRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(starVal)}
                        className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none cursor-pointer active:scale-95"
                        aria-label={`Rate ${starVal} out of 5 stars`}
                      >
                        <Star
                          className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-2xs'
                              : 'text-slate-300 stroke-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label & Description */}
                <div className="text-[11px] pt-0.5">
                  <span className={`font-bold ${ratingMeta.textClass}`}>
                    {activeDisplayRating} / 5 — {ratingMeta.title}
                  </span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">
                    {ratingMeta.desc}
                  </span>
                </div>
              </div>

              {/* 2. Category Selection Chips (2x2 Grid, Clean & Mobile Friendly) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#00215C] block text-xs">
                    Category <span className="text-[10px] font-normal text-slate-400">(Optional • Choose one or more)</span>
                  </label>
                  {selectedCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategories.includes(cat.value);

                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleCategory(cat.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#EBF2FF] border-[#255CC1] text-[#00215C] shadow-2xs ring-1 ring-[#255CC1]/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#255CC1]' : 'text-slate-400'}`} />
                          <span className="text-xs font-semibold truncate leading-tight">
                            {cat.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#255CC1] shrink-0 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Feedback Comments / Suggestions (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="feedback-message" className="font-bold text-[#00215C] block text-xs">
                  {rating <= 3 ? 'What went wrong or could be improved?' : 'What did you like or suggest for future updates?'}
                  <span className="text-[10px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={
                    rating <= 3
                      ? "Tell us what didn't work well or what felt off (optional)..."
                      : selectedCategories.includes('Content issue')
                      ? "What was inaccurate about the correction, transcription, or tutor response (optional)?"
                      : selectedCategories.includes('Bug')
                      ? "What went wrong? Steps to reproduce the issue (optional)..."
                      : "Share your thoughts or ideas to make SpeechAI even better (optional)..."
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#255CC1] focus:ring-1 focus:ring-[#255CC1] outline-none text-xs text-slate-800 placeholder-slate-400 resize-none transition-all leading-relaxed bg-[#FAFBFF]"
                />
              </div>
            </div>

            {/* Fixed Footer: Always visible at bottom */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-white">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || rating < 1}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-xs transition-all disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Rating & Feedback</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, MessageSquarePlus, Bug, Sparkles, HelpCircle, FileText, Star } from 'lucide-react';
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
  2: { title: 'Needs Work', desc: 'Ran into noticeable issues or latency', textClass: 'text-orange-600' },
  3: { title: 'Fair', desc: 'Acceptable, but room for improvement', textClass: 'text-amber-600' },
  4: { title: 'Good', desc: 'Very helpful conversational practice', textClass: 'text-blue-600' },
  5: { title: 'Excellent', desc: 'Outstanding simulation & feedback!', textClass: 'text-emerald-600' },
};

const CATEGORIES: Array<{
  value: FeedbackCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: 'Content issue',
    label: 'Content issue',
    icon: FileText,
    description: 'Grammar recap mistake, phrasing question, or inaccurate correction',
  },
  {
    value: 'Bug',
    label: 'Bug',
    icon: Bug,
    description: 'Audio, microphone, loading, or UI malfunction',
  },
  {
    value: 'Feature request',
    label: 'Feature request',
    icon: Sparkles,
    description: 'New domain, exam type, roleplay scenario, or feature suggestion',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: HelpCircle,
    description: 'General support inquiry or learning feedback',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Bug',
  sessionId = null,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync category when defaultCategory changes on open
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(null);
      setCategory(defaultCategory);
      setMessage('');
      setSubmitting(false);
      setSubmitted(false);
      setErrorMsg(null);
    }
  }, [isOpen, defaultCategory]);

  if (!isOpen) return null;

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;
  const ratingMeta = RATING_LABELS[activeDisplayRating] || RATING_LABELS[5];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter your feedback message.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitUserFeedback({
        rating,
        category,
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

  const handleClose = () => {
    setMessage('');
    setSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200/80 my-8 text-[#111111] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#00215C]">
                Rate & Send Feedback
              </h3>
              <p className="text-xs text-slate-500">
                Direct channel to the engineering & curriculum team
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Confirmation State */
          <div className="py-6 text-center space-y-4 animate-fadeIn">
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
              <h4 className="font-heading font-extrabold text-xl text-[#00215C]">
                {rating >= 4 ? 'Thank you so much!' : "We'll look into this immediately"}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {rating >= 4
                  ? 'Your rating and feedback help us prioritize real-world German scenarios and roleplays.'
                  : 'We take critical feedback seriously to improve speech recognition, latency, and grammatical precision.'}
              </p>
            </div>

            {sessionId && (
              <p className="text-[11px] text-slate-400 font-mono">
                Session ID: {sessionId.slice(0, 8)}... attached
              </p>
            )}

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="py-2.5 px-6 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Session Context Banner if auto-attached */}
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

            {/* 1. App / Session Star Rating Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#FAFBFF] to-white border border-blue-100/80 text-center space-y-2">
              <label className="text-xs font-bold text-[#00215C] block">
                {sessionId ? 'How would you rate this simulation session?' : 'How would you rate your overall experience with SpeechAI?'}
              </label>

              {/* Star buttons */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeDisplayRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(starVal)}
                      className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none"
                      aria-label={`Rate ${starVal} out of 5 stars`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-2xs'
                            : 'text-slate-300 stroke-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="text-[11px]">
                <span className={`font-bold ${ratingMeta.textClass}`}>
                  {activeDisplayRating} / 5 — {ratingMeta.title}
                </span>
                <span className="text-slate-400 block text-[10px] mt-0.5">
                  {ratingMeta.desc}
                </span>
              </div>
            </div>

            {/* 2. Category Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#00215C] block">Feedback Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'border-[#255CC1] bg-[#EBF2FF] text-[#00215C] shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#255CC1]' : 'text-slate-400'}`} />
                        <span className="text-xs">{cat.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {cat.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Free Text Message */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-message" className="font-bold text-[#00215C] block">
                {rating <= 3 ? 'What went wrong or could be improved?' : 'What did you like or suggest for future updates?'}
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                placeholder={
                  rating <= 3
                    ? "Tell us what didn't work well or what correction felt wrong..."
                    : category === 'Content issue'
                    ? "What was inaccurate about the correction, transcription, or tutor response?"
                    : category === 'Bug'
                    ? "What went wrong? Steps to reproduce the issue..."
                    : "Share your thoughts or ideas to make SpeechAI even better..."
                }
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#255CC1] focus:ring-1 focus:ring-[#255CC1] outline-none text-xs text-slate-800 placeholder-slate-400 resize-none transition-all leading-relaxed"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-1 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold transition-all disabled:opacity-50 shadow-xs"
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

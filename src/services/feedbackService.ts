import { supabase } from '../lib/supabase';
import { FeedbackCategory, UserFeedback } from '../lib/database.types';

export interface SubmitFeedbackParams {
  rating?: number | null;
  category: FeedbackCategory;
  message: string;
  session_id?: string | null;
}

export async function submitUserFeedback(params: SubmitFeedbackParams): Promise<UserFeedback> {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    throw new Error('You must be signed in to submit feedback.');
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: authData.user.id,
      rating: params.rating || null,
      category: params.category,
      message: params.message.trim(),
      session_id: params.session_id || null,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to submit user feedback:', error);
    throw new Error(error.message || 'Failed to submit feedback. Please try again.');
  }

  // Attempt async email notification dispatch (non-blocking)
  try {
    fetch('/api/feedback-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedbackId: data.id,
        userId: authData.user.id,
        userEmail: authData.user.email,
        rating: data.rating,
        category: data.category,
        message: data.message,
        sessionId: data.session_id,
        createdAt: data.created_at,
      }),
    }).catch(() => {
      // Non-blocking: database trigger trg_notify_admin_on_feedback already recorded audit log
    });
  } catch {}

  return data as UserFeedback;
}

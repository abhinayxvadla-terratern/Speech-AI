import { supabase } from '../lib/supabase';
import { UserFeedback } from '../lib/database.types';

export interface SubmitFeedbackParams {
  rating?: number | null;
  category?: string;
  categories?: string[];
  message?: string;
  session_id?: string | null;
}

export async function submitUserFeedback(params: SubmitFeedbackParams): Promise<UserFeedback> {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    throw new Error('You must be signed in to submit feedback.');
  }

  // If categories array provided, join them, otherwise use category or default to 'General'
  let resolvedCategory = 'General';
  if (Array.isArray(params.categories) && params.categories.length > 0) {
    resolvedCategory = params.categories.join(', ');
  } else if (params.category && params.category.trim()) {
    resolvedCategory = params.category.trim();
  }

  const resolvedMessage = (params.message || '').trim();

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: authData.user.id,
      rating: params.rating || null,
      category: resolvedCategory,
      message: resolvedMessage,
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

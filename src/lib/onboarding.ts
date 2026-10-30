import { supabase } from './supabase';

/**
 * Resets a user's onboarding state and progress.
 * Wipes module progress, zeroes streaks, clears domain/subbranch/cefr/urgency,
 * and sets onboarding_completed back to false.
 *
 * @param userId - The user's auth uuid
 */
export async function resetOnboarding(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required to reset onboarding');
    }

    // 1. Reset profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        primary_domain: null,
        primary_subbranch: null,
        cefr_level: null,
        urgency_date: null,
        onboarding_completed: false,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error resetting profile in resetOnboarding:', profileError);
      throw profileError;
    }

    // 2. Reset streaks table
    const { error: streakError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: userId,
          current_streak: 0,
          total_sessions: 0,
          total_modules_completed: 0,
          last_session_date: null,
        },
        { onConflict: 'user_id' }
      );

    if (streakError) {
      console.error('Error resetting streaks in resetOnboarding:', streakError);
      throw streakError;
    }

    // 3. Clear user's diagnostic recaps and sessions (modules/practice sessions)
    const { error: recapError } = await supabase
      .from('diagnostic_recaps')
      .delete()
      .eq('user_id', userId);

    if (recapError) {
      console.warn('Note: diagnostic_recaps cleanup warning:', recapError);
    }

    const { error: sessionError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionError) {
      console.warn('Note: sessions cleanup warning:', sessionError);
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to reset onboarding:', err);
    return { success: false, error: err };
  }
}

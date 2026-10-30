import { supabase } from './supabase';

/**
 * Updates user streaks upon completing a learning or practice session.
 * - Increments total_sessions
 * - Updates last_session_date to today (YYYY-MM-DD)
 * - If last_session_date was yesterday or null (first session), increments current_streak
 * - If last_session_date was today, current_streak is unchanged
 * - If there was a gap (> 1 day), resets current_streak to 1
 * - If isNewModuleCompletion is true, increments total_modules_completed
 */
export async function recordSessionCompletionInStreak(
  userId: string,
  isNewModuleCompletion: boolean = false
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch existing streak
    const { data: streak, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching streak:', error);
      return;
    }

    if (!streak) {
      // First time streak creation
      await supabase.from('streaks').insert({
        user_id: userId,
        current_streak: 1,
        last_session_date: today,
        total_sessions: 1,
        total_modules_completed: isNewModuleCompletion ? 1 : 0,
      });
      return;
    }

    let newStreak = streak.current_streak || 0;
    const lastDate = streak.last_session_date;

    if (!lastDate) {
      newStreak = 1;
    } else if (lastDate === today) {
      // Already practiced today, keep current streak
      newStreak = Math.max(1, newStreak);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else {
        // Gap detected, reset to 1
        newStreak = 1;
      }
    }

    // Compute authoritative count of distinct completed modules from sessions table
    const { data: completedSessions } = await supabase
      .from('sessions')
      .select('module_id')
      .eq('user_id', userId)
      .eq('tab', 'speak')
      .eq('status', 'completed');

    const authoritativeCompletedModules = new Set(
      (completedSessions || []).map((s) => s.module_id).filter(Boolean)
    ).size;

    await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        last_session_date: today,
        total_sessions: (streak.total_sessions || 0) + 1,
        total_modules_completed: authoritativeCompletedModules,
      })
      .eq('user_id', userId);
  } catch (err) {
    console.error('Failed to update streak:', err);
  }
}

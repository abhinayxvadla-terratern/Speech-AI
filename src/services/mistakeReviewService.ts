import { supabase } from '../lib/supabase';

export interface AggregatedMistakeCategory {
  category: string;
  occurrences: number;
  lastPracticedAt: string | null;
  exampleMistakes: Array<{
    example: string;
    correction: string;
    what_to_change?: string;
  }>;
}

const STORAGE_KEY = 'speechai_category_practiced_at';

export function getCategoryPracticedTimestamps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordCategoryPracticed(category: string): void {
  try {
    const current = getCategoryPracticedTimestamps();
    current[category] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to record category practiced timestamp:', err);
  }
}

export async function fetchUserMistakeReviewData(userId: string): Promise<{
  totalSessions: number;
  categories: AggregatedMistakeCategory[];
}> {
  try {
    const { data: recaps, error } = await supabase
      .from('diagnostic_recaps')
      .select('id, mistakes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !recaps) {
      return { totalSessions: 0, categories: [] };
    }

    const practicedMap = getCategoryPracticedTimestamps();
    const categoryMap: Record<
      string,
      {
        occurrences: number;
        exampleMistakes: Array<{ example: string; correction: string; what_to_change?: string }>;
      }
    > = {};

    recaps.forEach((recap) => {
      const rawMistakes = Array.isArray(recap.mistakes) ? recap.mistakes : [];
      rawMistakes.forEach((m: any) => {
        const cat = (m?.category || 'General Expression').trim();
        if (!categoryMap[cat]) {
          categoryMap[cat] = { occurrences: 0, exampleMistakes: [] };
        }
        categoryMap[cat].occurrences += 1;

        const ex = m?.example || m?.example_de || m?.example_en || '';
        const corr = m?.correction || m?.correction_de || m?.correction_en || '';
        if (ex || corr) {
          // Avoid duplicate examples
          const alreadyExists = categoryMap[cat].exampleMistakes.some(
            (item) => item.example === ex && item.correction === corr
          );
          if (!alreadyExists && categoryMap[cat].exampleMistakes.length < 5) {
            categoryMap[cat].exampleMistakes.push({
              example: ex,
              correction: corr,
              what_to_change: m?.what_to_change,
            });
          }
        }
      });
    });

    const categoriesList: AggregatedMistakeCategory[] = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      occurrences: categoryMap[cat].occurrences,
      lastPracticedAt: practicedMap[cat] || null,
      exampleMistakes: categoryMap[cat].exampleMistakes,
    }));

    // Sorting rule:
    // 1. Oldest-unpracticed first: never-practiced (null) or older practiced timestamps rank first.
    // 2. Most repeated first: among items with similar practice status, higher occurrences rank first.
    categoriesList.sort((a, b) => {
      const timeA = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0;
      const timeB = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0;

      // Unpracticed items come first
      if (timeA === 0 && timeB > 0) return -1;
      if (timeB === 0 && timeA > 0) return 1;

      // If both were practiced at significantly different times (> 6 hours), older practiced comes first
      if (timeA > 0 && timeB > 0) {
        const diffHours = (timeB - timeA) / (1000 * 60 * 60);
        if (Math.abs(diffHours) > 6) {
          return timeA - timeB; // older timestamp first
        }
      }

      // Most repeated first
      return b.occurrences - a.occurrences;
    });

    return {
      totalSessions: recaps.length,
      categories: categoriesList,
    };
  } catch (err) {
    console.error('Error fetching user mistake review data:', err);
    return { totalSessions: 0, categories: [] };
  }
}

// Target practice phrases per mistake category, strictly ordered short-to-long
export function getReviewPhrasesForCategory(
  category: string,
  examples?: Array<{ example: string; correction: string }>
): Array<{ german: string; english: string }> {
  // If we have corrections from user's actual mistakes, use them!
  const extractedPhrases: Array<{ german: string; english: string }> = [];

  if (Array.isArray(examples)) {
    examples.forEach((ex) => {
      if (ex.correction && ex.correction.trim().length > 0) {
        extractedPhrases.push({
          german: ex.correction.trim(),
          english: ex.example ? `Correcting: "${ex.example}"` : `Target practice phrase`,
        });
      }
    });
  }

  // Pre-configured category drills in German, from short to long
  const defaultBank: Record<string, Array<{ german: string; english: string }>> = {
    'Pronunciation & Delivery': [
      { german: 'Guten Tag.', english: 'Good day.' },
      { german: 'Ich heiße Thomas.', english: 'My name is Thomas.' },
      { german: 'Können Sie das bitte wiederholen?', english: 'Could you please repeat that?' },
    ],
    'Grammar & Structure': [
      { german: 'Weil ich lerne.', english: 'Because I am learning.' },
      { german: 'Obwohl es spät ist.', english: 'Although it is late.' },
      { german: 'Ich glaube, dass wir pünktlich ankommen.', english: 'I believe that we will arrive on time.' },
    ],
    'Vocabulary & Phrasing': [
      { german: 'Vielen Dank.', english: 'Thank you very much.' },
      { german: 'Ich verstehe die Anweisung.', english: 'I understand the instruction.' },
      { german: 'Lassen Sie uns den nächsten Schritt besprechen.', english: 'Let us discuss the next step.' },
    ],
    'Fluency & Flow': [
      { german: 'Ja, gerne.', english: 'Yes, gladly.' },
      { german: 'Einen Moment bitte.', english: 'One moment, please.' },
      { german: 'Ich möchte gerne einen Termin vereinbaren.', english: 'I would like to make an appointment.' },
    ],
  };

  const pool = extractedPhrases.length > 0 ? extractedPhrases : (defaultBank[category] || defaultBank['Pronunciation & Delivery']);

  // Strictly enforce short-to-long sorting (words first, then characters)
  return [...pool].sort((a, b) => {
    const aWords = a.german.trim().split(/\s+/).filter(Boolean).length;
    const bWords = b.german.trim().split(/\s+/).filter(Boolean).length;
    if (aWords !== bWords) return aWords - bWords;
    return a.german.trim().length - b.german.trim().length;
  });
}

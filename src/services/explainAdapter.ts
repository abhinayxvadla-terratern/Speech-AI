import { DiagnosticMistake } from '../lib/database.types';

export interface ExplainResult {
  explanation: string;
  ruleKey?: string;
  category?: string;
}

export interface ExplainAdapter {
  explain(mistake: DiagnosticMistake): Promise<ExplainResult>;
}

class StubExplainAdapter implements ExplainAdapter {
  async explain(mistake: DiagnosticMistake): Promise<ExplainResult> {
    const category = (mistake.category || '').toLowerCase();
    const example = (mistake.example_de || mistake.example_en || mistake.example || '').toLowerCase();
    const correction = (mistake.correction_de || mistake.correction_en || mistake.correction || '').toLowerCase();

    // Reference example and correction to satisfy compiler and educational context
    void example;

    // 1. Verb Position & Sentence Order
    if (category.includes('verb') || category.includes('position') || category.includes('order')) {
      return {
        category: 'Word Order & Verb Position',
        ruleKey: 'verb_position_2',
        explanation: 'In German main clauses, the finite (conjugated) verb must always take position 2. In subordinate clauses (starting with weil, dass, wenn), the conjugated verb is placed at the very end of the clause.',
      };
    }

    // 2. Cases (Accusative / Dative / Genitive)
    if (category.includes('case') || category.includes('ending') || category.includes('akkusativ') || category.includes('dativ')) {
      return {
        category: 'Grammatical Cases & Endings',
        ruleKey: 'case_endings',
        explanation: 'German noun phrases adjust their articles and adjective endings according to their grammatical function: masculine direct objects require the accusative ending "-en" (den/einen), while indirect objects require the dative case (dem/einem).',
      };
    }

    // 3. Pronunciation, Phonetics & Umlauts
    if (category.includes('pronunciation') || category.includes('delivery') || category.includes('vowel') || category.includes('phonetic') || category.includes('sound')) {
      return {
        category: 'Pronunciation & Phonetics',
        ruleKey: 'phonetic_articulation',
        explanation: 'German pronunciation requires clear articulation of vowels and umlauts (ä, ö, ü). Furthermore, word-final voiced stops undergo terminal devoicing (Auslautverhärtung), so final "-g" sounds like a soft "-k" (as in "Tag").',
      };
    }

    // 4. Noun Gender & Articles
    if (category.includes('gender') || category.includes('article') || category.includes('genus')) {
      return {
        category: 'Gender & Articles',
        ruleKey: 'noun_gender',
        explanation: 'Every German noun has an inherent grammatical gender (der, die, or das). Definite and indefinite articles must match the exact gender and case of the noun being referenced.',
      };
    }

    // 5. Prepositions
    if (category.includes('preposition') || category.includes('präposition')) {
      return {
        category: 'Prepositions',
        ruleKey: 'two_way_prepositions',
        explanation: 'Two-way prepositions (in, an, auf, unter, etc.) take the accusative case when describing directional motion (Wohin?) and the dative case when describing stationary location (Wo?).',
      };
    }

    // Default targeted educational rationale
    if (correction) {
      return {
        category: mistake.category || 'German Structure',
        ruleKey: 'general_usage',
        explanation: `In standard German, "${correction}" is the idiomatic structure. Paying attention to clear word endings and natural word rhythm ensures native clarity in professional settings.`,
      };
    }

    return {
      category: mistake.category || 'General Practice',
      ruleKey: 'general_practice',
      explanation: 'Focus on clear syllable articulation and standard German sentence rhythm.',
    };
  }
}

export const explainAdapter: ExplainAdapter = new StubExplainAdapter();

export interface MistakeExplanation {
  why: string;
  category?: string;
  ruleKey?: string;
}

export async function explainMistake(mistake: { example?: string; correction?: string; category?: string }): Promise<MistakeExplanation> {
  const res = await explainAdapter.explain({
    example: mistake.example,
    correction: mistake.correction,
    category: mistake.category,
  } as any);
  return {
    why: res.explanation,
    category: res.category,
    ruleKey: res.ruleKey,
  };
}

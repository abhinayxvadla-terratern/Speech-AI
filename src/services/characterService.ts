import { supabase } from '../lib/supabase';
import { Character } from '../lib/database.types';

// Fallback seed characters matching the Supabase migration
export const FALLBACK_CHARACTERS: Character[] = [
  {
    id: '3cb22134-a00d-4e73-91ee-acf56ee380ea',
    name: 'Schwester Sabine',
    role: 'Senior Ward Nurse',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    intro_line: 'Hallo! Ich bin Schwester Sabine. Auf Station 4 müssen wir heute die Patientenübergabe machen.',
    is_active: true,
  },
  {
    id: 'e564ce23-7e22-4dd0-83b8-e01d04f4c2f3',
    name: 'Meister Weber',
    role: 'Workshop Trainer',
    domain: 'Ausbildung',
    sub_branch: 'Mechatronics',
    intro_line: 'Guten Morgen! In der Werkstatt prüfen wir heute die Sicherheitsventile.',
    is_active: true,
  },
  {
    id: '00025b49-24a7-4694-acf3-a104f437ed19',
    name: 'Frau Dr. Keller',
    role: 'University Admissions Officer',
    domain: 'Study/University',
    sub_branch: 'General',
    intro_line: 'Guten Tag! Willkommen im Immatrikulationsbüro der Universität.',
    is_active: true,
  },
  {
    id: 'b02b63ad-019f-4b82-ba5d-c757507f826f',
    name: 'Herr Becker',
    role: 'Project Lead',
    domain: 'Workplace Integration',
    sub_branch: 'IT',
    intro_line: 'Hallo! Willkommen im Team. Lassen Sie uns über das Projekt sprechen.',
    is_active: true,
  },
  {
    id: '69a954c4-22d0-4c51-90e6-06c25923d3b9',
    name: 'Frau Schneider',
    role: 'Integration Officer',
    domain: 'Settlement',
    sub_branch: 'General',
    intro_line: 'Guten Tag! Ich bin Frau Schneider vom Bürgeramt. Wie kann ich Ihnen helfen?',
    is_active: true,
  },
];

let cachedCharacters: Character[] | null = null;

export async function fetchActiveCharacters(): Promise<Character[]> {
  if (cachedCharacters && cachedCharacters.length > 0) {
    return cachedCharacters;
  }

  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      cachedCharacters = FALLBACK_CHARACTERS;
      return FALLBACK_CHARACTERS;
    }

    cachedCharacters = data as Character[];
    return cachedCharacters;
  } catch (err) {
    console.warn('Using fallback characters due to fetch error:', err);
    cachedCharacters = FALLBACK_CHARACTERS;
    return FALLBACK_CHARACTERS;
  }
}

export function matchCharacter(
  characters: Character[],
  domain?: string | null,
  subBranch?: string | null
): Character {
  const pool = characters.length > 0 ? characters : FALLBACK_CHARACTERS;

  if (domain && subBranch) {
    const exact = pool.find(
      (c) =>
        c.domain.toLowerCase() === domain.toLowerCase() &&
        c.sub_branch?.toLowerCase() === subBranch.toLowerCase()
    );
    if (exact) return exact;
  }

  if (domain) {
    const domainMatch = pool.find(
      (c) =>
        c.domain.toLowerCase() === domain.toLowerCase() ||
        domain.toLowerCase().includes(c.domain.toLowerCase()) ||
        c.domain.toLowerCase().includes(domain.toLowerCase())
    );
    if (domainMatch) return domainMatch;
  }

  // Default fallback character
  return pool[0] || FALLBACK_CHARACTERS[0];
}

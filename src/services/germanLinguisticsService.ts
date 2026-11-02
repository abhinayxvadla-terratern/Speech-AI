// Linguistic helper for breaking down German words, syllables, phonetics, and sentence structure
// Specially tailored for Learn Mode in Scenarios and Interviews

export interface WordLinguisticBreakdown {
  word: string;
  cleanWord: string;
  syllables: string;
  phonetics: string;
  meaning?: string;
  tip?: string;
}

export interface SentenceLinguisticAnalysis {
  german: string;
  english: string;
  structureNote: string;
  grammarHighlight: string;
  politenessNote: string;
  words: WordLinguisticBreakdown[];
  spokenCoachPrompt: string;
}

// Curated dictionary for high-frequency scenario, medical, technical, and interview terminology
const KNOWN_WORDS: Record<string, { syllables: string; phonetics: string; meaning?: string; tip?: string }> = {
  hafermilch: {
    syllables: 'Ha·fer·milch',
    phonetics: '[HAH-fer-milkh]',
    meaning: 'oat milk (Hafer = oat + Milch = milk)',
    tip: 'Compound word: stress "Ha-fer", end with soft "-ch".',
  },
  hauptbahnhof: {
    syllables: 'Haupt·bahn·hof',
    phonetics: '[HOWPT-bahn-hohf]',
    meaning: 'main train station (Haupt = main + Bahnhof = station)',
    tip: 'Stress "Haupt", pronounce "au" like "ow" in "cow".',
  },
  entschuldigung: {
    syllables: 'Ent·schul·di·gung',
    phonetics: '[ent-SHOOL-dee-goong]',
    meaning: 'excuse me / apology (ent- + Schuld = guilt + -igung)',
    tip: 'Soft "-ig" sounds like "-ich" in standard high German.',
  },
  patientenübergabe: {
    syllables: 'Pa·ti·en·ten·über·ga·be',
    phonetics: '[pa-tsi-EN-ten-ew-ber-gah-be]',
    meaning: 'patient handover (Patienten + Übergabe)',
    tip: 'Pronounce "ti" as "tsi" and "ü" with rounded lips.',
  },
  gesundheitskarte: {
    syllables: 'Ge·sund·heits·kar·te',
    phonetics: '[ge-ZOOND-hyts-kahr-te]',
    meaning: 'health insurance card (Gesundheit = health + Karte = card)',
    tip: 'Pronounce initial "s" as voiced "z".',
  },
  sprechstunde: {
    syllables: 'Sprech·stun·de',
    phonetics: '[SHPREKH-shtoon-de]',
    meaning: 'consultation hours (sprechen = speak + Stunde = hour)',
    tip: '"sp" and "st" at syllable start sound like "shp" and "sht".',
  },
  halsschmerzen: {
    syllables: 'Hals·schmer·zen',
    phonetics: '[HAHLS-shmehr-tsen]',
    meaning: 'sore throat (Hals = throat + Schmerzen = pain)',
    tip: '"z" is always pronounced like "ts" in "cats".',
  },
  vollkornbrot: {
    syllables: 'Voll·korn·brot',
    phonetics: '[FOHL-kohn-broht]',
    meaning: 'whole-grain bread (Vollkorn = whole grain + Brot = bread)',
    tip: 'German "v" is pronounced like English "f".',
  },
  nachbarschaftshilfe: {
    syllables: 'Nach·bar·schafts·hil·fe',
    phonetics: '[NAHKH-bahr-shahfts-hil-fe]',
    meaning: 'neighborhood assistance (Nachbar = neighbor + Hilfe = help)',
    tip: 'Pronounce guttural "ch" after "a".',
  },
  vorstellungsgespräch: {
    syllables: 'Vor·stel·lungs·ge·spräch',
    phonetics: '[FOHR-shtel-loongs-ge-shprehkh]',
    meaning: 'job interview (Vorstellung = introduction + Gespräch = talk)',
    tip: 'Stress "Vor", pronounce "ä" as open "eh".',
  },
  entwicklungsbedarf: {
    syllables: 'Ent·wick·lungs·be·darf',
    phonetics: '[ent-VIK-loongs-be-dahrf]',
    meaning: 'room for development / improvement need',
    tip: 'Stress "wick", pronounce "w" as English "v".',
  },
  zusammenarbeit: {
    syllables: 'Zu·sam·men·ar·beit',
    phonetics: '[tsoo-ZAH-men-ahr-byt]',
    meaning: 'collaboration / working together (zusammen + Arbeit)',
    tip: '"z" sounds like "ts", "ei" sounds like "eye".',
  },
  verantwortung: {
    syllables: 'Ver·ant·wor·tung',
    phonetics: '[fehr-AHNT-vohr-toong]',
    meaning: 'responsibility',
    tip: 'Prefix "ver-" sounds like "fehr-".',
  },
  situation: {
    syllables: 'Si·tu·a·ti·on',
    phonetics: '[zee-too-ah-tsee-OHN]',
    meaning: 'situation / circumstances',
    tip: 'Last syllable "-on" receives full stress.',
  },
  erfahrung: {
    syllables: 'Er·fah·rung',
    phonetics: '[ehr-FAH-roong]',
    meaning: 'experience',
    tip: 'The "h" lengthens the "a" sound.',
  },
  frühstück: {
    syllables: 'Früh·stück',
    phonetics: '[FREW-shtewk]',
    meaning: 'breakfast (früh = early + Stück = piece)',
    tip: 'Rounded lips for both "ü" sounds; "st" sounds like "sht".',
  },
  wiederholen: {
    syllables: 'Wie·der·ho·len',
    phonetics: '[VEE-der-hoh-len]',
    meaning: 'to repeat',
    tip: '"ie" is a long "ee" sound.',
  },
  vereinbaren: {
    syllables: 'Ver·ein·ba·ren',
    phonetics: '[fehr-EYE-bah-ren]',
    meaning: 'to arrange / book an appointment',
    tip: '"ver-" sounds like "fehr-", "ein" sounds like "eye-n".',
  },
  empfehlen: {
    syllables: 'Emp·feh·len',
    phonetics: '[emp-FEH-len]',
    meaning: 'to recommend',
    tip: 'Stress the second syllable "feh".',
  },
  stadtzentrum: {
    syllables: 'Stadt·zen·trum',
    phonetics: '[SHTAHT-tsen-troom]',
    meaning: 'city center (Stadt = city + Zentrum = center)',
    tip: '"st" sounds like "sht", "z" sounds like "ts".',
  },
  einkaufstasche: {
    syllables: 'Ein·kaufs·ta·sche',
    phonetics: '[EYE-n-kowfs-tah-she]',
    meaning: 'shopping bag (Einkauf = shopping + Tasche = bag)',
    tip: '"au" sounds like "ow", "sch" sounds like "sh".',
  },
  versichert: {
    syllables: 'Ver·si·chert',
    phonetics: '[fehr-ZEE-khert]',
    meaning: 'insured (under health insurance)',
    tip: 'Prefix "ver-" = "fehr-", "si" = "zee".',
  },
  bewerben: {
    syllables: 'Be·wer·ben',
    phonetics: '[be-VEHR-ben]',
    meaning: 'to apply (for a job)',
    tip: 'Stress "wer", pronounce "w" as "v".',
  },
};

// Algorithmic syllable and phonetic breakdown for arbitrary German words
function breakDownWordAlgorithmic(rawWord: string): WordLinguisticBreakdown {
  const clean = rawWord.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
  const lower = clean.toLowerCase();

  if (KNOWN_WORDS[lower]) {
    return {
      word: rawWord,
      cleanWord: clean,
      ...KNOWN_WORDS[lower],
    };
  }

  // Common German prefix separations
  const prefixes = ['vor', 'ent', 'ver', 'ge', 'be', 'zer', 'er', 'auf', 'aus', 'an', 'mit', 'ein', 'ab', 'nach', 'über', 'unter'];
  let remaining = lower;
  const parts: string[] = [];

  for (const p of prefixes) {
    if (remaining.startsWith(p) && remaining.length > p.length + 2) {
      parts.push(p);
      remaining = remaining.slice(p.length);
      break;
    }
  }

  // Vowel cluster syllable segmentation
  const vowelRegex = /([aeiouyäöü]+|ei|ie|au|eu|äu)/gi;
  const matches: RegExpMatchArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = vowelRegex.exec(remaining)) !== null) {
    matches.push(m);
  }

  if (matches.length <= 1) {
    parts.push(remaining);
  } else {
    let lastIdx = 0;
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      if (!nextMatch) {
        parts.push(remaining.slice(lastIdx));
      } else {
        const betweenStart = currentMatch.index! + currentMatch[0].length;
        const betweenEnd = nextMatch.index!;
        const consonants = remaining.slice(betweenStart, betweenEnd);

        let splitOffset = betweenStart;
        if (consonants.length > 1) {
          // Rule: split between consonants (e.g., k-t, s-t, r-t, n-d)
          splitOffset = betweenStart + 1;
        }
        parts.push(remaining.slice(lastIdx, splitOffset));
        lastIdx = splitOffset;
      }
    }
  }

  // Capitalize properly according to original word
  const syllables = parts
    .filter(Boolean)
    .map((p, idx) => (idx === 0 && /^[A-ZÄÖÜ]/.test(clean) ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join('·');

  // Phonetic transcription
  const phonetics = `[${parts
    .filter(Boolean)
    .map((p, idx) => {
      let ph = p
        .replace(/ei/g, 'EYE')
        .replace(/ie/g, 'EE')
        .replace(/au/g, 'OW')
        .replace(/äu|eu/g, 'OY')
        .replace(/sch/g, 'sh')
        .replace(/ch/g, 'kh')
        .replace(/ä/g, 'eh')
        .replace(/ö/g, 'ew')
        .replace(/ü/g, 'ew')
        .replace(/z/g, 'ts')
        .replace(/w/g, 'v')
        .replace(/v/g, 'f')
        .replace(/ß/g, 'ss');
      if (idx === (parts.length > 2 ? 1 : 0)) {
        return ph.toUpperCase();
      }
      return ph.toLowerCase();
    })
    .join('-')}]`;

  return {
    word: rawWord,
    cleanWord: clean,
    syllables: syllables || clean,
    phonetics,
    tip: clean.length > 6 ? 'Break into syllables and articulate vowels clearly.' : undefined,
  };
}

// Generate comprehensive linguistic analysis for any scenario phrase or interview question
export function analyzeSentenceLinguistics(germanSentence: string, englishTranslation: string): SentenceLinguisticAnalysis {
  const cleanSentence = germanSentence.trim();
  const rawWords = cleanSentence.split(/\s+/).filter(Boolean);

  // Extract key / challenging words (length >= 5 or compound / special characters)
  const candidateWords = rawWords.filter((w) => {
    const pure = w.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
    return pure.length >= 4 && !['und', 'der', 'die', 'das', 'dem', 'den', 'mit', 'für', 'ein', 'eine', 'auf', 'ist', 'von'].includes(pure.toLowerCase());
  });

  // Pick top 2-3 most educational words to break down
  const selectedWords = (candidateWords.length > 0 ? candidateWords : rawWords.slice(0, 2))
    .slice(0, 3)
    .map(breakDownWordAlgorithmic);

  // Analyze sentence structure
  let structureNote = '';
  let grammarHighlight = '';
  const lower = cleanSentence.toLowerCase();

  const isQuestion = cleanSentence.endsWith('?') || /^(wo|wie|was|wann|warum|welche|können|haben|möchten|dürfen|sind)\b/i.test(cleanSentence);

  if (lower.startsWith('können sie') || lower.startsWith('haben sie') || lower.startsWith('möchten sie') || lower.startsWith('darf ich')) {
    structureNote = 'Inverted question structure: The conjugated modal/auxiliary verb takes position 1, followed immediately by the subject "Sie".';
    grammarHighlight = 'Polite formal question pattern (Verb + Sie + ... + infinitive).';
  } else if (/^(wo|wie|was|wann|warum)\b/i.test(lower)) {
    structureNote = 'W-Question: Question word in position 1, conjugated verb in position 2, followed by the subject.';
    grammarHighlight = 'Standard German information request structure.';
  } else if (isQuestion) {
    structureNote = 'Question structure: In German questions, the conjugated verb takes position 1 or directly follows a W-question word.';
    grammarHighlight = 'Question word order & intonation.';
  } else if (lower.includes('weil') || lower.includes('dass') || lower.includes('obwohl') || lower.includes('wenn')) {
    structureNote = 'Subordinate clause (Nebensatz): The subordinating conjunction sends the conjugated verb to the very end of the clause.';
    grammarHighlight = 'Conjunction word order: Verb at final position.';
  } else if (lower.includes('möchte') || lower.includes('kann') || lower.includes('muss')) {
    structureNote = 'Modal verb structure: The conjugated modal verb is in position 2; the main action verb stays in the infinitive at the very end.';
    grammarHighlight = 'Bracket structure (Satzklammer): Modal verb + end infinitive.';
  } else {
    structureNote = 'Standard German main clause (Hauptsatz): The conjugated verb stands strictly in position 2.';
    grammarHighlight = 'Core position 2 verb rule ensures native German cadence.';
  }

  const politenessNote = cleanSentence.includes('Sie') || cleanSentence.includes('Ihnen') || cleanSentence.includes('Ihre')
    ? 'Formal register (Sie-Form): Essential for professional workplaces, healthcare wards, and public services.'
    : 'Everyday German conversational register.';

  // Build spoken guidance for the AI voice adapter in Learn Mode
  const primaryWord = selectedWords[0];
  let spokenCoachPrompt = '';
  if (primaryWord) {
    spokenCoachPrompt = `The German sentence is: "${cleanSentence}". It means: "${englishTranslation}". Pay close attention to the word "${primaryWord.cleanWord}", broken down as: "${primaryWord.syllables.replace(/·/g, ' - ')}". ${structureNote} Now try pronouncing it and speak the full phrase aloud!`;
  } else {
    spokenCoachPrompt = `The German sentence is: "${cleanSentence}". It means: "${englishTranslation}". ${structureNote} Now speak it aloud in German!`;
  }

  return {
    german: cleanSentence,
    english: englishTranslation,
    structureNote,
    grammarHighlight,
    politenessNote,
    words: selectedWords,
    spokenCoachPrompt,
  };
}

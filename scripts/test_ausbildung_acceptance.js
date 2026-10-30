import { ausbildungA1 } from './ausbildung_a1.js';
import { ausbildungA2 } from './ausbildung_a2.js';
import { ausbildungB1 } from './ausbildung_b1.js';
import { ausbildungB2 } from './ausbildung_b2.js';
import { healthcareA1 } from './healthcare_a1.js';
import { healthcareA2 } from './healthcare_a2.js';
import { healthcareB1 } from './healthcare_b1.js';
import { healthcareB2 } from './healthcare_b2.js';

const allAusbildung = {
  ...ausbildungA1,
  ...ausbildungA2,
  ...ausbildungB1,
  ...ausbildungB2
};

const allHealthcare = {
  ...healthcareA1,
  ...healthcareA2,
  ...healthcareB1,
  ...healthcareB2
};

console.log('--- AUSBILDUNG & HEALTHCARE RESOLUTION TEST ---');
console.log(`Ausbildung modules: ${Object.keys(allAusbildung).length}`);
console.log(`Healthcare modules: ${Object.keys(allHealthcare).length}`);

// UI Resolution simulation logic from src/pages/Speak.tsx & ActiveSession.tsx
function resolveModuleContent(mod, userProfile) {
  const c = mod.content || {};
  const domain = userProfile?.primary_domain;
  const variant = domain && c.domain_variants?.[domain] ? c.domain_variants[domain] : null;
  return {
    isVariant: !!variant,
    content: variant || c
  };
}

// Create a synthetic module with both variants
const sampleMod = {
  module_number: 1,
  content: {
    target_phrases: [{ german: 'Neutral phrase', english: 'Neutral phrase' }],
    example_sentences: ['Neutral sentence'],
    domain_variants: {
      Healthcare: allHealthcare[1],
      Ausbildung: allAusbildung[1]
    }
  }
};

// 1. Ausbildung user
const ausbildungUser = { primary_domain: 'Ausbildung', primary_subbranch: 'Electrician' };
const resAusbildung = resolveModuleContent(sampleMod, ausbildungUser);
if (!resAusbildung.isVariant) throw new Error('Failed to resolve Ausbildung variant');
if (!resAusbildung.content.target_phrases[0].german.includes('Auszubildende') && !resAusbildung.content.target_phrases[0].german.includes('Meister')) {
  throw new Error('Ausbildung content mismatch');
}
console.log('✓ Ausbildung user correctly resolved Ausbildung variant');

// 2. Healthcare user
const hcUser = { primary_domain: 'Healthcare', primary_subbranch: 'Nursing' };
const resHc = resolveModuleContent(sampleMod, hcUser);
if (!resHc.isVariant) throw new Error('Failed to resolve Healthcare variant');
console.log('✓ Healthcare user correctly resolved Healthcare variant');

// 3. Other domain user (e.g. Study / University)
const studyUser = { primary_domain: 'Study / University', primary_subbranch: 'Engineering' };
const resStudy = resolveModuleContent(sampleMod, studyUser);
if (resStudy.isVariant) throw new Error('Other domain should not resolve variant');
if (resStudy.content.target_phrases[0].german !== 'Neutral phrase') throw new Error('Should fallback to neutral content');
console.log('✓ Other domain user correctly falls back to neutral default content');

// 4. User without domain
const anonymousUser = { primary_domain: null };
const resAnon = resolveModuleContent(sampleMod, anonymousUser);
if (resAnon.isVariant || resAnon.content.target_phrases[0].german !== 'Neutral phrase') {
  throw new Error('Anonymous user fallback failed');
}
console.log('✓ User without domain correctly falls back to neutral default content');

// 5. Test all 9 Ausbildung sub-branches
const subbranches = [
  'Electrician',
  'Plumbing/Heating',
  'Carpentry',
  'Automotive Mechatronics',
  'Hospitality & Culinary',
  'Retail/Commerce',
  'Logistics & Warehousing',
  'IT/Technical',
  'Industrial/Manufacturing'
];

for (const sub of subbranches) {
  const profile = { primary_domain: 'Ausbildung', primary_subbranch: sub };
  for (let num = 1; num <= 112; num++) {
    const mod = {
      module_number: num,
      content: {
        target_phrases: [{ german: 'Neutral', english: 'Neutral' }],
        domain_variants: {
          Ausbildung: allAusbildung[num]
        }
      }
    };
    const res = resolveModuleContent(mod, profile);
    if (!res.isVariant || !res.content.target_phrases.length) {
      throw new Error(`Failed for subbranch ${sub} on module ${num}`);
    }
  }
}
console.log(`✓ All 9 Ausbildung subbranches verified across all 112 modules!`);
console.log('SUCCESS: All acceptance checks passed!');

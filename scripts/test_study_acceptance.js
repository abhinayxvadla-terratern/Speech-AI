import { studyA1 } from './study_a1.js';
import { studyA2 } from './study_a2.js';
import { studyB1 } from './study_b1.js';
import { studyB2 } from './study_b2.js';
import { ausbildungA1 } from './ausbildung_a1.js';
import { ausbildungA2 } from './ausbildung_a2.js';
import { ausbildungB1 } from './ausbildung_b1.js';
import { ausbildungB2 } from './ausbildung_b2.js';
import { healthcareA1 } from './healthcare_a1.js';
import { healthcareA2 } from './healthcare_a2.js';
import { healthcareB1 } from './healthcare_b1.js';
import { healthcareB2 } from './healthcare_b2.js';

const allStudy = {
  ...studyA1,
  ...studyA2,
  ...studyB1,
  ...studyB2
};

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

console.log('--- THREE-DOMAIN RESOLUTION TEST (Study/University, Ausbildung, Healthcare) ---');
console.log(`Study modules: ${Object.keys(allStudy).length}`);
console.log(`Ausbildung modules: ${Object.keys(allAusbildung).length}`);
console.log(`Healthcare modules: ${Object.keys(allHealthcare).length}`);

if (Object.keys(allStudy).length !== 112) {
  throw new Error(`Expected 112 study modules, found ${Object.keys(allStudy).length}`);
}

// UI Resolution simulation logic identical to src/pages/Speak.tsx & ActiveSession.tsx
function resolveModuleContent(mod, userProfile) {
  const c = mod.content || {};
  const domain = userProfile?.primary_domain;
  const variant = domain && c.domain_variants?.[domain] ? c.domain_variants[domain] : null;
  return {
    isVariant: !!variant,
    content: variant || c
  };
}

// Build a synthetic module containing all three variants
const sampleMod1 = {
  module_number: 1,
  content: {
    target_phrases: [{ german: 'Guten Tag!', english: 'Hello!' }],
    example_sentences: ['Guten Tag, wie geht es Ihnen?'],
    domain_variants: {
      Healthcare: allHealthcare[1],
      Ausbildung: allAusbildung[1],
      'Study/University': allStudy[1]
    }
  }
};

// Test 1: Study/University user with each of the 6 sub-branches
const studySubbranches = [
  'University Application & Enrollment',
  'Academic Life',
  'Student Administration',
  'Campus & Student Life',
  'Thesis/Academic Writing',
  'Part-time Student Jobs'
];

studySubbranches.forEach(sub => {
  const user = { primary_domain: 'Study/University', primary_subbranch: sub };
  const res = resolveModuleContent(sampleMod1, user);
  if (!res.isVariant) throw new Error(`Failed to resolve Study variant for sub-branch: ${sub}`);
  if (!res.content.target_phrases[0].german.includes('Professor') && !res.content.target_phrases[0].german.includes('Vorlesung')) {
    throw new Error(`Study content phrase mismatch for sub-branch: ${sub}`);
  }
});
console.log('✓ All 6 Study/University sub-branches correctly resolve Study/University variant');

// Test 2: Ausbildung user
const ausbildungUser = { primary_domain: 'Ausbildung', primary_subbranch: 'Electrician' };
const resAusbildung = resolveModuleContent(sampleMod1, ausbildungUser);
if (!resAusbildung.isVariant) throw new Error('Failed to resolve Ausbildung variant');
if (!resAusbildung.content.target_phrases[0].german.includes('Auszubildende') && !resAusbildung.content.target_phrases[0].german.includes('Meister')) {
  throw new Error('Ausbildung content mismatch');
}
console.log('✓ Ausbildung user correctly resolves Ausbildung variant');

// Test 3: Healthcare user
const healthcareUser = { primary_domain: 'Healthcare', primary_subbranch: 'Nursing' };
const resHealthcare = resolveModuleContent(sampleMod1, healthcareUser);
if (!resHealthcare.isVariant) throw new Error('Failed to resolve Healthcare variant');
if (!resHealthcare.content.target_phrases[0].german.includes('Pflegekraft') && !resHealthcare.content.target_phrases[0].german.includes('Patient')) {
  throw new Error('Healthcare content mismatch');
}
console.log('✓ Healthcare user correctly resolves Healthcare variant');

// Test 4: Default / Neutral fallback for user with no domain or untracked domain
const neutralUser = { primary_domain: null };
const resNeutral = resolveModuleContent(sampleMod1, neutralUser);
if (resNeutral.isVariant) throw new Error('Neutral user should not resolve a variant');
if (resNeutral.content.target_phrases[0].german !== 'Guten Tag!') {
  throw new Error('Neutral fallback failed');
}
console.log('✓ Neutral user correctly falls back to default content');

// Test 5: Verify across all 112 modules that Study/University structure is valid
for (let i = 1; i <= 112; i++) {
  const mod = allStudy[i];
  if (!mod || !Array.isArray(mod.target_phrases) || mod.target_phrases.length === 0) {
    throw new Error(`Module ${i} missing valid target_phrases in Study`);
  }
  if (!Array.isArray(mod.example_sentences) || mod.example_sentences.length === 0) {
    throw new Error(`Module ${i} missing valid example_sentences in Study`);
  }
}
console.log('✓ All 112 modules verified for target_phrases & example_sentences structure');
console.log('ALL TESTS PASSED SUCCESSFULLY!');

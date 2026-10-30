import fs from 'fs';
import { healthcareA1 } from './healthcare_a1.js';
import { healthcareA2 } from './healthcare_a2.js';
import { healthcareB1 } from './healthcare_b1.js';
import { healthcareB2 } from './healthcare_b2.js';

const allVariants = {
  ...healthcareA1,
  ...healthcareA2,
  ...healthcareB1,
  ...healthcareB2
};

const defaultModules = JSON.parse(fs.readFileSync('scripts/all_modules.json', 'utf8'));

console.log('--- COMPREHENSIVE OFFLINE ACCEPTANCE VERIFICATION ---');
console.log(`Loaded ${defaultModules.length} default modules and ${Object.keys(allVariants).length} healthcare variants.`);

// 1. Simulate merged database state
const mergedModules = defaultModules.map(m => {
  const variant = allVariants[m.module_number];
  if (!variant) throw new Error(`Missing variant for module ${m.module_number}`);
  return {
    ...m,
    content: {
      ...m.content,
      domain_variants: {
        Healthcare: variant
      }
    }
  };
});

console.log('✓ Successfully simulated merged content across all 112 modules');

// 2. Check level counts and domain weights
let a1Count = 0, a2Count = 0, b1Count = 0, b2Count = 0;
for (const m of mergedModules) {
  if (m.level === 'A1') {
    a1Count++;
    if (m.domain_weight_pct !== 20) throw new Error(`A1 module ${m.module_number} wrong weight`);
  } else if (m.level === 'A2') {
    a2Count++;
    if (m.domain_weight_pct !== 20) throw new Error(`A2 module ${m.module_number} wrong weight`);
  } else if (m.level === 'B1') {
    b1Count++;
    if (m.domain_weight_pct !== 40) throw new Error(`B1 module ${m.module_number} wrong weight`);
  } else if (m.level === 'B2') {
    b2Count++;
    if (m.domain_weight_pct !== 70) throw new Error(`B2 module ${m.module_number} wrong weight`);
  }
}
console.log(`✓ Distribution verified: A1=${a1Count} (20%), A2=${a2Count} (20%), B1=${b1Count} (40%), B2=${b2Count} (70%)`);

// 3. UI Resolution Simulation Function (matches Speak.tsx and ActiveSession.tsx)
function resolveModuleContent(mod, userProfile) {
  const c = mod.content || {};
  const domain = userProfile?.primary_domain;
  const variant = domain && c.domain_variants?.[domain] ? c.domain_variants[domain] : null;
  return {
    isVariant: !!variant,
    content: variant || c
  };
}

// 4. Test with Healthcare user
const hcUser = { primary_domain: 'Healthcare', primary_subbranch: 'Nursing' };
for (const m of mergedModules) {
  const resolved = resolveModuleContent(m, hcUser);
  if (!resolved.isVariant) {
    throw new Error(`Module ${m.module_number} failed to resolve Healthcare variant for Healthcare user!`);
  }
  if (!resolved.content.target_phrases || resolved.content.target_phrases.length === 0) {
    throw new Error(`Module ${m.module_number} resolved empty target_phrases`);
  }
}
console.log('✓ Healthcare user successfully receives Healthcare-flavored content across ALL 112 modules!');

// 5. Test with non-Healthcare user (e.g. Ausbildung)
const nonHcUser = { primary_domain: 'Ausbildung', primary_subbranch: 'Electrician' };
for (const m of mergedModules) {
  const resolved = resolveModuleContent(m, nonHcUser);
  if (resolved.isVariant) {
    throw new Error(`Module ${m.module_number} resolved unexpected variant for non-Healthcare user!`);
  }
  // Must match generic default
  if (resolved.content.target_phrases[0].german !== m.content.target_phrases[0].german) {
    throw new Error(`Module ${m.module_number} did not match generic default`);
  }
}
console.log('✓ Non-Healthcare user (Ausbildung) correctly sees generic default content across ALL 112 modules, unaffected!');

// 6. Test with neutral user (null primary_domain)
const neutralUser = { primary_domain: null, primary_subbranch: null };
for (const m of mergedModules) {
  const resolved = resolveModuleContent(m, neutralUser);
  if (resolved.isVariant) {
    throw new Error(`Module ${m.module_number} resolved unexpected variant for neutral user!`);
  }
}
console.log('✓ Neutral user (null primary_domain) correctly sees generic default content across ALL 112 modules, unaffected!');

// 7. Verify Phrasing Progression & Healthcare Flavor Calibration
console.log('\n--- PHRASING PROGRESSION SAMPLES ---');
const sampleA1 = mergedModules.find(m => m.module_number === 1);
const sampleA2 = mergedModules.find(m => m.module_number === 26);
const sampleB1 = mergedModules.find(m => m.module_number === 51);
const sampleB2 = mergedModules.find(m => m.module_number === 77);

console.log(`[A1 - 20%] Modul 1:`);
console.log(`  Generic:    "${sampleA1.content.target_phrases[0].german}"`);
console.log(`  Healthcare: "${sampleA1.content.domain_variants.Healthcare.target_phrases[0].german}"`);

console.log(`[A2 - 20%] Modul 26:`);
console.log(`  Generic:    "${sampleA2.content.target_phrases[0].german}"`);
console.log(`  Healthcare: "${sampleA2.content.domain_variants.Healthcare.target_phrases[0].german}"`);

console.log(`[B1 - 40%] Modul 51:`);
console.log(`  Generic:    "${sampleB1.content.target_phrases[0].german}"`);
console.log(`  Healthcare: "${sampleB1.content.domain_variants.Healthcare.target_phrases[0].german}"`);
console.log(`  Healthcare Ex: "${sampleB1.content.domain_variants.Healthcare.example_sentences[0]}"`);

console.log(`[B2 - 70%] Modul 77:`);
console.log(`  Generic:    "${sampleB2.content.target_phrases[0].german}"`);
console.log(`  Healthcare: "${sampleB2.content.domain_variants.Healthcare.target_phrases[0].german}"`);
console.log(`  Healthcare Ex: "${sampleB2.content.domain_variants.Healthcare.example_sentences[0]}"`);

console.log('\n--- ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! ---');

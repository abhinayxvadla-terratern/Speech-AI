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

const keys = Object.keys(allVariants).map(Number).sort((a, b) => a - b);
console.log('Total modules authored:', keys.length);
console.log('Min module number:', keys[0]);
console.log('Max module number:', keys[keys.length - 1]);

// Check each module 1 to 112
let errors = [];
for (let i = 1; i <= 112; i++) {
  const v = allVariants[i];
  if (!v) {
    errors.push(`Missing module ${i}`);
    continue;
  }
  if (!Array.isArray(v.target_phrases) || v.target_phrases.length < 2) {
    errors.push(`Module ${i} has insufficient target_phrases: ${v.target_phrases?.length}`);
  }
  for (const p of v.target_phrases) {
    if (!p.german || !p.english) {
      errors.push(`Module ${i} has incomplete phrase: ${JSON.stringify(p)}`);
    }
  }
  if (!Array.isArray(v.example_sentences) || v.example_sentences.length < 1) {
    errors.push(`Module ${i} has insufficient example_sentences: ${v.example_sentences?.length}`);
  }
}

if (errors.length > 0) {
  console.error('Validation errors found:', errors);
  process.exit(1);
} else {
  console.log('All 112 Healthcare module variants passed structural validation!');
}

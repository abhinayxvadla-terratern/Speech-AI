import { studyA1 } from './study_a1.js';
import { studyA2 } from './study_a2.js';
import { studyB1 } from './study_b1.js';
import { studyB2 } from './study_b2.js';

const allVariants = {
  ...studyA1,
  ...studyA2,
  ...studyB1,
  ...studyB2
};

const keys = Object.keys(allVariants).map(Number).sort((a, b) => a - b);
console.log('Total Study/University modules authored:', keys.length);
console.log('Min module number:', keys[0]);
console.log('Max module number:', keys[keys.length - 1]);

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
  console.log('SUCCESS: All 112 Study/University module variants passed structural validation!');
}

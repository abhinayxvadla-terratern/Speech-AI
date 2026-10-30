import fs from 'fs';

const files = [
  'scripts/data_scenarios_healthcare.js',
  'scripts/data_scenarios_ausbildung.js',
  'scripts/data_scenarios_study.js',
  'scripts/data_scenarios_workplace.js',
  'scripts/data_scenarios_settlement.js',
  'scripts/data_scenarios_daily_life.js'
];

let issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match any backslash-quote, e.g. \'
  const matches = [...content.matchAll(/([a-zA-Z0-9_\s]{0,15})\\?'([a-zA-Z0-9_\s]{0,15})/g)];
  matches.forEach(m => {
    const text = m[0];
    // Check if it's suspicious
    if (/([a-zA-Z])\\?'\s+[a-z]/.test(text)) {
      issues.push(`${file}: suspicious space after quote -> "${text}"`);
    }
  });
});

if (issues.length > 0) {
  console.log('Issues found:');
  issues.forEach(i => console.log(' - ' + i));
} else {
  console.log('No suspicious apostrophes found in data files.');
}

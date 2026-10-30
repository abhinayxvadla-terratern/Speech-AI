import { healthcareScenarios } from './data_scenarios_healthcare.js';
import { ausbildungScenarios } from './data_scenarios_ausbildung.js';
import { studyScenarios } from './data_scenarios_study.js';
import { workplaceScenarios } from './data_scenarios_workplace.js';
import { settlementScenarios } from './data_scenarios_settlement.js';
import { dailyLifeScenarios } from './data_scenarios_daily_life.js';

const expectedSubBranches = {
  Healthcare: [
    'Dental Assistant',
    'Elderly Care',
    'Hospital Administration/Ward Clerk',
    'Medical Technician/Lab Assistant',
    'Nursing',
    'Nursing/Care Assistant',
    'Physiotherapy',
    'Radiology Technician'
  ],
  Ausbildung: [
    'Automotive Mechatronics',
    'Carpentry',
    'Electrician',
    'Hospitality & Culinary',
    'Industrial/Manufacturing',
    'IT/Technical',
    'Logistics & Warehousing',
    'Plumbing/Heating',
    'Retail/Commerce'
  ],
  'Study/University': [
    'Academic Life',
    'Campus & Student Life',
    'Part-time Student Jobs',
    'Student Administration',
    'Thesis/Academic Writing',
    'University Application & Enrollment'
  ],
  'Workplace Integration': [
    'Customer-facing/Service',
    'Factory/Production Floor',
    'General Office/Corporate',
    'Team & Manager Communication',
    'Workplace Safety & Compliance'
  ],
  Settlement: [
    'Anmeldung & Registration',
    'Banking & Finance',
    'Healthcare System Access',
    'Housing & Tenancy',
    'Social Integration'
  ]
};

const domainLists = [
  ...healthcareScenarios,
  ...ausbildungScenarios,
  ...studyScenarios,
  ...workplaceScenarios,
  ...settlementScenarios
];

console.log(`Total domain scenarios authored: ${domainLists.length}`);
console.log(`Total daily life scenarios authored: ${dailyLifeScenarios.length}`);

let errors = [];

// 1. Check total count
if (domainLists.length !== 99) {
  errors.push(`Expected 99 domain scenarios, got ${domainLists.length}`);
}
if (dailyLifeScenarios.length !== 10) {
  errors.push(`Expected 10 daily life scenarios, got ${dailyLifeScenarios.length}`);
}

// 2. Check 3 scenarios per sub-branch
const countsBySubBranch = {};
for (const [parent, subs] of Object.entries(expectedSubBranches)) {
  for (const sub of subs) {
    countsBySubBranch[`${parent}::${sub}`] = 0;
  }
}

const titlesSeen = new Set();

domainLists.forEach((sc, idx) => {
  const key = `${sc.parent_domain}::${sc.sub_branch}`;
  if (countsBySubBranch[key] === undefined) {
    errors.push(`Scenario [${idx}] has unexpected parent/sub: ${key} ("${sc.title}")`);
  } else {
    countsBySubBranch[key]++;
  }

  if (titlesSeen.has(sc.title)) {
    errors.push(`Duplicate title across domain scenarios: "${sc.title}"`);
  }
  titlesSeen.add(sc.title);

  // Validate fields
  if (!sc.title || typeof sc.title !== 'string' || sc.title.length < 5) {
    errors.push(`Scenario [${idx}] invalid title: "${sc.title}"`);
  }
  if (!sc.description || typeof sc.description !== 'string' || sc.description.length < 20) {
    errors.push(`Scenario [${idx}] description too short: "${sc.description}"`);
  }
  if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(sc.min_level)) {
    errors.push(`Scenario [${idx}] invalid min_level: "${sc.min_level}"`);
  }
  if (!sc.content || !Array.isArray(sc.content.target_phrases)) {
    errors.push(`Scenario [${idx}] missing content.target_phrases`);
  } else {
    if (sc.content.target_phrases.length < 3 || sc.content.target_phrases.length > 5) {
      errors.push(`Scenario [${idx}] ("${sc.title}") expected 3-5 target_phrases, got ${sc.content.target_phrases.length}`);
    }
    sc.content.target_phrases.forEach((tp, pIdx) => {
      if (!tp.german || !tp.english) {
        errors.push(`Scenario [${idx}] target_phrase [${pIdx}] missing german or english`);
      }
    });
  }
  if (!sc.content || !Array.isArray(sc.content.example_sentences)) {
    errors.push(`Scenario [${idx}] missing content.example_sentences`);
  } else {
    if (sc.content.example_sentences.length < 1 || sc.content.example_sentences.length > 2) {
      errors.push(`Scenario [${idx}] ("${sc.title}") expected 1-2 example_sentences, got ${sc.content.example_sentences.length}`);
    }
    sc.content.example_sentences.forEach((es, sIdx) => {
      if (!es || typeof es !== 'string') {
        errors.push(`Scenario [${idx}] example_sentence [${sIdx}] empty`);
      }
    });
  }
});

// Check counts per sub-branch
for (const [key, count] of Object.entries(countsBySubBranch)) {
  if (count !== 3) {
    errors.push(`Sub-branch ${key} has ${count} scenarios (expected 3)`);
  }
}

// 3. Check Daily Life Scenarios
dailyLifeScenarios.forEach((sc, idx) => {
  if (sc.track !== 'daily_life') {
    errors.push(`Daily scenario [${idx}] wrong track: ${sc.track}`);
  }
  if (sc.is_baseline !== false) {
    errors.push(`Daily scenario [${idx}] is_baseline should be false`);
  }
  if (sc.parent_domain !== null || sc.sub_branch !== null) {
    errors.push(`Daily scenario [${idx}] parent_domain or sub_branch should be null`);
  }
  if (!sc.title || sc.title.length < 5) {
    errors.push(`Daily scenario [${idx}] invalid title: "${sc.title}"`);
  }
  if (!sc.description || sc.description.length < 20) {
    errors.push(`Daily scenario [${idx}] description too short: "${sc.description}"`);
  }
  if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(sc.min_level)) {
    errors.push(`Daily scenario [${idx}] invalid min_level: "${sc.min_level}"`);
  }
  if (!sc.content || !Array.isArray(sc.content.target_phrases)) {
    errors.push(`Daily scenario [${idx}] missing target_phrases`);
  } else {
    if (sc.content.target_phrases.length < 3 || sc.content.target_phrases.length > 5) {
      errors.push(`Daily scenario [${idx}] expected 3-5 target_phrases, got ${sc.content.target_phrases.length}`);
    }
  }
  if (!sc.content || !Array.isArray(sc.content.example_sentences)) {
    errors.push(`Daily scenario [${idx}] missing example_sentences`);
  } else {
    if (sc.content.example_sentences.length < 1 || sc.content.example_sentences.length > 2) {
      errors.push(`Daily scenario [${idx}] expected 1-2 example_sentences, got ${sc.content.example_sentences.length}`);
    }
  }
});

if (errors.length > 0) {
  console.error(`Validation FAILED with ${errors.length} errors:`);
  errors.forEach(e => console.error(` - ${e}`));
  process.exit(1);
} else {
  console.log(`Validation PASSED flawlessly! All 99 domain scenarios (33 sub-branches x 3) and 10 daily life scenarios meet 100% of the specs.`);
}

import fs from 'fs';
import path from 'path';

import { healthcareInterviews } from './data_interviews_healthcare.js';
import { ausbildungInterviews } from './data_interviews_ausbildung.js';
import { studyInterviews } from './data_interviews_study.js';
import { workplaceInterviews } from './data_interviews_workplace.js';
import { settlementInterviews } from './data_interviews_settlement.js';
import { examSpeakingPrompts } from './data_exam_speaking_prompts.js';

const allInterviews = [
  ...healthcareInterviews,
  ...ausbildungInterviews,
  ...studyInterviews,
  ...workplaceInterviews,
  ...settlementInterviews
];

console.log("=== Validating Interview Types ===");
console.log(`Total interview types authored: ${allInterviews.length} (Expected: 165)`);

const subBranches = [
  // Healthcare (8)
  { parent: 'Healthcare', sub: 'Nursing' },
  { parent: 'Healthcare', sub: 'Elderly Care' },
  { parent: 'Healthcare', sub: 'Nursing/Care Assistant' },
  { parent: 'Healthcare', sub: 'Physiotherapy' },
  { parent: 'Healthcare', sub: 'Medical Technician/Lab Assistant' },
  { parent: 'Healthcare', sub: 'Radiology Technician' },
  { parent: 'Healthcare', sub: 'Dental Assistant' },
  { parent: 'Healthcare', sub: 'Hospital Administration/Ward Clerk' },
  // Ausbildung (9)
  { parent: 'Ausbildung', sub: 'Electrician' },
  { parent: 'Ausbildung', sub: 'Plumbing/Heating' },
  { parent: 'Ausbildung', sub: 'Carpentry' },
  { parent: 'Ausbildung', sub: 'Automotive Mechatronics' },
  { parent: 'Ausbildung', sub: 'Hospitality & Culinary' },
  { parent: 'Ausbildung', sub: 'Retail/Commerce' },
  { parent: 'Ausbildung', sub: 'Logistics & Warehousing' },
  { parent: 'Ausbildung', sub: 'IT/Technical' },
  { parent: 'Ausbildung', sub: 'Industrial/Manufacturing' },
  // Study/University (6)
  { parent: 'Study/University', sub: 'University Application & Enrollment' },
  { parent: 'Study/University', sub: 'Academic Life' },
  { parent: 'Study/University', sub: 'Student Administration' },
  { parent: 'Study/University', sub: 'Campus & Student Life' },
  { parent: 'Study/University', sub: 'Thesis/Academic Writing' },
  { parent: 'Study/University', sub: 'Part-time Student Jobs' },
  // Workplace Integration (5)
  { parent: 'Workplace Integration', sub: 'General Office/Corporate' },
  { parent: 'Workplace Integration', sub: 'Factory/Production Floor' },
  { parent: 'Workplace Integration', sub: 'Customer-facing/Service' },
  { parent: 'Workplace Integration', sub: 'Team & Manager Communication' },
  { parent: 'Workplace Integration', sub: 'Workplace Safety & Compliance' },
  // Settlement (5)
  { parent: 'Settlement', sub: 'Anmeldung & Registration' },
  { parent: 'Settlement', sub: 'Banking & Finance' },
  { parent: 'Settlement', sub: 'Housing & Tenancy' },
  { parent: 'Settlement', sub: 'Healthcare System Access' },
  { parent: 'Settlement', sub: 'Social Integration' }
];

const requiredTypes = ['Behavioral', 'Technical', 'Situational', 'Panel', 'Phone Screen'];

let interviewErrors = 0;
for (const sb of subBranches) {
  const matching = allInterviews.filter(i => i.parent_domain === sb.parent && i.sub_branch === sb.sub);
  if (matching.length !== 5) {
    console.error(`ERROR: ${sb.parent} -> ${sb.sub} has ${matching.length} interview types, expected 5!`);
    interviewErrors++;
  }
  for (const t of requiredTypes) {
    const row = matching.find(m => m.type_name === t);
    if (!row) {
      console.error(`ERROR: Missing type ${t} for ${sb.parent} -> ${sb.sub}`);
      interviewErrors++;
      continue;
    }
    if (!row.min_level || !['B1', 'B2'].includes(row.min_level)) {
      console.error(`ERROR: Invalid min_level '${row.min_level}' in ${row.parent_domain} -> ${row.sub_branch} -> ${row.type_name}`);
      interviewErrors++;
    }
    if (!row.content || !Array.isArray(row.content.sample_questions) || row.content.sample_questions.length < 3) {
      console.error(`ERROR: Insufficient sample_questions in ${row.parent_domain} -> ${row.sub_branch} -> ${row.type_name}`);
      interviewErrors++;
    }
    for (const q of row.content.sample_questions) {
      if (!q.german || !q.english || !q.guidance) {
        console.error(`ERROR: Missing question fields in ${row.parent_domain} -> ${row.sub_branch} -> ${row.type_name}`);
        interviewErrors++;
      }
    }
  }
}

if (interviewErrors === 0) {
  console.log("All 165 interview types validated successfully!");
} else {
  console.error(`Validation failed with ${interviewErrors} errors.`);
  process.exit(1);
}

console.log("\n=== Validating Exam Speaking Prompts ===");
console.log(`Total exam speaking prompts authored: ${examSpeakingPrompts.length} (Expected: 48)`);

let examErrors = 0;
for (const lvl of ['B1', 'B2']) {
  for (let s = 1; s <= 8; s++) {
    const setPrompts = examSpeakingPrompts.filter(p => p.level === lvl && p.set_number === s);
    if (setPrompts.length !== 3) {
      console.error(`ERROR: ${lvl} Set ${s} has ${setPrompts.length} parts, expected 3!`);
      examErrors++;
    }
    for (let part = 1; part <= 3; part++) {
      const p = setPrompts.find(pr => pr.part === part);
      if (!p) {
        console.error(`ERROR: Missing part ${part} in ${lvl} Set ${s}`);
        examErrors++;
        continue;
      }
      if (!p.topic_title || !p.prompt_text || !p.prompt_text.german || !p.prompt_text.english) {
        console.error(`ERROR: Missing fields in ${lvl} Set ${s} Part ${part}`);
        examErrors++;
      }
    }
  }
}

if (examErrors === 0) {
  console.log("All 48 exam speaking prompts validated successfully!");
} else {
  console.error(`Exam prompt validation failed with ${examErrors} errors.`);
  process.exit(1);
}

// Generate SQL helper
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function generateInterviewInserts(rows) {
  const values = rows.map(r => {
    return `  (${escapeSql(r.parent_domain)}, ${escapeSql(r.sub_branch)}, ${escapeSql(r.type_name)}, ${escapeSql(r.min_level)}, ${escapeSql(r.description)}, ${escapeSql(JSON.stringify(r.content))}::jsonb)`;
  }).join(',\n');
  return `INSERT INTO public.interview_types (parent_domain, sub_branch, type_name, min_level, description, content)\nVALUES\n${values};`;
}

function generateExamPromptsInserts(rows) {
  const values = rows.map(r => {
    return `  (${escapeSql(r.level)}, ${r.set_number}, ${r.part}, ${escapeSql(r.topic_title)}, ${escapeSql(JSON.stringify(r.prompt_text))}::jsonb)`;
  }).join(',\n');
  return `INSERT INTO public.exam_speaking_prompts (level, set_number, part, topic_title, prompt_text)\nVALUES\n${values};`;
}

// Output chunks for interview types:
// 1. Healthcare (40 rows) -> split in 2 chunks of 20
fs.writeFileSync('scripts/chunk_interview_01_healthcare_a.sql', generateInterviewInserts(healthcareInterviews.slice(0, 20)));
fs.writeFileSync('scripts/chunk_interview_02_healthcare_b.sql', generateInterviewInserts(healthcareInterviews.slice(20)));

// 2. Ausbildung (45 rows) -> split in 3 chunks of 15
fs.writeFileSync('scripts/chunk_interview_03_ausbildung_a.sql', generateInterviewInserts(ausbildungInterviews.slice(0, 15)));
fs.writeFileSync('scripts/chunk_interview_04_ausbildung_b.sql', generateInterviewInserts(ausbildungInterviews.slice(15, 30)));
fs.writeFileSync('scripts/chunk_interview_05_ausbildung_c.sql', generateInterviewInserts(ausbildungInterviews.slice(30)));

// 3. Study/University (30 rows) -> split in 2 chunks of 15
fs.writeFileSync('scripts/chunk_interview_06_study_a.sql', generateInterviewInserts(studyInterviews.slice(0, 15)));
fs.writeFileSync('scripts/chunk_interview_07_study_b.sql', generateInterviewInserts(studyInterviews.slice(15)));

// 4. Workplace Integration (25 rows) -> split in 2 chunks (15 and 10)
fs.writeFileSync('scripts/chunk_interview_08_workplace_a.sql', generateInterviewInserts(workplaceInterviews.slice(0, 15)));
fs.writeFileSync('scripts/chunk_interview_09_workplace_b.sql', generateInterviewInserts(workplaceInterviews.slice(15)));

// 5. Settlement (25 rows) -> split in 2 chunks (15 and 10)
fs.writeFileSync('scripts/chunk_interview_10_settlement_a.sql', generateInterviewInserts(settlementInterviews.slice(0, 15)));
fs.writeFileSync('scripts/chunk_interview_11_settlement_b.sql', generateInterviewInserts(settlementInterviews.slice(15)));

// 6. Exam Speaking Prompts (48 rows) -> split in 2 chunks (24 B1 and 24 B2)
const b1Prompts = examSpeakingPrompts.filter(p => p.level === 'B1');
const b2Prompts = examSpeakingPrompts.filter(p => p.level === 'B2');
fs.writeFileSync('scripts/chunk_exam_01_b1.sql', generateExamPromptsInserts(b1Prompts));
fs.writeFileSync('scripts/chunk_exam_02_b2.sql', generateExamPromptsInserts(b2Prompts));

console.log("\nGenerated 11 interview chunk SQL files and 2 exam chunk SQL files successfully!");

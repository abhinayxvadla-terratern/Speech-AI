import fs from 'fs';
import { healthcareScenarios } from './data_scenarios_healthcare.js';
import { ausbildungScenarios } from './data_scenarios_ausbildung.js';
import { studyScenarios } from './data_scenarios_study.js';
import { workplaceScenarios } from './data_scenarios_workplace.js';
import { settlementScenarios } from './data_scenarios_settlement.js';
import { dailyLifeScenarios } from './data_scenarios_daily_life.js';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function escapeJsonSql(obj) {
  const jsonStr = JSON.stringify(obj);
  return "'" + jsonStr.replace(/'/g, "''") + "'::jsonb";
}

function generateInsert(scenarios) {
  const rows = scenarios.map(sc => {
    const track = escapeSql(sc.track || 'domain');
    const isBaseline = sc.is_baseline ? 'true' : 'false';
    const parentDomain = sc.parent_domain ? escapeSql(sc.parent_domain) : 'NULL';
    const subBranch = sc.sub_branch ? escapeSql(sc.sub_branch) : 'NULL';
    const title = escapeSql(sc.title);
    const description = escapeSql(sc.description);
    const minLevel = escapeSql(sc.min_level);
    const content = escapeJsonSql(sc.content);

    return `  (${track}, ${isBaseline}, ${parentDomain}, ${subBranch}, ${title}, ${description}, ${minLevel}, ${content})`;
  });

  return `INSERT INTO public.scenarios (track, is_baseline, parent_domain, sub_branch, title, description, min_level, content)\nVALUES\n${rows.join(',\n')};`;
}

// Batch 1: Delete old domain placeholders + Insert Healthcare (24)
const batch1Sql = `-- Part A: Delete old placeholder domain scenarios
DELETE FROM public.scenarios WHERE track = 'domain';

-- Part B: Insert Healthcare scenarios (24)
${generateInsert(healthcareScenarios)}
`;
fs.writeFileSync('scripts/batch_scenarios_1_healthcare.sql', batch1Sql, 'utf8');

// Batch 2: Insert Ausbildung scenarios (27)
const batch2Sql = `-- Part B: Insert Ausbildung scenarios (27)
${generateInsert(ausbildungScenarios)}
`;
fs.writeFileSync('scripts/batch_scenarios_2_ausbildung.sql', batch2Sql, 'utf8');

// Batch 3: Insert Study/University scenarios (18)
const batch3Sql = `-- Part B: Insert Study/University scenarios (18)
${generateInsert(studyScenarios)}
`;
fs.writeFileSync('scripts/batch_scenarios_3_study.sql', batch3Sql, 'utf8');

// Batch 4: Insert Workplace Integration (15) + Settlement (15) = 30
const batch4Sql = `-- Part B: Insert Workplace Integration (15) & Settlement (15)
${generateInsert([...workplaceScenarios, ...settlementScenarios])}
`;
fs.writeFileSync('scripts/batch_scenarios_4_workplace_settlement.sql', batch4Sql, 'utf8');

// Batch 5: Insert Daily Life (10)
const batch5Sql = `-- Part C: Insert 10 new non-baseline Daily Life scenarios
${generateInsert(dailyLifeScenarios)}
`;
fs.writeFileSync('scripts/batch_scenarios_5_daily_life.sql', batch5Sql, 'utf8');

console.log('Generated all 5 batch SQL files successfully!');

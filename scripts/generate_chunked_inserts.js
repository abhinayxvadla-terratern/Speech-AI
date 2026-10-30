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

const chunks = [
  { name: 'chunk_01_healthcare_a', data: healthcareScenarios.slice(0, 12) },
  { name: 'chunk_02_healthcare_b', data: healthcareScenarios.slice(12, 24) },
  { name: 'chunk_03_ausbildung_a', data: ausbildungScenarios.slice(0, 9) },
  { name: 'chunk_04_ausbildung_b', data: ausbildungScenarios.slice(9, 18) },
  { name: 'chunk_05_ausbildung_c', data: ausbildungScenarios.slice(18, 27) },
  { name: 'chunk_06_study_a', data: studyScenarios.slice(0, 9) },
  { name: 'chunk_07_study_b', data: studyScenarios.slice(9, 18) },
  { name: 'chunk_08_workplace_a', data: workplaceScenarios.slice(0, 8) },
  { name: 'chunk_09_workplace_b', data: workplaceScenarios.slice(8, 15) },
  { name: 'chunk_10_settlement_a', data: settlementScenarios.slice(0, 8) },
  { name: 'chunk_11_settlement_b', data: settlementScenarios.slice(8, 15) },
  { name: 'chunk_12_daily_life', data: dailyLifeScenarios }
];

chunks.forEach(c => {
  const sql = generateInsert(c.data);
  fs.writeFileSync(`scripts/${c.name}.sql`, sql, 'utf8');
  console.log(`Wrote ${c.name}.sql with ${c.data.length} scenarios.`);
});

console.log('All chunked insert files generated.');

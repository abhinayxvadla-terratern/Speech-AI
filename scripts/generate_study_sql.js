import fs from 'fs';
import { studyA1 } from './study_a1.js';
import { studyA2 } from './study_a2.js';
import { studyB1 } from './study_b1.js';
import { studyB2Part1 } from './study_b2_part1.js';
import { studyB2Part2 } from './study_b2_part2.js';

function buildBatchSql(modulesMap) {
  const entries = Object.entries(modulesMap).map(([num, data]) => {
    // Escape single quotes for SQL string literal
    const jsonStr = JSON.stringify(data).replace(/'/g, "''");
    return `(${num}, '${jsonStr}'::jsonb)`;
  });

  return `UPDATE public.modules as m
SET content = m.content || jsonb_build_object(
  'domain_variants', 
  COALESCE(m.content->'domain_variants', '{}'::jsonb) || jsonb_build_object('Study/University', v.variant_json)
)
FROM (VALUES 
  ${entries.join(',\n  ')}
) as v(module_number, variant_json)
WHERE m.module_number = v.module_number;`;
}

const batches = [
  { name: 'study_a1', map: studyA1 },
  { name: 'study_a2', map: studyA2 },
  { name: 'study_b1', map: studyB1 },
  { name: 'study_b2_part1', map: studyB2Part1 },
  { name: 'study_b2_part2', map: studyB2Part2 }
];

for (const b of batches) {
  const sql = buildBatchSql(b.map);
  fs.writeFileSync(`./scripts/batch_${b.name}.sql`, sql, 'utf8');
  console.log(`Generated ./scripts/batch_${b.name}.sql with ${Object.keys(b.map).length} modules.`);
}

import fs from 'fs';
import { ausbildungA1 } from './ausbildung_a1.js';
import { ausbildungA2 } from './ausbildung_a2.js';
import { ausbildungB1 } from './ausbildung_b1.js';
import { ausbildungB2Part1 } from './ausbildung_b2_part1.js';
import { ausbildungB2Part2 } from './ausbildung_b2_part2.js';

function buildBatchSql(modulesMap) {
  const entries = Object.entries(modulesMap).map(([num, data]) => {
    // Escape single quotes for SQL string literal
    const jsonStr = JSON.stringify(data).replace(/'/g, "''");
    return `(${num}, '${jsonStr}'::jsonb)`;
  });

  return `UPDATE public.modules as m
SET content = m.content || jsonb_build_object(
  'domain_variants', 
  COALESCE(m.content->'domain_variants', '{}'::jsonb) || jsonb_build_object('Ausbildung', v.variant_json)
)
FROM (VALUES 
  ${entries.join(',\n  ')}
) as v(module_number, variant_json)
WHERE m.module_number = v.module_number;`;
}

const batches = [
  { name: 'a1', map: ausbildungA1 },
  { name: 'a2', map: ausbildungA2 },
  { name: 'b1', map: ausbildungB1 },
  { name: 'b2_part1', map: ausbildungB2Part1 },
  { name: 'b2_part2', map: ausbildungB2Part2 }
];

for (const b of batches) {
  const sql = buildBatchSql(b.map);
  fs.writeFileSync(`./scripts/batch_${b.name}.sql`, sql, 'utf8');
  console.log(`Generated ./scripts/batch_${b.name}.sql with ${Object.keys(b.map).length} modules.`);
}

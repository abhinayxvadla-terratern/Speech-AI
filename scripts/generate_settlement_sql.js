import fs from 'fs';
import { settlementA1 } from './settlement_a1.js';
import { settlementA2 } from './settlement_a2.js';
import { settlementB1 } from './settlement_b1.js';
import { settlementB2Part1 } from './settlement_b2_part1.js';
import { settlementB2Part2 } from './settlement_b2_part2.js';

function buildBatchSql(modulesMap) {
  const entries = Object.entries(modulesMap).map(([num, data]) => {
    // Escape single quotes for SQL string literal
    const jsonStr = JSON.stringify(data).replace(/'/g, "''");
    return `(${num}, '${jsonStr}'::jsonb)`;
  });

  return `UPDATE public.modules as m
SET content = m.content || jsonb_build_object(
  'domain_variants', 
  COALESCE(m.content->'domain_variants', '{}'::jsonb) || jsonb_build_object('Settlement', v.variant_json)
)
FROM (VALUES 
  ${entries.join(',\n  ')}
) as v(module_number, variant_json)
WHERE m.module_number = v.module_number;`;
}

const batches = [
  { name: 'settlement_a1', map: settlementA1 },
  { name: 'settlement_a2', map: settlementA2 },
  { name: 'settlement_b1', map: settlementB1 },
  { name: 'settlement_b2_part1', map: settlementB2Part1 },
  { name: 'settlement_b2_part2', map: settlementB2Part2 }
];

for (const b of batches) {
  const sql = buildBatchSql(b.map);
  fs.writeFileSync(`./scripts/batch_${b.name}.sql`, sql, 'utf8');
  console.log(`Generated ./scripts/batch_${b.name}.sql with ${Object.keys(b.map).length} modules.`);
}

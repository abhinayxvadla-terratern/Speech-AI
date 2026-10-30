import fs from 'fs';
import { workplaceA1 } from './workplace_a1.js';
import { workplaceA2 } from './workplace_a2.js';
import { workplaceB1 } from './workplace_b1.js';
import { workplaceB2Part1 } from './workplace_b2_part1.js';
import { workplaceB2Part2 } from './workplace_b2_part2.js';

function buildBatchSql(modulesMap) {
  const entries = Object.entries(modulesMap).map(([num, data]) => {
    // Escape single quotes for SQL string literal
    const jsonStr = JSON.stringify(data).replace(/'/g, "''");
    return `(${num}, '${jsonStr}'::jsonb)`;
  });

  return `UPDATE public.modules as m
SET content = m.content || jsonb_build_object(
  'domain_variants', 
  COALESCE(m.content->'domain_variants', '{}'::jsonb) || jsonb_build_object('Workplace Integration', v.variant_json)
)
FROM (VALUES 
  ${entries.join(',\n  ')}
) as v(module_number, variant_json)
WHERE m.module_number = v.module_number;`;
}

const batches = [
  { name: 'workplace_a1', map: workplaceA1 },
  { name: 'workplace_a2', map: workplaceA2 },
  { name: 'workplace_b1', map: workplaceB1 },
  { name: 'workplace_b2_part1', map: workplaceB2Part1 },
  { name: 'workplace_b2_part2', map: workplaceB2Part2 }
];

for (const b of batches) {
  const sql = buildBatchSql(b.map);
  fs.writeFileSync(`./scripts/batch_${b.name}.sql`, sql, 'utf8');
  console.log(`Generated ./scripts/batch_${b.name}.sql with ${Object.keys(b.map).length} modules.`);
}

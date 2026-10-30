import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

async function runAcceptanceChecks() {
  console.log('--- STARTING HEALTHCARE DOMAIN FLAVOR ACCEPTANCE CHECKS ---');

  // 1. Fetch all 112 modules from Supabase via REST API
  const res = await fetch(urlMatch[1].trim() + '/rest/v1/modules?select=id,level,module_number,title,domain_weight_pct,content&order=module_number.asc', {
    headers: {
      'apikey': keyMatch[1].trim(),
      'Authorization': 'Bearer ' + keyMatch[1].trim()
    }
  });

  if (!res.ok) {
    console.error('Fetch error:', res.status, await res.text());
    process.exit(1);
  }

  const modules = await res.json();

  console.log(`✓ Fetched ${modules.length} modules from Supabase (expected 112)`);
  if (modules.length !== 112) {
    console.error(`Expected 112 modules, found ${modules.length}`);
    process.exit(1);
  }

  // 2. Verify all 112 modules have content.domain_variants.Healthcare populated
  let missingHealthcare = [];
  let a1a2Count = 0;
  let b1Count = 0;
  let b2Count = 0;

  for (const m of modules) {
    const c = m.content || {};
    const hc = c.domain_variants?.Healthcare;

    if (!hc) {
      missingHealthcare.push(m.module_number);
      continue;
    }

    if (!Array.isArray(hc.target_phrases) || hc.target_phrases.length < 2) {
      console.error(`Module ${m.module_number} has invalid target_phrases:`, hc.target_phrases);
      process.exit(1);
    }

    if (!Array.isArray(hc.example_sentences) || hc.example_sentences.length < 1) {
      console.error(`Module ${m.module_number} has invalid example_sentences:`, hc.example_sentences);
      process.exit(1);
    }

    // Default content intact check
    if (!Array.isArray(c.target_phrases) || c.target_phrases.length < 2) {
      console.error(`Module ${m.module_number} generic default target_phrases corrupted!`);
      process.exit(1);
    }

    if (m.level === 'A1' || m.level === 'A2') {
      a1a2Count++;
      if (m.domain_weight_pct !== 20) {
        console.error(`Module ${m.module_number} level ${m.level} has wrong domain_weight_pct: ${m.domain_weight_pct}`);
        process.exit(1);
      }
    } else if (m.level === 'B1') {
      b1Count++;
      if (m.domain_weight_pct !== 40) {
        console.error(`Module ${m.module_number} level B1 has wrong domain_weight_pct: ${m.domain_weight_pct}`);
        process.exit(1);
      }
    } else if (m.level === 'B2') {
      b2Count++;
      if (m.domain_weight_pct !== 70) {
        console.error(`Module ${m.module_number} level B2 has wrong domain_weight_pct: ${m.domain_weight_pct}`);
        process.exit(1);
      }
    }
  }

  if (missingHealthcare.length > 0) {
    console.error('Modules missing Healthcare variant:', missingHealthcare);
    process.exit(1);
  }

  console.log(`✓ All 112 modules have valid content.domain_variants.Healthcare populated`);
  console.log(`✓ Level breakdown: A1/A2 = ${a1a2Count} (20% weight), B1 = ${b1Count} (40% weight), B2 = ${b2Count} (70% weight)`);

  // 3. Check phrasing flavor calibration samples
  const sampleA1 = modules.find(m => m.module_number === 3); // Numbers
  const sampleA2 = modules.find(m => m.module_number === 25); // Weekend
  const sampleB1 = modules.find(m => m.module_number === 49); // Opinions
  const sampleB2 = modules.find(m => m.module_number === 77); // Operational Procedures

  console.log('\n--- SAMPLE PHRASING CALIBRATION CHECKS ---');
  console.log(`Module 3 [A1 - 20%] Generic first phrase: "${sampleA1.content.target_phrases[0].german}"`);
  console.log(`Module 3 [A1 - 20%] Healthcare flavored phrase: "${sampleA1.content.domain_variants.Healthcare.target_phrases[0].german}"`);

  console.log(`Module 25 [A2 - 20%] Generic first phrase: "${sampleA2.content.target_phrases[0].german}"`);
  console.log(`Module 25 [A2 - 20%] Healthcare flavored phrase: "${sampleA2.content.domain_variants.Healthcare.target_phrases[0].german}"`);

  console.log(`Module 49 [B1 - 40%] Generic first phrase: "${sampleB1.content.target_phrases[0].german}"`);
  console.log(`Module 49 [B1 - 40%] Healthcare flavored phrase: "${sampleB1.content.domain_variants.Healthcare.target_phrases[0].german}"`);

  console.log(`Module 77 [B2 - 70%] Generic first phrase: "${sampleB2.content.target_phrases[0].german}"`);
  console.log(`Module 77 [B2 - 70%] Healthcare flavored phrase: "${sampleB2.content.domain_variants.Healthcare.target_phrases[0].german}"`);

  // 4. Test UI Content Resolution Logic
  console.log('\n--- UI CONTENT RESOLUTION LOGIC TEST ---');
  
  function resolveModuleContent(mod, userProfile) {
    const c = mod.content || {};
    const domain = userProfile?.primary_domain;
    const variant = domain && c.domain_variants?.[domain] ? c.domain_variants[domain] : null;
    return variant || c;
  }

  // Healthcare user test
  const healthcareProfile = { primary_domain: 'Healthcare', primary_subbranch: 'Nursing' };
  const hcResolved = resolveModuleContent(sampleB2, healthcareProfile);
  const isHcFlavored = hcResolved.target_phrases[0].german === sampleB2.content.domain_variants.Healthcare.target_phrases[0].german;
  console.log(`✓ Healthcare User sees domain-flavored phrase: ${isHcFlavored} ("${hcResolved.target_phrases[0].german}")`);

  if (!isHcFlavored) {
    console.error('FAILED: Healthcare user did not receive flavored content!');
    process.exit(1);
  }

  // Non-Healthcare user test (e.g. Ausbildung)
  const ausbildungProfile = { primary_domain: 'Ausbildung', primary_subbranch: 'Electrician' };
  const genericResolved = resolveModuleContent(sampleB2, ausbildungProfile);
  const isGeneric = genericResolved.target_phrases[0].german === sampleB2.content.target_phrases[0].german;
  console.log(`✓ Ausbildung User sees generic default phrase: ${isGeneric} ("${genericResolved.target_phrases[0].german}")`);

  if (!isGeneric) {
    console.error('FAILED: Non-Healthcare user received unexpected content!');
    process.exit(1);
  }

  // User with no domain test
  const neutralProfile = { primary_domain: null, primary_subbranch: null };
  const neutralResolved = resolveModuleContent(sampleB2, neutralProfile);
  const isNeutralGeneric = neutralResolved.target_phrases[0].german === sampleB2.content.target_phrases[0].german;
  console.log(`✓ Neutral User sees generic default phrase: ${isNeutralGeneric}`);

  if (!isNeutralGeneric) {
    console.error('FAILED: Neutral user did not receive generic default content!');
    process.exit(1);
  }

  console.log('\n✓ ALL HEALTHCARE DOMAIN ACCEPTANCE CHECKS PASSED SUCCESSFULLY!');
}

runAcceptanceChecks().catch(err => {
  console.error(err);
  process.exit(1);
});

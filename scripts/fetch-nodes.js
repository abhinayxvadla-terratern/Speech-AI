import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'brt2r0MFeUUq4Rk9rZHFLl';

async function fetchNodes() {
  const nodeIds = ['15:575', '3:26', '39:380', '110:490', '60:1304', '36:82'].join(',');
  console.log('Fetching nodes from Figma:', nodeIds);

  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${nodeIds}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Figma API error (${res.status}):`, text);
    return;
  }

  const data = await res.json();
  fs.writeFileSync('scripts/figma-nodes.json', JSON.stringify(data, null, 2));
  console.log('Saved figma-nodes.json successfully!');
}

fetchNodes().catch((err) => console.error('Fatal error:', err));

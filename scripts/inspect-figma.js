import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'brt2r0MFeUUq4Rk9rZHFLl';

async function fetchFigma() {
  console.log('Fetching Figma file metadata...');
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
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
  console.log('File Name:', data.name);
  console.log('Last Modified:', data.lastModified);
  console.log('Version:', data.version);

  // Save full response to inspect
  fs.writeFileSync('scripts/figma-raw.json', JSON.stringify(data, null, 2));

  // Extract pages and top-level frames
  const pages = data.document.children.map((page) => ({
    id: page.id,
    name: page.name,
    childrenCount: page.children ? page.children.length : 0,
    frames: (page.children || []).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    })),
  }));

  console.log('\n--- PAGES & FRAMES ---');
  console.log(JSON.stringify(pages, null, 2));

  // Also check styles
  console.log('\n--- STYLES ---');
  console.log(JSON.stringify(data.styles, null, 2));
}

fetchFigma().catch((err) => console.error('Fatal error:', err));

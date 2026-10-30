import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'brt2r0MFeUUq4Rk9rZHFLl';

async function fetchIcons() {
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=37:517`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  const data = await res.json();
  const iconNode = data.nodes['37:517']?.document;
  if (!iconNode) {
    console.log('No icon node');
    return;
  }

  function getNames(n, acc = []) {
    if (n.name) acc.push(n.name);
    if (n.children) n.children.forEach((c) => getNames(c, acc));
    return acc;
  }

  const names = getNames(iconNode);
  console.log('Icons found in Terratern design system:', [...new Set(names)].slice(0, 50));
}

fetchIcons().catch(console.error);

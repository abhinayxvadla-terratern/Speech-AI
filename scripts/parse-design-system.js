import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma-nodes.json', 'utf8'));

function findNodes(node, predicate, results = []) {
  if (!node) return results;
  if (predicate(node)) results.push(node);
  if (node.children) {
    for (const child of node.children) {
      findNodes(child, predicate, results);
    }
  }
  return results;
}

function rgbaToHex(c) {
  if (!c) return 'none';
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

console.log('Available node IDs in response:', Object.keys(data.nodes));

// 1. Color node: "15:575"
const colorNode = data.nodes['15:575']?.document;
console.log('\n================ COLOR NODE ================');
if (colorNode) {
  // Find all text elements with color labels or hexes, and all rectangles/swatches
  const texts = findNodes(colorNode, (n) => n.type === 'TEXT').map((t) => t.characters);
  console.log('Color Texts/Labels found:', [...new Set(texts)].filter(Boolean).slice(0, 50));

  const fills = findNodes(colorNode, (n) => n.fills && n.fills.length > 0 && n.fills[0].color);
  const colorMap = {};
  fills.forEach((f) => {
    const hex = rgbaToHex(f.fills[0].color);
    if (!colorMap[hex]) {
      colorMap[hex] = { name: f.name, hex };
    }
  });
  console.log('Unique Hex Colors found in Color Frame:');
  console.table(Object.values(colorMap));
}

// 2. Type Scale node: "3:26"
const typeNode = data.nodes['3:26']?.document;
console.log('\n================ TYPE SCALE NODE ================');
if (typeNode) {
  const textNodes = findNodes(typeNode, (n) => n.type === 'TEXT');
  const typography = textNodes.map((t) => ({
    text: t.characters?.replace(/\n/g, ' ').slice(0, 35),
    fontFamily: t.style?.fontFamily,
    fontWeight: t.style?.fontWeight,
    fontSize: t.style?.fontSize,
    lineHeightPx: t.style?.lineHeightPx,
  }));
  console.table(typography.slice(0, 25));
}

// 3. Buttons node: "39:380"
const buttonNode = data.nodes['39:380']?.document;
console.log('\n================ BUTTONS NODE ================');
if (buttonNode) {
  const btnVariants = findNodes(buttonNode, (n) => n.type === 'COMPONENT' || n.name.toLowerCase().includes('button'));
  console.log('Button Variants found:', btnVariants.length);
  const sampleBtns = btnVariants.slice(0, 15).map((b) => ({
    name: b.name,
    cornerRadius: b.cornerRadius,
    bg: rgbaToHex(b.fills?.[0]?.color),
    padding: `${b.paddingTop || 0}px ${b.paddingRight || 0}px ${b.paddingBottom || 0}px ${b.paddingLeft || 0}px`,
  }));
  console.table(sampleBtns);
}

// 4. Corner Radius: "110:490"
const radiusNode = data.nodes['110:490']?.document;
console.log('\n================ CORNER RADIUS NODE ================');
if (radiusNode) {
  const radii = findNodes(radiusNode, (n) => n.cornerRadius !== undefined);
  radii.forEach((r) => {
    console.log(`Radius '${r.name}': ${r.cornerRadius}px`);
  });
}

// 5. Effects: "60:1304"
const effectsNode = data.nodes['60:1304']?.document;
console.log('\n================ EFFECTS / SHADOWS NODE ================');
if (effectsNode) {
  const fxNodes = findNodes(effectsNode, (n) => n.effects && n.effects.length > 0);
  fxNodes.forEach((n) => {
    console.log(`Effect '${n.name}':`, JSON.stringify(n.effects));
  });
}

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma-raw.json', 'utf8'));

// Recursive finder helper
function findNodes(node, predicate, results = []) {
  if (predicate(node)) {
    results.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      findNodes(child, predicate, results);
    }
  }
  return results;
}

function rgbaToHex(r, g, b, a = 1) {
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

console.log('--- 1. EXTRACTING COLOR SWATCHES ---');
const colorFrame = data.document.children[0].children.find((c) => c.name === 'Color');
const colorTokens = {};

if (colorFrame) {
  const rects = findNodes(colorFrame, (n) => n.fills && n.fills.length > 0 && n.fills[0].color);
  rects.forEach((r) => {
    const fill = r.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      const hex = rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a);
      colorTokens[r.name] = {
        name: r.name,
        hex: hex,
        opacity: fill.opacity ?? 1,
      };
    }
  });
}
console.log('Color Swatches Found:', Object.keys(colorTokens).length);

console.log('\n--- 2. EXTRACTING TYPE SCALE ---');
const typeFrame = data.document.children[0].children.find((c) => c.name === 'Type Scale');
const typographyTokens = [];

if (typeFrame) {
  const texts = findNodes(typeFrame, (n) => n.type === 'TEXT' && n.style);
  texts.forEach((t) => {
    typographyTokens.push({
      name: t.name,
      characters: t.characters?.slice(0, 30),
      fontFamily: t.style.fontFamily,
      fontWeight: t.style.fontWeight,
      fontSize: t.style.fontSize,
      lineHeightPx: t.style.lineHeightPx,
      letterSpacing: t.style.letterSpacing,
    });
  });
}

console.log('\n--- 3. EXTRACTING CORNER RADIUS ---');
const cornerRadiusFrame = data.document.children[0].children.find((c) => c.name === 'Corner Radius');
const cornerRadiuses = [];
if (cornerRadiusFrame) {
  const rects = findNodes(cornerRadiusFrame, (n) => n.cornerRadius !== undefined);
  rects.forEach((r) => {
    cornerRadiuses.push({
      name: r.name,
      cornerRadius: r.cornerRadius,
    });
  });
}

console.log('\n--- 4. EXTRACTING SPACING & SIZING ---');
const spacingFrame = data.document.children[0].children.find((c) => c.name === 'Size and Spacing');
const spacingTokens = [];
if (spacingFrame) {
  const nodes = findNodes(spacingFrame, (n) => n.absoluteBoundingBox);
  nodes.forEach((n) => {
    spacingTokens.push({
      name: n.name,
      width: n.absoluteBoundingBox?.width,
      height: n.absoluteBoundingBox?.height,
    });
  });
}

console.log('\n--- 5. EXTRACTING EFFECTS / SHADOWS ---');
const effectsFrame = data.document.children[0].children.find((c) => c.name === 'Effects');
const effectTokens = [];
if (effectsFrame) {
  const nodes = findNodes(effectsFrame, (n) => n.effects && n.effects.length > 0);
  nodes.forEach((n) => {
    effectTokens.push({
      name: n.name,
      effects: n.effects,
    });
  });
}

console.log('\n--- 6. EXTRACTING BUTTONS ---');
const buttonFrame = data.document.children[0].children.find((c) => c.name === 'Buttons');
const buttonComponents = [];
if (buttonFrame) {
  const btns = findNodes(buttonFrame, (n) => n.type === 'COMPONENT' || n.type === 'INSTANCE' || n.name.includes('Button'));
  btns.slice(0, 15).forEach((b) => {
    buttonComponents.push({
      name: b.name,
      type: b.type,
      cornerRadius: b.cornerRadius,
      paddingLeft: b.paddingLeft,
      paddingRight: b.paddingRight,
      paddingTop: b.paddingTop,
      paddingBottom: b.paddingBottom,
      itemSpacing: b.itemSpacing,
    });
  });
}

const tokensOutput = {
  colors: colorTokens,
  typography: typographyTokens,
  cornerRadiuses,
  spacing: spacingTokens.slice(0, 25),
  effects: effectTokens,
  buttons: buttonComponents,
};

fs.writeFileSync('scripts/design-tokens.json', JSON.stringify(tokensOutput, null, 2));
console.log('Saved design tokens to scripts/design-tokens.json');

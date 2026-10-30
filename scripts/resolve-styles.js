import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma-raw.json', 'utf8'));

// Build map of styleId -> style info
const styleMap = {};
for (const [id, s] of Object.entries(data.styles || {})) {
  styleMap[id] = s;
}

// Find nodes that reference these styles or have the style names
const resolvedStyles = {};

function scanNode(node) {
  if (node.styles) {
    for (const [type, styleId] of Object.entries(node.styles)) {
      if (styleMap[styleId]) {
        const sName = styleMap[styleId].name;
        if (!resolvedStyles[sName]) {
          resolvedStyles[sName] = {
            id: styleId,
            name: sName,
            styleType: styleMap[styleId].styleType,
            fill: node.fills?.[0],
            textStyle: node.style,
            effect: node.effects?.[0],
          };
        }
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      scanNode(child);
    }
  }
}

scanNode(data.document);

function rgbaToHex(c) {
  if (!c) return 'none';
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

const report = {};
for (const [name, info] of Object.entries(resolvedStyles)) {
  if (info.styleType === 'FILL') {
    report[name] = {
      hex: rgbaToHex(info.fill?.color),
      opacity: info.fill?.opacity ?? 1,
      type: info.fill?.type,
    };
  } else if (info.styleType === 'TEXT') {
    report[name] = {
      fontFamily: info.textStyle?.fontFamily,
      fontWeight: info.textStyle?.fontWeight,
      fontSize: info.textStyle?.fontSize,
      lineHeightPx: info.textStyle?.lineHeightPx,
      letterSpacing: info.textStyle?.letterSpacing,
    };
  } else {
    report[name] = info;
  }
}

console.log('--- RESOLVED STYLES FROM NODES ---');
console.log(JSON.stringify(report, null, 2));
fs.writeFileSync('scripts/resolved-styles.json', JSON.stringify(report, null, 2));

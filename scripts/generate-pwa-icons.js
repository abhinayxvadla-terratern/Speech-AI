import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard SVG (fills canvas with #00215C, subtle glow, central mic + wave icon)
const standardSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002D7A" />
      <stop offset="50%" stop-color="#00215C" />
      <stop offset="100%" stop-color="#001438" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#255CC1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#255CC1" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background with subtle brand curve -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <circle cx="256" cy="256" r="180" fill="none" stroke="#255CC1" stroke-width="3" stroke-opacity="0.25" stroke-dasharray="12 12" />

  <!-- Center Shield/Bubble Backdrop -->
  <g filter="url(#glow)">
    <!-- Central Microphone and Waves -->
    <!-- Sound Waves Left -->
    <path d="M148 200 C132 230 132 282 148 312" fill="none" stroke="#38BDF8" stroke-width="14" stroke-linecap="round" />
    <path d="M116 172 C92 216 92 296 116 340" fill="none" stroke="#255CC1" stroke-width="12" stroke-linecap="round" stroke-opacity="0.75" />

    <!-- Sound Waves Right -->
    <path d="M364 200 C380 230 380 282 364 312" fill="none" stroke="#38BDF8" stroke-width="14" stroke-linecap="round" />
    <path d="M396 172 C420 216 420 296 396 340" fill="none" stroke="#255CC1" stroke-width="12" stroke-linecap="round" stroke-opacity="0.75" />

    <!-- Mic Capsule Body -->
    <rect x="220" y="148" width="72" height="136" rx="36" fill="url(#accentGrad)" />
    <!-- Capsule inner accent line -->
    <rect x="228" y="156" width="56" height="60" rx="28" fill="#FFFFFF" fill-opacity="0.2" />

    <!-- Mic Cradle / Arc -->
    <path d="M192 236 C192 296 232 328 256 328 C280 328 320 296 320 236" fill="none" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" />

    <!-- Mic Stem & Base -->
    <path d="M256 328 L256 376" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" />
    <path d="M208 376 L304 376" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" />
  </g>

  <!-- AI Sparkle Indicator -->
  <g transform="translate(320, 130)">
    <path d="M24 0 L29 16 L45 21 L29 26 L24 42 L19 26 L3 21 L19 16 Z" fill="#38BDF8" />
  </g>
</svg>
`;

// 2. Maskable SVG (Full-bleed rectangle to edges, safe-zone emblem kept in central 65% area)
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002D7A" />
      <stop offset="50%" stop-color="#00215C" />
      <stop offset="100%" stop-color="#001438" />
    </linearGradient>
    <linearGradient id="accentGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#255CC1" />
    </linearGradient>
  </defs>

  <!-- Strict full-bleed rectangular background for maskable canvas -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />

  <!-- Content scaled and centered within the 65% safe circle zone -->
  <g transform="translate(56, 56) scale(0.78)">
    <!-- Central Microphone and Waves -->
    <!-- Sound Waves Left -->
    <path d="M148 200 C132 230 132 282 148 312" fill="none" stroke="#38BDF8" stroke-width="16" stroke-linecap="round" />
    <path d="M116 172 C92 216 92 296 116 340" fill="none" stroke="#255CC1" stroke-width="14" stroke-linecap="round" stroke-opacity="0.8" />

    <!-- Sound Waves Right -->
    <path d="M364 200 C380 230 380 282 364 312" fill="none" stroke="#38BDF8" stroke-width="16" stroke-linecap="round" />
    <path d="M396 172 C420 216 420 296 396 340" fill="none" stroke="#255CC1" stroke-width="14" stroke-linecap="round" stroke-opacity="0.8" />

    <!-- Mic Capsule Body -->
    <rect x="220" y="148" width="72" height="136" rx="36" fill="url(#accentGradMask)" />
    <!-- Capsule inner accent line -->
    <rect x="228" y="156" width="56" height="60" rx="28" fill="#FFFFFF" fill-opacity="0.25" />

    <!-- Mic Cradle / Arc -->
    <path d="M192 236 C192 296 232 328 256 328 C280 328 320 296 320 236" fill="none" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" />

    <!-- Mic Stem & Base -->
    <path d="M256 328 L256 376" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" />
    <path d="M208 376 L304 376" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" />

    <!-- AI Sparkle Indicator -->
    <g transform="translate(320, 130)">
      <path d="M24 0 L29 16 L45 21 L29 26 L24 42 L19 26 L3 21 L19 16 Z" fill="#38BDF8" />
    </g>
  </g>
</svg>
`;

async function generate() {
  console.log('Generating PWA icons with sharp...');

  // 1. Generate 512x512 standard
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // 2. Generate 192x192 standard
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // 3. Generate 512x512 maskable
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Generated public/maskable-icon-512x512.png');

  // 4. Generate apple-touch-icon 180x180
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // 5. Generate favicon 64x64 and 32x32
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'pwa-64x64.png'));

  // 6. Save raw standard SVG as favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg.trim());
  console.log('Generated public/favicon.svg');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

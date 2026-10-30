import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
const emblemPath = path.join(publicDir, 'terratern-emblem.png');

async function buildIcons() {
  console.log('Generating PWA and App icons from TerraTern emblem...');

  // 1. First get trimmed emblem buffer
  const trimmedEmblemBuffer = await sharp(emblemPath)
    .trim()
    .toBuffer();

  // 2. Generate standard 512x512 icon
  // White/subtle light background with clean padding
  const emblem512Resized = await sharp(trimmedEmblemBuffer)
    .resize(410, 410, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 250, g: 251, b: 255, alpha: 1 } // #FAFBFF
    }
  })
    .composite([{ input: emblem512Resized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // 3. Generate standard 192x192 icon
  const emblem192Resized = await sharp(trimmedEmblemBuffer)
    .resize(154, 154, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 250, g: 251, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: emblem192Resized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // 4. Generate maskable 512x512 icon (Safe zone is center 65-70% = 350px)
  const emblemMaskableResized = await sharp(trimmedEmblemBuffer)
    .resize(350, 350, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 250, g: 251, b: 255, alpha: 1 } // #FAFBFF
    }
  })
    .composite([{ input: emblemMaskableResized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Generated public/maskable-icon-512x512.png');

  // 5. Generate apple-touch-icon 180x180
  const emblem180Resized = await sharp(trimmedEmblemBuffer)
    .resize(144, 144, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 250, g: 251, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: emblem180Resized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // 6. Generate favicon 64x64
  await sharp(trimmedEmblemBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-64x64.png'));
  console.log('Generated public/pwa-64x64.png');

  // 7. Generate favicon.png 32x32
  await sharp(trimmedEmblemBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated public/favicon.png');

  console.log('All TerraTern PWA icons built successfully!');
}

buildIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});

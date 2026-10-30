import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const userImagePath = 'C:/Users/abhin/.gemini/antigravity/brain/12484f77-2142-43c9-834d-fbc14dade85a/.user_uploaded/media_1793338644714_1fcd290c.png';
const assetsDir = path.resolve(process.cwd(), 'src/assets');
const publicDir = path.resolve(process.cwd(), 'public');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

async function processImages() {
  console.log('Processing user uploaded logo...');

  // 1. Full trimmed logo (emblem + text)
  const trimmedFullBuffer = await sharp(userImagePath)
    .trim()
    .png()
    .toBuffer();

  await sharp(trimmedFullBuffer).toFile(path.join(assetsDir, 'logo-full.png'));
  await sharp(trimmedFullBuffer).toFile(path.join(publicDir, 'logo-full.png'));
  console.log('Saved logo-full.png');

  // 2. Emblem only (rows 0 to 434 of trimmed image)
  const trimmedMeta = await sharp(trimmedFullBuffer).metadata();
  const emblemBuffer = await sharp(trimmedFullBuffer)
    .extract({
      left: 0,
      top: 0,
      width: trimmedMeta.width,
      height: 434
    })
    .trim()
    .png()
    .toBuffer();

  await sharp(emblemBuffer).toFile(path.join(assetsDir, 'logo-emblem.png'));
  await sharp(emblemBuffer).toFile(path.join(assetsDir, 'mascot.png'));
  await sharp(emblemBuffer).toFile(path.join(publicDir, 'logo-emblem.png'));
  console.log('Saved logo-emblem.png and mascot.png');

  // 3. Avatar Mascot for chat turns (square 128x128 with subtle padding, transparent background)
  await sharp(emblemBuffer)
    .resize(112, 112, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(assetsDir, 'avatar-mascot.png'));
  console.log('Saved avatar-mascot.png (128x128)');

  // 4. PWA standard icon 192x192 with #00215C background
  // Embed the emblem centered inside a rounded container with brand styling
  const pwa192Buffer = await sharp(emblemBuffer)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: '#FAFBFF'
    }
  })
    .composite([
      { input: pwa192Buffer, gravity: 'center' }
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  // 5. PWA standard icon 512x512
  const pwa512Buffer = await sharp(emblemBuffer)
    .resize(380, 380, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#FAFBFF'
    }
  })
    .composite([
      { input: pwa512Buffer, gravity: 'center' }
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  // 6. Maskable 512x512 (Safe-zone 65% in center with solid brand background #00215C)
  const maskableEmblem = await sharp(emblemBuffer)
    .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#00215C'
    }
  })
    .composite([
      { input: maskableEmblem, gravity: 'center' }
    ])
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Saved public/maskable-icon-512x512.png');

  // 7. Apple touch icon 180x180
  const appleEmblem = await sharp(emblemBuffer)
    .resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: '#FAFBFF'
    }
  })
    .composite([
      { input: appleEmblem, gravity: 'center' }
    ])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved public/apple-touch-icon.png');

  // 8. Favicon 64x64 & 32x32
  await sharp(emblemBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-64x64.png'));

  console.log('Logo processing complete!');
}

processImages().catch(err => {
  console.error('Image processing failed:', err);
  process.exit(1);
});

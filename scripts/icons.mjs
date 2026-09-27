// Renders every app icon from the SVG sources, so the artwork lives in one place.
//
//   public/icons/icon.svg              rounded tile: favicon, header logo, PWA "any"
//   public/icons/icon-maskable.svg     full bleed: PWA "maskable", iOS home screen
//   public/icons/icon-monochrome.svg   shape only: PWA "monochrome"
//   resources/adaptive-*.svg           Android adaptive icon layers (108 dp canvas)
//
// Run with `npm run icons`. The Android part is skipped until android/ exists.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public', 'icons');
const res = join(root, 'resources');
const BG = '#1b2230';

const svg = (p) => readFileSync(p);
async function png(src, size, out, { circle = false } = {}) {
  let img = sharp(svg(src), { density: Math.ceil((72 * size) / 512) * 2 }).resize(size, size);
  if (circle) {
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`
    );
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]);
  }
  mkdirSync(dirname(out), { recursive: true });
  await img.png({ compressionLevel: 9 }).toFile(out);
}

// PWA and browser
await png(join(pub, 'icon.svg'), 192, join(pub, 'icon-192.png'));
await png(join(pub, 'icon.svg'), 512, join(pub, 'icon-512.png'));
await png(join(pub, 'icon.svg'), 32, join(pub, 'favicon-32.png'));
await png(join(pub, 'icon-maskable.svg'), 192, join(pub, 'icon-maskable-192.png'));
await png(join(pub, 'icon-maskable.svg'), 512, join(pub, 'icon-maskable-512.png'));
await png(join(pub, 'icon-maskable.svg'), 180, join(pub, 'apple-touch-icon.png'));
await png(join(pub, 'icon-monochrome.svg'), 512, join(pub, 'icon-monochrome-512.png'));
console.log('PWA icons written to public/icons');

// Android
const main = join(root, 'android', 'app', 'src', 'main', 'res');
if (existsSync(main)) {
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(densities)) {
    const dir = join(main, `mipmap-${d}`);
    await png(join(pub, 'icon.svg'), 48 * k, join(dir, 'ic_launcher.png'));
    await png(join(pub, 'icon-maskable.svg'), 48 * k, join(dir, 'ic_launcher_round.png'), { circle: true });
    await png(join(res, 'adaptive-foreground.svg'), 108 * k, join(dir, 'ic_launcher_foreground.png'));
    await png(join(res, 'adaptive-monochrome.svg'), 108 * k, join(dir, 'ic_launcher_monochrome.png'));
    // Android 12+ splash: the launcher foreground on the icon colour (240 dp canvas, 160 dp safe).
    await png(join(res, 'adaptive-foreground.svg'), 240 * k, join(main, `drawable-${d}`, 'splash_icon.png'));
  }
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`;
  mkdirSync(join(main, 'mipmap-anydpi-v26'), { recursive: true });
  writeFileSync(join(main, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptive);
  writeFileSync(join(main, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptive);
  mkdirSync(join(main, 'values'), { recursive: true });
  writeFileSync(
    join(main, 'values', 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BG}</color>
</resources>
`
  );
  console.log('Android launcher and splash icons written to android/app/src/main/res');
}

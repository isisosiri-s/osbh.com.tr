// Basliksiz-3.png (orijinal favicon, 50x50) -> favicon-16/32/apple-touch-icon
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'kaynak', 'gorseller', 'Basliksiz-3-f94f8be53b.png');
const OUT_DIR = path.join(__dirname, '..', 'site', 'public');

const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base64In = fs.readFileSync(SRC).toString('base64');

  for (const { name, size } of SIZES) {
    const dataUrl = await page.evaluate(
      async ({ base64In, size }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${base64In}`;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, size, size);
        return canvas.toDataURL('image/png');
      },
      { base64In, size }
    );
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT_DIR, name), buf);
    console.log(`✓ ${name}`);
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUT_DIR, 'site.webmanifest'),
    JSON.stringify(
      {
        name: 'Online Sağlık Bilişim Hizmetleri A.Ş.',
        short_name: 'OSBH',
        icons: [
          { src: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
          { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
      },
      null,
      2
    )
  );
  console.log('✓ site.webmanifest');
})();

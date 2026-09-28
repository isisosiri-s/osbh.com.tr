// PNG/JPG -> WebP dönüştürücü (sharp native binary bu makinede Application Control
// politikası tarafından engellendiği için Chromium canvas API'si kullanılıyor).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'kaynak', 'gorseller');
const OUT_DIR = path.join(__dirname, '..', 'site', 'public', 'images');
fs.mkdirSync(OUT_DIR, { recursive: true });

const MAX_DIM = 1600;
const QUALITY = 0.82;

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const files = fs.readdirSync(SRC_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));

  let totalOrig = 0;
  let totalNew = 0;
  const mapping = {};

  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const mime = MIME[ext];
    const base64In = fs.readFileSync(srcPath).toString('base64');
    const outName = file.replace(/\.(png|jpe?g)$/i, '.webp');
    const outPath = path.join(OUT_DIR, outName);

    const dataUrl = await page.evaluate(
      async ({ base64In, mime, maxDim, quality }) => {
        const img = new Image();
        img.src = `data:${mime};base64,${base64In}`;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/webp', quality);
      },
      { base64In, mime, maxDim: MAX_DIM, quality: QUALITY }
    );

    const base64Out = dataUrl.split(',')[1];
    const buf = Buffer.from(base64Out, 'base64');
    fs.writeFileSync(outPath, buf);

    const origSize = fs.statSync(srcPath).size;
    const newSize = buf.length;
    totalOrig += origSize;
    totalNew += newSize;
    mapping[file] = outName;
    console.log(
      `${file} -> ${outName}: ${(origSize / 1024).toFixed(0)}KB -> ${(newSize / 1024).toFixed(0)}KB`
    );
  }

  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, '..', 'kaynak', 'image-webp-mapping.json'),
    JSON.stringify(mapping, null, 2)
  );

  console.log(`\nToplam: ${(totalOrig / 1024 / 1024).toFixed(2)}MB -> ${(totalNew / 1024 / 1024).toFixed(2)}MB`);
})();

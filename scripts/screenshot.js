const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'kaynak', 'onizleme');
require('fs').mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { url: 'http://localhost:4321/', name: 'home' },
  { url: 'http://localhost:4321/magaza/', name: 'magaza' },
  { url: 'http://localhost:4321/urun/business-flex-usbs/', name: 'urun' },
  { url: 'http://localhost:4321/iletisim/', name: 'iletisim' },
  { url: 'http://localhost:4321/gizlilik-politikasi/', name: 'legal' },
  { url: 'http://localhost:4321/bireysel-usbs-paketleri/', name: 'paket-bireysel' },
];

(async () => {
  const browser = await chromium.launch();
  for (const { url, name } of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT_DIR, `${name}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(OUT_DIR, `${name}-mobile.png`), fullPage: true });
    await page.close();
    console.log(`✓ ${name}`);
  }
  await browser.close();
})();

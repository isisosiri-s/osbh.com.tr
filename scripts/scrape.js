// OSBH.com.tr içerik/görsel toplama script'i
// Kullanım: node scripts/scrape.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = 'https://osbh.com.tr';
const OUT_DIR = path.join(__dirname, '..', 'kaynak');
const PAGES_DIR = path.join(OUT_DIR, 'sayfalar');
const IMG_DIR = path.join(OUT_DIR, 'gorseller');

for (const d of [OUT_DIR, PAGES_DIR, IMG_DIR]) {
  fs.mkdirSync(d, { recursive: true });
}

const REAL_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// --- URL envanteri (brief'ten) ---
const MARKETING = [
  '/', '/usbs-ozellikleri/', '/uzaktan-saglik-hizmet-paketleri/',
  '/bireysel-usbs-paketleri/', '/kurumsal-usbs-paketleri/', '/osgb-usbs-paketleri/',
  '/hizmetlerimiz/', '/kurumsal/', '/iletisim/',
  '/bilgi-kalite-guvenligi-yonetim-politikasi/', '/blog/',
];
const PRODUCTS = [
  '/urun/workplace-flex-usbs/', '/urun/workplace-smart-usbs/', '/urun/workplace-base-usbs/',
  '/urun/business-flex-usbs/', '/urun/business-smart-usbs/', '/urun/business-base-usbs/',
  '/urun/bireysel-performance-usbs/', '/urun/bireysel-advantage-usbs/', '/urun/bireysel-economy-usbs/',
];
const BLOG = [
  '/isyeri-hekimligi-e-recete-programi/',
  '/uzaktan-online-saglik-hizmeti-vermeye-baslayin-2023/',
  '/uzaktan-saglik-hizmeti-vermek-icin-dikkat-edilecekler/',
  '/usbs-kayitli-firma/',
  '/uzaktan-saglik-hizmetlerinin-sunumu/',
];
const CATEGORY = ['/category/uzaktan-saglik/'];
const LEGAL = [
  '/mesafeli-satis-sozlesmesi/', '/iptal-ve-iade/', '/cerez-politikasi/',
  '/uyelik-sozlesmesi/', '/gizlilik-politikasi/', '/kisisel-verilerin-korunmasi-kanunu/',
];
const WOO_FUNCTIONAL = [
  '/magaza/', '/sepet/', '/odeme/', '/hesabim/', '/wishlist/', '/compare/', '/bilgi/',
];
// ATLA: /portfolio/*, /banners/  (kullanıcı talimatıyla tamamen atlanıyor)

const ALL_URLS = [
  ...MARKETING.map((u) => ({ url: u, group: 'marketing' })),
  ...PRODUCTS.map((u) => ({ url: u, group: 'product' })),
  ...BLOG.map((u) => ({ url: u, group: 'blog' })),
  ...CATEGORY.map((u) => ({ url: u, group: 'category' })),
  ...LEGAL.map((u) => ({ url: u, group: 'legal' })),
  ...WOO_FUNCTIONAL.map((u) => ({ url: u, group: 'woo-functional' })),
];

function slugify(urlPath) {
  if (urlPath === '/') return 'home';
  return urlPath.replace(/^\/|\/$/g, '').replace(/\//g, '__');
}

function absUrl(src, pageUrl) {
  try {
    return new URL(src, pageUrl).toString();
  } catch {
    return null;
  }
}

const downloadedImages = new Map(); // absUrl -> local relative path

async function downloadImage(page, absoluteUrl) {
  if (!absoluteUrl || absoluteUrl.startsWith('data:')) return null;
  if (downloadedImages.has(absoluteUrl)) return downloadedImages.get(absoluteUrl);
  try {
    const resp = await page.context().request.get(absoluteUrl, {
      headers: { 'User-Agent': REAL_UA },
      timeout: 30000,
    });
    if (!resp.ok()) {
      console.warn(`  ! görsel indirilemedi (${resp.status()}): ${absoluteUrl}`);
      return null;
    }
    const buf = await resp.body();
    const urlObj = new URL(absoluteUrl);
    let ext = path.extname(urlObj.pathname);
    if (!ext || ext.length > 5) ext = '.jpg';
    const hash = crypto.createHash('md5').update(absoluteUrl).digest('hex').slice(0, 10);
    const baseName = path.basename(urlObj.pathname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'img';
    const fileName = `${baseName}-${hash}${ext}`;
    const localPath = path.join(IMG_DIR, fileName);
    fs.writeFileSync(localPath, buf);
    const rel = `gorseller/${fileName}`;
    downloadedImages.set(absoluteUrl, rel);
    return rel;
  } catch (e) {
    console.warn(`  ! görsel hata: ${absoluteUrl} -> ${e.message}`);
    return null;
  }
}

async function scrapePage(browser, entry) {
  const pageUrl = BASE + entry.url;
  const slug = slugify(entry.url);
  console.log(`\n=== [${entry.group}] ${pageUrl} ===`);

  const context = await browser.newContext({
    userAgent: REAL_UA,
    viewport: { width: 1440, height: 900 },
    locale: 'tr-TR',
  });
  const page = await context.newPage();

  let ok = false;
  let lastErr = null;
  for (const attempt of [
    { waitUntil: 'load', timeout: 45000 },
    { waitUntil: 'networkidle', timeout: 60000 },
  ]) {
    try {
      const resp = await page.goto(pageUrl, attempt);
      if (resp && resp.status() >= 400) {
        lastErr = new Error(`HTTP ${resp.status()}`);
        continue;
      }
      await page.waitForTimeout(1500); // Slider Revolution / JS içerik için ek bekleme
      ok = true;
      break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!ok) {
    console.warn(`  !! sayfa alınamadı: ${pageUrl} — ${lastErr && lastErr.message}`);
    await context.close();
    return { entry, error: String(lastErr && lastErr.message) };
  }

  const data = await page.evaluate(() => {
    function meta(name) {
      const el =
        document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);
      return el ? el.getAttribute('content') : null;
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    const favicon =
      document.querySelector('link[rel="icon"]') ||
      document.querySelector('link[rel="shortcut icon"]') ||
      document.querySelector('link[rel="apple-touch-icon"]');

    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach((el) => {
      og[el.getAttribute('property')] = el.getAttribute('content');
    });
    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach((el) => {
      twitter[el.getAttribute('name')] = el.getAttribute('content');
    });

    const jsonLd = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        jsonLd.push(JSON.parse(el.textContent));
      } catch {
        jsonLd.push({ raw: el.textContent });
      }
    });

    const h1 = Array.from(document.querySelectorAll('h1')).map((e) => e.textContent.trim()).filter(Boolean);
    const h2 = Array.from(document.querySelectorAll('h2')).map((e) => e.textContent.trim()).filter(Boolean);
    const h3 = Array.from(document.querySelectorAll('h3')).map((e) => e.textContent.trim()).filter(Boolean);

    // Gövde metni: script/style hariç, görünür metin
    function isVisible(el) {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }
    let bodyText = '';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const seen = new Set();
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(tag)) continue;
      if (!isVisible(parent)) continue;
      const t = node.textContent.replace(/\s+/g, ' ').trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        bodyText += t + '\n';
      }
    }

    // img src
    const images = Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src'),
      srcset: img.getAttribute('srcset'),
      alt: img.getAttribute('alt') || '',
    }));

    // CSS background-image (computed style) - tüm elementler
    const bgSet = new Set();
    document.querySelectorAll('*').forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const matches = bg.match(/url\(["']?([^"')]+)["']?\)/g);
        if (matches) {
          matches.forEach((m) => {
            const u = m.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            bgSet.add(u);
          });
        }
      }
    });

    // Links
    const internal = new Set();
    const external = new Set();
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        const u = new URL(href, location.href);
        if (u.hostname === location.hostname) internal.add(u.pathname);
        else external.add(u.toString());
      } catch {}
    });

    // İletişim formu action / mailto tespiti
    const forms = Array.from(document.querySelectorAll('form')).map((f) => ({
      action: f.getAttribute('action'),
      method: f.getAttribute('method'),
      id: f.getAttribute('id'),
      fields: Array.from(f.querySelectorAll('input,textarea,select')).map(
        (i) => i.getAttribute('name') || i.getAttribute('id')
      ),
    }));

    // Google Maps iframe
    const mapIframes = Array.from(document.querySelectorAll('iframe[src*="google.com/maps"]')).map((f) =>
      f.getAttribute('src')
    );

    // GA / GTM / FB pixel tespiti (script src veya inline text içinde)
    const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'));
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).map((s) => s.textContent).join('\n');
    const trackingHints = {
      gtagOrAnalytics: scriptSrcs.filter((s) => /gtag|analytics|googletagmanager/i.test(s || '')),
      gtmId: (inlineScripts.match(/GTM-[A-Z0-9]+/g) || []),
      gaId: (inlineScripts.match(/G-[A-Z0-9]+/g) || inlineScripts.match(/UA-\d+-\d+/g) || []),
      fbPixel: /fbq\(/.test(inlineScripts),
      searchConsoleVerification: (() => {
        const el = document.querySelector('meta[name="google-site-verification"]');
        return el ? el.getAttribute('content') : null;
      })(),
    };

    return {
      title: document.title,
      metaDescription: meta('description'),
      canonical: canonical ? canonical.getAttribute('href') : null,
      favicon: favicon ? favicon.getAttribute('href') : null,
      og,
      twitter,
      jsonLd,
      h1, h2, h3,
      bodyText: bodyText.trim(),
      images,
      backgroundImageUrls: Array.from(bgSet),
      links: { internal: Array.from(internal), external: Array.from(external) },
      forms,
      mapIframes,
      trackingHints,
      fullHtml: document.documentElement.outerHTML,
    };
  });

  // Görselleri indir
  const imageRecords = [];
  for (const img of data.images) {
    const abs = absUrl(img.src, pageUrl);
    const local = await downloadImage(page, abs);
    imageRecords.push({ src: img.src, absoluteUrl: abs, alt: img.alt, localPath: local });
  }
  const bgImageRecords = [];
  for (const bgUrl of data.backgroundImageUrls) {
    const abs = absUrl(bgUrl, pageUrl);
    const local = await downloadImage(page, abs);
    bgImageRecords.push({ src: bgUrl, absoluteUrl: abs, localPath: local });
  }
  let faviconRecord = null;
  if (data.favicon) {
    const abs = absUrl(data.favicon, pageUrl);
    const local = await downloadImage(page, abs);
    faviconRecord = { absoluteUrl: abs, localPath: local };
  }

  const record = {
    url: pageUrl,
    path: entry.url,
    group: entry.group,
    fetchedAt: new Date().toISOString(),
    title: data.title,
    metaDescription: data.metaDescription,
    canonical: data.canonical,
    og: data.og,
    twitter: data.twitter,
    jsonLd: data.jsonLd,
    h1: data.h1,
    h2: data.h2,
    h3: data.h3,
    bodyText: data.bodyText,
    images: imageRecords,
    backgroundImages: bgImageRecords,
    favicon: faviconRecord,
    links: data.links,
    forms: data.forms,
    mapIframes: data.mapIframes,
    trackingHints: data.trackingHints,
  };

  fs.writeFileSync(path.join(PAGES_DIR, `${slug}.json`), JSON.stringify(record, null, 2), 'utf-8');
  fs.writeFileSync(path.join(PAGES_DIR, `${slug}.html`), data.fullHtml, 'utf-8');

  const md = `# ${data.title || slug}

- **URL**: ${pageUrl}
- **Grup**: ${entry.group}
- **Canonical**: ${data.canonical || '-'}
- **Meta description**: ${data.metaDescription || '-'}
- **OG title**: ${data.og['og:title'] || '-'}
- **OG description**: ${data.og['og:description'] || '-'}
- **OG image**: ${data.og['og:image'] || '-'}

## H1
${data.h1.map((h) => `- ${h}`).join('\n') || '(yok)'}

## H2
${data.h2.map((h) => `- ${h}`).join('\n') || '(yok)'}

## H3
${data.h3.map((h) => `- ${h}`).join('\n') || '(yok)'}

## Gövde Metni
${data.bodyText}

## Görseller (${imageRecords.length})
${imageRecords.map((i) => `- ${i.localPath || '(indirilemedi)'} — alt: "${i.alt}" — kaynak: ${i.absoluteUrl}`).join('\n')}

## Arka Plan Görselleri (${bgImageRecords.length})
${bgImageRecords.map((i) => `- ${i.localPath || '(indirilemedi)'} — kaynak: ${i.absoluteUrl}`).join('\n')}

## İç Bağlantılar
${data.links.internal.map((l) => `- ${l}`).join('\n')}

## Formlar
${JSON.stringify(data.forms, null, 2)}

## Google Maps
${data.mapIframes.join('\n') || '(yok)'}

## İzleme Kodları (tespit)
${JSON.stringify(data.trackingHints, null, 2)}
`;
  fs.writeFileSync(path.join(PAGES_DIR, `${slug}.md`), md, 'utf-8');

  console.log(`  ✓ kaydedildi: ${slug} (${imageRecords.length} img, ${bgImageRecords.length} bg-img)`);

  await context.close();
  return { entry, slug, ok: true, imageCount: imageRecords.length, bgImageCount: bgImageRecords.length };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const entry of ALL_URLS) {
    const r = await scrapePage(browser, entry);
    results.push(r);
  }
  await browser.close();

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        totalPages: ALL_URLS.length,
        totalImagesDownloaded: downloadedImages.size,
        results,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log('\n\n=== ÖZET ===');
  console.log(`Toplam sayfa: ${ALL_URLS.length}`);
  console.log(`Başarılı: ${results.filter((r) => r.ok).length}`);
  console.log(`Hatalı: ${results.filter((r) => !r.ok).length}`);
  console.log(`İndirilen benzersiz görsel: ${downloadedImages.size}`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('\nHatalı sayfalar:');
    failed.forEach((f) => console.log(`  - ${f.entry.url}: ${f.error}`));
  }
})();

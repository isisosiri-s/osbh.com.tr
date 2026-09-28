// kaynak/sayfalar/urun__*.json -> site/src/content/products/*.md
const fs = require('fs');
const path = require('path');

const KAYNAK = path.join(__dirname, '..', 'kaynak');
const PAGES_DIR = path.join(KAYNAK, 'sayfalar');
const OUT_DIR = path.join(__dirname, '..', 'site', 'src', 'content', 'products');
fs.mkdirSync(OUT_DIR, { recursive: true });

const webpMapping = JSON.parse(fs.readFileSync(path.join(KAYNAK, 'image-webp-mapping.json'), 'utf-8'));
const urlToLocal = {};
fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json')).forEach((f) => {
  const j = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf-8'));
  [...j.images, ...j.backgroundImages].forEach((img) => {
    if (img.absoluteUrl && img.localPath) {
      const webp = webpMapping[path.basename(img.localPath)];
      if (webp) urlToLocal[img.absoluteUrl] = '/images/' + webp;
    }
  });
});
function resolveImage(absoluteUrl) {
  if (!absoluteUrl) return null;
  if (urlToLocal[absoluteUrl]) return urlToLocal[absoluteUrl];
  const base = path.basename(absoluteUrl).replace(/-\d+x\d+(?=\.\w+$)/, '');
  const found = Object.keys(urlToLocal).find((u) => path.basename(u).replace(/-\d+x\d+(?=\.\w+$)/, '') === base);
  return found ? urlToLocal[found] : null;
}

const SECTION_HEADERS = [
  'DOKTOR PROFİLİ',
  'ONLINE MUAYENE',
  'MÜŞTERİ HİZMETLERİ',
  'FİNANSAL HİZMETLER',
  'SEO/PAZARLAMA HİZMETLERİ',
];

const PRODUCTS = [
  { slug: 'workplace-flex-usbs', group: 'osgb' },
  { slug: 'workplace-smart-usbs', group: 'osgb' },
  { slug: 'workplace-base-usbs', group: 'osgb' },
  { slug: 'business-flex-usbs', group: 'kurumsal' },
  { slug: 'business-smart-usbs', group: 'kurumsal' },
  { slug: 'business-base-usbs', group: 'kurumsal' },
  { slug: 'bireysel-performance-usbs', group: 'bireysel' },
  { slug: 'bireysel-advantage-usbs', group: 'bireysel' },
  { slug: 'bireysel-economy-usbs', group: 'bireysel' },
];

function yamlStr(v) {
  return JSON.stringify(String(v == null ? '' : v));
}

function parseFeatures(bodyText) {
  const startMatch = bodyText.match(/Reviews \(\d+\)\n/);
  if (!startMatch) return { activation: null, sections: [] };
  const startIdx = startMatch.index + startMatch[0].length;
  const endIdx = bodyText.indexOf('\nReviews\n', startIdx);
  const block = bodyText.slice(startIdx, endIdx === -1 ? undefined : endIdx);
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

  let i = 0;
  let activation = null;
  if (lines[0] === 'Aktivasyon Süreci') {
    i = 1;
    if (lines[i] && !SECTION_HEADERS.includes(lines[i])) {
      activation = lines[i];
      i++;
    }
  }

  const sections = [];
  let current = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (SECTION_HEADERS.includes(line)) {
      current = { title: line, items: [] };
      sections.push(current);
    } else if (current) {
      const parts = line.split(' – ');
      if (parts.length === 2) {
        current.items.push({ name: parts[0].trim(), value: parts[1].trim() });
      } else {
        current.items.push({ name: line, value: null });
      }
    }
  }
  return { activation, sections };
}

function extractPrice(bodyText) {
  const discountMatch = bodyText.match(/-(\d+)%/);
  const priceMatch = bodyText.match(/([\d.,]+)\s*\n([\d.,]+)\s*\nÜcretler/);
  if (priceMatch) {
    return {
      originalPrice: priceMatch[1],
      price: priceMatch[2],
      discountPercent: discountMatch ? discountMatch[1] : null,
    };
  }
  const singleMatch = bodyText.match(/([\d.,]+)\s*\nÜcretler/);
  return {
    originalPrice: null,
    price: singleMatch ? singleMatch[1] : null,
    discountPercent: null,
  };
}

const CATEGORY_LABEL = {
  osgb: 'OSGB USBS Hizmetleri',
  kurumsal: 'Kurumsal USBS Hizmetleri',
  bireysel: 'Bireysel USBS Hizmetleri',
};

for (const { slug, group } of PRODUCTS) {
  const j = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, `urun__${slug}.json`), 'utf-8'));
  const { activation, sections } = parseFeatures(j.bodyText);
  const { price, originalPrice, discountPercent } = extractPrice(j.bodyText);
  const image = resolveImage(j.og['og:image']);

  const noteMatch = j.bodyText.match(/Ücretler 12 aylık[^\n]*\n[^\n]*\n[^\n]*\./);

  const frontmatterObj = {
    title: j.h1[0] || j.title,
    pageTitle: j.title,
    description: j.metaDescription,
    canonical: j.canonical || j.url,
    slug,
    group,
    categoryLabel: CATEGORY_LABEL[group],
    price,
    originalPrice,
    discountPercent,
    activation,
    image,
    note: noteMatch ? noteMatch[0].replace(/\n/g, ' ') : null,
  };

  const yamlLines = ['---'];
  for (const [k, v] of Object.entries(frontmatterObj)) {
    if (v === null || v === undefined) continue;
    yamlLines.push(`${k}: ${yamlStr(v)}`);
  }
  yamlLines.push('sections:');
  for (const sec of sections) {
    yamlLines.push(`  - title: ${yamlStr(sec.title)}`);
    yamlLines.push(`    items:`);
    for (const item of sec.items) {
      yamlLines.push(`      - name: ${yamlStr(item.name)}`);
      yamlLines.push(`        value: ${item.value === null ? 'true' : yamlStr(item.value)}`);
    }
  }
  yamlLines.push('---', '');

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), yamlLines.join('\n'), 'utf-8');
  console.log(`✓ ${slug}.md — fiyat ${originalPrice || ''} -> ${price}, ${sections.length} bölüm, görsel: ${image}`);
}

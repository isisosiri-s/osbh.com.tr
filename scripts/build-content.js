// kaynak/sayfalar/*.json -> site/src/content/pages/*.md (yasal sayfalar + blog yazıları)
const fs = require('fs');
const path = require('path');

const KAYNAK = path.join(__dirname, '..', 'kaynak');
const PAGES_DIR = path.join(KAYNAK, 'sayfalar');
const OUT_DIR = path.join(__dirname, '..', 'site', 'src', 'content', 'pages');
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- URL -> webp yerel yol haritası oluştur ---
const webpMapping = JSON.parse(
  fs.readFileSync(path.join(KAYNAK, 'image-webp-mapping.json'), 'utf-8')
); // { "orijinal-dosya.jpg": "orijinal-dosya.webp" }

const urlToLocal = {}; // absoluteUrl -> "/images/xxx.webp"
const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json'));
files.forEach((f) => {
  const j = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf-8'));
  [...j.images, ...j.backgroundImages].forEach((img) => {
    if (img.absoluteUrl && img.localPath) {
      const base = path.basename(img.localPath); // gorseller/xxx.jpg -> xxx.jpg
      const webp = webpMapping[base];
      if (webp) urlToLocal[img.absoluteUrl] = '/images/' + webp;
    }
  });
  if (j.favicon && j.favicon.absoluteUrl && j.favicon.localPath) {
    const base = path.basename(j.favicon.localPath);
    const webp = webpMapping[base];
    if (webp) urlToLocal[j.favicon.absoluteUrl] = '/images/' + webp;
  }
});

function resolveImage(absoluteUrl) {
  if (!absoluteUrl) return null;
  if (urlToLocal[absoluteUrl]) return urlToLocal[absoluteUrl];
  // Boyut varyasyonlarını (ör. -500x350) yok sayıp taban ada göre eşleştirmeyi dene
  const base = path.basename(absoluteUrl).replace(/-\d+x\d+(?=\.\w+$)/, '');
  const found = Object.keys(urlToLocal).find((u) => path.basename(u).replace(/-\d+x\d+(?=\.\w+$)/, '') === base);
  return found ? urlToLocal[found] : null;
}

const END_ANCHORS = [
  'Online Sağlık Bilişim\nHizmetlerimiz\nAktif USBS Listesi',
  'Facebook\nTwitter\nPinterest\nLinkedIn\nTelegram',
  'Close\nSon Makaleler',
  'Bir yanıt yazın',
  'Bir cevap yazın',
];
const START_ANCHOR = '0.00\n₺\n';

function cleanBody(bodyText, h1, h2, h3) {
  let text = bodyText;
  const startIdx = text.indexOf(START_ANCHOR);
  if (startIdx !== -1) text = text.slice(startIdx + START_ANCHOR.length);

  let cutAt = text.length;
  for (const anchor of END_ANCHORS) {
    const idx = text.indexOf(anchor);
    if (idx !== -1 && idx < cutAt) cutAt = idx;
  }
  text = text.slice(0, cutAt).trim();

  const h2Set = new Set(h2);
  const h3Set = new Set(h3);
  let lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (h1 && h1[0] && lines[0] === h1[0]) lines = lines.slice(1);

  const blocks = [];
  let listBuffer = [];
  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(listBuffer.map((l) => `- ${l.replace(/^[–\-•]\s*/, '')}`).join('\n'));
      listBuffer = [];
    }
  };

  for (const line of lines) {
    if (h2Set.has(line)) {
      flushList();
      blocks.push(`## ${line}`);
    } else if (h3Set.has(line)) {
      flushList();
      blocks.push(`### ${line}`);
    } else if (/^[–\-•]\s*/.test(line)) {
      listBuffer.push(line);
    } else {
      flushList();
      blocks.push(line);
    }
  }
  flushList();
  return blocks.join('\n\n');
}

function extractDate(jsonLd) {
  const graph = jsonLd?.[0]?.['@graph'] || [];
  const post = graph.find((g) => g['@type'] === 'BlogPosting');
  return post?.datePublished || null;
}

function yamlEscape(str) {
  if (str == null) return '""';
  return JSON.stringify(String(str));
}

const LEGAL_SLUGS = [
  'mesafeli-satis-sozlesmesi',
  'iptal-ve-iade',
  'cerez-politikasi',
  'uyelik-sozlesmesi',
  'gizlilik-politikasi',
  'kisisel-verilerin-korunmasi-kanunu',
];
const BLOG_SLUGS = [
  'isyeri-hekimligi-e-recete-programi',
  'uzaktan-online-saglik-hizmeti-vermeye-baslayin-2023',
  'uzaktan-saglik-hizmeti-vermek-icin-dikkat-edilecekler',
  'usbs-kayitli-firma',
  'uzaktan-saglik-hizmetlerinin-sunumu',
];

function build(slug, type) {
  const j = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, `${slug}.json`), 'utf-8'));
  const body = cleanBody(j.bodyText, j.h1, j.h2, j.h3);
  const ogImage = resolveImage(j.og['og:image']);
  const date = type === 'blog' ? extractDate(j.jsonLd) : null;

  const frontmatter = [
    '---',
    `title: ${yamlEscape(j.h1[0] || j.title)}`,
    `pageTitle: ${yamlEscape(j.title)}`,
    `description: ${yamlEscape(j.metaDescription)}`,
    `canonical: ${yamlEscape(j.canonical || j.url)}`,
    `slug: ${yamlEscape(slug)}`,
    `type: ${yamlEscape(type)}`,
    date ? `date: ${yamlEscape(date)}` : null,
    ogImage ? `ogImage: ${yamlEscape(ogImage)}` : null,
  ]
    .filter(Boolean)
    .join('\n') + '\n---\n\n';

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), frontmatter + body + '\n', 'utf-8');
  console.log(`✓ ${type}: ${slug}.md (${body.length} karakter)`);
}

LEGAL_SLUGS.forEach((s) => build(s, 'legal'));
BLOG_SLUGS.forEach((s) => build(s, 'blog'));

console.log('\nTamamlandı.');

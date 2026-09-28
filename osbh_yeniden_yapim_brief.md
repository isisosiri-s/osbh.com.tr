# osbh.com.tr — Yeniden Yapım Brief'i (Claude Code için)

## Amaç
osbh.com.tr'nin mevcut sitesini (WordPress + WooCommerce + Yoast SEO + Slider
Revolution) **sıfırdan, modern bir stack ile** yeniden yapmak. Mevcut hosting'e
erişim YOK; site canlı yayında (bot koruması nedeniyle wget/curl çalışmıyor,
ama gerçek tarayıcı erişiyor). İçerik ve SEO **korunacak**, tasarım
yenilenecek/iyileştirilecek.

## EN KRİTİK KURAL — SEO KORUNMASI
Site yıllardır indeksli. Sıralamayı kaybetmemek için:
1. **URL yapısını BİREBİR koru.** Aşağıdaki tüm yol adları (slug) aynen kalacak.
   URL değişecekse eski→yeni **301 redirect** kur.
2. Her sayfanın **`<title>`, `<meta name="description">`, `<link rel="canonical">`,
   `og:title/og:description/og:image`** değerlerini canlı siteden çekip birebir taşı.
3. **H1/H2 başlık yapısını** ve gövde metnini koru (tasarımı değiştir, metni değil).
4. Yeni sitede **sitemap.xml** ve **robots.txt** üret; yayına alınca Google Search
   Console'a yeni sitemap gönder.
5. **https + geçerli SSL** olmadan yayına alma (yoksa Google + tarayıcı cezası).

## İÇERİK ÇEKME YÖNTEMİ (bot korumasını aşan)
wget/curl bloklanıyor. Bu yüzden **Playwright (headless Chromium)** ile çek:
```
npm i -D playwright && npx playwright install chromium
```
Her URL için: sayfayı gerçek tarayıcıda aç → şunları kaydet:
- Tam render edilmiş HTML (JS çalıştıktan sonra — Slider Revolution içeriği için şart)
- `<title>`, meta description, canonical, tüm `og:*` ve `twitter:*` etiketleri
- H1/H2/H3 başlıkları + gövde metni
- Tüm `<img src>`, CSS `background-image` URL'leri, `<link rel=icon>` (favicon)
- Sayfadaki tüm iç/dış bağlantılar
Görselleri (wp-content/uploads altındakiler dahil) indirip yerelleştir.
Gerçek tarayıcı olduğu için 403/timeout gelmez; gelirse `--user-agent` gerçek Chrome
UA ile ve `waitUntil: 'networkidle'` ile dene.

## TAM URL ENVANTERİ (Yoast sitemap'ten, Şub 2023)

### Pazarlama / kurumsal sayfalar (içerik + tasarım korunacak)
- `/`  (Anasayfa — 30 görsel, Slider Revolution slider'ı var)
- `/usbs-ozellikleri/`
- `/uzaktan-saglik-hizmet-paketleri/`   (USBS Çözümleri)
- `/bireysel-usbs-paketleri/`
- `/kurumsal-usbs-paketleri/`
- `/osgb-usbs-paketleri/`
- `/hizmetlerimiz/`
- `/kurumsal/`
- `/iletisim/`   (2 harita/iletişim — koordinatları + adres + form alıcısını çek)
- `/bilgi-kalite-guvenligi-yonetim-politikasi/`
- `/blog/`

### Ürünler (WooCommerce — 9 paket)
- `/urun/workplace-flex-usbs/`
- `/urun/workplace-smart-usbs/`
- `/urun/workplace-base-usbs/`
- `/urun/business-flex-usbs/`
- `/urun/business-smart-usbs/`
- `/urun/business-base-usbs/`
- `/urun/bireysel-performance-usbs/`
- `/urun/bireysel-advantage-usbs/`
- `/urun/bireysel-economy-usbs/`
(Her ürünün adı, açıklaması, fiyatı, görseli ve özellik listesini çek.)

### Blog yazıları (5)
- `/isyeri-hekimligi-e-recete-programi/`
- `/uzaktan-online-saglik-hizmeti-vermeye-baslayin-2023/`
- `/uzaktan-saglik-hizmeti-vermek-icin-dikkat-edilecekler/`
- `/usbs-kayitli-firma/`
- `/uzaktan-saglik-hizmetlerinin-sunumu/`

### Kategori
- `/category/uzaktan-saglik/`

### Yasal sayfalar (Türkiye e-ticaret için zorunlu — metinleri birebir taşı)
- `/mesafeli-satis-sozlesmesi/`
- `/iptal-ve-iade/`
- `/cerez-politikasi/`
- `/uyelik-sozlesmesi/`
- `/gizlilik-politikasi/`
- `/kisisel-verilerin-korunmasi-kanunu/`

### WooCommerce işlevsel sayfalar (dinamik — yeniden yapımda ele al)
`/magaza/`, `/sepet/`, `/odeme/`, `/hesabim/`, `/wishlist/`, `/compare/`, `/bilgi/`
→ Bunlar mağaza akışı. KARAR GEREKİR: site gerçek online satış mı yapıyor,
yoksa paketler "teklif al / iletişime geç" vitrin mi? Gerçek satış varsa
ödeme/sepet/üyelik altyapısı gerekir; vitrinse bunlar sadeleştirilebilir.

### ATLA
- `/portfolio/...` (4 sayfa) — 2017 tema demo içeriği (Latin lorem metinleri).
- `/banners/` — 44 görsel, muhtemelen slider görsel deposu; görselleri al, sayfayı değil.

## KAÇIRILMAMASI GEREKENLER (kolayca unutulur)
- **favicon** ve **og:image** (sosyal paylaşım önizlemesi)
- **JSON-LD / schema** (Organization, Product) varsa — SEO için değerli
- **Google Analytics / Tag Manager / Search Console doğrulama** kodu → ölçüm ID'sini not al, yeni sitede kur
- **Facebook Pixel** vb. varsa
- **İletişim formu + bülten formu** hangi adrese gidiyor → yeni sitede SMTP + alıcı ayarı (mailler artık GüzelHosting'de)
- **Google Maps embed** — iki ofis koordinatı (İletişim sayfasında)
- **Sertifika/rozet görselleri** — ISO, e-Nabız, e-Reçete, e-Rapor vb. güven unsurları
- **Müşteri yorumları** (testimonial) metin + görselleri
- **Çerez onay bandı** (KVKK)
- **CSS içindeki arka plan görselleri** (otomatik araçlar kaçırır — Playwright ile computed style'dan çek)

## YAYINA ALMA (yeniden yapım bitince)
1. Yeni siteyi GüzelHosting cPanel'de kur (osbh.com.tr bu hesaba eklenecek).
2. URL'ler + meta veriler yerinde, https/SSL aktif, sitemap/robots hazır → test et.
3. **En son:** İHS'de/registrar'da NS'i GüzelHosting'e çevir (mail tarafıyla birlikte planlanacak).
4. Google Search Console: yeni sitemap gönder, sıralamaları birkaç hafta izle.

## NOT
Mail tarafı (osbh.com.tr e-postaları) bu işten bağımsız; greenmed.uk'teki
imapsync yöntemiyle ayrıca taşınacak.

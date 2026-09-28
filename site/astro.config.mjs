import { defineConfig, passthroughImageService } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// NOT: Bu makinede bir Windows Application Control politikası "sharp" gibi
// native (.node) binary'leri engelliyor. Bu yüzden:
// 1) Astro'nun görsel servisi "passthrough" moduna alındı (sharp'ı hiç
//    çağırmaz) — görseller build öncesi scripts/convert-images.js ile
//    WebP'ye önceden dönüştürülüp public/images/ altına konuyor.
// 2) Astro sürümü bilinçli olarak 5.18.2'de sabitlendi; 7.3.5+ sürümü
//    (XSS/RCE güvenlik yamalarını içerir) native "satteri" markdown
//    motorunu gerektiriyor ve bu makinede engelleniyor. Canlıya almadan
//    önce, bu kısıtlama olmayan bir makinede/CI'da Astro'yu güncelleyip
//    yeniden build almanız ÖNERİLİR.
export default defineConfig({
  site: 'https://osbh.com.tr',
  output: 'static',
  trailingSlash: 'always',
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    tailwind(),
    sitemap(),
  ],
});

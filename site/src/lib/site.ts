export const SITE = {
  name: 'Online Sağlık Bilişim Hizmetleri A.Ş.',
  shortName: 'OSBH',
  url: 'https://osbh.com.tr',
  phone: '+90 312 482 5451',
  phoneHref: 'tel:+903124825451',
  email: 'info@osbh.com.tr',
  emailCorporate: 'kurumsal@osbh.com.tr',
  offices: [
    {
      name: 'Merkez Ofis',
      address: 'Harbiye Mahallesi Hürriyet Caddesi No:7/12 Çankaya/Ankara',
      lat: 39.8953538338559,
      lng: 32.83681689088477,
    },
    {
      name: 'AR-GE Ofisi',
      address: 'Kırıkkale Teknopark No:25 Yahşihan/Kırıkkale',
      lat: null,
      lng: null,
    },
  ],
};

export const NAV_LINKS = [
  { href: '/', label: 'Anasayfa' },
  { href: '/usbs-ozellikleri/', label: 'USBS Özellikleri' },
  { href: '/uzaktan-saglik-hizmet-paketleri/', label: 'USBS Çözümleri' },
  { href: '/bireysel-usbs-paketleri/', label: 'Bireysel USBS Paketleri' },
  { href: '/kurumsal-usbs-paketleri/', label: 'Kurumsal USBS Paketleri' },
  { href: '/osgb-usbs-paketleri/', label: 'OSGB USBS Paketleri' },
  { href: '/blog/', label: 'Blog' },
  { href: '/kurumsal/', label: 'Kurumsal' },
  { href: '/iletisim/', label: 'İletişim' },
];

export const FOOTER_LINKS = {
  company: [
    { href: '/hizmetlerimiz/', label: 'Hizmetlerimiz' },
    { href: 'https://kayittescil.saglik.gov.tr/TR-90715/aktif-usbs-listesi.html?Sayfa=2', label: 'Aktif USBS Listesi', external: true },
    { href: 'https://ceptesaglik.com', label: 'Cepte Sağlık', external: true },
    { href: '/magaza/', label: 'Paketlerimiz' },
  ],
  legal: [
    { href: '/uyelik-sozlesmesi/', label: 'Üyelik Sözleşmesi' },
    { href: '/gizlilik-politikasi/', label: 'Gizlilik Politikası' },
    { href: '/kisisel-verilerin-korunmasi-kanunu/', label: 'Kişisel Verilerin Korunması Kanunu' },
    { href: '/iptal-ve-iade/', label: 'İptal ve İade' },
    { href: '/mesafeli-satis-sozlesmesi/', label: 'Mesafeli Satış Sözleşmesi' },
    { href: '/bilgi-kalite-guvenligi-yonetim-politikasi/', label: 'Bilgi-Kalite Güvenliği Yönetim Politikası' },
    { href: '/cerez-politikasi/', label: 'Çerez Politikası' },
  ],
};

export const CERTIFICATES = [
  { image: '/images/27001-19571e61bf.webp', alt: 'ISO 27001 Bilgi Güvenliği Yönetim Sistemi' },
  { image: '/images/9001-1-ae395c1fb8.webp', alt: 'ISO 9001 Kalite Yönetim Sistemi' },
  { image: '/images/15004-1-d0605eabad.webp', alt: 'ISO 13485 Tıbbi Cihazlar Kalite Yönetim Sistemi' },
  { image: '/images/ssl-3317f051f7.webp', alt: 'SSL Güvenlik Sertifikası' },
  { image: '/images/enabiz-78a10b3a57.webp', alt: 'e-Nabız Entegrasyonu' },
  { image: '/images/erecete-c99e985ed0.webp', alt: 'e-Reçete Entegrasyonu' },
  { image: '/images/erapor-807b794262.webp', alt: 'e-Rapor Entegrasyonu' },
];

export const TESTIMONIALS = [
  {
    text: 'dır OSBH firmasının Uzaktan Sağlık yazılımlarını kullanıyorum. Yazılım gayet hızlı ve basit. Tüm hasta işlemlerini artık telefonumdan dahi yönetebiliyorum.',
    author: 'Özel Muayenehane',
    location: 'Ankara',
    image: '/images/med-testim-1-d0b33413cb.webp',
  },
  {
    text: 'Reçete ve rapor için farklı bir yazılım almıştım ancak artık gerek kalmadı. Bir sistem üzerinde tüm işlemlerimi halledebiliyorum. Teşekkürler OSBH',
    author: 'Doktor',
    location: '',
    image: '/images/med-testim-2-d2afbe7972.webp',
  },
  {
    text: '12 doktorumuz ile birlikte OSBH sayesinde artık 7/24 online olduk. Kendi hastalarımızın yanında farklı illerden hastalarında hayatlarına dokunmak heyecan verici.',
    author: 'Sağlık Kurumu',
    location: 'Bursa',
    image: '/images/med-testim-3-13ac243888.webp',
  },
  {
    text: 'En uygun fiyat, en şeffaf hizmet. Teknik destek harika. Diğer doktor arkadaşlarıma önermeye dahi başladım. Teşekkürler',
    author: 'Doktor',
    location: 'İstanbul',
    image: '/images/med-testim-4-df2e42fb0a.webp',
  },
];

export const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  alternateName: 'Uzaktan Sağlık Bilgi Sistemleri',
  url: SITE.url,
  logo: `${SITE.url}/images/logosd-8b84d523ea.webp`,
  telephone: SITE.phone,
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Harbiye Mahallesi Hürriyet Caddesi No:7/12',
    addressLocality: 'Çankaya/Ankara',
    addressCountry: 'TR',
  },
};

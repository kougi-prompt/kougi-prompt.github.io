// Webサイト版（GitHub Pages などに置く静的サイト）を site/ に作る。
//   npm run build:site     … site/ を作る
//   npm run preview:site   … 作ってから http://localhost:8080 で表示する
// 設定は site.config.mjs、記事と固定ページは content/*.md、共通の見た目は site-src/ にあります。
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { BASE_CSS, copyFonts, splitPage } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site');
// 設定ファイルは環境変数 SITE_CONFIG で差し替えられる（確認用）
const config = (await import(pathToFileURL(resolve(process.env.SITE_CONFIG || join(root, 'site.config.mjs'))).href)).default;

const warnings = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (template, values) => template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in values ? values[key] : m));
const text = v => (typeof v === 'string' ? v.trim() : '');
const siteName = text(config.siteName) || '講義プロンプトメーカー';
const siteUrl = text(config.siteUrl).replace(/\/+$/, '');
const absUrl = path => `${siteUrl}/${path}`;
const today = new Date().toISOString().slice(0, 10);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const fontFiles = copyFonts(root, out);
cpSync(join(root, 'site-src', 'static'), out, { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');

// ---------- 設定から作る部品 ----------
const operator = text(config.operatorName);
if (!operator) warnings.push('operatorName（運営者名）が空です。「このサイトについて」とプライバシーポリシーに表示されます。');
let contactBlock = '';
if (text(config.contactFormUrl)) contactBlock = `[お問い合わせフォーム](${text(config.contactFormUrl)})`;
else if (text(config.contactEmail)) contactBlock = `メール：${text(config.contactEmail)}`;
else warnings.push('contactFormUrl か contactEmail（連絡先）が空です。お問い合わせページなどに表示されます。');

// content/*.md の中の {{名前}} を置き換える値
const vars = {
  siteName,
  operatorName: operator || '【運営者名（site.config.mjs の operatorName）】',
  contactBlock: contactBlock || '【連絡先（site.config.mjs の contactFormUrl か contactEmail）】',
};

const ads = config.ads || {};
const adClient = text(ads.adsenseClient);
if (adClient && !/^ca-pub-\d{10,}$/.test(adClient)) warnings.push(`adsenseClient「${adClient}」の形を確認してください（例：ca-pub-1234567890123456）。`);
function adSlot(name) {
  const slot = (ads.slots && ads.slots[name]) || {};
  let inner = '';
  if (text(slot.html)) {
    inner = text(slot.html);
  } else if (adClient && text(String(slot.adsenseSlot ?? ''))) {
    inner = `<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(adClient)}" data-ad-slot="${esc(text(String(slot.adsenseSlot)))}" data-ad-format="auto" data-full-width-responsive="true"></ins>\n`
      + '<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>';
  }
  return inner ? `<aside class="ad-slot ad-${name}" aria-label="広告"><p class="ad-label">広告</p>${inner}</aside>` : '';
}

function headTags({ title, description, path, type }) {
  return [
    `<meta name="description" content="${esc(description)}">`,
    siteUrl && `<link rel="canonical" href="${esc(absUrl(path))}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${esc(siteName)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    '<meta property="og:locale" content="ja_JP">',
    siteUrl && `<meta property="og:url" content="${esc(absUrl(path))}">`,
    siteUrl && `<meta property="og:image" content="${esc(absUrl('images/ogp.png'))}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">',
    '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
    '<link rel="manifest" href="manifest.webmanifest">',
    '<meta name="theme-color" content="#ECF0EE" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#101A17" media="(prefers-color-scheme: dark)">',
    '<meta name="apple-mobile-web-app-title" content="講義プロンプト">',
    adClient && `<meta name="google-adsense-account" content="${esc(adClient)}">`,
    adClient && `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adClient)}" crossorigin="anonymous"></script>`,
  ].filter(Boolean).join('\n');
}

// ---------- 記事と固定ページ（content/*.md） ----------
marked.use({
  gfm: true,
  renderer: {
    image({ href, title, text: alt }) {
      return `<img src="${esc(href)}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`;
    },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    },
  },
});

function readPage(file) {
  const src = readFileSync(join(root, 'content', file), 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  if (!m) throw new Error(`content/${file} の先頭に、--- で囲んだ情報（title など）がありません`);
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!data.title) throw new Error(`content/${file} に title がありません`);
  const html = marked.parse(fill(src.slice(m[0].length), vars))
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
  return {
    slug: file.replace(/\.md$/, ''),
    title: data.title,
    description: data.description || '',
    card: data.card || data.description || '',
    type: data.type === 'article' ? 'article' : 'page',
    order: Number(data.order) || 99,
    updated: data.updated || today,
    html,
  };
}
const pages = readdirSync(join(root, 'content')).filter(f => f.endsWith('.md')).map(readPage).sort((a, b) => a.order - b.order);
const articles = pages.filter(p => p.type === 'article');
const others = pages.filter(p => p.type !== 'article');

const linkItem = p => `<li><a href="${p.slug}.html">${esc(p.title)}</a></li>`;
const supportItem = text(config.supportUrl) ? `<li><a href="${esc(text(config.supportUrl))}" target="_blank" rel="noopener">このサイトを応援する</a></li>` : '';
const nav = `<nav class="site-nav" aria-label="サイト内のページ">
  <div><p class="site-nav-h">読みもの</p><ul>${articles.map(linkItem).join('')}</ul></div>
  <div><p class="site-nav-h">このサイトについて</p><ul>${others.map(linkItem).join('')}${supportItem}</ul></div>
</nav>`;
const copyright = `© ${new Date().getFullYear()} ${esc(siteName)}`;
const brand = siteName === '講義プロンプトメーカー' ? '講義<span class="hl">プロンプト</span>メーカー' : esc(siteName);
const SW_SCRIPT = "<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>";
const layout = readFileSync(join(root, 'site-src', 'layout.html'), 'utf8');

for (const p of pages) {
  const isArticle = p.type === 'article';
  const fullTitle = `${p.title}｜${siteName}`;
  const jsonLd = isArticle
    ? `\n<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p.title,
      description: p.description,
      dateModified: p.updated,
      inLanguage: 'ja',
      ...(siteUrl ? { url: absUrl(`${p.slug}.html`) } : {}),
    })}</script>`
    : '';
  const related = isArticle
    ? `<section class="related" aria-labelledby="related-h"><h2 id="related-h">ほかの読みもの</h2><ul>${articles.filter(a => a !== p).map(linkItem).join('')}</ul></section>`
    : '';
  const cta = '<div class="cta-box"><p>講義に合わせたプロンプトを、いますぐ作ってみる</p><a href="./">ツールを使う</a></div>';
  writeFileSync(join(out, `${p.slug}.html`), fill(layout, {
    title: esc(fullTitle),
    head: headTags({ title: fullTitle, description: p.description, path: `${p.slug}.html`, type: isArticle ? 'article' : 'website' }) + jsonLd,
    brand,
    pageTitle: esc(p.title),
    meta: isArticle ? `<p class="article-meta">更新日：<time datetime="${esc(p.updated)}">${esc(p.updated.replace(/-/g, '.'))}</time></p>` : '',
    body: p.html,
    after: [isArticle ? adSlot('article') : '', cta, related].filter(Boolean).join('\n'),
    nav,
    copyright,
    scripts: SW_SCRIPT,
  }));
}

writeFileSync(join(out, '404.html'), fill(layout, {
  title: esc(`ページが見つかりません｜${siteName}`),
  head: '<meta name="robots" content="noindex">\n<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">',
  brand,
  pageTitle: 'ページが見つかりません',
  meta: '',
  body: '<p>お探しのページは、移動したか削除された可能性があります。</p>\n<p><a href="./">トップページ（ツール）に戻る</a></p>',
  after: '',
  nav,
  copyright,
  scripts: '',
}));

// ---------- ツール画面（src/app.html → index.html） ----------
const { head, body } = splitPage(readFileSync(join(root, 'src', 'app.html'), 'utf8'));
const replaceOnce = (s, find, replacement) => {
  if (!s.includes(find)) throw new Error(`src/app.html に次の部分が見つかりません：${find}`);
  return s.replace(find, () => replacement);
};
const indexTitle = `${siteName}｜大学の講義に合わせたAIプロンプト作成ツール`;
const readings = `<section class="readings" aria-labelledby="h-readings">
  <h2 id="h-readings">読みもの</h2>
  <ul class="reading-list">${articles.map(a => `<li><a href="${a.slug}.html"><span class="r-title">${esc(a.title)}</span><span class="r-desc">${esc(a.card)}</span></a></li>`).join('')}</ul>
</section>`;
let indexBody = body;
indexBody = replaceOnce(indexBody, '<!-- slot:after-tasks -->', adSlot('afterTasks'));
indexBody = replaceOnce(indexBody, '<!-- slot:before-footer -->', `<div class="wrap site-band">\n${readings}\n${adSlot('beforeFooter')}\n</div>`);
indexBody = replaceOnce(indexBody,
  '<li id="privacy-note">入力した内容はこのブラウザの中にだけ保存され、どこにも送信されません。</li>',
  '<li id="privacy-note">入力した内容はこのブラウザの中にだけ保存され、サーバーには送信されません。広告の配信については<a href="privacy.html">プライバシーポリシー</a>をご覧ください。</li>');
indexBody = replaceOnce(indexBody,
  '<p class="foot-links" id="app-links" hidden><a href="privacy.html">プライバシーポリシー</a></p>',
  `${nav}\n    <p class="site-copy">${copyright}</p>`);
const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: siteName,
  description: text(config.description),
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  inLanguage: 'ja',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  ...(siteUrl ? { url: absUrl('') } : {}),
};
writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="format-detection" content="telephone=no">
${headTags({ title: indexTitle, description: text(config.description), path: '', type: 'website' })}
<script type="application/ld+json">${JSON.stringify(appJsonLd)}</script>
<link rel="stylesheet" href="fonts/fonts.css">
<style>${BASE_CSS}</style>
${head.replace(/<title>[^<]*<\/title>/, `<title>${esc(indexTitle)}</title>`)}
<link rel="stylesheet" href="site.css">
</head>
<body>
${indexBody}
${SW_SCRIPT}
</body>
</html>
`);

// ---------- ホーム画面に追加・オフライン対応（PWA） ----------
writeFileSync(join(out, 'manifest.webmanifest'), JSON.stringify({
  name: siteName,
  short_name: '講義プロンプト',
  description: text(config.description),
  lang: 'ja',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#ECF0EE',
  theme_color: '#ECF0EE',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

const precache = ['./', 'index.html', 'site.css', 'fonts/fonts.css', 'manifest.webmanifest', 'icons/icon-192.png', ...pages.map(p => `${p.slug}.html`)];
writeFileSync(join(out, 'sw.js'), `// オフラインでも使えるようにするための Service Worker（npm run build:site で自動生成）
const CACHE = 'kougi-${Date.now().toString(36)}';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('kougi-') && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 広告など、外部へのリクエストには関わらない
  if (req.mode === 'navigate') {
    // ページはネットを優先し、つながらないときだけ保存しておいたものを返す
    event.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))));
    return;
  }
  // フォント・画像・CSS は保存しておいたものを優先する
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy));
    }
    return res;
  })));
});
`);

// ---------- 検索エンジン・広告向けのファイル ----------
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${absUrl('sitemap.xml')}\n` : ''}`);
if (siteUrl) {
  const urls = [{ loc: absUrl(''), lastmod: today }, ...pages.map(p => ({ loc: absUrl(`${p.slug}.html`), lastmod: p.updated }))];
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);
} else {
  warnings.push('siteUrl が空なので、sitemap.xml と SNS 用の画像指定は作りませんでした（公開URLが決まったら設定してください）。');
}
if (adClient) writeFileSync(join(out, 'ads.txt'), `google.com, ${adClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);

console.log(`site/ を作成しました（ページ ${pages.length + 1} 件、フォント ${fontFiles} ファイル）`);
console.log(adClient ? `広告：AdSense（${adClient}）のコードと ads.txt を入れました` : '広告：未設定（site.config.mjs の ads を設定すると入ります）');
for (const w of warnings) console.log(`  ⚠ ${w}`);

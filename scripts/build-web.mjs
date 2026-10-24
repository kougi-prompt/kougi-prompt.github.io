// src/app.html（Web版と共通のページ）から、アプリに同梱する www/ を作る。
//   - Google Fonts の読み込みを、同梱フォント（www/fonts）に置き換える
//   - Capacitor の JS（capacitor.js）を読み込む
//   - プライバシーポリシー（docs/privacy.html）を「戻る」リンク付きで同梱する
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const nm = join(root, 'node_modules');

// 同梱するフォント（ページで使っている太さだけ）
const FONTS = [
  ['@fontsource/klee-one', '600'],
  ['@fontsource/zen-kaku-gothic-new', '400'],
  ['@fontsource/zen-kaku-gothic-new', '500'],
  ['@fontsource/zen-kaku-gothic-new', '700'],
  ['@fontsource/ibm-plex-mono', '500'],
];

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'fonts'), { recursive: true });

let fontCss = '';
let fontFiles = 0;
for (const [pkg, weight] of FONTS) {
  const pkgDir = join(nm, pkg);
  const css = readFileSync(join(pkgDir, `${weight}.css`), 'utf8');
  // woff2 だけを使う（iOS / Android の WebView はどちらも woff2 を読める）
  fontCss += css.replace(
    /url\(\.\/files\/([^)]+?\.woff2)\) format\('woff2'\)(?:,\s*url\([^)]+\) format\('woff'\))?/g,
    (_, file) => {
      copyFileSync(join(pkgDir, 'files', file), join(out, 'fonts', file));
      fontFiles += 1;
      return `url(./${file}) format('woff2')`;
    },
  ) + '\n';
}
writeFileSync(join(out, 'fonts', 'fonts.css'), fontCss);

// ページ本体：<style> までを <head> に、残りを <body> に入れる
const src = readFileSync(join(root, 'src', 'app.html'), 'utf8');
const styleEnd = src.indexOf('</style>') + '</style>'.length;
if (styleEnd < '</style>'.length) throw new Error('src/app.html に <style> が見つかりません');
const headPart = src.slice(0, styleEnd)
  .replace(/<meta name="claude:[^>]*>\n?/g, '')
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '');
const bodyPart = src.slice(styleEnd).trim();

const BASE = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  + 'body{margin:0;-webkit-tap-highlight-color:transparent}img{max-width:100%}[hidden]{display:none!important}';

writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="format-detection" content="telephone=no">
<link rel="stylesheet" href="fonts/fonts.css">
<style>${BASE}</style>
${headPart}
<script src="capacitor.js"></script>
</head>
<body>
${bodyPart}
</body>
</html>
`);

copyFileSync(join(nm, '@capacitor/core/dist/capacitor.js'), join(out, 'capacitor.js'));

const privacy = readFileSync(join(root, 'docs', 'privacy.html'), 'utf8')
  .replace('<!-- app-back-link -->', '<p class="back"><a href="index.html">← アプリに戻る</a></p>');
writeFileSync(join(out, 'privacy.html'), privacy);

console.log(`www/ を作成しました（フォント ${fontFiles} ファイル）`);

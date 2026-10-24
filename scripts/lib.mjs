// Web サイト版（build-site.mjs）とアプリ版（build-web.mjs）で共通に使う処理
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// 同梱するフォント（ページで使っている太さだけ）
const FONTS = [
  ['@fontsource/klee-one', '600'],
  ['@fontsource/zen-kaku-gothic-new', '400'],
  ['@fontsource/zen-kaku-gothic-new', '500'],
  ['@fontsource/zen-kaku-gothic-new', '700'],
  ['@fontsource/ibm-plex-mono', '500'],
];

// フォントを outDir/fonts にコピーして fonts.css を作り、コピーしたファイル数を返す
export function copyFonts(root, outDir) {
  mkdirSync(join(outDir, 'fonts'), { recursive: true });
  let css = '';
  let count = 0;
  for (const [pkg, weight] of FONTS) {
    const pkgDir = join(root, 'node_modules', pkg);
    // woff2 だけを使う（今のブラウザと iOS / Android の WebView はすべて woff2 を読める）
    css += readFileSync(join(pkgDir, `${weight}.css`), 'utf8').replace(
      /url\(\.\/files\/([^)]+?\.woff2)\) format\('woff2'\)(?:,\s*url\([^)]+\) format\('woff'\))?/g,
      (_, file) => {
        copyFileSync(join(pkgDir, 'files', file), join(outDir, 'fonts', file));
        count += 1;
        return `url(./${file}) format('woff2')`;
      },
    ) + '\n';
  }
  writeFileSync(join(outDir, 'fonts', 'fonts.css'), css);
  return count;
}

// src/app.html を <head> に入れる部分（<style> まで）と <body> に入れる部分に分ける。
// Google Fonts の読み込みとアーティファクト用の meta は外す（フォントは同梱するため）。
export function splitPage(src) {
  const end = src.indexOf('</style>');
  if (end < 0) throw new Error('src/app.html に <style> が見つかりません');
  const styleEnd = end + '</style>'.length;
  const head = src.slice(0, styleEnd)
    .replace(/<meta name="claude:[^>]*>\n?/g, '')
    .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '');
  return { head, body: src.slice(styleEnd).trim() };
}

// ページの土台になる最小限のスタイル（セーフエリアの余白など）
export const BASE_CSS = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  + 'body{margin:0;-webkit-tap-highlight-color:transparent}img{max-width:100%}[hidden]{display:none!important}';

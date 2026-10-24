// src/app.html（Web版と共通のページ）から、アプリに同梱する www/ を作る。
//   - Google Fonts の読み込みを、同梱フォント（www/fonts）に置き換える
//   - Capacitor の JS（capacitor.js）を読み込む
//   - プライバシーポリシー（docs/privacy.html）を「戻る」リンク付きで同梱する
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_CSS, copyFonts, splitPage } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const fontFiles = copyFonts(root, out);

const { head, body } = splitPage(readFileSync(join(root, 'src', 'app.html'), 'utf8'));

writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="format-detection" content="telephone=no">
<link rel="stylesheet" href="fonts/fonts.css">
<style>${BASE_CSS}</style>
${head}
<script src="capacitor.js"></script>
</head>
<body>
${body}
</body>
</html>
`);

copyFileSync(join(root, 'node_modules', '@capacitor/core/dist/capacitor.js'), join(out, 'capacitor.js'));

const privacy = readFileSync(join(root, 'docs', 'privacy.html'), 'utf8')
  .replace('<!-- app-back-link -->', '<p class="back"><a href="index.html">← アプリに戻る</a></p>');
writeFileSync(join(out, 'privacy.html'), privacy);

console.log(`www/ を作成しました（フォント ${fontFiles} ファイル）`);

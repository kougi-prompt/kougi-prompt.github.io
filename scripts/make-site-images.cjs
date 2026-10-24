// 開発用（任意）：Webサイト用の画像を作り直すスクリプト。
//   ファビコン・ホーム画面用アイコン（site-src/static/icons）
//   SNSで共有されたときの画像（site-src/static/images/ogp.png）
//   使い方ガイドの画面（site-src/static/images/guide-*.png）
// 使い方：npm run build のあと node scripts/make-site-images.cjs（Playwright が必要）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { iconSvg, page, C } = require('./make-images.cjs');

const root = path.resolve(__dirname, '..');
const out = (...p) => {
  const file = path.join(root, 'site-src', 'static', ...p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return file;
};

async function main() {
  const browser = await chromium.launch();
  async function render(html, width, height, file) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const pg = await ctx.newPage();
    await pg.setContent(html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(200);
    await pg.screenshot({ path: file });
    await ctx.close();
  }

  // アイコン（ホーム画面用はOSが角を丸めるので、正方形のまま描く）
  for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png'], [512, 'icon-maskable-512.png']]) {
    await render(page(iconSvg({ size })), size, size, out('icons', name));
  }

  // SNS で共有されたときの画像（1200 x 630）
  await render(page(`<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:radial-gradient(130% 130% at 15% 0%, ${C.boardHi}, #173D33)">
    <div style="position:absolute;left:84px;top:150px;width:660px">
      <div style="font-family:'Klee One',serif;font-weight:600;font-size:76px;line-height:1.28;color:${C.chalk}">講義<span style="background:linear-gradient(transparent 62%, rgba(245,217,120,.42) 62%)">プロンプト</span><br>メーカー</div>
      <div style="margin-top:30px;font-family:'Zen Kaku Gothic New',sans-serif;font-weight:500;font-size:30px;line-height:1.65;color:#CFE0D7">講義のことを書くだけで、<br>AIに貼れる学習プロンプトができる</div>
    </div>
    <div style="position:absolute;right:-40px;top:-10px">${iconSvg({ size: 660, background: false })}</div>
  </div>`), 1200, 630, out('images', 'ogp.png'));

  // 使い方ガイドの画面（スマホ幅のツール画面を、パネルごとに切り出す）
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage();
  await pg.goto('file://' + path.join(root, 'www', 'index.html'));
  await pg.addStyleTag({ content: '.mbar,.toast{display:none!important}' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(300);
  const panels = [
    ['section[aria-labelledby="h-lecture"]', 'guide-1.png'],
    ['section[aria-labelledby="h-task"]', 'guide-2.png'],
    ['#out-panel', 'guide-3.png'],
  ];
  for (const [selector, name] of panels) {
    const el = await pg.$(selector);
    await el.scrollIntoViewIfNeeded();
    await pg.evaluate(sel => window.scrollTo(0, document.querySelector(sel).getBoundingClientRect().top + window.scrollY - 8), selector);
    await pg.waitForTimeout(100);
    const box = await el.boundingBox();
    await pg.screenshot({ path: out('images', name), clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 760) } });
  }
  await ctx.close();
  await browser.close();
  console.log('サイト用の画像を作成しました');
}

main().catch(e => { console.error(e); process.exit(1); });

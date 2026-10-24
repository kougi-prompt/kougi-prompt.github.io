// 開発用（任意）：アプリアイコン・スプラッシュ・ストア用の画像を作り直すスクリプト。
// 使い方：npm run build のあと node scripts/make-images.cjs
// Playwright（npm i -D playwright && npx playwright install chromium）が必要です。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fontLinks = ['klee-one/600.css', 'zen-kaku-gothic-new/400.css', 'zen-kaku-gothic-new/700.css']
  .map(p => `<link rel="stylesheet" href="file://${path.join(root, 'node_modules/@fontsource', p)}">`).join('');

const C = {
  board: '#23574A', boardHi: '#2D6A59', boardLo: '#1B463B',
  desk: '#ECF0EE', deskDark: '#101A17', ink: '#1A2521', chalk: '#EEF3EF',
  marker: '#FFE45A', pen: '#2243A3', rule: '#D6E3F0', ruleTop: '#A8C0DB', text: '#34433D',
};

// ノートの1ページ（1024 x 1024 の中央に置く）
const sheet = () => `
  <g transform="rotate(-5 512 512)">
    <rect x="242" y="182" width="540" height="660" rx="44" fill="#0A2019" opacity=".38" filter="url(#soft)" transform="translate(12 20)"/>
    <rect x="242" y="182" width="540" height="660" rx="44" fill="#FFFFFF"/>
    <rect x="300" y="254" width="250" height="38" rx="19" fill="${C.board}"/>
    <path d="M286 334H738M286 346H738" stroke="${C.ruleTop}" stroke-width="4"/>
    <path d="M286 436H738M286 520H738M286 604H738M286 688H738M286 772H738" stroke="${C.rule}" stroke-width="5"/>
    <rect x="300" y="400" width="330" height="22" rx="11" fill="${C.text}"/>
    <rect x="292" y="492" width="320" height="24" rx="3" fill="${C.marker}"/>
    <rect x="300" y="482" width="296" height="22" rx="11" fill="${C.text}"/>
    <rect x="300" y="568" width="392" height="22" rx="11" fill="${C.pen}"/>
    <rect x="300" y="652" width="228" height="22" rx="11" fill="${C.text}"/>
  </g>`;

const defs = `<defs>
  <radialGradient id="bg" cx="28%" cy="18%" r="100%"><stop offset="0" stop-color="${C.boardHi}"/><stop offset="1" stop-color="${C.boardLo}"/></radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>
</defs>`;

const iconSvg = ({ size = 1024, background = true, scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}`
  + (background ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : '')
  + `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${sheet()}</g></svg>`;

const page = body => `<!doctype html><html><head><meta charset="utf-8">${fontLinks}
<style>html,body{margin:0;background:transparent}</style></head><body>${body}</body></html>`;

// アプリ内の画面を撮るときに、iOS / Android のネイティブ機能をまねる（保存・コピー・共有）
const SEED = {
  v: 1,
  activeId: 'l1',
  taskId: 'summary',
  moreOpen: false,
  lectures: [
    { id: 'l1', name: 'ミクロ経済学Ⅰ', desc: '消費者と企業の行動を、グラフと数式を使って分析する講義。毎回スライドのPDFが配られる。無差別曲線や予算制約線のグラフの読み取りが苦手。', field: 'econ', fieldManual: false, year: 'y2', level: 'low', format: 'slide', evals: ['exam', 'report'], day: '月', period: '2', opts: {}, sample: false },
    { id: 'l2', name: '線形代数', desc: '行列と線形写像を扱う。毎週の小テストと期末試験で評価される。', field: 'stem', fieldManual: false, year: 'y1', level: 'mid', format: 'board', evals: ['quiz', 'exam'], day: '火', period: '1', opts: {}, sample: false },
    { id: 'l3', name: '英語コミュニケーションⅡ', desc: 'ディスカッション中心。毎回の小レポートと期末の発表がある。', field: 'lang', fieldManual: false, year: 'y2', level: 'mid', format: 'seminar', evals: ['present', 'attend'], day: '水', period: '3', opts: {}, sample: false },
  ],
};
function mockNative([seed, platform]) {
  const store = { 'kougi-prompt-maker:v1': seed };
  if (platform === 'ios') window.webkit = { messageHandlers: { bridge: { postMessage() {} } } };
  else window.androidBridge = { postMessage() {} };
  const header = (name, ...methods) => ({ name, methods: methods.map(m => ({ name: m, rtype: 'promise' })) });
  window.__nativeCalls = [];
  window.Capacitor = {
    PluginHeaders: [
      header('Preferences', 'get', 'set', 'remove'),
      header('Clipboard', 'write', 'read'),
      header('Share', 'share', 'canShare'),
      header('Haptics', 'impact', 'notification', 'vibrate'),
    ],
    nativePromise(plugin, method, options) {
      window.__nativeCalls.push([plugin, method, options]);
      if (plugin === 'Preferences' && method === 'get') return Promise.resolve({ value: store[options.key] ?? null });
      if (plugin === 'Preferences' && method === 'set') { store[options.key] = options.value; return Promise.resolve(); }
      return Promise.resolve({});
    },
  };
}

async function main() {
  const browser = await chromium.launch();
  const out = (...p) => { const f = path.join(root, ...p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };

  async function render(html, w, h, file, { transparent = false } = {}) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.setContent(html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(200);
    await pg.screenshot({ path: file, omitBackground: transparent });
    await ctx.close();
  }

  // アイコン（iOS用・Google Play用）、Android のアダプティブアイコン
  await render(page(iconSvg()), 1024, 1024, out('resources', 'icon-only.png'));
  // @capacitor/assets が前景を中央66%に縮めて配置するので、前景はキャンバスいっぱいに描く
  await render(page(iconSvg({ background: false })), 1024, 1024, out('resources', 'icon-foreground.png'), { transparent: true });
  await render(page(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${defs}<rect width="1024" height="1024" fill="url(#bg)"/></svg>`), 1024, 1024, out('resources', 'icon-background.png'));
  await render(page(iconSvg({ size: 512 })), 512, 512, out('store', 'google-play', 'icon-512.png'));

  // スプラッシュ（明るい / 暗い）
  const splash = (bg, fg) => page(`<div style="width:2732px;height:2732px;display:grid;place-items:center;background:${bg}">
    <div style="display:grid;justify-items:center;gap:80px">
      <div style="width:520px;height:520px;border-radius:116px;overflow:hidden">${iconSvg({ size: 520 })}</div>
      <div style="font-family:'Klee One',serif;font-weight:600;font-size:88px;letter-spacing:.04em;color:${fg}">講義プロンプトメーカー</div>
    </div></div>`);
  await render(splash(C.desk, C.ink), 2732, 2732, out('resources', 'splash.png'));
  await render(splash(C.deskDark, C.chalk), 2732, 2732, out('resources', 'splash-dark.png'));

  // Google Play のフィーチャーグラフィック（1024 x 500）
  await render(page(`<div style="position:relative;width:1024px;height:500px;overflow:hidden;background:radial-gradient(130% 130% at 15% 0%, ${C.boardHi}, #173D33)">
    <div style="position:absolute;left:72px;top:112px;width:560px">
      <div style="font-family:'Klee One',serif;font-weight:600;font-size:62px;line-height:1.28;color:${C.chalk}">講義<span style="background:linear-gradient(transparent 62%, rgba(245,217,120,.42) 62%)">プロンプト</span><br>メーカー</div>
      <div style="margin-top:24px;font-family:'Zen Kaku Gothic New',sans-serif;font-weight:500;font-size:25px;line-height:1.65;color:#CFE0D7">講義のことを書くだけで、<br>AIに貼れる学習プロンプトができる</div>
    </div>
    <div style="position:absolute;right:-36px;top:-26px">${iconSvg({ size: 560, background: false })}</div>
  </div>`), 1024, 500, out('store', 'google-play', 'feature-graphic.png'));

  // ストア用スクリーンショット（www/index.html を、ネイティブ機能をまねた状態で撮る）
  const appUrl = 'file://' + path.join(root, 'www', 'index.html');
  async function shots(dir, { width, height, scale, platform, mobile }) {
    const shotsTaken = [];
    async function open(colorScheme) {
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile, colorScheme });
      const pg = await ctx.newPage();
      await pg.addInitScript(mockNative, [JSON.stringify(SEED), platform]);
      await pg.goto(appUrl);
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(400);
      return { ctx, pg };
    }
    const snap = async (pg, name) => {
      const file = out('store', dir, `${String(shotsTaken.length + 1).padStart(2, '0')}-${name}.png`);
      await pg.waitForTimeout(150);
      await pg.screenshot({ path: file });
      shotsTaken.push(file);
    };
    const toPanel = (pg, sel) => pg.$eval(sel, el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 12));

    const narrow = width < 960; // 960px 未満は1列のスマホ向けレイアウト
    let { ctx, pg } = await open('light');
    await snap(pg, 'lecture');
    if (narrow) {
      await toPanel(pg, '#task-groups');
      await snap(pg, 'tasks');
      await toPanel(pg, '#out-panel');
      await snap(pg, 'prompt');
      await pg.click('.task[data-task="quiz"]');
      await toPanel(pg, '#out-panel');
      await snap(pg, 'quiz');
    } else {
      await pg.click('.task[data-task="quiz"]');
      await pg.evaluate(() => window.scrollTo(0, 0));
      await snap(pg, 'quiz');
    }
    await ctx.close();
    ({ ctx, pg } = await open('dark'));
    if (narrow) await toPanel(pg, '#out-panel');
    await snap(pg, 'dark');
    await ctx.close();
    return shotsTaken;
  }
  const iphone = await shots('app-store/iphone-6.9', { width: 440, height: 956, scale: 3, platform: 'ios', mobile: true });
  const ipad = await shots('app-store/ipad-13', { width: 1032, height: 1376, scale: 2, platform: 'ios', mobile: true });
  const android = await shots('google-play/phone', { width: 360, height: 720, scale: 3, platform: 'android', mobile: true });

  await browser.close();
  console.log(`画像を作成しました：iPhone ${iphone.length}枚 / iPad ${ipad.length}枚 / Android ${android.length}枚`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { mockNative, SEED };

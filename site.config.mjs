// Webサイト版の設定です。書き換えて GitHub に push すると、自動で公開サイトに反映されます。
// （手元で確かめるときは npm run preview:site）
export default {
  // サイト名
  siteName: '講義プロンプトメーカー',

  // 検索結果などに表示されるサイトの説明（120文字くらいまで）
  description: '受けている講義のことを書いて、やりたいことを選ぶだけ。講義資料の要約、想定問題、レポートの構成づくりなど17種類の目的に合わせて、ChatGPT・Claude・Gemini に貼り付けられるプロンプトを無料で作れます。',

  // 公開したサイトのURL（最後の / は付けない）。例：'https://kougi-prompt.com'
  // 空でも動きますが、検索エンジン向けのファイル（sitemap.xml）や SNS 用の画像の指定は作られません。
  siteUrl: 'https://kougi-prompt.github.io',

  // 運営者名（ニックネームでも可）。「このサイトについて」とプライバシーポリシーに表示されます
  operatorName: 'デカいカマキリ',

  // 連絡先。どちらか一方でOK。フォーム（Googleフォームなど）があればそちらを優先して表示します
  contactFormUrl: 'https://forms.gle/ZFu6G3yGX7kiN2tKA',
  contactEmail: '',

  // 応援用のリンク（OFUSE など）。空なら表示しません
  supportUrl: '',

  // Google Search Console の所有権の確認用。「HTML タグ」の content="..." の中身だけを貼る。空なら入れません
  googleSiteVerification: '9NxwDZiu5ggSKrcMXtjNeBhJh-_lwEIbGqFG4-pManE',

  // 広告の設定。審査に通るまでは空のままで大丈夫です（空のあいだは広告枠も表示されません）
  ads: {
    // Google AdSense のサイト運営者ID（例：'ca-pub-1234567890123456'）
    // 入れると、AdSense の審査用コードと ads.txt が自動で入ります
    adsenseClient: 'ca-pub-4502375566114455',

    // 広告を出す場所ごとの設定。AdSense の「広告」→「広告ユニットごと」で、右に書いた種類の広告ユニットを作る
    //   adsenseSlot：作った広告ユニットの「data-ad-slot」の番号
    //   html：AdSense 以外（忍者AdMax など）を使うときは、配信タグをそのまま貼る（こちらが優先）
    slots: {
      afterTasks: { adsenseSlot: '', html: '' },    // ツール画面「やりたいこと」の下 …… ディスプレイ広告
      beforeFooter: { adsenseSlot: '', html: '' },  // ツール画面のいちばん下 …… ディスプレイ広告
      rail: { adsenseSlot: '', html: '' },          // パソコンの広い画面の右側 …… ディスプレイ広告
      articleMiddle: { adsenseSlot: '', html: '' }, // 記事の途中 …… 記事内広告
      articleEnd: { adsenseSlot: '', html: '' },    // 記事の最後 …… Multiplex 広告
    },
  },
};

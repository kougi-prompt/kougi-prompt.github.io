# 講義プロンプトメーカー

受けている講義のことを書いて、やりたいことを選ぶだけで、AIチャット（ChatGPT・Claude・Gemini など）に貼り付けるプロンプトを作る Web ツールです。

- **Webサイト版**：このリポジトリから GitHub Pages に無料で公開でき、広告（Google AdSense など）を載せられます。この README はその手順です。
- **アプリ版**（App Store / Google Play）：Mac と開発者登録が必要なため保留中です。手順は [`docs/app.md`](docs/app.md) にあります。

---

## フォルダの中身

| 場所 | 内容 |
| --- | --- |
| `src/app.html` | ツール本体（Webサイト・アプリ・Claude のアーティファクトで共通） |
| `site.config.mjs` | **サイトの設定**（運営者名、連絡先、公開URL、広告のID） |
| `content/*.md` | 記事と固定ページ（使い方、コツ、よくある質問、プライバシーポリシーなど） |
| `site-src/` | 記事ページの見た目（`layout.html`・`static/site.css`）と画像・アイコン |
| `scripts/build-site.mjs` | 上の材料から公開用の `site/` を作るスクリプト |
| `.github/workflows/deploy-site.yml` | main ブランチに push すると GitHub Pages に自動で公開する設定 |
| `android/` `ios/` `resources/` `store/` `docs/` | アプリ版（保留中）のファイル |

---

## 1. サイトを公開する（無料）

GitHub Pages を使います。このリポジトリは組織 `kougi-prompt` の `kougi-prompt.github.io` なので、サイトは **https://kougi-prompt.github.io/** で公開されます。

無料プランの GitHub Pages は**公開（Public）リポジトリ**でしか使えません。設定は次のとおりです（設定済みなら確認だけで大丈夫です）。

1. リポジトリの **Settings → General** の一番下（Danger Zone）の **Change visibility** で **Public** にします。
2. **Settings → Pages** を開き、「Build and deployment」の **Source** を **GitHub Actions** にします。
3. main ブランチに変更が入ると、自動でサイトが作られて公開されます。進み具合は **Actions** タブで見られます。すぐに公開したいときは、Actions タブの「Webサイトを公開」→ **Run workflow** で手動でも動かせます。
4. 数分で `https://kougi-prompt.github.io/` に反映されます。

> リポジトリを非公開のままにしたい場合は、[Cloudflare Pages](https://pages.cloudflare.com/)（無料）でも公開できます。リポジトリをつないで、ビルドコマンドに `npm run build:site`、出力先に `site`、環境変数に `NODE_VERSION = 22` を設定してください。

---

## 2. 公開前に設定すること（`site.config.mjs`）

GitHub の画面で `site.config.mjs` を開き、鉛筆のアイコンから直接書き換えられます（書き換えて「Commit changes」を押すと、自動で公開サイトに反映されます）。

| 項目 | 書くこと |
| --- | --- |
| `operatorName` | 運営者名。ニックネームでも構いません |
| `contactFormUrl` | お問い合わせ用のフォームのURL。[Google フォーム](https://www.google.com/forms/about/)で無料で作れて、メールアドレスを公開しなくて済むのでおすすめです |
| `contactEmail` | フォームを使わない場合の連絡先メールアドレス |
| `siteUrl` | 公開したURL（最後の `/` は付けない）。`https://kougi-prompt.github.io` を設定済みです。独自ドメインに移ったときに書き換えます |

運営者名と連絡先は、プライバシーポリシーと「このサイトについて」「お問い合わせ」のページに表示されます。広告の審査でも確認されるので、公開前に必ず埋めてください。

---

## 3. 広告を載せる（Google AdSense）

### 申し込む前に知っておくこと

- AdSense に申し込めるのは **18 歳以上**です。
- このサイトは `https://kougi-prompt.github.io/` のように URL のいちばん上の階層にあるので、広告に必要な `ads.txt` も正しく置けます。
- ただし、`github.io` のような無料のURLより、**独自ドメイン**（例：`kougi-prompt.com`、年 1,500 円前後から）のほうが審査に通りやすいと言われています。まずは今のURLで申し込み、通らなかったときにドメインを検討すれば十分です。
- 審査では、サイトに十分な内容があるかを見られます。記事・プライバシーポリシー・お問い合わせのページは用意してありますが、申し込む前に自分の体験をもとにした記事を 1〜2 本足すと、さらに通りやすくなります（書き方は「4. 記事を書く・直す」）。

### 手順

1. [Google AdSense](https://adsense.google.com/) に申し込み、公開したサイトのURLを登録します。
2. 表示される **サイト運営者 ID**（`ca-pub-` で始まる番号）を、`site.config.mjs` の `ads.adsenseClient` に書きます。審査用のコードと `ads.txt` が自動でサイトに入ります。
3. AdSense の画面で審査をリクエストします。結果が出るまで数日から数週間かかります。
4. 承認されたら、AdSense の **広告 → 広告ユニットごと → ディスプレイ広告** で広告ユニットを作り、表示される `data-ad-slot` の番号を `site.config.mjs` の `slots` に書きます。

   | 名前 | 表示される場所 |
   | --- | --- |
   | `afterTasks` | ツール画面の「やりたいこと」の下 |
   | `beforeFooter` | ツール画面の下のほう（読みものの下） |
   | `article` | 記事ページの本文の下 |

   設定した場所にだけ、「広告」と表示された枠が出ます（空の場所には何も出ません）。

5. AdSense の「自動広告」を使う場合は、**アンカー広告**と**モバイル全画面広告**をオフにしてください。スマホで画面の下に出るコピーボタンと重なり、ツールが使いにくくなります。

### 審査に通らなかったら

- 「有用性の低いコンテンツ」と言われた場合は、記事を増やしたり、独自ドメインに移ったりしてから、しばらくして申し込み直します。
- 審査なしで始められる広告サービス（忍者AdMax など）もあります。管理画面で作った広告タグを `slots` の `html` にそのまま貼ってください。そのときは、`content/privacy.md` の広告サービスの名前も書き換えます。

### 守らないといけないこと

- **自分の広告をクリックしたり、人にクリックを頼んだりしてはいけません。** AdSense のアカウントが停止される原因になります。
- 広告であることがわかるよう、広告枠には「広告」と表示しています。消さないでください。

### お金のこと

- 収益はアクセス数しだいです。アクセスが少ないうちは、月に数百円ということも珍しくありません。
- AdSense の収益は、残高が一定額（日本では 8,000 円）以上になると振り込まれます。
- 広告収入は所得になります。金額によっては学生でも申告が必要になるので、収益が出てきたら確認しましょう。

---

## 4. 記事を書く・直す

記事と固定ページは `content/` の Markdown ファイルです。GitHub の画面で直接書き換えても、新しいファイルを追加してもかまいません。

ファイルの先頭には、次のような情報を書きます。

```markdown
---
title: 記事のタイトル
description: 検索結果に出る説明（100文字くらい）
card: トップページの「読みもの」に出る短い説明
type: article        # article＝記事（読みものに並び、広告枠あり）／page＝固定ページ
order: 5             # 並び順（小さいほど前）
updated: 2026-10-24
---
```

- 画像は `site-src/static/images/` に置き、本文から `![説明](images/ファイル名.png)` で使います。
- 本文中の `{{operatorName}}`（運営者名）、`{{contactBlock}}`（連絡先）、`{{siteName}}`（サイト名）は、`site.config.mjs` の内容に自動で置き換わります。

---

## 5. 手元のパソコンで確かめる（任意）

[Node.js](https://nodejs.org/) 22 以上を入れて、このフォルダで次を実行すると、`http://localhost:8080` で公開前のサイトを見られます。

```bash
npm install
npm run preview:site
```

---

## 6. ツール本体を直す

ツール本体は `src/app.html` です。Webサイト・アプリ・Claude のアーティファクトで同じファイルを使っています。直したら main ブランチに push すると、サイトに反映されます。

---

## アプリ版について

App Store / Google Play に出すためのファイル（`android/`、`ios/` など）と手順（[`docs/app.md`](docs/app.md)）は、そのまま残してあります。Mac が手に入ったときなどに使えます。

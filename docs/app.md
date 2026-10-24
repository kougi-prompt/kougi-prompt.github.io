# アプリ版（App Store / Google Play）の公開手順【保留中】

> いまは Web サイト版を優先しているため、アプリ版は保留中です。Mac と開発者登録（App Store は年 99 米ドル、Google Play は 25 米ドル）が用意できたら、この手順で公開できます。Web サイト版の手順はリポジトリ直下の `README.md` を見てください。

Web 版の「講義プロンプトメーカー」を、App Store と Google Play に公開するための手順です。
[Capacitor](https://capacitorjs.com/)（Web の画面をそのままスマホアプリにする仕組み）を使っています。

アプリはオフラインで動き、入力内容は端末の中だけに保存します。アプリ版では次のネイティブ機能も使います。

- 共有シート（作ったプロンプトを AI アプリやメモに直接送る）
- 端末のクリップボードへのコピー
- コピーしたときの振動フィードバック
- 端末内の保存領域への保存（複数の講義を保存できる）

---

## フォルダの中身

| 場所 | 内容 |
| --- | --- |
| `src/app.html` | アプリの画面（Web 版と共通）。**内容を変えるときはここを編集します** |
| `scripts/build-web.mjs` | `src/app.html` からアプリ用の `www/` を作るスクリプト |
| `www/` | アプリに同梱される画面（自動で作られる。直接は編集しない） |
| `android/` | Android Studio で開くプロジェクト |
| `ios/` | Xcode で開くプロジェクト |
| `resources/` | アイコンと起動画面の元画像 |
| `store/` | ストアに載せる画像と文章（`store/listing.md`） |
| `docs/privacy.html` | アプリ版のプライバシーポリシー（Web 上に公開し、その URL をストアに登録する） |
| `capacitor.config.json` | アプリ ID・アプリ名などの設定 |

---

## 全体の流れと費用

| | App Store（iPhone / iPad） | Google Play（Android） |
| --- | --- | --- |
| 開発者登録 | Apple Developer Program：年 99 米ドル | Google Play Console：25 米ドル（1 回だけ） |
| 必要なパソコン | **Mac**（最新の Xcode） | Windows / Mac / Linux（Android Studio） |
| 公開前のテスト | TestFlight（任意） | 新しい**個人**アカウントは、**12 人以上のテスターで 14 日間**のクローズドテストが必須 |
| 審査 | 多くは 1〜2 日 | 数日〜1 週間ほど |

料金やルールは変わることがあります。登録のときに各ストアの最新の案内を確認してください。

---

## 0. 公開する前に決めること

1. **アプリ ID**（Android のパッケージ名／iOS の Bundle ID）
   いまは `jp.kougiprompt.app` にしています。**ストアに一度アップロードすると変更できません。**
   変えたい場合は、最初のアップロードの前に次の手順で作り直してください。
   ```bash
   # capacitor.config.json の "appId" を書き換えてから
   rm -rf android ios
   npx cap add android
   npx cap add ios --packagemanager SPM
   npx @capacitor/assets generate --ios --android --assetPath resources \
     --iconBackgroundColor '#23574A' --iconBackgroundColorDark '#1B463B' \
     --splashBackgroundColor '#ECF0EE' --splashBackgroundColorDark '#101A17'
   # iOS の暗号化の申告を毎回聞かれないようにする設定を Info.plist に戻す
   #（ios/App/App/Info.plist に ITSAppUsesNonExemptEncryption = NO を追加）
   ```
2. **アプリ名**：ストアでは「講義プロンプトメーカー」、ホーム画面では「講義プロンプト」と表示します（長い名前は途中で切れるため）。ホーム画面の名前は `capacitor.config.json` の `appName` で変えられます。
3. **プライバシーポリシー**：`docs/privacy.html` の【運営者名】【お問い合わせ先のメールアドレス】を書き換え、Web 上に公開します（下の「プライバシーポリシーの公開」を参照）。両ストアとも URL の登録が必須です。
4. **サポート用の連絡先**：App Store には「サポート URL」が必要です。プライバシーポリシーと同じサイトに簡単なページを置けば十分です。

---

## 1. 準備（共通）

1. [Node.js](https://nodejs.org/) 22 以上をインストールします。
2. このフォルダでコマンドを実行します。
   ```bash
   npm install
   npm run sync      # src/app.html → www/ を作り、Android / iOS に反映
   ```

---

## 2. Android（Google Play）

### 動かしてみる
1. [Android Studio](https://developer.android.com/studio) をインストールします（最新版。JDK 21 も同梱されています）。
2. `npm run android` を実行すると Android Studio が開きます。
3. 初回は Gradle の同期に数分かかります。終わったら ▶（Run）でエミュレータか実機（USB デバッグを有効にしたスマホ）で起動します。

### ストアに出すファイル（AAB）を作る
1. バージョンを確認します：`android/app/build.gradle` の `versionCode`（更新のたびに 1 ずつ増やす整数）と `versionName`（表示用の "1.0" など）。
2. Android Studio のメニュー **Build → Generate Signed App Bundle or APK → Android App Bundle** を選びます。
3. 「Create new…」で**アップロード鍵（.jks ファイル）**を作ります。
   **鍵ファイルとパスワードは絶対になくさないでください。** クラウドなど安全な場所にバックアップしておきます（このフォルダの `.gitignore` で Git には入らないようにしています）。
4. `release` を選んで作成すると、`android/app/release/app-release.aab` ができます。

### Play Console での手続き
1. [Google Play Console](https://play.google.com/console) でデベロッパー登録をします（本人確認があります）。
2. 「アプリを作成」：アプリ名「講義プロンプトメーカー」、言語は日本語、アプリ（ゲームではない）、無料。
3. **ストアの掲載情報**：`store/listing.md` の文章と、`store/google-play/` の画像（アイコン 512px、フィーチャーグラフィック、スクリーンショット）を登録します。
4. **アプリのコンテンツ**（左メニュー「ポリシー」→「アプリのコンテンツ」）
   - プライバシーポリシー：公開した URL
   - 広告：含まない
   - アプリのアクセス権：すべての機能を制限なしで利用可能（ログインなし）
   - コンテンツのレーティング：質問票に回答（暴力などはすべて「いいえ」）
   - ターゲットユーザー：大学生向けなので「18 歳以上」を選ぶのがおすすめです（18 歳未満を含めると子ども向けの追加ポリシーが適用されます）
   - データセーフティ：「データを収集・共有しない」
5. **テスト**：「テスト → クローズドテスト」でトラックを作り、AAB をアップロードしてテスターを招待します。
   個人アカウントは **12 人以上が 14 日間参加**したあとで、製品版の公開を申請できます（友人やゼミの仲間に頼むのが現実的です）。
6. **製品版**：「製品版」に AAB をアップロードして審査に提出します。

---

## 3. iOS（App Store）

### 動かしてみる
1. Mac に [Xcode](https://apps.apple.com/jp/app/xcode/id497799835) をインストールします（最新版）。
2. `npm run ios` を実行すると Xcode が開きます。必要なライブラリは Swift Package Manager が自動で取得します（CocoaPods は不要です）。
3. 画面上部で iPhone シミュレータを選んで ▶ で起動します。

### Apple Developer Program と署名
1. [Apple Developer Program](https://developer.apple.com/jp/programs/) に登録します（年額。審査に 1〜2 日かかることがあります）。
2. Xcode で `App` ターゲット → **Signing & Capabilities** を開き、「Automatically manage signing」をオンにして **Team** に自分のアカウントを選びます。
3. Bundle Identifier が `jp.kougiprompt.app`（または自分で決めた ID）になっていることを確認します。

### App Store Connect に提出
1. [App Store Connect](https://appstoreconnect.apple.com/) で「新規 App」を作成：プラットフォーム iOS、名前「講義プロンプトメーカー」、言語は日本語、Bundle ID を選択。
2. Xcode で実行先を「Any iOS Device」にして **Product → Archive**。完了したら **Distribute App → App Store Connect → Upload**。
3. 数十分で App Store Connect の「TestFlight」にビルドが表示されます。自分の iPhone の TestFlight アプリで動作を確認できます。
4. App の情報を入力します（文章は `store/listing.md`）。
   - スクリーンショット：`store/app-store/iphone-6.9/`（iPhone 6.9 インチ）と `store/app-store/ipad-13/`（iPad 13 インチ）
   - プライバシーポリシー URL、サポート URL
   - **App のプライバシー**：「データを収集していません」
   - 年齢制限：質問票はすべて「なし」
   - **App Review に関する情報**：`store/listing.md` の「審査メモ」を貼り付け
5. ビルドを選んで「審査へ提出」。

---

## 4. 内容を更新するとき

1. `src/app.html` を編集します（Web 版と同じファイルです）。
2. `npm run sync` を実行します。
3. バージョンを上げます。
   - Android：`android/app/build.gradle` の `versionCode` を +1、`versionName` を新しい番号に
   - iOS：Xcode の `App` ターゲット → General の **Version**（例 1.1）と **Build**（例 2）
4. 上の手順と同じようにアップロードして審査に出します。

---

## 5. 審査で気をつけること

- **最低限の機能（Apple 審査ガイドライン 4.2）**：Web サイトを包んだだけのアプリは却下されることがあります。このアプリはネット接続なしで動き、共有シート・クリップボード・触覚フィードバック・端末内保存を使っています。審査メモでもそのことを説明しています。それでも 4.2 で却下された場合は、試験日の通知（ローカル通知）などのネイティブ機能を足して再提出するのが定番の対策です。
- **他社の商標**：アプリ名・サブタイトル・キーワード・アイコンに「ChatGPT」「Claude」「Gemini」などを入れないでください。説明文では対応サービスとして触れる程度にとどめ、「これらの会社とは関係ありません」と書いています。
- **レポートの全文作成**：アプリ内の注意書きは残してください。ストアの説明文で「レポート代行」「丸写しで提出」のような書き方はしないでください。
- **プライバシー**：広告や解析ツールを後から追加した場合は、プライバシーポリシーとストアの申告（App のプライバシー、データセーフティ）を必ず更新してください。

---

## 6. プライバシーポリシーの公開（GitHub Pages の例）

1. GitHub で新しいリポジトリを作り、このフォルダを push します。
2. リポジトリの **Settings → Pages** で、Branch を `main`、フォルダを `/docs` にして保存します。
3. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/privacy.html` で公開されます。この URL をストアに登録します。

---

## 7. 画像を作り直すとき（任意）

アイコン・起動画面・ストア用スクリーンショットは `scripts/make-images.cjs` で作っています。画面を変えたあとにスクリーンショットを撮り直す場合は、次のように実行します。

```bash
npm i -D playwright && npx playwright install chromium
npm run build
node scripts/make-images.cjs
npx @capacitor/assets generate --ios --android --assetPath resources \
  --iconBackgroundColor '#23574A' --iconBackgroundColorDark '#1B463B' \
  --splashBackgroundColor '#ECF0EE' --splashBackgroundColorDark '#101A17'
```

---

## 動作環境（このプロジェクトの設定）

- Capacitor 8.5.3
- Android：最小 Android 7.0（API 24）、ターゲット API 36、Java 21
- iOS：iOS 15 以上、iPhone と iPad の両方に対応

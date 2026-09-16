# CLAUDE.md — WA-Site 作業ガイド

WA-Chain（和紙と文化財修復のオンラインスクール）のウェブサイト。
**このファイルは実際に動かして確認した事実を記録している。** README.md には古い記述があるので、
食い違う場合は**このファイルと HANDOFF.md を優先**すること。

---

## 0. 最初に読むもの

| ファイル | 内容 | 鮮度 |
|---|---|---|
| **CLAUDE.md**（本書） | 環境の癖・検証手順・落とし穴 | 最新 |
| **HANDOFF.md** | 引き継ぎ。編集場所の対応表・残課題 | 新しい |
| `README.md` | 仕様の詳細。**一部古い**（§8参照） | 古い箇所あり |
| `PLAN.md` | 初期MVPの実装計画（architect が生成） | 履歴 |
| `input/今後追加したい機能メモ.txt` | 依頼と対応履歴。**未実装欄が次にやること** | 運用中 |

---

## 1. 環境（重要な癖）

### Node.js は入っているが PATH が通っていない

```bash
export PATH="/c/Program Files/nodejs:$PATH"
```

- 実体: `C:\Program Files\nodejs\node.exe`（v24.19.0 / npm 11.17.0）
- これを忘れると `node: command not found` になる。**毎回シェルの先頭で通すこと。**

### 基本コマンド

```bash
npm install      # 初回のみ
npm run dev      # 開発サーバー（localhost:5173）
npm run build    # dist/ に出力。169モジュール・約3.5秒
npm run preview  # ビルド結果をローカル配信（localhost:4173）
```

- `.env` は**不要**。`import.meta.env.PROD` は Vite 組み込み、`CHROME_PATH` は検証スクリプト用の任意項目。
- `wrangler.toml` は `.example` のみ。**Cloudflare のイベントログを使うときだけ**必要で、サイト表示には不要。

---

## 2. ★ルーティングはハッシュルーター

`src/App.jsx` の自前実装。**React Router ではない。**

```
http://localhost:4173/#/            ← ホーム（ハブ）= HubPage.jsx
http://localhost:4173/#/course
http://localhost:4173/#/watch/kozo-provenance   ← 動画講義プレイヤー
http://localhost:4173/#/lesson/section-1
http://localhost:4173/#/news/<記事ID>
```

- `/course` のようにハッシュ抜きで開くと**ホームが表示される**（気づきにくい。検証時の事故のもと）
- **例外**: `/about/` だけは**別ビルドエントリ**なので実パス。`http://localhost:4173/about/`

---

## 3. 入口が2つ（同一ソース）

| URL | 中身 | エントリ |
|---|---|---|
| `/` | 講座・和紙マップ・活動報告を含む全体 | `index.html` |
| `/about/` | ミッション・活動実績・メンバーのみ | `about/index.html` |

`/about/` は**講座を見せずにチーム紹介だけ共有する**ための独立版。
中身は同じ `src/pages/AboutPage.jsx` なので、**About を直すと両方に反映される。**

---

## 4. どこを編集するか

| 直したいもの | ファイル |
|---|---|
| **サイト上の文章ほぼ全て（日英）** | `src/i18n/strings.js` |
| 講義の中身・クイズ | `data/lessons.json`（**25セクション／公開中5**） |
| 活動報告の記事 | `data/news.json`（7件） |
| 和紙マップ | `data/washiPapers.json` |
| 用語辞典 | `data/glossary.json`（14語） |
| トップの大きな写真 | `data/heroImages.json` |
| セクション冒頭の短い動画 | `data/media.json` |
| **動画講義（The Course の本体）** | `data/courses.json` |
| 更新履歴 | `data/updates.json`（3件） |
| 写真の実体 | `public/images/hero/` |
| チームのSNS | `src/config/social.js` |

### ⚠ `strings.js` は日英が別ブロック
**片方だけ直すと、もう片方の言語で古い文が残る。** キー名（例 `aboutMission`）で検索して両方直すこと。

---

## 5. デザイン上の約束（勝手に変えない）

- **トークンは `src/tokens.css`**（後述のとおり README の記述は誤り）。色・書体・余白はここの CSS 変数を使い、
  ページ側で直接指定しない。
  - ライト: `--bg #f5f0e8` / `--text #1a1a1a` / `--accent #4a4a3a`
  - ダーク: `--bg #211f1a` / `--text #ece5d6` / `--accent #b3ab8e`
  - トラック別: `--track-foundations #2f4a52` / `--track-diagnostics #4c5a3c` / `--track-practice #7a4a38`
  - `--seal #a63f2e`（落款＝朱の印。**控えめに使う**）
  - 書体: `--font-heading` Lora / `--font-body` system-ui
- **ゲーミフィケーション禁止**。ポイント・バッジ・称賛メッセージ・効果音・連続記録・紙吹雪は入れない。
  進捗は「Section 3 of 4 completed」のような**事実の表示のみ**。控えめな機能的アニメ（チェックのフェード等）は可。
- **レスポンシブは768pxの1ブレークポイントのみ**。`--space-lg` / `--space-xl` を絞ることで全体に効かせる設計。
  ページ個別のメディアクエリを増やさない。
- ダークテーマは `<html data-theme>` で切替（ThemeContext）。**両テーマで確認すること。**

---

## 6. 検証のしかた（ヘッドレス）

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npm run build && npx vite preview --port 4173 &
sleep 6
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,900 \
  --virtual-time-budget=9000 --screenshot=out.png "http://localhost:4173/#/lesson/section-1"
```

### ★スクリーンショットの落とし穴

- **必ずハッシュ付きURLで開く**（§2）。
- **レッスンページは縦長ビューポートで撮らない。**
  `height: calc(100vh - ...)` の**固定高＋内部スクロール**設計なので、`--window-size=1280,1700` のように
  縦を大きくすると**中身が引き伸ばされて巨大な余白に見える**。これは不具合ではない。
  **1440×900 など実機サイズで撮ること。**
- 縦に長いページは PIL で帯状にクロップして確認する。
- **ヘッドレスの `--window-size` は狭い幅の検証に使えない。** `--window-size=430,900` で撮っても
  レイアウトビューポートは430pxにならず、`max-width:480px` のメディアクエリが効かないため
  「横がはみ出している」ように見える。**これは不具合ではない。**
  モバイル確認は実際のビューポートを持つブラウザ（Browser ペイン等）で `innerWidth` と
  `document.documentElement.scrollWidth` を比較して判定すること。
- 終わったら `pkill -f "vite preview"` でサーバーを止める。

**変更したら必ず `npm run build` を通す。** 通らない状態で公開するとサイトが更新されない。

---

## 7. 制作フロー（前任者から継承）

大きめの機能は **architect → builder** のエージェント分担。定義は `.claude/agents/` にあり、
ルートの `architect.md` / `builder.md` と同一。

1. **architect**（Read/Grep/Glob/Write のみ）… 要件から `PLAN.md` を書く。実装はしない。
   - ファイル分割／データスキーマ（実例つき）／マイルストーン／**譲れない制約の再掲**／未解決の疑問
2. **builder**（実装担当）… PLAN.md どおりに実装。レビュー地点で止めて報告。
   **PLAN と要件で答えが出ない判断は、勝手に決めずに聞く。**

小さな修正は直接編集でよい。

---

## 8. ★README.md の古い記述（引っかからないこと）

実際に確認した相違点。

| README の記述 | 実際 |
|---|---|
| トークンは `src/App.module.css` にある | **`src/tokens.css`**。App.module.css にトークンは0件 |
| `vite.config.js` は `base: './'` | **`base: '/'`**（`/about/` が1階層下にあるため絶対パス必須） |
| デプロイ先は Vercel / GitHub Pages | **Cloudflare Pages** |
| （記載なし） | **`/about/` の2エントリ構成** |

→ README の更新自体が未着手タスク（§9）。

---

## 9. 残っている作業

### `input/今後追加したい機能メモ.txt` の【未実装】
1. 山形大会で**飯村が写っている写真**への差し替え（写真待ち）
2. **チーム紹介文の書き直し**（宮本指摘の「それじゃない感」／ソーシャルビジネスを選んだ経緯）
   → **チームで確認してから着手**

### HANDOFF.md が挙げる課題
3. **README.md の更新**（§8のとおり古い）
4. **講義に出典・監修の表示がない** ← **最優先**（下記§10）

---

## 10. ★出典表示（最優先課題）

`data/lessons.json` の**全25セクションに出典フィールドが1つもない**
（`source` `citation` `reference` の出現回数ゼロ、実測）。

これは単なる機能追加ではなく、**法務上の指摘事項**である。

- 弁理士から「**引用箇所が分からなくなっていた**」と直接指摘を受けている
- HANDOFF.md にも「専門家向けの教材なので参考文献の明示が必要」とある

### 満たすべき要件（知財相談の結論に基づく）

| # | 要件 |
|---|---|
| 1 | **逐語引用は「」または斜体＋出典**を明示 |
| 2 | **言い換えは事実のみ**。原著者の主張・評価を混ぜない。出典は必ず明記 |
| 3 | **インライン出典に番号を前置**し、巻末に**「本文での対応箇所」列**を設ける |
| 4 | **単一出典の比重は35%以下**。超えそうなら別出典で分散し、比重を明記 |
| 5 | **AI使用を末尾に明記** |
| 6 | **複数文献を1つの文章に混ぜない**（同一性保持権のリスク）。出典ごとに分離 |
| 7 | **図表・年表は引用せず自作**（作成者の思想が現れるため） |

> 詳細は WA-Chain 側の `知財相談_記録と論点_2026-08.md` と `和紙教材制作_SKILL.md`（§0.5 コンプライアンス）を参照。

### 設計案（2026-08 レビュー済み）
講義ステップ末尾に出典ストリップを常時表示する案を推奨。番号マーカーには**既存の `--seal`（落款）**を使う
（新色を足さない）。実装は ①仕組み（`SourceStrip.jsx` ＋データ構造＋`strings.js` の文言）→
②全25セクションの出典を埋める、の2段階。**②が作業の本体。**

---

## 10.5 ★プロトタイプの機能範囲（2026-08 決定）

製品プロトタイプとして、サイトの機能を**6つに絞っている**。

| | 機能 | ルート |
|---|---|---|
| 中核 | The Course（講座＝動画講義＋テキスト教材） | `#/course` `#/watch/<id>` |
| 中核 | Washi Map（産地マップ） | `#/washi-map` |
| 中核 | Study Tour（現地ツアー） | `#/tour` |
| 中核 | Pricing（料金） | `#/pricing` |
| サブ | News（お知らせ） | `#/news` |
| サブ | WA-Chain 紹介 | `#/about` `/about/` |

- ホーム `#/` は**この6つへのハブ**（`src/pages/HubPage.jsx`）。旧トップの `HomePage.jsx` は
  **未使用のまま残してある**（CSSモジュール `HomePage.module.css` は CoursePage が今も使用）。
- 用語辞典・チャット・コホート・コミュニティ・更新履歴・フィードバックの各ページは
  **URLでは今も開くが、ナビゲーションからは外してある**（Header / Footer / FeaturesMenu）。
  機能を戻すときはこの3ファイルにリンクを足すだけでよい。

### 動画講義

- 定義は `data/courses.json`。**1件追加するのにコード変更は不要**（配列に足すだけ）。
- 実体は `public/videos/course-*.mp4`。再生位置は localStorage `wa-chain-watch` に保存し、
  次回「◯:◯◯ から再開」ボタンが出る（残り15秒未満は視聴済み扱いで出さない）。
- **Cloudflare Pages は1ファイル25MiBが上限**。元データ（1080p・46〜64MB）はそのままでは配信できない。
  次のレシピで720pに再エンコードして 14〜20MB に収めてある:

```bash
ffmpeg -i 元.mp4 -vf scale=1280:-2 -c:v libx264 -crf 28 -preset medium \
  -profile:v high -pix_fmt yuv420p -c:a aac -b:a 96k -ac 1 -movflags +faststart 出力.mp4
```

`-movflags +faststart` は**必須**（これがないと先頭のシークまで全体をダウンロードする）。

### 再生コントロール（倍速・10秒移動）

`src/components/PlaybackControls.jsx`。講義動画（`CourseVideoPage`）とセクション冒頭動画（`VideoPage`）の両方で使う。
ブラウザ標準の `controls` は**残したまま**、下にツールバーを足す構成（シーク・音量・全画面・字幕は標準のほうが良い）。

| 操作 | 内容 |
|---|---|
| 倍速 | 0.75〜2倍の6段階。`localStorage` の `wa-chain-playback-rate` に保存し、他の講義にも引き継ぐ |
| ボタン | 10秒戻る／10秒進む（先頭・末尾で止まる） |
| キー | ← → ／ J L で±10秒、K で再生停止、`<` `>` で速度を1段階変更。**全画面中も効く** |

- **矢印キーを既にページ移動に使っているページでは `arrowKeys={false}` を渡す**（`VideoPage` は → で講義へ進むため）。
- キー操作は **window の capture フェーズ**で受けている。動画要素にフォーカスがあると、ブラウザ標準の
  5秒シークが先に走り、bubble フェーズの `preventDefault` では止まらず**二重にシークしていた**（+10のはずが+16）。
  capture で `stopPropagation` して解消済み。ここを bubble に戻すと再発する。

### 講義のあとの「問い」と「あなたの考え」（`src/components/CourseReflection.jsx`）

動画が終わると、**キーワードについての問い2つ → 自分の考えを書くフォーム**が開く。
**宿題・テストに見せないことが要件**（2026-09 決定）。点数は出さない、違う選択肢を選んでも
「不正解」ではなく「講義では、こう説明していました」と返す、最後の問いは正解のない意見を聞く。

| 項目 | 内容 |
|---|---|
| 中身 | `data/courses.json` の各講義の `reflection`（`quiz` 2問・`prompt`・任意の `hint`）。日英併記 |
| 問いの作り方 | **スライドの重要キーワード1語につき1問**（例：楮・雁皮・典具帖紙）。根拠はナレーション原稿とスライドのみ |
| 開くタイミング | 終了15秒前に静かに開き、**実際の終了でパネルまでスクロール**。途中で閉じた人向けに「ひらく」入口も常設 |
| 該当箇所に戻る | 各問いの `rewatchAt`（秒）。**配信中の動画ファイルに対する秒数** |
| 送信先 | 既存の Web3Forms（`submitForm`）。メール任意。書けばチームがコメントを返す運用 |
| 端末に残すもの | `localStorage` の `wa-chain-reflection`（送信済みかどうかだけ） |

> ⚠ **動画を差し替えたら `rewatchAt` を必ず測り直す。** サイトの講義動画は冒頭に WA-Chain イントロ（47.47秒）が
> 付くので、字幕やナレーション原稿の時刻とはずれる。2026-09 は `ffmpeg` のシーン検出で切り替わりを取り、
> **該当時刻のフレームを実際に見て**スライドを照合した（検出は似たスライド間を取りこぼすため、目視確認が必須）。

> ⚠ **テストで送信を飛ばさないこと。** puppeteer では `api.web3forms.com` を横取りしてモックする。
> 別オリジンへの JSON 送信なのでプリフライト（OPTIONS）が先に飛ぶ。モック応答に CORS ヘッダーを付けないと
> ブラウザが送信失敗扱いにする。

### ★Service Worker（`public/sw.js`）— 動画と API には触らせない

オフライン用の stale-while-revalidate。**2026-09 に v2 → v3 で作り直した**。v2 には実害のある欠陥が3つあった。

| v2 の欠陥 | 結果 |
|---|---|
| 動画も含めて全 GET を横取りし、**動画ファイル丸ごとをキャッシュ**していた。`cache.match` は Range ヘッダーを無視するので、シークのたびにファイル全体を先頭から返した | Safari はシークできない。**差し替えた講義動画でも、キャッシュ済みの古い版を再生し続ける** |
| すべてのリクエストで最初に `caches.open()` を呼び、**失敗時の逃げ道が無かった** | CacheStorage が内部エラーを返すブラウザでは、**ページ自体が開かなくなる**（実際の Chrome プロファイルで `ERR_FAILED` を再現。SW を迂回すると HTTP 200） |
| `response.ok`（206 も含む）でキャッシュしようとした | 206 は保存できず、無駄な背景ダウンロードが走る |

v3 の決まり：
- `/videos/` `/video/` `/api/` と **Range 付きリクエストは素通し**（`BYPASS`）
- キャッシュ操作が失敗したら**そのままネットワークへ**。オフライン対応はおまけで、閲覧を妨げてはならない
- 保存するのは **200 だけ**
- **キャッシュ名を上げると、有効化時に古いキャッシュを全削除**する。キャッシュに入れていた物の扱いを変えたら必ず上げること

> ⚠ **SW の不具合は、まっさらなブラウザで回す自動テストでは出ない。** 以前から訪れているブラウザの状態を
> 再現して確かめること（puppeteer の `userDataDir` を固定し、デプロイ前後で同じプロファイルを使う）。

### ★動画の Range 配信（`server/range.js`）

**Cloudflare Pages の静的配信は Range リクエストを無視する**（実測：途中からの要求にも 200 でファイル全体を返し、
`Accept-Ranges` も付かない）。ブラウザはこの状態だと**ダウンロード済みの範囲しかシークできない**ため、
再開ボタン・±10秒・シークバーのドラッグがすべて本番で効かなかった。GitHub Pages は正しく 206 を返すので気づきにくい。

- `functions/videos/[[path]].js` と `functions/video/[[path]].js` が動画パスだけを受け、206 を切り出して返す
- **ファイルサイズはビルド時に `scripts/media-sizes.mjs` が `server/media-sizes.json` に書き出す**。
  アセット側は `transfer-encoding: chunked` で Content-Length を返さず、実行時にサイズを知る方法が無いため
- 表に無いパスは 404（しないと SPA の index.html が 200 で返る）
- `npm run build` が自動で表を再生成する。**動画を追加・差し替えたら必ずビルドを通すこと**（表が古いと末尾が欠ける）

確認コマンド（206 と `Content-Range` が返れば正常）:

```bash
curl -s -D - -o /dev/null -r 5000000-5001023 https://<サイト>/videos/course-kozo-provenance.mp4
```

---

## 10.6 ★配信先とパス（GitHub Pages 対応）

`vite.config.js` の `base` は**環境変数 `BASE_PATH` で切り替わる**（既定 `/`）。
GitHub Pages のプロジェクトサイトはサブパス配信なので、リポジトリ名を渡してビルドする:

```bash
BASE_PATH=/WA-Site/ npm run build
```

- Vite が生成する URL は自動で base が付く。
- **`data/*.json` の写真・動画パスは Vite の管轄外**なので、`src/utils/asset.js` の
  `asset()` を必ず通すこと。`<img src={asset(...)}>` `<video src={asset(...)}>`。
  ここで `encodeURI` もかけているので、**呼び出し側で二重に encodeURI しない。**
- ハッシュルーターなので Pages 側のリライト設定は不要。
- `.github/workflows/deploy.yml` がリポジトリ名から `BASE_PATH` を自動決定して公開する。
  手順は `DEPLOY.md`。

**公開先: https://ezaki0801518026-bot.github.io/WA-Chain-Educational-content-prototype/**
（`main` に push すると自動デプロイ）

### ⚠ `/api/...` は既定で呼ばない

`functions/api/` は Cloudflare Pages 専用で、GitHub Pages には存在しない。
以前は全ページビューで `POST /api/event` と `GET /api/newsletter` が 404/405 になっていた。
現在は `src/utils/api.js` の `apiUrl()` / `hasApi` を通し、**`VITE_API_BASE` が
未設定なら通信そのものを行わない**。Cloudflare へ戻すときは `VITE_API_BASE=/` を付けてビルドする。

### 公開リポジトリから除外しているもの

`.gitignore` に `docs/sources/`（書籍の書き起こし＝著作権上公開できない）と
`input/`（実名入りの内部メモ・使用済み写真11MB）を追加済み。**手元には残っている**ので、
§10 の出典作業ではローカルの `docs/sources/` を参照してよい。

---

## 10.7 ★相談AIチャットボット（Claude Sonnet 5）

`#/chat` の「専門家に相談する」。**Cloudflare でのみ動く**（GitHub Pages には Functions がないため、
そちらでは自動的に従来の「質問をメールでチームに送る」フォームにフォールバックする）。

| 直したいもの | ファイル |
|---|---|
| **AIの人格・口調・禁止事項** | **`data/chat-persona.js`** ← ここだけ直せばよい |
| モデル・effort・上限トークン・履歴長 | 同ファイルの `CHAT_CONFIG` |
| サーバー側の処理 | `functions/api/chat.js` |
| チャット画面 | `src/pages/ChatPage.jsx` |
| 教材→document 変換と出典番号の対応 | `data/chat-corpus.js`（Worker とブラウザ共用） |
| **WA-Chain調べ（AIが根拠にする事実）** | **`data/wa-chain-facts.json`** |
| 回答内の図（表・棒・範囲・学習ルート） | `src/components/ChatVisual.jsx` |
| ストリームの読み取り・出典の組み立て | `src/utils/chatStream.js` |
| トップページの入口（質問入力欄） | `src/pages/HubPage.jsx` の `.ask` ブロック |

トップに打った質問は `sessionStorage` の `wa-chain-chat-prefill` 経由で
チャット画面に引き継がれる（ハッシュルーターにはURLで渡す場所が無いため）。

### 設計の要点

- **根拠は3段（人格 v2, 2026-09-16〜）。信頼度の順に:**
  1. **WA-Chain調べ** `data/wa-chain-facts.json` — WA-Chain がファクトチェック済みの事実だけを
     自分の言葉で書いたもの（トピック＝document、事実＝block、各事実に `sources`（リンク）と `confidence`）。
     回答の出典欄には「WA-Chain調べ」ラベル＋元の出典リンクが出る。
     **調査で新しく裏取りした事実はここに足す**（id は変えない。book の書き起こしは入れない）。
  2. **テキスト教材（試作版）** `data/lessons.json` の公開中セクション。出典欄ラベルは「教材（試作）」。
     > ⚠ **テキスト教材 Section 1〜5 はファクトチェック済みではない。** `washi-course-prompt.md`（専門書の要約アウトライン）
     > から生成AIが書き下ろしたもので、2026-09-16 に動画講義と重なる箇所（Section 2・4 の一部）を直しただけ。
     > 講座ページと全ステップに「プロトタイプ（試作版）」の注記を出している（`courseLessonsDraftNote` / `lessonDraftNotice`）。
     > ファクトチェックを終えたセクションが出たら、注記と人格の扱いを見直すこと。
     > Section 1 の出典欄の AI 表記「Every source was checked and the text reviewed by hand」は照合記録が無く、要確認。
  3. **Web検索** — Anthropic のサーバーツール `web_search_20250305`（`CHAT_CONFIG.webSearches` 回まで、0で停止）。
     引用された Web ページは「Web」ラベル＋リンク、引用なしで検索だけした場合は「検索で見つかったページ」。
  1・2 は全文を Citations 付き document として最初の user ターンに入れてキャッシュ（約22,500トークン）。
  **`docs/sources/` の書籍書き起こしは絶対に参照させない**（他者の著作物）。
- **どれにも無ければ「無い」と答えるのが正しい振る舞い。** 推測・記憶で埋めさせない（名前も含む）。
  答えられないときは既存の人間へのエスカレーション（メール送信）に渡す。
- **漠然とした質問 → 学習ルート。** システムプロンプト末尾の `COURSE MAP`（`chat-corpus.js` の `courseMap()`、
  courses.json と lessons.json から自動生成）にある講義・レッスンだけを使って2〜3ルートを図で示す。
- **図示。** モデルが `<visual>{JSON}</visual>` を書き、`chatStream.js` が切り出し、
  `src/components/ChatVisual.jsx` が描く（table / bars / ranges / routes の4種、値は検証・件数上限・
  リンクは `#/…` と https のみ）。書きかけの `<visual>` は「図を作成しています…」で隠す。
- **Web検索の可否は外から確認できる。** 応答ヘッダー `x-wa-web-search`: `on` / `off`（設定で0）/
  `unavailable`（Claude Console の組織設定で無効 → 自動で検索なしで回答）。
- **effort は low のまま。** medium を本番で試したが、根拠のない形容の混入は減らず時間だけ増えた（2026-09-16 実測）。
  品質の問題は人格の文言（具体的なパターン名での禁止）で直す。

### ★出典は API の Citations で出す（2026-09-16〜）

モデルに「(Section 4)」と**手で書かせるのはやめた**（番号を間違えうる）。
`data/chat-corpus.js` が教材を **1セクション＝1 document、block 0＝概要、block N＝ステップN** に
組み、`citations: {enabled: true}` で送る。回答に付く `content_block_location` の
(document_index, block_index) を、**同じファイルの `sourceFor()`** で「Section 4 · Kōzo: …」に戻す。

- API は**実在する位置しか返さない**ので、出典欄の項目は必ず教材に実在する箇所を指す。
  リンクを押すとそのステップを開く（`setSectionStep` で保存位置を合わせてから `#/lesson/<id>`）。
- `chat-corpus.js` は **Worker とブラウザの両方が import する。** 番号付けを片方だけで変えないこと。
- 人格側は「本文にセクション番号を書かない」「引用はその箇所に citation を付ける」を指示。
- 実測（本番・5問×2回）: 引用 延べ78件すべて解決、本文に手書きの Section 番号 0件。

### 必要な設定

| 場所 | 変数 | 値 |
|---|---|---|
| Cloudflare Pages の **Secret**（Production） | `ANTHROPIC_API_KEY` | Anthropic のキー |

**これ1つだけ。** ビルド時の環境変数は不要（チャットの有無はページ読み込み時に
`GET /api/chat` を叩いて実行時に判定する。`VITE_API_BASE` は analytics 用で、チャットとは無関係）。

> ⚠ **Secret の名前でハマった実例（2026-09-04）。** ダッシュボードは「名前」を聞くだけで、
> それがコード側の変数名と一致する必要があることを画面上どこにも書かない。
> 用途が分かる名前（例 `ClaudeAIChat`）を付けると、**設定は正しく見えるのに Function には何も届かない。**
> 対策として `functions/api/chat.js` の `apiKey()` は、名前で見つからなければ
> **値が `sk-ant-` で始まる binding を探す**。名前を間違えても動く。
> 新規に設定するなら `ANTHROPIC_API_KEY` を使うこと。

> 💡 **切り分け方:** ブラウザで `/api/chat` を開くと `{"code":"method_not_allowed","ready":true/false}`
> が返る。`ready` が鍵の結線状態を示すので、**外から自分で確認できる。**

ローカル検証は `.dev.vars`（gitignore 済み）に鍵を置いて:

```bash
npm run build            # VITE_API_BASE=/ を付けてビルド
npx wrangler pages dev dist --port 8788
```

### Sonnet 5 の API 上の制約

- **`temperature` / `top_p` / `top_k` は送ると400。** 口調の調整はプロンプトの文言だけで行う
- `budget_tokens` は廃止。`thinking: {type:'adaptive'}` ＋ `output_config: {effort}` を使う
- アシスタントのプリフィル不可、会話中の `role:'system'` も Sonnet 5 では不可

### ★応答は Anthropic の SSE を**素通し**（Worker では一切パースしない）

`POST /api/chat` は Anthropic の `text/event-stream` を**そのままブラウザへ流す**。
パースはブラウザ側の `src/utils/chatStream.js`（`readAnswer()` / `assemble()`）。
SDK（`@anthropic-ai/sdk`）は使っていない（`fetch` 直叩き）。

> ⚠ **「回答が文の途中で切れる」の真因（2026-09-16 実測）。** 以前は Worker 内で SDK の
> `messages.stream()` を回し、イベントを1つずつ NDJSON に詰め替えていた。
> Cloudflare 無料プランの **CPU 10ms/リクエスト** を長めの回答の2〜4秒目で使い切り、
> **Worker が強制終了** → `done` も `code` も来ないままストリームが閉じていた。
> `max_tokens` の問題ではない（上限に当たれば `stop_reason` が返る）。
> **Worker でストリームを読む処理を足すと再発する。** 素通しなら何分流しても CPU を使わない。
> 修正後: 1,600トークン超・24秒の回答も最後まで届く。

- ストリーム開始前の失敗（鍵なし・不正・予算・混雑）は **JSON `{code}` ＋ 実ステータス**。
  クライアントは `content-type` が `event-stream` かどうかで判別する。
- 生成途中の失敗は SSE の `error` イベント。`message_stop` が来ないまま閉じたら
  「接続が切れました」（`chatInterrupted`）、`stop_reason: max_tokens` なら `chatTruncated` を表示。
- `thinking: {type:'adaptive', display:'omitted'}` なので思考内容はブラウザに流れない（実測 0文字）。
- 429/5xx は Worker で1回だけ再試行（予算切れは再試行しない）。
- 訪問者が離脱すると body が cancel され、上流接続も切れて生成が止まる。
- `.dev.vars` の鍵は無効なダミー（44文字）。**実 API の確認は本番で行った。**
  Preview 環境には Secret が無い（`ready:false`）。

### 送信と例の配置

- トップの入力欄から来た質問は、`GET /api/chat` の判定が `true` になった時点で**自動送信**
  （1回押せば1回質問される）。アシスタントが無い環境では入力欄に入れるだけ（メールが要るため）。
- チャット欄では **Enter で送信、Shift+Enter で改行**。IME 変換中の Enter は送信しない。
- 「質問の例」は**入力欄の下**。会話が始まったら消える。例の出典も `sourceFor()` で引いた実在箇所。

### 回答の書式

**Markdown はレンダリングしない。** 吹き出しは `white-space: pre-wrap` の素のテキスト。
人格定義側で「装飾なし・段落は空行・箇条書きは `- `」を指示している（FORMATTING）。
それでも `**` や行頭の `# ` がたまに出る（本番で実測）ので、`assemble()` で除去している。
日本語の質問には**全文日本語**で答えさせる（Citations を有効にすると英文をそのまま貼る傾向が出たため、
人格定義で禁止）。

### エラーコードの意味（`functions/api/chat.js` の `classify()`）

| code | 原因 | UI の挙動 |
|---|---|---|
| `budget` | 支出上限に到達（400 または `enforced_spend_limit_reached` の429） | 再試行させず、人間の経路へ誘導 |
| `busy` | レート上限（429） | 少し待って再試行を促す |
| `unconfigured` | 鍵が無い・無効（401/403） | 利用不可を表示 |
| `error` | その他 | 汎用エラー＋人間の経路 |

---

## 11. その他の注意

- **写真は圧縮してから入れる**。長辺1600px前後・JPEG品質80・1枚300KB以下が目安。
  無圧縮の元データを `public/` に置くと、そのまま公開先へアップされ表示も遅くなる。
- **`dist/` と `node_modules/` は編集しない**（自動生成）。
- 進捗・クイズの状態は**ブラウザの localStorage** に保存。サーバー側の状態はない。
- `functions/api/` に Cloudflare Functions が3本（event / newsletter / stats）。
  D1 を有効化しない限り**休眠状態**で、サイト表示には影響しない。

---

## 12. 連絡先

WA-Chain: wachain2026@gmail.com

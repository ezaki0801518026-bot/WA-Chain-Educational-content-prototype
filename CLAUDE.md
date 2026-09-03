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

### 設計の要点

- **参照範囲は自社教材のみ。** `data/lessons.json` の公開中セクション（約7,000トークン）を
  **全文システムプロンプトに入れてキャッシュ**している。検索（RAG）は無い。
  教材を足せば自動で参照範囲に入る。
  **`docs/sources/` の書籍書き起こしは絶対に参照させない**（他者の著作物）。
- **「教材に無い」と答えるのが正しい振る舞い。** 推測で埋めさせない。
  答えられないときは既存の人間へのエスカレーション（メール送信）に渡す。
- 出典はセクション番号をインラインで書かせる。

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

# バックエンド（無料枠）セットアップ手順

サイトには Cloudflare Pages Functions によるバックエンドが組み込まれています。
**何も設定しなくてもサイトは今までどおり動きます**が、以下の一度きりの設定をすると
機能が有効になります。すべて Cloudflare の無料枠内です。

## 1. 学習イベントログ（D1 データベース）

「どのページ・レッスンがどれだけ使われているか」を匿名で記録します。
個人情報は一切収集しません（イベント種別・ページ・セクションID・言語のみ）。

### 有効化手順（初回のみ・5分）

リポジトリのフォルダでターミナルを開き:

```bash
# 1. Cloudflareにログイン（ブラウザが開きます）
npx wrangler login

# 2. データベースを作成（無料）
npx wrangler d1 create washi-events
#    → 出力に database_id = "xxxx-xxxx-..." が表示される

# 3. テーブルを作成
npx wrangler d1 execute washi-events --remote --file=./schema.sql
```

次に `wrangler.toml.example` を `wrangler.toml` にリネームし、
`REPLACE_WITH_DATABASE_ID` を手順2の database_id に置き換えて、
コミット & プッシュ。次のデプロイからイベントが記録され始めます。

### 集計を見る

Cloudflareダッシュボード → Pages → washi-course → Settings →
Environment variables で `STATS_TOKEN` に好きな長い文字列を設定した後:

```
https://washi-course.pages.dev/api/stats?token=（設定した文字列）
```

をブラウザで開くと、イベント種別ごとの件数・ページ別ビュー・
セクション完了数・読む/観るの選択比率がJSONで見られます。

### 記録しているイベント

| イベント | 意味 |
|---|---|
| `page_view` | ページ表示（ハッシュルートごと） |
| `lesson_step` | レッスンのステップ進行（何ステップ目まで読んだか） |
| `section_complete` | セクション完了（クイズの得点付き） |
| `format_choice` | 「読む/観る」トグルの選択（仮説D-1） |

## 2. Substack ニュースレター連携

メルマガを開始したら、同じ Environment variables に

```
SUBSTACK_FEED_URL = https://（あなたのSubstack名）.substack.com/feed
```

を設定するだけで、活動報告ページの上部に最新記事へのリンクが
自動で表示されるようになります（1時間キャッシュ）。

## 費用について

- Cloudflare Pages Functions: 無料枠 100,000リクエスト/日
- D1: 無料枠 500万行読み取り/日・10万行書き込み/日・5GB
- 現在の規模では課金が発生する可能性は事実上ありません
- クレジットカード登録も不要です

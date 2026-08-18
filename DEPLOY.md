# GitHub Pages へ公開する手順

## 公開中のURL

**https://ezaki0801518026-bot.github.io/WA-Chain-Educational-content-prototype/**

リポジトリ: https://github.com/ezaki0801518026-bot/WA-Chain-Educational-content-prototype

`main` に push するたびに自動で更新されます（`.github/workflows/deploy.yml`）。

---

以下は、別のリポジトリで一から公開する場合の手順です。**リポジトリ名は何でも構いません**
（ビルド時に自動で読み取ってパスを合わせます）。

---

## 1. リポジトリを作る

GitHub で新規リポジトリを作成します（Public 推奨。Private でも Pages は使えますが有料プランが必要）。
README・.gitignore・ライセンスの自動生成は**チェックを外して**、空の状態で作ってください。

## 2. push する

このフォルダ（`WA-Site`）で:

```bash
git init -b main
git add -A
git commit -m "WA-Chain prototype site"
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```

## 3. Pages を有効にする（初回だけ・手動が必要）

リポジトリの **Settings → Pages → Build and deployment → Source** を
**「GitHub Actions」** に変更します。

> **この操作は自動化できません。** 新規リポジトリでは GITHUB_TOKEN から Pages サイトを
> 作成できず、ワークフローが `Create Pages site failed: Resource not accessible by
> integration` で失敗します。有効化したあと Actions タブで **Re-run all jobs** してください。

これで `.github/workflows/deploy.yml` が動き、数分後に

```
https://<ユーザー名>.github.io/<リポジトリ名>/
```

で公開されます。以降は `main` に push するたびに自動で更新されます。

---

## 手動でビルドしたい場合

```bash
export PATH="/c/Program Files/nodejs:$PATH"
BASE_PATH=/<リポジトリ名>/ npm run build
```

`dist/` の中身をそのまま置けば動きます。`BASE_PATH` を省略するとルート配信（`/`）向けになります。

ローカルで公開時と同じパスを確認するには:

```bash
BASE_PATH=/<リポジトリ名>/ npx vite preview
```

---

## 注意点

### 動画ファイル

`public/videos/` に講義動画が2本（合計約35MB）入っており、**これも一緒に push されます。**

- GitHub の 1ファイル上限は 100MB、警告が出るのは 50MB から。**今の2本はどちらも余裕で通ります**
  （14.1MB / 20.1MB）。Git LFS は不要です。
- GitHub Pages のサイト全体の上限は 1GB。現状は約 62MB。
- 今後もっと長い動画を足すなら、720p・CRF 28 に再エンコードしてから入れてください
  （レシピは `CLAUDE.md` §10.5）。1本が 50MB を超えるようなら、動画だけ外部配信
  （YouTube 限定公開 / Cloudflare Stream 等）に切り替える判断が要ります。

### ルーティング

ハッシュルーター（`#/course` など）なので、**GitHub Pages 側のリライト設定は不要**です。
どのページを直接開いても 404 になりません。

### `<user>.github.io` という名前で作った場合

その場合だけルート配信（`https://<user>.github.io/`）になります。
ワークフローが自動で判定して `BASE_PATH=/` にするので、こちらも設定変更は不要です。

### バックエンド（`/api/...`）は既定でオフ

`functions/api/` の3本（event / newsletter / stats）は **Cloudflare Pages 専用**で、
GitHub Pages には存在しません。有効なまま公開すると全ページで 404 / 405 が出るため、
`VITE_API_BASE` を指定したときだけ呼ぶようにしてあります（`src/utils/api.js`）。

```bash
VITE_API_BASE=/ npm run build   # Cloudflare Pages 向け（アクセス計測とメルマガ取得が有効に）
```

GitHub Pages 側は未指定のままで構いません。サイトの表示・動画再生には影響しません。

### 公開リポジトリから外しているもの

`.gitignore` で以下を除外しています（手元のフォルダには残っています）。

| 除外 | 理由 |
|---|---|
| `docs/sources/` | 書籍の書き起こし。分量が本文に近く、公開すると著作権上の問題になる |
| `input/` | 実名入りのチーム内メモと、使用済みの元写真11MB |

どちらもサイトの動作には不要です。

### Jekyll

`public/.nojekyll` を置いてあるので、GitHub Pages の Jekyll 処理は走りません（そのまま静的配信）。

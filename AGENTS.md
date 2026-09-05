# AGENTS.md - AYP Site

## プロジェクト概要
Always Yesterday Party の企業静的サイト。Eleventy でビルド、Cloudflare Pages で公開。

## 技術スタック
- Eleventy（11ty）静的サイトジェネレーター
- HTML / CSS / JavaScript
- Bun（パッケージマネージャー）
- Cloudflare Pages（Git統合 — プッシュ自動ビルド）

## ビルド・実行コマンド
```bash
# 依存関係インストール
bun install

# ビルド
bun run build

# 開発サーバー
bun run dev
```

## ファイル構造
- `index.html` - ホームページ
- `about.html` - About ページ
- `discography.html` - ディスコグラフィー
- `contact.html` - 連絡先
- `.eleventy.cjs` - Eleventy 設定
- `assets/` - 静的アセット

## コードスタイル
- Prettier 使用
- インデント：スペース 2 個

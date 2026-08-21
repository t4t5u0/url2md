# url2md

現在開いているタブを **Markdown のリンク記法でクリップボードにコピー**する Chrome 拡張です。

```
[ページタイトル](https://example.com)
![画像タイトル](https://example.com/image.png)   ← 画像 URL のときは ! が付きます
```

## できること

ツールバーの拡張機能アイコンをクリックすると、そのタブが Markdown 形式でコピーされます。
成功するとアイコンに緑のバッジ (✓)、コピーできないページ (`chrome://` や Chrome ウェブストアなど) では赤いバッジ (!) が一瞬表示されます。

![url2md の動作](store/screenshot_1280x800.png)

## インストール

```sh
npm ci
npm run build
```

`chrome://extensions` を開き、「デベロッパー モード」を ON にして **「パッケージ化されていない拡張機能を読み込む」** から `dist` を選択します。

配布用の zip が必要な場合は `npm run zip` で `url2md.zip` が生成されます。

## 開発

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | ソースを監視して `dist` を再ビルド (変更後は拡張機能ページで再読み込み) |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | 型チェック (`tsc --noEmit`) |
| `npm run lint` | Biome による lint / format チェック |
| `npm run format` | Biome で自動修正 |

### 構成

| パス | 役割 |
| --- | --- |
| `src/service-worker.ts` | MV3 の service worker。アイコンのクリックを受けて Markdown を組み立て、`chrome.scripting` でタブにコピー処理を注入する |
| `public/manifest.json` | Manifest V3。`public/` 以下はそのまま `dist/` にコピーされる |
| `vite.config.ts` | Vite のビルド設定 |
| `assets/` | アイコン・ストア掲載画像の生成元 (SVG / HTML)。ビルドには含まれない |
| `store/` | Chrome ウェブストア提出用の画像と[掲載情報](store/LISTING.md) |

- 要件: Node.js 20 以上 / Chrome 116 以上
- 権限は `activeTab` と `scripting` のみ。アイコンをクリックしたタブ以外にはアクセスしません

## 公開

Chrome ウェブストアへの提出手順・掲載文面・権限の説明文は [`store/LISTING.md`](store/LISTING.md) にまとめてあります。

```sh
npm run zip   # -> url2md.zip をアップロード
```

バージョンを上げるときは `package.json` と `public/manifest.json` の `version` を必ず揃えてください。

プライバシーポリシー: [PRIVACY.md](PRIVACY.md)（データの収集・送信は一切ありません）

## ライセンス

MIT

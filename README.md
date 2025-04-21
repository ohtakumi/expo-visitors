# EXPO2025 大阪・関西万博 入場者数カウンター

## 概要

このサイトは、2025年に開催される大阪・関西万博の来場者数を可視化する非公式モニターです。  
速報版と公式版のデータを切り替えて表示し、累計来場者数、関係者数、進捗状況、日別来場者グラフなどを提供します。

> 🌐 公開ページ: [未定](https://your-site-url.com)

## 主な機能

- 速報版・公式版データの切り替え表示
- 累計来場者数・関係者数・最終更新日時の表示
- 目標2820万人に対する進捗バー表示
- 日別来場者数チャート（Chart.js）
- Googleフォームへのフィードバックリンク

## 使用技術

- HTML / CSS / JavaScript
- Chart.js（グラフ描画）
- JSONファイルによるデータ読み込み

## ディレクトリ構成

```plaintext
/expo-visiters
├── index.html # メインHTMLファイル
├── style.css # スタイル定義
├── script.js # 機能ロジック
├── visitors速報.json # 速報版データ（仮）
├── visitors確定.json # 公式版データ（仮）
├─ LICENSE # ライセンス情報
└── README.md # プロジェクト説明ファイル
```

## データの構造

```json
{
  "lastUpdated": "YYYY-MM-DDTHH:mm:ss",
  "totalVisitors": 1234567,
  "staffVisitors": 12345,
  "dailyVisitors": [
    { "date": "MM-DD", "count": 100000, "staff": 2000 },
  ]
}
```

## ライセンス

このプロジェクトはMITライセンスのもとで提供されています。詳細については、[LICENSE](LICENSE) ファイルをご覧ください。

## ご意見

ご意見やフィードバックは[こちらのフォーム](https://forms.gle/HJoUeHhpdV3XwcnQ7)からお願いします。
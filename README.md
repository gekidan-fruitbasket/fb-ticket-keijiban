# Ticket Trade (チケット掲示板)

「人魚姫ー泡沫の龍宮城ー」チケット交換・譲渡用マッチング掲示板。
LIFF (LINE Front-end Framework) + Google Apps Script (GAS) + Google Sheets で動作する軽量Webアプリケーションです。

## 機能概要

- **チケット交換**: 手持ちのチケットと欲しいチケットを条件を指定して登録
- **チケット求む**: 欲しいチケットの条件を登録
- **マイページ**: 自分の投稿の管理（取消、成立完了）
- **コメント機能**: 投稿に対する質疑応答
- **通知**: LINEでのやり取りを前提としたシンプルな設計

## 技術スタック

- **Frontend**: HTML5, CSS3, Vue.js 3 (CDN), LIFF SDK
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets

## セットアップ

詳細は [SETUP.md](./SETUP.md) を参照してください。

## 開発フロー

1. `index.html` の編集
2. ブラウザでの動作確認（LIFFブラウザなど）
3. 本番環境へのデプロイ（GitHub Pagesへのプッシュなど）

## ライセンス

UNLICENSED (Private use)

# チケット掲示板 セットアップガイド

『人魚姫ー泡沫の龍宮城ー』チケット譲渡マッチング掲示板の設定手順です。

---

## 1. スプレッドシート作成

1. [Google スプレッドシート](https://sheets.google.com) で新規作成
2. URLからスプレッドシートIDをコピー
   - 例: `https://docs.google.com/spreadsheets/d/【このID部分】/edit`

---

## 2. GAS（Apps Script）設定

1. スプレッドシートで **拡張機能 → Apps Script** を開く
2. `Code.gs` の内容を貼り付け
3. **14行目**を編集:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ← コピーしたIDに置換
   ```
4. **保存** (Ctrl/Cmd + S)

### シート初期化

1. 関数選択で `initializeSheets` を選ぶ
2. **実行** ボタンをクリック
3. 初回は権限承認画面が出る → **許可**

### Webアプリ公開

1. **デプロイ → 新しいデプロイ**
2. 種類: **ウェブアプリ**
3. 設定:
   - 説明: `チケット掲示板API`
   - 次のユーザーとして実行: `自分`
   - アクセスできるユーザー: `全員`
4. **デプロイ** → URLをコピー

---

## 3. LIFF作成

### LINE Developers Console

1. [LINE Developers](https://developers.line.biz/) にログイン
2. プロバイダー選択（または新規作成）
3. **LINEログイン** チャネルを作成
4. **LIFF** タブ → **追加**
5. 設定:
   - サイズ: `Full`
   - エンドポイントURL: `https://（任意のホスティング先）/index.html`
   - Scope: `profile` にチェック
6. 作成後、**LIFF ID** をコピー

---

## 4. index.html 設定

2箇所を編集:

```javascript
// 399行目あたり
const LIFF_ID = 'YOUR_LIFF_ID';        // ← LIFF IDに置換
const GAS_URL = 'YOUR_GAS_WEBAPP_URL'; // ← GAS WebアプリURLに置換
```

---

## 5. ホスティング

`index.html` をホスティング（いずれかで）:

- **GitHub Pages** (無料)
- **Netlify** (無料)
- **Firebase Hosting** (無料枠あり)

ホスティング後のURLをLIFFエンドポイントに設定。

---

## 6. LINE公式アカウント連携

リッチメニューやトーク内リンクに以下を設定:

```
https://liff.line.me/【LIFF_ID】
```

---

## 完了 🎉

これでチケット掲示板が使えます！

### 確認ポイント
- [ ] スプレッドシートにシートが3つ作成されたか
- [ ] GAS WebアプリURLにアクセスして `{"error":"Unknown action"}` が出るか
- [ ] LIFFアプリにアクセスしてログインできるか

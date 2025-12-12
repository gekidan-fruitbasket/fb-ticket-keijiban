/**
 * チケット譲渡マッチング掲示板 - GAS バックエンド
 * 公演: 人魚姫ー泡沫《うたかた》の龍宮城ー
 * 
 * セットアップ手順:
 * 1. 新規スプレッドシートを作成
 * 2. このスクリプトをコピー
 * 3. SPREADSHEET_ID を設定
 * 4. LINE_CHANNEL_ACCESS_TOKEN を設定（任意）
 * 5. デプロイ → ウェブアプリとして公開
 */

// ==================== 設定 ====================
// 全てスクリプトプロパティから取得（開発用・本番用でコード共通化）
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';
const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '';
const LIFF_URL = PropertiesService.getScriptProperties().getProperty('LIFF_URL') || '';

// 公演情報
const SHOW_NAME = '人魚姫ー泡沫《うたかた》の龍宮城ー';
const SHOW_DATES = [
  { id: '1226_1500', label: '12/26（金）15:00' },
  { id: '1226_1830', label: '12/26（金）18:30' },
  { id: '1227_1400', label: '12/27（土）14:00' },
  { id: '1227_1730', label: '12/27（土）17:30' }
];

// シート名
const SHEET_EXCHANGES = '交換したい';
const SHEET_REQUESTS = '探しています';
const SHEET_MATCHES = 'マッチング';
const SHEET_COMMENTS = 'コメント';
const SHEET_USERS = 'ユーザー';

// ==================== 初期化 ====================
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 交換したいシート
  let exchangesSheet = ss.getSheetByName(SHEET_EXCHANGES);
  if (!exchangesSheet) {
    exchangesSheet = ss.insertSheet(SHEET_EXCHANGES);
    exchangesSheet.getRange(1, 1, 1, 10).setValues([[
      'ID', 'LINE_USER_ID', '表示名', '出すチケット', '求チケット', '座席種別', '枚数', 'コメント', 'ステータス', '投稿日時'
    ]]);
  }
  
  // 探していますシート
  let requestsSheet = ss.getSheetByName(SHEET_REQUESTS);
  if (!requestsSheet) {
    requestsSheet = ss.insertSheet(SHEET_REQUESTS);
    requestsSheet.getRange(1, 1, 1, 9).setValues([[
      'ID', 'LINE_USER_ID', '表示名', '希望日時', '希望枚数', '座席種別', 'コメント', 'ステータス', '投稿日時'
    ]]);
  }
  
  // マッチングシート
  let matchesSheet = ss.getSheetByName(SHEET_MATCHES);
  if (!matchesSheet) {
    matchesSheet = ss.insertSheet(SHEET_MATCHES);
    matchesSheet.getRange(1, 1, 1, 5).setValues([[
      'マッチID', '交換したいID', '探していますID', 'マッチ日時', 'ステータス'
    ]]);
  }
  
  // コメントシート
  let commentsSheet = ss.getSheetByName(SHEET_COMMENTS);
  if (!commentsSheet) {
    commentsSheet = ss.insertSheet(SHEET_COMMENTS);
    commentsSheet.getRange(1, 1, 1, 7).setValues([[
      'コメントID', '投稿ID', '投稿タイプ', 'LINE_USER_ID', '表示名', 'コメント内容', '投稿日時'
    ]]);
  }

  // ユーザーシート
  let usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEET_USERS);
    usersSheet.getRange(1, 1, 1, 3).setValues([[
      'LINE_USER_ID', '表示名', '登録日時'
    ]]);
  }
  
  return { exchangesSheet, requestsSheet, matchesSheet, commentsSheet, usersSheet };
}

// ==================== API エンドポイント ====================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || '';
  
  let result;
  
  try {
    switch (action) {
      case 'getShowInfo':
        result = { showName: SHOW_NAME, dates: SHOW_DATES };
        break;
      case 'getUser':
        result = getUser(params.userId);
        break;
      case 'registerUser':
        result = registerUser(params.userId, decodeURIComponent(params.displayName || ''));
        break;
      case 'getExchanges':
        result = getExchanges();
        break;
      case 'getRequests':
        result = getRequests();
        break;
      case 'getMyPosts':
        result = getMyPosts(params.userId);
        break;
      case 'postExchange':
        result = postExchange({
          userId: params.userId,
          displayName: decodeURIComponent(params.displayName || ''),
          offerDate: decodeURIComponent(params.offerDate || ''),
          wantDates: decodeURIComponent(params.wantDates || ''),
          seatType: decodeURIComponent(params.seatType || '自由席'),
          quantity: params.quantity,
          comment: decodeURIComponent(params.comment || '')
        });
        break;
      case 'postRequest':
        result = postRequest({
          userId: params.userId,
          displayName: decodeURIComponent(params.displayName || ''),
          desiredDates: decodeURIComponent(params.desiredDates || ''),
          quantity: params.quantity,
          seatType: decodeURIComponent(params.seatType || '自由席'),
          comment: decodeURIComponent(params.comment || '')
        });
        break;
      case 'cancelPost':
        result = cancelPost(params.type, params.postId, params.userId);
        break;
      case 'markCompleted':
        result = markCompleted(params.type, params.postId, params.userId);
        break;
      case 'getComments':
        result = getComments(params.postId, params.postType);
        break;
      case 'postComment':
        result = postComment({
          postId: params.postId,
          postType: params.postType,
          userId: params.userId,
          displayName: decodeURIComponent(params.displayName || ''),
          content: decodeURIComponent(params.content || '')
        });
        break;
      default:
        result = { error: 'Unknown action' };
    }
  } catch (error) {
    result = { error: error.message };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== データ取得 ====================
function getExchanges() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_EXCHANGES);
  
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const exchanges = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][8] === '募集中') { // ステータスが募集中のみ
      exchanges.push({
        id: data[i][0],
        userId: data[i][1],
        displayName: data[i][2],
        offerDate: data[i][3],
        wantDates: data[i][4],
        seatType: data[i][5],
        quantity: data[i][6],
        comment: data[i][7],
        status: data[i][8],
        createdAt: data[i][9]
      });
    }
  }
  
  return exchanges.reverse(); // 新しい順
}

function getRequests() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_REQUESTS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const requests = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === '募集中') { // ステータスが募集中のみ
      requests.push({
        id: data[i][0],
        userId: data[i][1],
        displayName: data[i][2],
        desiredDates: data[i][3],
        quantity: data[i][4],
        seatType: data[i][5],
        comment: data[i][6],
        status: data[i][7],
        createdAt: data[i][8]
      });
    }
  }
  
  return requests.reverse(); // 新しい順
}

function getMyPosts(userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 交換したい
  const exchangesSheet = ss.getSheetByName(SHEET_EXCHANGES);
  const myExchanges = [];
  if (exchangesSheet) {
    const exchangesData = exchangesSheet.getDataRange().getValues();
    for (let i = 1; i < exchangesData.length; i++) {
      if (exchangesData[i][1] === userId && exchangesData[i][8] !== '取消') {
        myExchanges.push({
          id: exchangesData[i][0],
          offerDate: exchangesData[i][3],
          wantDates: exchangesData[i][4],
          seatType: exchangesData[i][5],
          quantity: exchangesData[i][6],
          status: exchangesData[i][8]
        });
      }
    }
  }
  
  // 探しています
  const requestsSheet = ss.getSheetByName(SHEET_REQUESTS);
  const myRequests = [];
  if (requestsSheet) {
    const requestsData = requestsSheet.getDataRange().getValues();
    for (let i = 1; i < requestsData.length; i++) {
      if (requestsData[i][1] === userId && requestsData[i][7] !== '取消') {
        myRequests.push({
          id: requestsData[i][0],
          desiredDates: requestsData[i][3],
          quantity: requestsData[i][4],
          seatType: requestsData[i][5],
          status: requestsData[i][7]
        });
      }
    }
  }
  
  return { exchanges: myExchanges, requests: myRequests };
}

// ==================== データ投稿 ====================
function postExchange(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_EXCHANGES);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_EXCHANGES);
  }
  
  const id = new Date().getTime().toString();
  const now = new Date();
  
  // 求チケットを配列からカンマ区切りに
  const wantDates = Array.isArray(data.wantDates) 
    ? data.wantDates.join(',') 
    : data.wantDates;
  
  sheet.appendRow([
    id,
    data.userId,
    data.displayName,
    data.offerDate,
    wantDates,
    data.seatType || '自由席',
    data.quantity,
    data.comment || '',
    '募集中',
    now
  ]);
  
  return { success: true, id: id };
}

function postRequest(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_REQUESTS);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_REQUESTS);
  }
  
  const id = new Date().getTime().toString();
  const now = new Date();
  
  // 希望日時を配列からカンマ区切りに
  const desiredDates = Array.isArray(data.desiredDates) 
    ? data.desiredDates.join(',') 
    : data.desiredDates;
  
  sheet.appendRow([
    id,
    data.userId,
    data.displayName,
    desiredDates,
    data.quantity,
    data.seatType || '自由席',
    data.comment || '',
    '募集中',
    now
  ]);
  
  return { success: true, id: id };
}

// ==================== ステータス更新 ====================
function cancelPost(type, postId, userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheetName, statusCol;
  
  if (type === 'exchange') {
    sheetName = SHEET_EXCHANGES;
    statusCol = 9;
  } else {
    sheetName = SHEET_REQUESTS;
    statusCol = 8;
  }
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == postId && data[i][1] === userId) {
      sheet.getRange(i + 1, statusCol).setValue('取消');
      return { success: true };
    }
  }
  
  return { error: 'Post not found or unauthorized' };
}

function markCompleted(type, postId, userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheetName, statusCol;
  
  if (type === 'exchange') {
    sheetName = SHEET_EXCHANGES;
    statusCol = 9;
  } else {
    sheetName = SHEET_REQUESTS;
    statusCol = 8;
  }
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == postId && data[i][1] === userId) {
      sheet.getRange(i + 1, statusCol).setValue('成立');
      return { success: true };
    }
  }
  
  return { error: 'Post not found or unauthorized' };
}

// ==================== マッチング（将来の拡張用に残す） ====================
// 交換マッチングはコメント機能で対応するため、自動マッチングは無効化

// ==================== LINE通知 ====================
function sendMatchNotification(userId, partnerName, showDate, quantity, matchType) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('LINE通知: トークン未設定');
    return;
  }
  
  let message;
  if (matchType === 'offer') {
    message = `🎫 チケットマッチ！\n\n「${partnerName}」さんが ${showDate} のチケット${quantity}枚を譲りたいと投稿しました！\n\n掲示板で詳細を確認してください。`;
  } else {
    message = `🎫 チケットマッチ！\n\n「${partnerName}」さんが ${showDate} のチケットを探しています（${quantity}枚）\n\n掲示板で詳細を確認してください。`;
  }
  
  const payload = {
    to: userId,
    messages: [{
      type: 'text',
      text: message
    }]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  } catch (error) {
    console.error('LINE通知エラー:', error);
  }
}

// ==================== ユーティリティ ====================
function testInit() {
  initializeSheets();
  console.log('シート初期化完了');
}

// ==================== コメント機能 ====================
function getComments(postId, postType) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_COMMENTS);
  
  // シートがなければ初期化
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_COMMENTS);
  }
  
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const comments = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == postId && data[i][2] === postType) {
      comments.push({
        id: data[i][0],
        postId: data[i][1],
        postType: data[i][2],
        userId: data[i][3],
        displayName: data[i][4],
        content: data[i][5],
        createdAt: data[i][6]
      });
    }
  }
  
  return comments; // 古い順（時系列）
}

function postComment(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_COMMENTS);
  
  // シートがなければ初期化
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_COMMENTS);
  }
  
  const id = new Date().getTime().toString();
  const now = new Date();
  
  sheet.appendRow([
    id,
    data.postId,
    data.postType,
    data.userId,
    data.displayName,
    data.content,
    now
  ]);
  
  // LINE通知を送信
  if (LINE_CHANNEL_ACCESS_TOKEN) {
    sendCommentNotifications(data.postId, data.postType, data.userId, data.displayName, data.content);
  }
  
  return { success: true, id: id };
}

// ==================== コメント通知 ====================

function sendCommentNotifications(postId, postType, commenterUserId, commenterName, commentContent) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 投稿者のuserIdを取得
  const postSheet = ss.getSheetByName(postType === 'offer' ? SHEET_OFFERS : SHEET_REQUESTS);
  const postData = postSheet.getDataRange().getValues();
  let postOwnerUserId = null;
  
  for (let i = 1; i < postData.length; i++) {
    if (postData[i][0] == postId) {
      postOwnerUserId = postData[i][1];
      break;
    }
  }
  
  // 過去のコメント主たちを取得
  const commentSheet = ss.getSheetByName(SHEET_COMMENTS);
  const commentData = commentSheet.getDataRange().getValues();
  const previousCommenters = new Set();
  
  for (let i = 1; i < commentData.length; i++) {
    if (commentData[i][1] == postId && commentData[i][2] === postType) {
      const commenterId = commentData[i][3];
      // 今回のコメント主と投稿者は除外
      if (commenterId !== commenterUserId && commenterId !== postOwnerUserId) {
        previousCommenters.add(commenterId);
      }
    }
  }
  
  // ディープリンクURL（マイページへ直接飛ぶ）
  const deepLink = `${LIFF_URL}?page=mypage`;
  
  // 投稿者に通知（自分自身へのコメントでなければ）
  if (postOwnerUserId && postOwnerUserId !== commenterUserId) {
    const message = `【チケット掲示板からのお知らせ】\n\n${commenterName}さんがあなたの投稿にコメントしました。\n\n「${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}」\n\n確認する:\n${deepLink}`;
    sendLineMessage(postOwnerUserId, message);
  }
  
  // 過去のコメント主にも通知
  previousCommenters.forEach(userId => {
    const message = `【チケット掲示板からのお知らせ】\n\n${commenterName}さんが投稿に返信しました。\n\n「${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}」\n\n確認する:\n${deepLink}`;
    sendLineMessage(userId, message);
  });
}

// LINE Messaging APIでプッシュ通知を送信
function sendLineMessage(userId, message) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !userId) return;
  
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    console.error('LINE通知エラー:', e);
  }
}

// ==================== テスト用 ====================
// GASエディタから直接実行して通知をテスト
function testNotification() {
  // スプレッドシートから最初のユーザーIDを取得
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_EXCHANGES);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    console.log('テスト対象のユーザーがいません。先に投稿を作成してください。');
    return;
  }
  
  const testUserId = data[1][1]; // 最初の投稿者のuserId
  console.log('通知送信先:', testUserId);
  
  sendLineMessage(testUserId, '通知テスト成功！\n\nこのメッセージが届いていれば、通知機能が動作しています。');
  console.log('テスト通知を送信しました');
}

// 新しいフォーマットの通知をテスト（マイページへのディープリンク）
// ⚠️ 実行前に TEST_USER_ID を自分のLINE User IDに変更してください
function testNewNotificationFormat() {
  // ========================================
  // ここに自分のLINE User IDを入れる（Uから始まる文字列）
  // ユーザーシートのA列で確認できます
  const TEST_USER_ID = 'ここにあなたのLINE_USER_IDを入れてください';
  // ========================================
  
  if (TEST_USER_ID === 'ここにあなたのLINE_USER_IDを入れてください') {
    console.log('⚠️ TEST_USER_IDを設定してください！');
    console.log('ユーザーシートのA列から自分のLINE User IDをコピーして設定してください。');
    return;
  }
  
  const deepLink = `${LIFF_URL}?page=mypage`;
  
  const message = `【チケット掲示板からのお知らせ】

テストさんがあなたの投稿にコメントしました。

「これはテストメッセージです。リンクをタップして、マイページが開くか確認してください。」

確認する:
${deepLink}`;

  console.log('通知送信先:', TEST_USER_ID);
  console.log('メッセージ:\n', message);
  
  sendLineMessage(TEST_USER_ID, message);
  console.log('新フォーマットのテスト通知を送信しました');
}

// ==================== ユーザー管理 ====================
function getUser(userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  
  // シートがない場合は初期化（念のため）
  if (!sheet) {
    initializeSheets();
    return { registered: false };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return { 
        registered: true, 
        displayName: data[i][1] 
      };
    }
  }
  
  return { registered: false };
}

function registerUser(userId, displayName) {
  if (!userId || !displayName) {
    return { error: 'Invalid parameters' };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_USERS);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_USERS);
  }
  
  // 既に登録済みかチェック
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      // 名前を更新
      sheet.getRange(i + 1, 2).setValue(displayName);
      return { success: true, updated: true };
    }
  }
  
  // 新規登録
  sheet.appendRow([
    userId,
    displayName,
    new Date()
  ]);
  
  return { success: true, created: true };
}

/* ============================================================
 * 設定はこのファイルだけ
 * ============================================================ */
window.RR_CONFIG = {
  // Apps Script を「ウェブアプリ」としてデプロイした URL（…/exec）。
  // 空のままだとデモモード（このブラウザの中だけで動く・サンプル回答つき）。
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyEyWL9vfJTIozkzWLxBPeUFQXtl9V4NSoSmhgqGLoZSOVMOnDu76SfPLmSphmihMlTcw/exec',

  // ページの名前
  SITE_TITLE: 'ロボットは、だれの代わりになれる？',
  COURSE: '早稲田大学 教職授業',

  // 理由の最低文字数と最大文字数
  MIN_REASON: 15,
  MAX_REASON: 400,

  // true：回答を提出したブラウザ（または先生モード）だけが結果ページを見られる
  RESULTS_GATE: true,

  // 提出直後に、その人の理由を AI に分類させる（失敗しても、先生モードの「AIで分類」で後から分類できる）
  AUTO_CLASSIFY: true,

  // 結果ページの自動更新（秒）。0 で止める
  AUTO_REFRESH_SEC: 20
};

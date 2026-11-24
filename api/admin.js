// GET /api/admin?limit=1000&before=ISO時間：管理者分頁讀取作答（新到舊）。
// 需要 x-admin-password 標頭等於環境變數 ADMIN_PASSWORD。每頁最多 1000 筆，避免超過 Vercel 回應大小上限。
const {handler, send, query, fail} = require('../lib/http.js');
const {getStore} = require('../lib/store.js');
const {sameSecret} = require('../lib/answers.js');

module.exports = handler(['GET'], async (req, res) => {
  const store = getStore();
  if (!store) throw fail(503, '尚未設定資料庫');
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) throw fail(503, '尚未設定 ADMIN_PASSWORD 環境變數');
  const given = String(req.headers['x-admin-password'] || '');
  if (!given || !sameSecret(given, expected)) {
    await new Promise(r => setTimeout(r, 600));
    throw fail(401, '密碼不正確');
  }
  const q = query(req);
  const limit = Math.min(Math.max(parseInt(q.get('limit'), 10) || 1000, 1), 1000);
  const raw = q.get('before') || '';
  const before = /^[0-9T:. +\-Z]{10,40}$/.test(raw) ? raw : null;  // 上一頁最後一筆的時間（含微秒）
  const rows = await store.listResponses(limit, before);
  const last = rows[rows.length - 1];
  send(res, 200, {rows: rows.map(({cursor, ...r}) => r), next: rows.length === limit ? (last.cursor || last.createdAt) : null});
});

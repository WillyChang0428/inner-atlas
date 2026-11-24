// 驗證作答內容，並在伺服器端重新計分（不採信前端送來的分數）。
const crypto = require('crypto');
const {ITEMS, VERSION, score} = require('../assets/scoring.js');
const {fail} = require('./http.js');

const ECR_IDS = new Set(ITEMS.filter(i => i.g === 'ECR-12依附').map(i => i.id));
const ALL_IDS = new Set(ITEMS.map(i => i.id));
const AGES = new Set(['', '18 歲以下', '18–24', '25–34', '35–44', '45–54', '55 以上']);
const GENDERS = new Set(['', '女', '男', '其他／不願透露']);

function checkAnswers(body) {
  const ans = body && body.ans;
  const skipEcr = !!(body && body.skipEcr);
  if (!ans || typeof ans !== 'object' || Array.isArray(ans)) throw fail(400, '缺少作答內容');
  const clean = {};
  for (const [k, v] of Object.entries(ans)) {
    if (!ALL_IDS.has(k)) throw fail(400, `未知的題號：${String(k).slice(0, 10)}`);
    if (!Number.isInteger(v) || v < 1 || v > 5) throw fail(400, `${k} 的作答必須是 1 到 5 的整數`);
    if (skipEcr && ECR_IDS.has(k)) continue;
    clean[k] = v;
  }
  for (const id of ALL_IDS) {
    if (skipEcr && ECR_IDS.has(id)) continue;
    if (!clean[id]) throw fail(400, `作答不完整，缺少 ${id}`);
  }
  return {ans: clean, skipEcr, scores: score(clean, skipEcr)};
}

function checkDate(v) {
  const t = Date.parse(v);
  if (Number.isNaN(t)) return new Date().toISOString();
  const now = Date.now();
  return new Date(Math.min(Math.max(t, now - 366 * 864e5), now + 864e5)).toISOString();
}

const pick = (set, v) => (set.has(v) ? v : '');
const token = bytes => crypto.randomBytes(bytes).toString('base64url');
const sha = v => crypto.createHash('sha256').update(String(v)).digest('hex');
function sameSecret(a, b) {
  const x = Buffer.from(sha(a)), y = Buffer.from(sha(b));
  return crypto.timingSafeEqual(x, y);
}
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function shortId(n = 10) {
  const b = crypto.randomBytes(n);
  return Array.from(b, x => ALNUM[x % ALNUM.length]).join('');
}

module.exports = {checkAnswers, checkDate, pick, AGES, GENDERS, VERSION, token, sha, sameSecret, shortId};

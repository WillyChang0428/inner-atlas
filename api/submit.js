// POST /api/submit：儲存一次完整作答。分數由伺服器重新計算。
const crypto = require('crypto');
const {handler, send, readJson, fail} = require('../lib/http.js');
const {getStore} = require('../lib/store.js');
const {checkAnswers, checkDate, pick, AGES, GENDERS, VERSION} = require('../lib/answers.js');

module.exports = handler(['POST'], async (req, res) => {
  const store = getStore();
  if (!store) throw fail(503, '尚未設定資料庫');
  const body = await readJson(req);
  const respondentId = String(body.respondentId || '');
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(respondentId)) throw fail(400, '匿名代號格式錯誤');
  const {ans, skipEcr, scores} = checkAnswers(body);
  const id = crypto.randomUUID();
  await store.addResponse({
    id, respondentId, takenAt: checkDate(body.at), version: VERSION,
    age: pick(AGES, body.age), gender: pick(GENDERS, body.gender), skipEcr, answers: ans, scores
  });
  send(res, 201, {id});
});

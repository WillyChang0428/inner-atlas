// /api/share
//   GET    ?id=xxx                       讀取一份分享的報告（只有分數，沒有逐題作答）
//   POST   {ans, skipEcr, at, name, id?, editToken?}  建立分享；帶 id 與 editToken 則更新
//   DELETE {id, editToken}               停止分享
const {handler, send, readJson, query, fail} = require('../lib/http.js');
const {getStore} = require('../lib/store.js');
const {checkAnswers, checkDate, VERSION, token, sha, sameSecret, shortId} = require('../lib/answers.js');

const ID = /^[A-Za-z0-9]{6,32}$/;

module.exports = handler(['GET', 'POST', 'DELETE'], async (req, res) => {
  const store = getStore();
  if (!store) throw fail(503, '尚未設定資料庫');

  if (req.method === 'GET') {
    const id = query(req).get('id') || '';
    if (!ID.test(id)) throw fail(404, '找不到這份報告');
    const s = await store.getShare(id);
    if (!s) throw fail(404, '找不到這份報告');
    return send(res, 200, {id: s.id, name: s.name || '', at: s.takenAt, version: s.version, skipEcr: s.skipEcr, sc: s.scores});
  }

  const body = await readJson(req);

  if (req.method === 'DELETE') {
    const s = ID.test(String(body.id || '')) ? await store.getShare(body.id) : null;
    if (!s) return send(res, 200, {ok: true});
    if (!sameSecret(sha(body.editToken || ''), s.editTokenHash)) throw fail(403, '沒有權限停止這份分享');
    await store.deleteShare(s.id);
    return send(res, 200, {ok: true});
  }

  const {skipEcr, scores} = checkAnswers(body);
  const name = String(body.name || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 20);
  const record = {name, version: VERSION, skipEcr, takenAt: checkDate(body.at), scores};

  if (body.id && body.editToken && ID.test(String(body.id))) {
    const old = await store.getShare(body.id);
    if (old && sameSecret(sha(body.editToken), old.editTokenHash)) {
      await store.putShare({...record, id: old.id, editTokenHash: old.editTokenHash});
      return send(res, 200, {id: old.id, editToken: body.editToken});
    }
  }
  const id = shortId(10), editToken = token(24);
  await store.putShare({...record, id, editTokenHash: sha(editToken)});
  send(res, 201, {id, editToken});
});

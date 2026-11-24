// GET /api/health：告訴前端資料庫是否可用。
const {handler, send} = require('../lib/http.js');
const {getStore} = require('../lib/store.js');

module.exports = handler(['GET'], async (req, res) => {
  const store = getStore();
  send(res, 200, {ok: true, db: !!store, storage: store ? store.kind : 'none'});
});

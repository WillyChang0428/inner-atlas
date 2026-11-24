// 讓 API 同時能跑在 Vercel 與本機 dev server（純 Node http）上。
const MAX_BODY = 32 * 1024;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    return req.body || {};
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw Object.assign(new Error('內容太大'), {status: 413});
  }
  return raw ? JSON.parse(raw) : {};
}

function query(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

// 包一層：統一處理方法檢查與錯誤回應
function handler(methods, fn) {
  return async (req, res) => {
    if (!methods.includes(req.method)) {
      res.setHeader('allow', methods.join(', '));
      return send(res, 405, {error: '不支援的請求方法'});
    }
    try {
      await fn(req, res);
    } catch (e) {
      const status = e.status || (e instanceof SyntaxError ? 400 : 500);
      if (status >= 500) console.error(e);
      send(res, status, {error: status >= 500 ? '伺服器錯誤' : e.message});
    }
  };
}

const fail = (status, message) => Object.assign(new Error(message), {status});

module.exports = {send, readJson, query, handler, fail, MAX_BODY};

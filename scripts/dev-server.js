// 本機開發伺服器：提供靜態檔案，並把 /api/* 轉給 api 資料夾裡的函式（與 Vercel 相同）。
// 沒有設定 DATABASE_URL 時，資料只存在記憶體，重新啟動就會清空。
//   npm run dev            → http://localhost:3000
//   PORT=8080 npm run dev  → 改用其他埠號
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = 'dev-admin';
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8'};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const api = url.pathname.match(/^\/api\/([a-z-]+)$/);
  if (api) {
    const file = path.join(ROOT, 'api', api[1] + '.js');
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('{"error":"not found"}'); }
    return require(file)(req, res);
  }
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT) || /[\\/](api|lib|scripts|node_modules|\.git)[\\/]/.test(file.slice(ROOT.length))) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(buf);
  });
}).listen(PORT, () => {
  const db = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  console.log(`Inner Atlas 開發伺服器：http://localhost:${PORT}`);
  console.log(db ? '資料庫：Postgres（DATABASE_URL）' : '資料庫：記憶體（未設定 DATABASE_URL，重新啟動會清空）');
  console.log(`管理頁：http://localhost:${PORT}/#admin　密碼：${process.env.ADMIN_PASSWORD}`);
});

# Inner Atlas 心象研究所：六合一人格測驗

一次作答 104 題，同時得到六份報告：大五人格、16 型人格、HEXACO 六大人格、DISC 職場風格、親密關係依附（ECR-12）、霍蘭德職涯興趣。同一題會依權重計入多個測驗，104 題共產生 244 個計分題次。

## 功能

- 分三段作答：性格與職場 74 題、親密關係 12 題（可略過）、職涯興趣 18 題。進度自動保存在瀏覽器。
- 報告頁：一句話描述、跨測驗交叉亮點、雷達圖、16 型光譜、依附四象限圖、霍蘭德三碼。
- 匯出與分享：下載 PDF 報告、下載摘要圖卡（PNG，包含所有百分比）、建立分享連結（可更新、可停止分享）。
- 資料管理（`/#admin`）：輸入管理密碼後檢視所有作答，匯出 CSV（104 題原始作答與各維度分數）或 JSON。
- 分數一律由伺服器依作答重新計算，不採信前端送來的數字。

## 資料夾結構

```
index.html              網站頁面
assets/
  style.css             樣式
  app.js                前端程式（作答、報告、匯出、分享、管理頁）
  scoring.js            計分核心（前端與 API 共用）
  items.js              題庫資料（由 Excel 自動產生，勿手動修改）
  vendor/               html2canvas、jsPDF（MIT 授權，產生 PDF 與圖卡用）
api/                    Vercel Serverless Functions
  health.js             GET  /api/health    資料庫是否可用
  submit.js             POST /api/submit    儲存一次作答
  share.js              GET/POST/DELETE /api/share   分享連結
  admin.js              GET  /api/admin     管理者讀取作答（分頁）
lib/                    API 共用：資料庫、驗證、HTTP 工具
data/                   題庫 Excel（v3）
scripts/
  dev-server.js         本機開發伺服器
  build_items.py        Excel → assets/items.js
  test-scoring.js       計分規則自動檢查
```

## 本機執行

需要 Node.js 18 以上。

```bash
npm install
npm run dev
```

打開 http://localhost:3000 。沒有設定資料庫時，作答資料存在記憶體，重新啟動就會清空。管理頁是 http://localhost:3000/#admin ，本機預設密碼為 `dev-admin`。

想在本機連真正的資料庫，可以先設定環境變數再啟動：

```bash
DATABASE_URL="postgresql://..." ADMIN_PASSWORD="你的密碼" npm run dev
```

## 部署到 Vercel（建議）

1. 把這個資料夾推到 GitHub：
   ```bash
   git init && git add . && git commit -m "Inner Atlas 六合一人格測驗"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/inner-atlas.git
   git push -u origin main
   ```
2. 到 Vercel 選 **Add New → Project**，匯入這個 repo。Framework Preset 選 **Other**，Build Command 與 Output Directory 都留空，直接 Deploy。
3. 建立資料庫：在專案頁進入 **Storage → Create Database**，選 **Neon（Serverless Postgres）**，建立後連接到這個專案。Vercel 會自動加入 `DATABASE_URL` 環境變數。資料表會在第一次存取時自動建立，不需要手動執行 SQL。
4. 設定管理密碼：**Settings → Environment Variables** 新增 `ADMIN_PASSWORD`，填一組夠長的密碼。
5. 回到 **Deployments**，對最新一次部署按 **Redeploy**，讓環境變數生效。

完成後：

- 網站：`https://<你的專案>.vercel.app`
- 管理頁：`https://<你的專案>.vercel.app/#admin`

之後只要 push 到 GitHub，Vercel 就會自動重新部署。

## 只放 GitHub Pages（不含資料庫）

GitHub Pages 只能放靜態檔案，不能執行 `api/` 裡的程式。網站仍可完整作答、看報告、下載 PDF 與摘要圖卡，但結果只會存在作答者自己的瀏覽器，無法建立分享連結，也沒有管理頁的資料。

設定方式：repo 的 **Settings → Pages → Build and deployment**，Source 選 **Deploy from a branch**，Branch 選 `main` 與 `/ (root)`。

## 修改題庫

1. 編輯 `data/六合一人格職涯測驗題庫_v3.xlsx` 的「完整題庫總表」工作表。映射欄位格式為 `維度 (+1.0)`，不計分填 `-`。
2. 重新產生題庫資料（需要 Python 3 與 `pip install openpyxl`）：
   ```bash
   npm run build:items
   ```
3. 執行計分檢查：
   ```bash
   npm test
   ```

新增或刪除題目後，記得同步調整 `scripts/test-scoring.js` 裡的題數（104）與映射數（244）。

## 計分規則

- 5 點量尺。權重為正：越同意分數越高；權重為負：越同意分數越低。Excel 的「計分方向」欄只供參考，不參與計算。
- 維度分數 = Σ(有效分 − 1) × |權重| ÷ Σ(4 × |權重|) × 100%，四捨五入到小數一位。
- 16 型各軸先把兩端題組分開計算，再取平均，抵銷「都選同意」造成的偏移。45–55% 標示為彈性雙棲。
- 大五、HEXACO：≤35% 低、36–64% 中、≥65% 高。這是題目本身的百分比，不是和其他人比較的常模。
- 依附：焦慮、逃避各以 50% 為界，超過即為偏高，組成四種型態。
- DISC 取最高、次高為主輔風格；霍蘭德取前三高為三碼。

## 資料與隱私

- 作答者以瀏覽器隨機產生的匿名代號識別，不蒐集姓名、Email。年齡區間與性別為選填。
- `responses` 資料表：每次完整作答的 104 題原始作答、分數、作答時間、選填資料。只有知道 `ADMIN_PASSWORD` 的人能透過管理頁讀取。
- `shares` 資料表：分享連結的顯示名稱與各維度分數，不含逐題作答。拿到連結的人都能看到；分享者可隨時停止分享。停止分享用的金鑰只存在分享者的瀏覽器，資料庫裡只存它的雜湊值。

## 授權提醒

- 大五題目來自 IPIP-50（公有領域）；職涯題改編自 O*NET Interest Profiler（公有領域）。
- 誠實謙遜 10 題來自 HEXACO-60，限非商業與學術用途。若網站未來要商業化，請改用公有領域的 IPIP-HEXACO 題目。
- MBTI® 是 The Myers-Briggs Company 的註冊商標；本站的 16 型結果由大五相關題推估，並非官方 MBTI，也未使用 16Personalities 的類型暱稱。
- DISC 職場題與 16 型補強題為本站自編。
- `assets/vendor/` 內的 html2canvas、jsPDF 皆為 MIT 授權，授權條款附在同資料夾。

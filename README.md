# Inner Atlas 心象研究所：六合一人格測驗

一次作答 104 題，同時得到六份報告：大五人格、16 型人格、HEXACO 六大人格、DISC 職場風格、親密關係依附（ECR-12）、霍蘭德職涯興趣。同一題會依權重計入多個測驗，104 題共產生 244 個計分題次。

## 功能

- 分三段作答：性格與職場 74 題、親密關係 12 題（可略過）、職涯興趣 18 題。進度自動保存在瀏覽器。
- 報告頁：一句話描述、跨測驗交叉亮點、雷達圖、16 型光譜、依附四象限圖、霍蘭德三碼。
- 匯出與分享：下載 PDF 報告、下載摘要圖卡（PNG，包含所有百分比）、產生分享連結。
- **預設不蒐集任何資料**：作答與結果只保存在填答者的瀏覽器，網站是純靜態網頁，不需要資料庫。
- 分享連結把各維度分數與顯示名稱直接編碼在網址裡，不經過伺服器，因此不需要資料庫也能分享。
- 可選的資料蒐集（預設關閉）：開啟後，填答者須勾選同意，資料才會以匿名代號存入資料庫；管理頁（`/#admin`）可匯出 CSV、JSON。

## 資料夾結構

```
index.html              網站頁面
assets/
  config.js             網站設定（是否蒐集資料）
  style.css             樣式
  app.js                前端程式（作答、報告、匯出、分享、管理頁）
  scoring.js            計分核心（前端與 API 共用）
  items.js              題庫資料（由 Excel 自動產生，勿手動修改）
  vendor/               html2canvas、jsPDF（MIT 授權，產生 PDF 與圖卡用）
api/                    Vercel Serverless Functions（只有開啟資料蒐集時才會用到）
  health.js             GET  /api/health    資料庫是否可用
  submit.js             POST /api/submit    儲存一次作答（需填答者同意）
  admin.js              GET  /api/admin     管理者讀取作答（分頁）
lib/                    API 共用：資料庫、驗證、HTTP 工具
data/                   題庫 Excel（v3）
scripts/
  dev-server.js         本機開發伺服器
  build_items.py        Excel → assets/items.js
  test-scoring.js       計分規則自動檢查
```

## 本機執行

最簡單：直接用瀏覽器打開 `index.html` 就能作答、看報告、下載 PDF 與圖卡。

或用本機伺服器（需要 Node.js 18 以上）：

```bash
npm install
npm run dev
```

打開 http://localhost:3000 。

## 部署（預設：不蒐集資料）

網站是純靜態網頁，以下任選一種：

### GitHub Pages

1. 把這個資料夾推到 GitHub：
   ```bash
   git init && git add . && git commit -m "Inner Atlas 六合一人格測驗"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/inner-atlas.git
   git push -u origin main
   ```
2. repo 的 **Settings → Pages → Build and deployment**，Source 選 **Deploy from a branch**，Branch 選 `main` 與 `/ (root)`，按 Save。
3. 約一分鐘後網站會出現在 `https://<你的帳號>.github.io/inner-atlas/`。

### Vercel

1. 同上推到 GitHub。
2. 到 Vercel 選 **Add New → Project**，匯入這個 repo。Framework Preset 選 **Other**，Build Command 與 Output Directory 留空，直接 Deploy。
3. 網站會出現在 `https://<你的專案>.vercel.app`。之後 push 到 GitHub 就會自動重新部署。

## 開啟資料蒐集（選用）

需要部署在 Vercel（GitHub Pages 無法執行 `api/` 程式）。

1. 把 `assets/config.js` 的 `collect: false` 改成 `collect: true`，commit 並 push。
2. 在 Vercel 專案頁進入 **Storage → Create Database**，選 **Neon（Serverless Postgres）**，建立後連接到這個專案。Vercel 會自動加入 `DATABASE_URL` 環境變數，資料表會在第一次存取時自動建立。
3. **Settings → Environment Variables** 新增 `ADMIN_PASSWORD`，填一組夠長的密碼。
4. 回到 **Deployments**，對最新一次部署按 **Redeploy**。

開啟後的行為：

- 首頁與作答前說明會改為告知資料蒐集方式。作答前會出現「同意提供資料」勾選框，預設不勾選；年齡區間與性別兩個選填欄位也只在這時出現。
- 只有勾選同意的人，作答完成後才會上傳。沒勾選的人一樣能作答、看報告。API 也會拒絕沒有同意標記的資料。
- 管理頁：`https://<你的專案>.vercel.app/#admin`，輸入 `ADMIN_PASSWORD` 後可檢視並匯出 CSV、JSON。

本機測試資料蒐集：把 `collect` 改成 `true` 後執行 `npm run dev`。沒有設定 `DATABASE_URL` 時資料存在記憶體（重新啟動會清空），管理頁密碼預設為 `dev-admin`。

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

- 預設（`collect: false`）：不會有任何資料離開填答者的瀏覽器。作答進度與最近一次結果存在瀏覽器的 localStorage。
- 分享連結：分數（各維度百分比）與顯示名稱直接寫在網址裡，不經過伺服器。拿到連結的人都能看到，傳出後無法收回。連結不包含逐題作答。
- 開啟資料蒐集時：只有勾選同意的人會上傳。以瀏覽器隨機產生的匿名代號識別，不蒐集姓名、Email；年齡區間與性別為選填。`responses` 資料表存放 104 題原始作答、分數、作答時間與選填資料，只有知道 `ADMIN_PASSWORD` 的人能透過管理頁讀取。

## 授權提醒

- 大五題目來自 IPIP-50（公有領域）；職涯題改編自 O*NET Interest Profiler（公有領域）。
- 誠實謙遜 10 題來自 HEXACO-60，限非商業與學術用途。若網站未來要商業化，請改用公有領域的 IPIP-HEXACO 題目。
- MBTI® 是 The Myers-Briggs Company 的註冊商標；本站的 16 型結果由大五相關題推估，並非官方 MBTI，也未使用 16Personalities 的類型暱稱。
- DISC 職場題與 16 型補強題為本站自編。
- `assets/vendor/` 內的 html2canvas、jsPDF 皆為 MIT 授權，授權條款附在同資料夾。

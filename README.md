# Inner Atlas 心象研究所：六合一人格測驗

一次作答 104 題，同時得到六份報告：大五人格、16 型人格、HEXACO 六大人格、DISC 職場風格、親密關係依附（ECR-12）、霍蘭德職涯興趣。同一題會依權重計入多個測驗，104 題共產生 244 個計分題次。

這是**純靜態網站**：沒有後端、沒有資料庫，也不蒐集任何資料。所有計分都在填答者的瀏覽器裡完成。

## 功能

- 分三段作答：性格與職場 74 題、親密關係 12 題（可略過）、職涯興趣 18 題。作答進度自動保存在瀏覽器。
- 報告頁：一句話描述、跨測驗交叉亮點、雷達圖、16 型光譜、依附四象限圖、霍蘭德三碼。
- 下載 PDF 報告（A4 多頁）與摘要圖卡（PNG，包含所有百分比）。
- 分享連結：各維度分數與顯示名稱直接編碼在網址裡，不經過任何伺服器。

## 資料夾結構

```
index.html              網站頁面
assets/
  style.css             樣式
  app.js                前端程式（作答、報告、PDF、圖卡、分享）
  scoring.js            計分核心
  items.js              題庫資料（由 Excel 自動產生，勿手動修改）
  favicon.svg           網站圖示
  vendor/               html2canvas、jsPDF（MIT 授權，產生 PDF 與圖卡用）
data/                   題庫 Excel（v3）
scripts/
  build_items.py        Excel → assets/items.js
  test-scoring.js       計分規則自動檢查
  dev-server.js         本機預覽用的簡易伺服器
```

## 本機預覽

直接用瀏覽器打開 `index.html` 即可。

或用本機伺服器（需要 Node.js 18 以上，不必安裝任何套件）：

```bash
npm run dev
```

打開 http://localhost:3000 。

## 部署

### GitHub Pages

1. 把這個資料夾推到 GitHub：
   ```bash
   git init && git add . && git commit -m "Inner Atlas 六合一人格測驗"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/inner-atlas.git
   git push -u origin main
   ```
2. repo 的 **Settings → Pages → Build and deployment**，Source 選 **Deploy from a branch**，Branch 選 `main` 與 `/ (root)`，按 Save。
3. 約一分鐘後，網站會出現在 `https://<你的帳號>.github.io/inner-atlas/`。

### Vercel

1. 同上推到 GitHub。
2. 到 Vercel 選 **Add New → Project**，匯入這個 repo。Framework Preset 選 **Other**，Build Command 與 Output Directory 留空，直接 Deploy。
3. 網站會出現在 `https://<你的專案>.vercel.app`。之後 push 到 GitHub 就會自動重新部署。

其他能放靜態檔案的服務（Netlify、Cloudflare Pages 等）也都可以，把整個資料夾上傳即可。

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

- 網站不蒐集、不上傳任何資料。作答進度與最近一次結果只存在填答者瀏覽器的 localStorage。
- 分享連結把各維度百分比與顯示名稱寫在網址裡（不含逐題作答）。拿到連結的人都能看到，傳出後無法收回。
- 頁面會從 Google Fonts 載入字型，這是網站唯一的外部請求。若想完全不連外，可移除 `index.html` 中的 Google Fonts 連結，改用系統字型。

## 授權提醒

- 大五題目來自 IPIP-50（公有領域）；職涯題改編自 O*NET Interest Profiler（公有領域）。
- 誠實謙遜 10 題來自 HEXACO-60，限非商業與學術用途。若網站未來要商業化，請改用公有領域的 IPIP-HEXACO 題目。
- MBTI® 是 The Myers-Briggs Company 的註冊商標；本站的 16 型結果由大五相關題推估，並非官方 MBTI，也未使用 16Personalities 的類型暱稱。
- DISC 職場題與 16 型補強題為本站自編。
- `assets/vendor/` 內的 html2canvas、jsPDF 皆為 MIT 授權，授權條款附在同資料夾。

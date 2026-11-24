/* 網站設定
   collect：是否蒐集作答資料。
     false（預設）：作答與結果只保存在填答者的瀏覽器，網站是純靜態，不需要資料庫，GitHub Pages 或 Vercel 都能放。
     true：開始作答前會出現「同意提供資料」勾選框，勾選的人作答完成後，資料會以匿名代號存入資料庫。
           需要部署在 Vercel 並連接資料庫（設定方式見 README 的「開啟資料蒐集」）。 */
window.INNER_CONFIG = {
  collect: false
};

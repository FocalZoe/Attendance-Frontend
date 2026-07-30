// TEAM_005: React 前端網頁的總入口檔案 (main.tsx)
// 【非程式人員導覽】：這個檔案是前端網頁畫面的「第一把開關」。
// 當你在瀏覽器輸入網址打開網頁時，瀏覽器會第一個找到此檔案，
// 它負責把我們的 React 元件 (App) 掛載並繪製到網頁的 HTML 畫布 (id="root") 上面。

import { StrictMode } from 'react'; // 載入 React 嚴格模式：開發時幫忙檢查潛在程式 bugs 的防護網
import { createRoot } from 'react-dom/client'; // 載入 React DOM 渲染器：負責將 React 代碼轉化成瀏覽器畫面
import './index.css'; // 載入全區 CSS 樣式檔（含霓虹玻璃擬態風格設計）
import App from './App'; // 匯入主要應用程式主體 App 元件

// 在 HTML 文件中找到 id 為 root 的容器元素，並在此啟動 React 應用程式畫面
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

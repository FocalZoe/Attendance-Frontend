// TEAM_005: API 與 WebSocket 端點位址自動設定與導航模組 (api.ts)
// 【非程式人員導覽】：這個檔案是前端網頁的「門牌地址導航員」。
// 為了讓網頁不管是跑在自己電腦 (localhost)、還是發布到雲端 (如 Render / Vercel)，
// 都能自動找到後端伺服器的門牌號碼，這個檔案會自動偵測與計算正确的 HTTP API 網址與 WebSocket 對講機網址。

/**
 * 取得 HTTP API 基礎網址
 * 優先讀取環境變數 VITE_API_BASE_URL (如 https://my-backend.onrender.com)
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, ''); // 去除末尾多餘的斜線
  }
  return ''; // 若未設定環境變數，預設使用相對路徑
};

/**
 * 取得完整的 API 請求 URL
 * @param path API 相對路徑，例如 '/api/history'
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * 取得 WebSocket 伺服器連線 URL (對講機網址)
 * 優先順序：
 * 1. 讀取 VITE_WS_URL 環境變數
 * 2. 讀取 VITE_API_BASE_URL 並自動將 http:// 轉為 ws:// 或 https:// 轉為 wss://
 * 3. 本地開發環境降景 (ws://localhost:5000)
 * 4. 根據目前瀏覽器網址列 window.location 自動推導 (wss://${window.location.host})
 */
export const getWsUrl = (): string => {
  // 順位 1：顯式指定了 WebSocket 環境變數
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // 順位 2：有設定 API 網址，自動把 http 換成 ws
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    return apiBaseUrl.replace(/^http/, 'ws');
  }

  // 順位 3 & 4：在瀏覽器中自動推導
  if (typeof window !== 'undefined') {
    // 如果是在本機 localhost 開發
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:5000';
    }

    // 若在加密網頁 (https)，對講機自動升級為安全加密模式 (wss)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}`;
  }

  // 預設降級位址
  return 'ws://localhost:5000';
};

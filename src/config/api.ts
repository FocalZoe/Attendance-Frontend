// TEAM_002: API 與 WebSocket 端點統一配置

/**
 * 取得 HTTP API 基礎 URL
 * 優先讀取環境變數 VITE_API_BASE_URL
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
};

/**
 * 取得完整的 API 請求 URL
 * @param path API 路徑，例如 '/api/history' 或 'api/history'
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * 取得 WebSocket 伺服器連線 URL
 * 優先順序：
 * 1. VITE_WS_URL 環境變數
 * 2. VITE_API_BASE_URL 環境變數（自動轉為 ws:// 或 wss://）
 * 3. 本地開發環境 fallback (ws://localhost:5000)
 * 4. 線上 Render 生產環境 fallback (wss://attendance-backend-p1pj.onrender.com)
 */
export const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    return apiBaseUrl.replace(/^http/, 'ws');
  }

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'ws://localhost:5000';
  }

  return 'wss://attendance-backend-p1pj.onrender.com';
};

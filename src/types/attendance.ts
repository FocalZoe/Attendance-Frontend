// TEAM_005: 考勤紀錄資料結構型態定義檔 (attendance.ts)
// 【非程式人員導覽】：這個檔案是我們資料的「表格欄位規格說明書」。
// 在 TypeScript 中，定義 Interface 就像是設計一張標準紙本表單。
// 規範裡面必須包含哪些欄位（如 UUID、時間點、打卡文字說明、照片網址），
// 防止程式寫錯欄位名稱或填錯資料型態。

/**
 * 考勤紀錄的標準表單結構 (AttendanceRecord)
 */
export interface AttendanceRecord {
  id: string;        // 每一筆打卡的專屬身份標籤 UUID (例如 "c56a4180-...")
  create_at: string; // 打卡的時間戳記 (ISO 格式字串，例如 "2026-07-30T14:00:00Z")
  message: string;   // 相機傳過來的通報訊息或辨識姓名 (例如 "門禁考勤刷卡成功: 張小明")
  file_url: string;  // 存放於 Supabase 雲端相簿的圖片公開網址 (例如 "https://.../uploads/img_xxx.jpg")
}

/**
 * 相機或模擬器傳送給後端 API 的通報包裹格式 (TelemetryPayload)
 */
export interface TelemetryPayload {
  message: string;   // 打卡訊息內容
  file: string;      // Base64 編碼的圖片純文字字串
  timestamp?: string;// 可選的打卡時間
}

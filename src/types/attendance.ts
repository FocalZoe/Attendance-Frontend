// TEAM_005 & TEAM_006: 考勤紀錄資料結構型態定義檔 (attendance.ts)
// 【非程式人員導覽】：這個檔案是我們資料的「表格欄位規格說明書」。
// 在 TypeScript 中，定義 Interface 規範欄位型態，並包含 TEAM_006 的 ai_analysis AI 辨識資訊。

export interface AiAnalysisInfo {
  engine?: string;
  detected?: boolean;
  status?: 'SUCCESS' | 'UNRECOGNIZED' | 'NO_FACE';
  confidence?: number;
  recognized_person?: string;
  face_count?: number;
  landmarks_count?: number;
  quality_score?: number;
}

/**
 * 考勤紀錄的標準表單結構 (AttendanceRecord)
 */
export interface AttendanceRecord {
  id: string;        // 每一筆打卡的專屬身份標籤 UUID
  create_at: string; // 打卡的時間戳記 (ISO 格式字串)
  message: string;   // 通報訊息或辨識姓名
  file_url: string;  // 存放於 Supabase 雲端相簿的圖片公開網址
  ai_analysis?: AiAnalysisInfo; // TEAM_006: AI 人臉考勤與影像辨識解析結果
}

/**
 * 相機或模擬器傳送給後端 API 的通報包裹格式 (TelemetryPayload)
 */
export interface TelemetryPayload {
  message: string;   // 打卡訊息內容
  file: string;      // Base64 編碼的圖片純文字字串
  timestamp?: string;// 可選的打卡時間
}

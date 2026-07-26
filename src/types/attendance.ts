// TEAM_001: AttendanceRecord 資料結構型態
export interface AttendanceRecord {
  id: string;
  create_at: string;
  message: string;
  file_url: string;
}

export interface TelemetryPayload {
  message: string;
  file: string; // Base64
  timestamp?: string;
}

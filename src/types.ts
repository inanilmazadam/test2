export type ShotType = "3pt" | "midrange" | "freethrow" | "layup" | "floater";

export interface Theme {
  id: string;
  name: string;
  image: string;
  color: string;
}

export interface Shot {
  id: string;
  timestamp: number;
  type: ShotType;
  made: boolean;
}

export interface DailyStats {
  date: string; // ISO date string (YYYY-MM-DD)
  shots: Shot[];
}

export interface SessionState {
  isActive: boolean;
  type: ShotType;
  makes: number;
  misses: number;
}

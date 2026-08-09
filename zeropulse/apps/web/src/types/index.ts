export type MonitorStatus = "up" | "down" | "unknown";

export interface MonitorWithStats {
  id: string;
  name: string;
  url: string;
  interval: number;
  isActive: boolean;
  alertEmail: string | null;
  slug: string;
  createdAt: string;
  status: MonitorStatus;
  uptimeDay: number | null;
  uptimeWeek: number | null;
  avgResponseTime: number | null;
  lastCheckedAt: string | null;
  lastStatusCode: number | null;
  lastResponseTime: number | null;
  isOngoingIncident: boolean;
}

export interface CheckPoint {
  checkedAt: string;
  responseTimeMs: number | null;
  isUp: boolean;
  statusCode: number | null;
}

export interface UptimeSegment {
  date: string;
  isUp: boolean | null;  // null = no data
  uptimePercent: number;
  checksCount: number;
}

export interface IncidentSummary {
  id: string;
  startedAt: string;
  resolvedAt: string | null;
  isOngoing: boolean;
  errorReason: string | null;
}

export interface StatsResponse {
  uptimeDay: number | null;
  uptimeWeek: number | null;
  avgResponseTimeDay: number | null;
  avgResponseTimeWeek: number | null;
  totalChecksDay: number;
  totalChecksWeek: number;
  currentStreak: number;
  incidents: IncidentSummary[];
}

export interface CreateMonitorPayload {
  name: string;
  url: string;
  interval: number;
  alertEmail?: string;
}

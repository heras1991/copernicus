import type { AlertSeverity } from "../utils/alertSeverity";

export type SegmentAlertSummary = {
  segmentId: string;
  captureDate: string;
  alertCells: number;
  maxNdvi: number;
  severity: AlertSeverity;
};
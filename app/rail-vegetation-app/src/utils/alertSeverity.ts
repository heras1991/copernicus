export type AlertSeverity = "alert" | "high" | "critical";

export const ALERT_NDVI_THRESHOLD = 0.65;

export function getAlertSeverity(value: number): AlertSeverity | null {
  if (!Number.isFinite(value) || value < ALERT_NDVI_THRESHOLD) {
    return null;
  }

  if (value >= 0.8) {
    return "critical";
  }

  if (value >= 0.7) {
    return "high";
  }

  return "alert";
}

export function getAlertRgba(value: number): [number, number, number, number] {
  const severity = getAlertSeverity(value);

  if (severity === "critical") {
    return [88, 28, 135, 235];
  }

  if (severity === "high") {
    return [192, 38, 211, 220];
  }

  return [232, 121, 249, 200];
}

export function getAlertRank(severity: AlertSeverity): number {
  if (severity === "critical") return 3;
  if (severity === "high") return 2;
  return 1;
}

export function getHighestAlertSeverity(
  current: AlertSeverity,
  next: AlertSeverity,
): AlertSeverity {
  return getAlertRank(next) > getAlertRank(current) ? next : current;
}

export function getAlertLabel(severity: AlertSeverity): string {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  return "Alert";
}

export function getAlertClasses(severity: AlertSeverity) {
  if (severity === "critical") {
    return {
      border: "border-purple-400",
      background: "bg-purple-100",
      text: "text-purple-900",
      bar: "bg-purple-900",
    };
  }

  if (severity === "high") {
    return {
      border: "border-fuchsia-300",
      background: "bg-fuchsia-100",
      text: "text-fuchsia-900",
      bar: "bg-fuchsia-600",
    };
  }

  return {
    border: "border-fuchsia-200",
    background: "bg-fuchsia-50",
    text: "text-fuchsia-800",
    bar: "bg-fuchsia-300",
  };
}

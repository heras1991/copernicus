import { useState } from "react";
import type { ManifestData } from "../types/manifest";
import type { SegmentAlertSummary } from "../types/alertSummary";
import useAlertSummary from "../hooks/useAlertSummary";
import { getAlertClasses, getAlertLabel } from "../utils/alertSeverity";

type RightPanelSummaryProps = {
  manifest: ManifestData | null;
  loading: boolean;
  error: string | null;
  onSegmentSelect?: (segmentId: string) => void;
};

type CoverageByDate = {
  date: string;
  sections: number;
  distanceKm: number;
};

type ExtentLevel = "small" | "medium" | "large";

function RightPanelSummary({
  manifest,
  loading,
  error,
  onSegmentSelect,
}: RightPanelSummaryProps) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const {
    alerts,
    loading: alertsLoading,
    error: alertsError,
  } = useAlertSummary(manifest);

  const totalSegments = manifest?.length ?? 0;

  const analysedDistanceKm =
    manifest?.reduce((sum, item) => sum + item.length_m / 1000, 0) ?? 0;

  const analysedDistance =
    analysedDistanceKm > 0 ? `${analysedDistanceKm.toFixed(1)} km` : "No data";

  const coverageByDate = buildCoverageByDate(manifest);

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Soria–Torralba
        </h2>
        <p className="text-xs text-slate-500">
          This summary shows the corridor split into processed 1 km sections and
          the total analysed distance currently covered by the vegetation layer.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <MiniMetrics
  totalSegments={totalSegments}
  analysedDistance={analysedDistance}
/>

<AlertSummarySection
  alerts={visibleAlerts}
  totalAlerts={alerts.length}
  loading={alertsLoading}
  error={alertsError}
  showAllAlerts={showAllAlerts}
  onToggleShowAll={() => setShowAllAlerts((value) => !value)}
  onSegmentSelect={onSegmentSelect}
/>

<AcquisitionDatesSection coverageByDate={coverageByDate} />
        </>
      )}
    </div>
  );
}

function buildCoverageByDate(manifest: ManifestData | null): CoverageByDate[] {
  if (!manifest) {
    return [];
  }

  return Array.from(
    manifest.reduce((map, item) => {
      const current = map.get(item.capture_date) ?? {
        date: item.capture_date,
        sections: 0,
        distanceKm: 0,
      };

      current.sections += 1;
      current.distanceKm += item.length_m / 1000;

      map.set(item.capture_date, current);
      return map;
    }, new Map<string, CoverageByDate>()),
  )
    .map(([, value]) => value)
    .sort((a, b) => a.date.localeCompare(b.date));
}

type MiniMetricsProps = {
  totalSegments: number;
  analysedDistance: string;
};

function MiniMetrics({ totalSegments, analysedDistance }: MiniMetricsProps) {
  return (
    <section className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <MiniMetric label="Sections" value={String(totalSegments)} />
      <div className="h-6 w-px bg-slate-200" />
      <MiniMetric label="Distance" value={analysedDistance} />
    </section>
  );
}

type MiniMetricProps = {
  label: string;
  value: string;
};

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

type AcquisitionDatesSectionProps = {
  coverageByDate: CoverageByDate[];
};

function AcquisitionDatesSection({
  coverageByDate,
}: AcquisitionDatesSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Satellite acquisition dates
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Processed coverage by satellite acquisition date.
      </p>

      <div className="mt-3 space-y-2">
        {coverageByDate.length > 0 ? (
          coverageByDate.map((item) => (
            <div
              key={item.date}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-800">
                {item.date}
              </span>
              <span className="text-xs text-slate-500">
                {item.sections} sections · {item.distanceKm.toFixed(1)} km
              </span>
            </div>
          ))
        ) : (
          <span className="text-sm text-slate-500">No dates available</span>
        )}
      </div>
    </section>
  );
}

type AlertSummarySectionProps = {
  alerts: SegmentAlertSummary[];
  totalAlerts: number;
  loading: boolean;
  error: string | null;
  showAllAlerts: boolean;
  onToggleShowAll: () => void;
  onSegmentSelect?: (segmentId: string) => void;
};

function AlertSummarySection({
  alerts,
  totalAlerts,
  loading,
  error,
  showAllAlerts,
  onToggleShowAll,
  onSegmentSelect,
}: AlertSummarySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Alert summary
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Sections with vegetation intensity and extent indicators.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
          {totalAlerts}
        </span>
      </div>

      <div className="mt-3">
        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-6">
            <Spinner />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && totalAlerts === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <p className="text-sm font-medium text-slate-700">
              No alert sections detected
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              No sections currently show vegetation alerts in the monitored
              corridor.
            </p>
          </div>
        )}

        {!loading && !error && totalAlerts > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-medium text-slate-500">
                  <th className="px-3 py-2 text-left">Km</th>
                  <th className="px-3 py-2 text-right">Intensity</th>
                  <th className="px-3 py-2 text-right">Extent</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <AlertSummaryRow
                    key={alert.segmentId}
                    alert={alert}
                    onClick={
                      onSegmentSelect
                        ? () => onSegmentSelect(alert.segmentId)
                        : undefined
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && totalAlerts > 10 && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {showAllAlerts
            ? "Show fewer sections"
            : `Show all ${totalAlerts} sections`}
        </button>
      )}
    </section>
  );
}

type AlertSummaryRowProps = {
  alert: SegmentAlertSummary;
  onClick?: () => void;
};

function AlertSummaryRow({ alert, onClick }: AlertSummaryRowProps) {
  const intensityClasses = getAlertClasses(alert.severity);
  const intensityLabel = getAlertLabel(alert.severity);
  const extentLevel = getExtentLevel(alert.alertCells);
  const extentClasses = getExtentClasses(extentLevel);

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer bg-white transition hover:bg-slate-50"
    >
      <td
        className="border-l-4 px-3 py-2 text-xs font-medium text-slate-700"
        style={{ borderLeftColor: getSeverityColor(alert.severity) }}
      >
        {formatKmRange(alert.segmentId)}
      </td>

      <td className="px-3 py-2 text-right">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${intensityClasses.background} ${intensityClasses.border} ${intensityClasses.text}`}
        >
          <span>{intensityLabel}</span>
          <span className="opacity-70">{alert.maxNdvi.toFixed(2)}</span>
        </span>
      </td>

      <td className="px-3 py-2 text-right">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${extentClasses.background} ${extentClasses.border} ${extentClasses.text}`}
        >
          <span>{getExtentLabel(extentLevel)}</span>
          <span className="opacity-70">{alert.alertCells}</span>
        </span>
      </td>
    </tr>
  );
}

function getExtentLevel(detections: number): ExtentLevel {
  if (detections > 15) {
    return "large";
  }

  if (detections > 5) {
    return "medium";
  }

  return "small";
}

function getExtentLabel(level: ExtentLevel) {
  if (level === "large") {
    return "Large";
  }

  if (level === "medium") {
    return "Medium";
  }

  return "Small";
}

function getExtentClasses(level: ExtentLevel) {
  if (level === "large") {
    return {
      background: "bg-slate-900",
      border: "border-slate-900",
      text: "text-white",
    };
  }

  if (level === "medium") {
    return {
      background: "bg-slate-100",
      border: "border-slate-300",
      text: "text-slate-700",
    };
  }

  return {
    background: "bg-white",
    border: "border-slate-200",
    text: "text-slate-500",
  };
}

function formatKmRange(segmentId: string) {
  const clean = segmentId
    .replace(/^soria[_-]?torralba[_-]?corridor[_-]?/i, "")
    .replace(/^soria[_-]?torralba[_-]?/i, "")
    .replace(/^segment[_-]?/i, "")
    .replaceAll("_", "-");

  const kmMatch = clean.match(/(\d+(?:\.\d+)?)[^\d]+(\d+(?:\.\d+)?)/);

  if (kmMatch) {
    return `${Number(kmMatch[1])}–${Number(kmMatch[2])}`;
  }

  return clean;
}

function Spinner() {
  return (
    <div
      className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
      aria-label="Loading"
    />
  );
}

function getSeverityColor(severity: SegmentAlertSummary["severity"]) {
  if (severity === "critical") {
    return "#581c87";
  }

  if (severity === "high") {
    return "#c026d3";
  }

  return "#e879f9";
}

export default RightPanelSummary;

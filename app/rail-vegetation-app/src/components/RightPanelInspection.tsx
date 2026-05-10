import { useEffect, useState } from "react";
import type { InspectionSelection } from "./RightPanel";
import { fetchInspectionTimeSeries } from "../services/inspection";
import type { InspectionTimeSeriesResponse } from "../types/inspection";

type RightPanelInspectionProps = {
  inspectionSelection: InspectionSelection;
};

type InspectionStatus = "idle" | "loading" | "success" | "error";

function RightPanelInspection({
  inspectionSelection,
}: RightPanelInspectionProps) {
  const [status, setStatus] = useState<InspectionStatus>("idle");
  const [data, setData] = useState<InspectionTimeSeriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTimeSeries() {
      if (!inspectionSelection) {
        setStatus("idle");
        setData(null);
        setError(null);
        return;
      }

      try {
        setStatus("loading");
        setData(null);
        setError(null);

        const result = await fetchInspectionTimeSeries(inspectionSelection);

        if (!cancelled) {
          setData(result);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unknown inspection error",
          );
          setStatus("error");
        }
      }
    }

    loadTimeSeries();

    return () => {
      cancelled = true;
    };
  }, [inspectionSelection]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Inspection</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          The selected pixel is used as the visual reference on the map. The
          temporal query uses a 3x3 pixel window centered on that location and
          retrieves the last 10 valid dates.
        </p>
      </div>

      {!inspectionSelection && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Selection status
          </h3>
          <p className="mt-2 text-sm text-slate-600">No map selection yet.</p>
        </section>
      )}

      {inspectionSelection && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Selected pixel
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Segment: {inspectionSelection.segmentId}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Capture date: {inspectionSelection.captureDate}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pixel row / col: {inspectionSelection.pixelRow} /{" "}
              {inspectionSelection.pixelCol}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Vegetation value:{" "}
              {inspectionSelection.ndviValue !== null
                ? inspectionSelection.ndviValue.toFixed(3)
                : "No data"}
            </p>
            <p className="mt-1 text-sm text-slate-600">Pixel size: 10 x 10 m</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Temporal query
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Query window: 3 x 3 pixels (30 x 30 m)
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Requested dates: last 10 valid observations
            </p>
          </section>

          {status === "loading" && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Loading time series
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Requesting temporal vegetation history for the selected
                location...
              </p>
            </section>
          )}

          {status === "error" && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-800">
                Inspection error
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </section>
          )}

          {status === "success" && data && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Time series result
              </h3>

              {data.series.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  No valid dates returned for this selection.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.series.map((item) => (
                    <div
                      key={item.date}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm text-slate-700">
                        {item.date}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {item.ndvi !== null ? item.ndvi.toFixed(3) : "No data"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default RightPanelInspection;

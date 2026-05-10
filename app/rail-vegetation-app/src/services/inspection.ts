import type { InspectionSelection } from "../components/RightPanel";
import type { InspectionTimeSeriesResponse } from "../types/inspection";

export async function fetchInspectionTimeSeries(
  selection: NonNullable<InspectionSelection>,
): Promise<InspectionTimeSeriesResponse> {
  const response = await fetch("/api/inspection-timeseries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      segmentId: selection.segmentId,
      captureDate: selection.captureDate,
      pixelRow: selection.pixelRow,
      pixelCol: selection.pixelCol,
      pixelWindowSize: 3,
      requestedDates: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Inspection request failed: ${response.status}`);
  }

  return (await response.json()) as InspectionTimeSeriesResponse;
}
import { useEffect, useState } from "react";
import { fromArrayBuffer } from "geotiff";
import type { MultiPolygon, Polygon } from "geojson";

import type { ManifestData } from "../types/manifest";
import type { SegmentAlertSummary } from "../types/alertSummary";
import { useRailAlertBandData } from "./useRailAlertBandData";
import { pointInGeometry } from "../utils/geometry";
import {
  getAlertSeverity,
  getHighestAlertSeverity,
} from "../utils/alertSeverity";

type AlertSummaryState = {
  alerts: SegmentAlertSummary[];
  loading: boolean;
  error: string | null;
};

function useAlertSummary(manifest: ManifestData | null): AlertSummaryState {
  const {
    data: railAlertBandData,
    loading: railAlertBandLoading,
    error: railAlertBandError,
  } = useRailAlertBandData();

  const [alerts, setAlerts] = useState<SegmentAlertSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function buildSummary() {
      if (!manifest || manifest.length === 0 || !railAlertBandData) {
        setAlerts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const summaryBySegment = new Map<string, SegmentAlertSummary>();

        for (const record of manifest) {
          const alertFeature = railAlertBandData.features.find(
            (feature) =>
              feature.properties?.segment_id === record.segment_id &&
              feature.geometry,
          );

          if (!alertFeature || !alertFeature.geometry) {
            continue;
          }

          const alertGeometry = alertFeature.geometry as Polygon | MultiPolygon;

          const tiffUrl = `/data/ndvi_blocks/${record.corridor_id}/${record.capture_date}/${record.segment_id}_ndvi.tif`;

          const response = await fetch(tiffUrl);
          if (!response.ok) {
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          const tiff = await fromArrayBuffer(arrayBuffer);
          const image = await tiff.getImage();

          const width = image.getWidth();
          const height = image.getHeight();
          const bbox = image.getBoundingBox();

          const minX = bbox[0];
          const maxY = bbox[3];
          const pixelWidth = (bbox[2] - bbox[0]) / width;
          const pixelHeight = (bbox[3] - bbox[1]) / height;

          const raster = await image.readRasters({ interleave: true });
          const values = raster as Float32Array | number[];

          for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
              const index = row * width + col;
              const ndvi = Number(values[index]);
              const severity = getAlertSeverity(ndvi);

              if (!severity) {
                continue;
              }

              const lng = minX + (col + 0.5) * pixelWidth;
              const lat = maxY - (row + 0.5) * pixelHeight;

              if (!pointInGeometry([lng, lat], alertGeometry)) {
                continue;
              }

              const previous = summaryBySegment.get(record.segment_id);

              if (!previous) {
                summaryBySegment.set(record.segment_id, {
                  segmentId: record.segment_id,
                  captureDate: record.capture_date,
                  alertCells: 1,
                  maxNdvi: ndvi,
                  severity,
                });
              } else {
                previous.alertCells += 1;
                previous.maxNdvi = Math.max(previous.maxNdvi, ndvi);
                previous.severity = getHighestAlertSeverity(
                  previous.severity,
                  severity,
                );
              }
            }
          }
        }

        const nextAlerts = Array.from(summaryBySegment.values()).sort((a, b) => {
          if (a.severity !== b.severity) {
            const order = { critical: 3, high: 2, alert: 1 };
            return order[b.severity] - order[a.severity];
          }

          return b.alertCells - a.alertCells;
        });

        if (!cancelled) {
          setAlerts(nextAlerts);
        }
      } catch (summaryError) {
        console.error("Error building alert summary:", summaryError);

        if (!cancelled) {
          setError("Unable to calculate alert summary.");
          setAlerts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    buildSummary();

    return () => {
      cancelled = true;
    };
  }, [manifest, railAlertBandData]);

  return {
    alerts,
    loading: loading || railAlertBandLoading,
    error: error || railAlertBandError,
  };
}

export default useAlertSummary;
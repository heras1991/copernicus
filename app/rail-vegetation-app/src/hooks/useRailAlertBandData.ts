import { useEffect, useState } from "react";
import type {
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Polygon,
} from "geojson";

type RailAlertBandFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  GeoJsonProperties
>;

type UseRailAlertBandDataResult = {
  data: RailAlertBandFeatureCollection | null;
  loading: boolean;
  error: string | null;
};

export function useRailAlertBandData(): UseRailAlertBandDataResult {
  const [data, setData] = useState<RailAlertBandFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRailAlertBand() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/data/rail/soria_torralba_rail_alert_band_wgs84.geojson"
        );
        const text = await response.text();

        if (!response.ok) {
          throw new Error(`Error loading rail alert band: ${response.status}`);
        }

        const json = JSON.parse(text) as RailAlertBandFeatureCollection;
        setData(json);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error loading rail alert band";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadRailAlertBand();
  }, []);

  return { data, loading, error };
}
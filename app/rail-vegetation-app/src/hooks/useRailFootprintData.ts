import { useEffect, useState } from "react";
import type { FeatureCollection, GeoJsonProperties, MultiPolygon, Polygon } from "geojson";

type RailFootprintFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  GeoJsonProperties
>;

type UseRailFootprintDataResult = {
  data: RailFootprintFeatureCollection | null;
  loading: boolean;
  error: string | null;
};

export function useRailFootprintData(): UseRailFootprintDataResult {
  const [data, setData] = useState<RailFootprintFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRailFootprint() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/data/rail/soria_torralba_rail_footprint_wgs84.geojson");
        const text = await response.text();

        if (!response.ok) {
          throw new Error(`Error loading rail footprint: ${response.status}`);
        }

        const json = JSON.parse(text) as RailFootprintFeatureCollection;
        setData(json);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error loading rail footprint";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadRailFootprint();
  }, []);

  return { data, loading, error };
}
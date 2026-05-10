import { useEffect, useState } from "react";
import type { RailFeatureCollection } from "../types/rail";

type UseRailDataResult = {
  data: RailFeatureCollection | null;
  loading: boolean;
  error: string | null;
};

export function useRailData(): UseRailDataResult {
  const [data, setData] = useState<RailFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRail() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/data/rail/soria_torralba_axis.geojson");
        if (!response.ok) {
          throw new Error(`Error cargando GeoJSON: ${response.status}`);
        }

        const json = (await response.json()) as RailFeatureCollection;
        setData(json);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido cargando la vía";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadRail();
  }, []);

  return { data, loading, error };
}
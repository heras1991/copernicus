import { useEffect, useState } from "react";
import type { CorridorFeatureCollection } from "../types/corridor";

type UseCorridorDataResult = {
  data: CorridorFeatureCollection | null;
  loading: boolean;
  error: string | null;
};

export function useCorridorData(): UseCorridorDataResult {
  const [data, setData] = useState<CorridorFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCorridor() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/data/rail/soria_torralba_corridor_blocks_wgs84.geojson");
        if (!response.ok) {
          throw new Error(`Error cargando corredor: ${response.status}`);
        }

        const json = (await response.json()) as CorridorFeatureCollection;
        setData(json);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido cargando el corredor";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCorridor();
  }, []);

  return { data, loading, error };
}
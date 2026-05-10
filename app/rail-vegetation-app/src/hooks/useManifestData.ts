import { useEffect, useState } from "react";
import type { ManifestData } from "../types/manifest";

type UseManifestDataResult = {
  data: ManifestData | null;
  loading: boolean;
  error: string | null;
};

export function useManifestData(): UseManifestDataResult {
  const [data, setData] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadManifest() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/data/ndvi_blocks/soria_torralba/manifest.json");
        const text = await response.text();

        if (!response.ok) {
          throw new Error(`Error cargando manifest: ${response.status}`);
        }

        const json = JSON.parse(text) as ManifestData;
        setData(json);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido cargando el manifest";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadManifest();
  }, []);

  return { data, loading, error };
}
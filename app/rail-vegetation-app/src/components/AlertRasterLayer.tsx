import { useEffect, useMemo, useState } from "react";
import { ImageOverlay } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { fromArrayBuffer } from "geotiff";
import type { MultiPolygon, Polygon } from "geojson";

import { pointInGeometry } from "../utils/geometry";
import { getAlertRgba, getAlertSeverity } from "../utils/alertSeverity";

type AlertRasterLayerProps = {
  tiffUrl: string;
  alertGeometry: Polygon | MultiPolygon;
};

type RasterOverlayData = {
  imageUrl: string;
  bounds: LatLngBoundsExpression;
};

function AlertRasterLayer({ tiffUrl, alertGeometry }: AlertRasterLayerProps) {
  const [overlayData, setOverlayData] = useState<RasterOverlayData | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRaster() {
      try {
        const response = await fetch(tiffUrl);
        if (!response.ok) {
          throw new Error(`Unable to download TIFF: ${response.status}`);
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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Unable to create 2D canvas context");
        }

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
            const i = row * width + col;
            const ndvi = Number(values[i]);
            const idx = i * 4;

            const severity = getAlertSeverity(ndvi);

            if (!severity) {
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 0;
              continue;
            }

            const lng = minX + (col + 0.5) * pixelWidth;
            const lat = maxY - (row + 0.5) * pixelHeight;

            const insideAlertBand = pointInGeometry([lng, lat], alertGeometry);
            if (!insideAlertBand) {
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 0;
              continue;
            }

            const [r, g, b, a] = getAlertRgba(ndvi);
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const imageUrl = canvas.toDataURL("image/png");
        const bounds: LatLngBoundsExpression = [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ];

        if (!cancelled) {
          setOverlayData({ imageUrl, bounds });
        }
      } catch (error) {
        console.error("Error loading alert raster:", error);
      }
    }

    loadRaster();

    return () => {
      cancelled = true;
    };
  }, [tiffUrl, alertGeometry]);

  const overlay = useMemo(() => overlayData, [overlayData]);

  if (!overlay) return null;

  return (
    <ImageOverlay
      url={overlay.imageUrl}
      bounds={overlay.bounds}
      opacity={1}
      zIndex={460}
    />
  );
}

export default AlertRasterLayer;

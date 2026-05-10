import { useEffect, useMemo, useState } from "react";
import { ImageOverlay } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { fromArrayBuffer } from "geotiff";
import type { MultiPolygon, Polygon } from "geojson";

type NdviRasterLayerProps = {
  tiffUrl: string;
  corridorGeometry: Polygon | MultiPolygon;
};

type RasterOverlayData = {
  imageUrl: string;
  bounds: LatLngBoundsExpression;
};

function getNdviColor(value: number): [number, number, number, number] {
  if (!Number.isFinite(value)) return [0, 0, 0, 0];
  if (value < 0) return [255, 255, 255, 0];
  if (value < 0.15) return [248, 250, 252, 60];
  if (value < 0.3) return [220, 252, 231, 90];
  if (value < 0.45) return [187, 247, 208, 120];
  if (value < 0.6) return [134, 239, 172, 150];
  if (value < 0.75) return [74, 222, 128, 180];
  return [22, 163, 74, 210];
}

function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInPolygon(
  point: [number, number],
  polygonCoords: number[][][],
): boolean {
  if (polygonCoords.length === 0) return false;
  if (!pointInRing(point, polygonCoords[0])) return false;

  for (let i = 1; i < polygonCoords.length; i++) {
    if (pointInRing(point, polygonCoords[i])) return false;
  }

  return true;
}

function pointInGeometry(
  point: [number, number],
  geometry: Polygon | MultiPolygon,
): boolean {
  if (geometry.type === "Polygon")
    return pointInPolygon(point, geometry.coordinates);
  return geometry.coordinates.some((polygonCoords) =>
    pointInPolygon(point, polygonCoords),
  );
}

function NdviRasterLayer({ tiffUrl, corridorGeometry }: NdviRasterLayerProps) {
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

            const lng = minX + (col + 0.5) * pixelWidth;
            const lat = maxY - (row + 0.5) * pixelHeight;

            const insideCorridor = pointInGeometry(
              [lng, lat],
              corridorGeometry,
            );
            const idx = i * 4;

            if (!insideCorridor) {
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 0;
              continue;
            }

            const [r, g, b, a] = getNdviColor(ndvi);
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
        console.error("Error loading NDVI GeoTIFF:", error);
      }
    }

    loadRaster();

    return () => {
      cancelled = true;
    };
  }, [tiffUrl, corridorGeometry]);

  const overlay = useMemo(() => overlayData, [overlayData]);

  if (!overlay) return null;

  return (
    <ImageOverlay
      url={overlay.imageUrl}
      bounds={overlay.bounds}
      opacity={1}
      zIndex={420}
    />
  );
}

export default NdviRasterLayer;

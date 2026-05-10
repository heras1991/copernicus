import { useEffect, useMemo, useState } from "react";
import { ImageOverlay } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { fromArrayBuffer } from "geotiff";
import type { MultiPolygon, Polygon } from "geojson";

type PixelGridLayerProps = {
  tiffUrl: string;
  corridorGeometry: Polygon | MultiPolygon;
};

type GridOverlayData = {
  imageUrl: string;
  bounds: LatLngBoundsExpression;
};

const GRID_SCALE = 10; // cada pixel raster se representa con 12x12 px en el canvas debug

function projectLngLatToPixel(
  lng: number,
  lat: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  width: number,
  height: number,
): [number, number] {
  const x = ((lng - minX) / (maxX - minX)) * width;
  const y = ((maxY - lat) / (maxY - minY)) * height;
  return [x, y];
}

function drawPolygonPath(
  ctx: CanvasRenderingContext2D,
  geometry: Polygon | MultiPolygon,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  width: number,
  height: number,
) {
  const drawRing = (ring: number[][]) => {
    if (ring.length === 0) return;

    const [firstLng, firstLat] = ring[0];
    const [firstX, firstY] = projectLngLatToPixel(
      firstLng,
      firstLat,
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
    );

    ctx.moveTo(firstX, firstY);

    for (let i = 1; i < ring.length; i++) {
      const [lng, lat] = ring[i];
      const [x, y] = projectLngLatToPixel(
        lng,
        lat,
        minX,
        minY,
        maxX,
        maxY,
        width,
        height,
      );
      ctx.lineTo(x, y);
    }

    ctx.closePath();
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach(drawRing);
    return;
  }

  geometry.coordinates.forEach((polygon) => {
    polygon.forEach(drawRing);
  });
}

function PixelGridLayer({ tiffUrl, corridorGeometry }: PixelGridLayerProps) {
  const [overlayData, setOverlayData] = useState<GridOverlayData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGrid() {
      try {
        const response = await fetch(tiffUrl);
        if (!response.ok) {
          throw new Error(`Unable to download TIFF: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const tiff = await fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();

        const rasterWidth = image.getWidth();
        const rasterHeight = image.getHeight();
        const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]

        const minX = bbox[0];
        const minY = bbox[1];
        const maxX = bbox[2];
        const maxY = bbox[3];

        // Canvas ampliado para que la grid sea realmente visible
        const canvasWidth = rasterWidth * GRID_SCALE;
        const canvasHeight = rasterHeight * GRID_SCALE;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Unable to create 2D canvas context");
        }

        // Fondo transparente
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Clip al corredor real
        ctx.save();
        ctx.beginPath();
        drawPolygonPath(
          ctx,
          corridorGeometry,
          minX,
          minY,
          maxX,
          maxY,
          canvasWidth,
          canvasHeight,
        );
        ctx.clip();

        // Grid visible de debug
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 0.25;

        // Líneas verticales de celda
        for (let col = 0; col <= rasterWidth; col++) {
          const x = col * GRID_SCALE + 0.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }

        // Líneas horizontales de celda
        for (let row = 0; row <= rasterHeight; row++) {
          const y = row * GRID_SCALE + 0.5;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }

        ctx.restore();

        const imageUrl = canvas.toDataURL("image/png");
        const bounds: LatLngBoundsExpression = [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ];

        if (!cancelled) {
          setOverlayData({ imageUrl, bounds });
        }
      } catch (error) {
        console.error("Error loading pixel grid:", error);
      }
    }

    loadGrid();

    return () => {
      cancelled = true;
    };
  }, [tiffUrl, corridorGeometry]);

  const overlay = useMemo(() => overlayData, [overlayData]);

  if (!overlay) return null;

  return (
    <ImageOverlay url={overlay.imageUrl} bounds={overlay.bounds} opacity={1} />
  );
}

export default PixelGridLayer;

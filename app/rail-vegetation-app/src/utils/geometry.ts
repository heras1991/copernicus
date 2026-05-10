import type { MultiPolygon, Polygon } from "geojson";

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

export function pointInGeometry(
  point: [number, number],
  geometry: Polygon | MultiPolygon,
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  return geometry.coordinates.some((polygonCoords) =>
    pointInPolygon(point, polygonCoords),
  );
}
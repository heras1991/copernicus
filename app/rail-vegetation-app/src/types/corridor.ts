import type { FeatureCollection, GeoJsonProperties, Polygon, MultiPolygon } from "geojson";

export type CorridorFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  GeoJsonProperties
>;
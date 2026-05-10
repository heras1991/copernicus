import type { FeatureCollection, GeoJsonProperties, Polygon, MultiPolygon } from "geojson";

export type RailFootprintFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  GeoJsonProperties
>;
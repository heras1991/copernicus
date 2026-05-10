import type { FeatureCollection, GeoJsonProperties, LineString, MultiLineString } from "geojson";

export type RailFeatureCollection = FeatureCollection<
  LineString | MultiLineString,
  GeoJsonProperties
>;
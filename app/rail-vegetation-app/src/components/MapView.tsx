import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Rectangle,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import type {
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Polygon,
} from "geojson";
import { fromArrayBuffer } from "geotiff";
import "leaflet/dist/leaflet.css";

import type { BaseMapMode } from "../App";
import type { InspectionSelection } from "./RightPanel";
import { useRailData } from "../hooks/useRailData";
import { useRailFootprintData } from "../hooks/useRailFootprintData";
import { useCorridorData } from "../hooks/useCorridorData";
import { useManifestData } from "../hooks/useManifestData";
import { useRailAlertBandData } from "../hooks/useRailAlertBandData";
import NdviRasterLayer from "./NdviRasterLayer";
import PixelGridLayer from "./PixelGridLayer";
import AlertRasterLayer from "./AlertRasterLayer";

type CorridorGeoJson = FeatureCollection<
  Polygon | MultiPolygon,
  GeoJsonProperties
>;

type RailFootprintGeoJson = FeatureCollection<
  Polygon | MultiPolygon,
  GeoJsonProperties
>;

type MapViewProps = {
  baseMap: BaseMapMode;
  showRaster: boolean;
  showRailLine: boolean;
  showCorridor: boolean;
  showPixelGrid: boolean;
  showAlerts: boolean;
  focusedSegmentId?: string | null;
  onInspectionClick?: (selection: InspectionSelection) => void;
};

type ManifestRecord = {
  corridor_id: string;
  segment_id: string;
  capture_date: string;
};

function MapClickHandler({
  onClick,
}: {
  onClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onClick?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function FitToSegment({
  corridorData,
  segmentId,
}: {
  corridorData: CorridorGeoJson | null;
  segmentId?: string | null;
}) {
  const map = useMapEvents({});

  useEffect(() => {
    if (!corridorData || !segmentId) return;

    const feature = corridorData.features.find(
      (item) => item.properties?.segment_id === segmentId,
    );

    if (!feature?.geometry) return;

    const bounds = L.geoJSON(feature).getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 17,
      });
    }
  }, [corridorData, map, segmentId]);

  return null;
}

function getBaseMapConfig(mode: BaseMapMode) {
  if (mode === "satellite") {
    return {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
    };
  }

  if (mode === "dark") {
    return {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    };
  }

  return {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  };
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
  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  return geometry.coordinates.some((polygonCoords) =>
    pointInPolygon(point, polygonCoords),
  );
}

async function buildInspectionSelection(params: {
  lat: number;
  lng: number;
  record: ManifestRecord;
}): Promise<InspectionSelection> {
  const { lat, lng, record } = params;

  const tiffUrl = `/data/ndvi_blocks/${record.corridor_id}/${record.capture_date}/${record.segment_id}_ndvi.tif`;

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
  const maxX = bbox[2];
  const maxY = bbox[3];

  const pixelWidth = (maxX - minX) / width;
  const pixelHeight = (bbox[3] - bbox[1]) / height;

  let pixelCol = Math.floor((lng - minX) / pixelWidth);
  let pixelRow = Math.floor((maxY - lat) / pixelHeight);

  pixelCol = Math.max(0, Math.min(width - 1, pixelCol));
  pixelRow = Math.max(0, Math.min(height - 1, pixelRow));

  const raster = await image.readRasters({ interleave: true });
  const values = raster as Float32Array | number[];

  const pixelIndex = pixelRow * width + pixelCol;
  const rawNdviValue = Number(values[pixelIndex]);
  const ndviValue = Number.isFinite(rawNdviValue) ? rawNdviValue : null;

  const west = minX + pixelCol * pixelWidth;
  const east = minX + (pixelCol + 1) * pixelWidth;
  const north = maxY - pixelRow * pixelHeight;
  const south = maxY - (pixelRow + 1) * pixelHeight;

  return {
    lat,
    lng,
    segmentId: record.segment_id,
    captureDate: record.capture_date,
    pixelWindowSize: 1,
    groundWindowMeters: 10,
    pixelRow,
    pixelCol,
    ndviValue,
    bounds: [
      [south, west],
      [north, east],
    ],
  };
}

function MapView({
  baseMap,
  showRaster,
  showRailLine,
  showCorridor,
  showPixelGrid,
  showAlerts,
  focusedSegmentId,
  onInspectionClick,
}: MapViewProps) {
  const {
    data: railData,
    loading: railLoading,
    error: railError,
  } = useRailData();

  const {
    data: railFootprintData,
    loading: railFootprintLoading,
    error: railFootprintError,
  } = useRailFootprintData();

  const {
    data: corridorData,
    loading: corridorLoading,
    error: corridorError,
  } = useCorridorData();

  const {
    data: manifest,
    loading: manifestLoading,
    error: manifestError,
  } = useManifestData();

  const {
    data: railAlertBandData,
    loading: railAlertBandLoading,
    error: railAlertBandError,
  } = useRailAlertBandData();

  const [selectedInspection, setSelectedInspection] =
    useState<InspectionSelection>(null);

  const defaultCenter: [number, number] = [41.55, -2.75];
  const defaultZoom = 12;
  const baseMapConfig = getBaseMapConfig(baseMap);
  const rasterRecords = useMemo(() => manifest ?? [], [manifest]);

  async function handleMapClick(lat: number, lng: number) {
    if (!corridorData || !manifest) return;

    const point: [number, number] = [lng, lat];

    const corridorFeature = corridorData.features.find((feature) => {
      if (!feature.geometry) return false;
      return pointInGeometry(point, feature.geometry as Polygon | MultiPolygon);
    });

    if (!corridorFeature) {
      return;
    }

    const segmentId = String(corridorFeature.properties?.segment_id ?? "");
    if (!segmentId) {
      return;
    }

    const record = (manifest as ManifestRecord[]).find(
      (item) => item.segment_id === segmentId,
    );

    if (!record) {
      return;
    }

    try {
      const selection = await buildInspectionSelection({
        lat,
        lng,
        record,
      });

      setSelectedInspection(selection);
      onInspectionClick?.(selection);
    } catch (error) {
      console.error("Error building inspection selection:", error);
    }
  }

  console.log("showAlerts:", showAlerts);
  console.log("railAlertBandData loaded:", !!railAlertBandData);
  console.log(
    "railAlertBand features:",
    railAlertBandData?.features?.length ?? 0,
  );
  console.log("rasterRecords:", rasterRecords.length);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution={baseMapConfig.attribution}
          url={baseMapConfig.url}
        />

        <MapClickHandler onClick={handleMapClick} />
        <FitToSegment
  corridorData={corridorData as CorridorGeoJson | null}
  segmentId={focusedSegmentId}
/>

        {(showRaster || showPixelGrid) &&
          rasterRecords.map((record) => {
            const tiffUrl = `/data/ndvi_blocks/${record.corridor_id}/${record.capture_date}/${record.segment_id}_ndvi.tif`;

            const corridorFeature = corridorData?.features.find(
              (feature) => feature.properties?.segment_id === record.segment_id,
            );

            if (!corridorFeature || !corridorFeature.geometry) {
              return null;
            }

            return (
              <div key={record.segment_id}>
                {showRaster && (
                  <NdviRasterLayer
                    tiffUrl={tiffUrl}
                    corridorGeometry={corridorFeature.geometry}
                  />
                )}

                {showPixelGrid && (
                  <PixelGridLayer
                    tiffUrl={tiffUrl}
                    corridorGeometry={corridorFeature.geometry}
                  />
                )}
              </div>
            );
          })}

        {showAlerts &&
          railAlertBandData &&
          rasterRecords.map((record) => {
            const tiffUrl = `/data/ndvi_blocks/${record.corridor_id}/${record.capture_date}/${record.segment_id}_ndvi.tif`;

            const alertFeature = railAlertBandData.features.find(
              (feature) => feature.properties?.segment_id === record.segment_id,
            );

            if (!alertFeature || !alertFeature.geometry) {
              return null;
            }

            return (
              <AlertRasterLayer
                key={`alert-${record.segment_id}`}
                tiffUrl={tiffUrl}
                alertGeometry={alertFeature.geometry}
              />
            );
          })}

        {showCorridor && corridorData && (
          <GeoJSON
            data={corridorData as CorridorGeoJson}
            style={() => ({
              color: "#000000",
              weight: 1,
              opacity: 0.2,
              fillColor: "#000000",
              fillOpacity: 0,
            })}
          />
        )}

        {showRailLine && railData && (
          <>
            <GeoJSON
              data={railData}
              style={() => ({
                color: baseMap === "dark" ? "#cbd5e1" : "#475569",
                weight: 2,
                opacity: 0.7,
              })}
            />

            {railFootprintData && (
              <GeoJSON
                data={railFootprintData as RailFootprintGeoJson}
                style={() => ({
                  color: "#475569",
                  weight: 1,
                  opacity: 0.8,
                  fillColor: "#475569",
                  fillOpacity: 0.65,
                })}
              />
            )}
          </>
        )}

        {selectedInspection && (
          <Rectangle
            bounds={selectedInspection.bounds}
            pathOptions={{
              color: "rgba(0, 0, 0, 0.75)",
              weight: 1,
              fillColor: "rgba(0, 0, 0, 0.25)",
              fillOpacity: 0.5,
            }}
          />
        )}
      </MapContainer>

      {(railLoading ||
        railFootprintLoading ||
        corridorLoading ||
        manifestLoading ||
        railAlertBandLoading) && (
        <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-sm text-slate-700 shadow">
          Loading geospatial data...
        </div>
      )}
      {(railError ||
        railFootprintError ||
        corridorError ||
        manifestError ||
        railAlertBandError) && (
        <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
          {railError ??
            railFootprintError ??
            corridorError ??
            manifestError ??
            railAlertBandError}
        </div>
      )}
    </div>
  );
}

export default MapView;

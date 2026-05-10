export type TimeSeriesPoint = {
  date: string;
  ndvi: number | null;
};

export type InspectionTimeSeriesResponse = {
  segmentId: string;
  captureDate: string;
  pixelRow: number;
  pixelCol: number;
  pixelWindowSize: number;
  groundWindowMeters: number;
  series: TimeSeriesPoint[];
};
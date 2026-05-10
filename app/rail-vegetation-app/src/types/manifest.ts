export type ManifestRecord = {
  corridor_id: string;
  segment_index: number;
  segment_id: string;
  start_km: number;
  end_km: number;
  length_m: number;
  capture_date: string;
  output_file: string;
  metadata_file: string;
  width_px: number;
  height_px: number;
};

export type ManifestData = ManifestRecord[];
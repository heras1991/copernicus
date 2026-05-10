import { PanelRightClose } from "lucide-react";
import type { ManifestData } from "../types/manifest";
import type { RightPanelMode } from "../App";
import RightPanelSummary from "./RightPanelSummary";
import RightPanelInspection from "./RightPanelInspection";

export type InspectionSelection = {
  lat: number;
  lng: number;
  segmentId: string;
  captureDate: string;
  pixelWindowSize: number;
  groundWindowMeters: number;
  pixelRow: number;
  pixelCol: number;
  ndviValue: number | null;
  bounds: [[number, number], [number, number]];
} | null;

type RightPanelProps = {
  isOpen: boolean;
  mode: RightPanelMode;
  onModeChange: (mode: RightPanelMode) => void;
  onClose: () => void;
  manifest: ManifestData | null;
  loading: boolean;
  error: string | null;
  inspectionSelection: InspectionSelection;
  onSegmentSelect?: (segmentId: string) => void;
};

function RightPanel({
  mode,
  onModeChange,
  onClose,
  manifest,
  loading,
  error,
  inspectionSelection,
  onSegmentSelect,
}: RightPanelProps) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <PanelTab
            label="Summary"
            active={mode === "summary"}
            onClick={() => onModeChange("summary")}
          />
          <PanelTab
            label="Inspection"
            active={mode === "inspection"}
            onClick={() => onModeChange("inspection")}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Close panel"
          title="Close panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[calc(75vh-56px)] overflow-y-auto px-4 py-4">
        {mode === "summary" ? (
          <RightPanelSummary
            manifest={manifest}
            loading={loading}
            error={error}
            onSegmentSelect={onSegmentSelect}
          />
        ) : (
          <RightPanelInspection inspectionSelection={inspectionSelection} />
        )}
      </div>
    </div>
  );
}

type PanelTabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function PanelTab({ label, active, onClick }: PanelTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default RightPanel;

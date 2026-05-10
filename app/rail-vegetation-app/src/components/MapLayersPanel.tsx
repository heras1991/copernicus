import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import LayerLegend from "./LayerLegend";
import LayerToggle from "./LayerToggle";

type MapLayersPanelProps = {
  showRaster: boolean;
  onShowRasterChange: (value: boolean) => void;
  showAlerts: boolean;
  onShowAlertsChange: (value: boolean) => void;
  showRailLine: boolean;
  onShowRailLineChange: (value: boolean) => void;
  showCorridor: boolean;
  onShowCorridorChange: (value: boolean) => void;
  showPixelGrid: boolean;
  onShowPixelGridChange: (value: boolean) => void;
};

type PanelTab = "layers" | "legend";

function MapLayersPanel({
  showRaster,
  onShowRasterChange,
  showAlerts,
  onShowAlertsChange,
  showRailLine,
  onShowRailLineChange,
  showCorridor,
  onShowCorridorChange,
  showPixelGrid,
  onShowPixelGridChange,
}: MapLayersPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("layers");

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex gap-2">
          <TabButton
            label="Layers"
            active={activeTab === "layers"}
            onClick={() => setActiveTab("layers")}
          />
          <TabButton
            label="Legend"
            active={activeTab === "legend"}
            onClick={() => setActiveTab("legend")}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label={isOpen ? "Collapse map panel" : "Expand map panel"}
          title={isOpen ? "Collapse map panel" : "Expand map panel"}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="px-4 py-4">
          {activeTab === "layers" && (
            <div className="space-y-3">
              <LayerControlRow
                title="Vegetation cover"
                description="Shows where vegetation is present along the railway corridor."
                checked={showRaster}
                onChange={onShowRasterChange}
              />

              <LayerControlRow
                title="Vegetation alerts"
                description="Highlights areas where vegetation may require field inspection."
                checked={showAlerts}
                onChange={onShowAlertsChange}
              />

              <LayerControlRow
                title="Rail area"
                description="Shows the approximate railway track and nearby infrastructure."
                checked={showRailLine}
                onChange={onShowRailLineChange}
              />

              <LayerControlRow
                title="Railway sections"
                description="Shows the railway sections included in this pilot."
                checked={showCorridor}
                onChange={onShowCorridorChange}
              />

              <LayerControlRow
                title="Pixel grid"
                description="Shows the detailed cells used to select an exact inspection point."
                checked={showPixelGrid}
                onChange={onShowPixelGridChange}
              />
            </div>
          )}

          {activeTab === "legend" && (
            <LayerLegend showVegetation={showRaster} showAlerts={showAlerts} />
          )}
        </div>
      )}
    </div>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

type LayerControlRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function LayerControlRow({
  title,
  description,
  checked,
  onChange,
}: LayerControlRowProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pr-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">
            {description}
          </p>
        </div>

        <div className="shrink-0 pt-0.5">
          <LayerToggle label="" checked={checked} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}

export default MapLayersPanel;

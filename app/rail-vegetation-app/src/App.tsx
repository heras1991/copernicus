import { useState } from "react";

import AppLayout from "./components/AppLayout";
import AppHeader from "./components/AppHeader";
import MapView from "./components/MapView";
import RightPanel from "./components/RightPanel";
import type { InspectionSelection } from "./components/RightPanel";
import { useManifestData } from "./hooks/useManifestData";
import MapLayersPanel from "./components/MapLayersPanel";

export type BaseMapMode = "satellite" | "light" | "dark";
export type RightPanelMode = "summary" | "inspection";

function App() {
  const corridorName = "Soria-Torralba";

  const [baseMap, setBaseMap] = useState<BaseMapMode>("satellite");
  const [showRaster, setShowRaster] = useState(true);
  const [showRailLine, setShowRailLine] = useState(false);
  const [showCorridor, setShowCorridor] = useState(false);
  const [showPixelGrid, setShowPixelGrid] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelMode, setRightPanelMode] =
    useState<RightPanelMode>("summary");

  const [inspectionSelection, setInspectionSelection] =
    useState<InspectionSelection>(null);

  const [focusedSegmentId, setFocusedSegmentId] = useState<string | null>(null);
  const {
    data: manifest,
    loading: manifestLoading,
    error: manifestError,
  } = useManifestData();

  function openRightPanel(mode?: RightPanelMode) {
    setIsRightPanelOpen(true);
    if (mode) setRightPanelMode(mode);
  }


  function handleMapInspectionClick(selection: InspectionSelection) {
    setInspectionSelection(selection);
    setRightPanelMode("inspection");
    setIsRightPanelOpen(true);
  }

  return (
    <AppLayout
      header={
        <AppHeader
          selectedCorridor={corridorName}
          baseMap={baseMap}
          onBaseMapChange={setBaseMap}
        />
      }
      map={
        <div className="relative h-full w-full">
          <MapView
            baseMap={baseMap}
            showRaster={showRaster}
            showRailLine={showRailLine}
            showCorridor={showCorridor}
            showPixelGrid={showPixelGrid}
            showAlerts={showAlerts}
            focusedSegmentId={focusedSegmentId}
            onInspectionClick={handleMapInspectionClick}
          />

          <div className="pointer-events-none absolute bottom-4 left-4 z-[1250] w-[390px]">
            {" "}
            <div className="pointer-events-auto">
              <MapLayersPanel
                showRaster={showRaster}
                onShowRasterChange={setShowRaster}
                showAlerts={showAlerts}
                onShowAlertsChange={setShowAlerts}
                showRailLine={showRailLine}
                onShowRailLineChange={setShowRailLine}
                showCorridor={showCorridor}
                onShowCorridorChange={setShowCorridor}
                showPixelGrid={showPixelGrid}
                onShowPixelGridChange={setShowPixelGrid}
              />
            </div>
          </div>
        </div>
      }
      rightPanel={
        <RightPanel
          isOpen={isRightPanelOpen}
          mode={rightPanelMode}
          onModeChange={setRightPanelMode}
          onClose={() => setIsRightPanelOpen(false)}
          manifest={manifest}
          loading={manifestLoading}
          error={manifestError}
          inspectionSelection={inspectionSelection}
          onSegmentSelect={setFocusedSegmentId}
        />
      }
      isRightPanelOpen={isRightPanelOpen}
      onOpenRightPanel={() => openRightPanel("summary")}
    />
  );
}

export default App;

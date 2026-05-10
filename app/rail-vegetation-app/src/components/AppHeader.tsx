import type { BaseMapMode } from "../App";
import MapBaseSwitcher from "./MapBaseSwitcher";

type AppHeaderProps = {
  selectedCorridor: string;
  baseMap: BaseMapMode;
  onBaseMapChange: (value: BaseMapMode) => void;
};

function AppHeader({
  selectedCorridor,
  baseMap,
  onBaseMapChange,
}: AppHeaderProps) {
  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
          RV
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex rounded-xl bg-slate-100 p-1 shadow-sm">
          <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm">
            {selectedCorridor}
          </div>
        </div>

        <MapBaseSwitcher value={baseMap} onChange={onBaseMapChange} />
      </div>
    </div>
  );
}

export default AppHeader;

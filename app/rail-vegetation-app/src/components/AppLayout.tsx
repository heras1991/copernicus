import type { ReactNode } from "react";
import { PanelRightOpen } from "lucide-react";

type AppLayoutProps = {
  header: ReactNode;
  map: ReactNode;
  rightPanel: ReactNode;
  isRightPanelOpen: boolean;
  onOpenRightPanel: () => void;
};

function AppLayout({
  header,
  map,
  rightPanel,
  isRightPanelOpen,
  onOpenRightPanel,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100">
      <header className="z-[1200] h-16 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        {header}
      </header>

      <main className="relative min-h-0 flex-1">
        <section className="relative h-full w-full">{map}</section>

        {!isRightPanelOpen && (
          <button
            type="button"
            onClick={onOpenRightPanel}
            className="absolute right-4 top-4 z-[1300] rounded-full border border-slate-200 bg-white/95 p-3 text-slate-700 shadow-lg backdrop-blur transition hover:bg-slate-50"
            aria-label="Open panel"
            title="Open panel"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        )}

        {isRightPanelOpen && (
          <div className="pointer-events-none absolute right-4 top-4 z-[1250] w-[380px]">
            <div className="pointer-events-auto max-h-[75vh] w-full">
              {rightPanel}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AppLayout;

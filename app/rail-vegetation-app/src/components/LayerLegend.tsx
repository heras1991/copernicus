type LayerLegendProps = {
  showVegetation: boolean;
  showAlerts: boolean;
};

function LayerLegend({ showVegetation, showAlerts }: LayerLegendProps) {
  if (!showVegetation && !showAlerts) {
    return (
      <p className="text-sm text-slate-500">
        Enable vegetation or alerts to show the map legend.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {showVegetation && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Vegetation cover
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Green tones show where vegetation is present along the railway
            corridor.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <LegendItem colorClass="bg-slate-50" label="Very low" />
            <LegendItem colorClass="bg-green-200" label="Moderate" />
            <LegendItem colorClass="bg-green-500" label="High" />
          </div>
        </section>
      )}

      {showAlerts && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Inspection alerts
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Purple tones highlight vegetation areas that may require inspection
            near the rail line.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <LegendItem colorClass="bg-fuchsia-300" label="Alert" />
            <LegendItem colorClass="bg-fuchsia-600" label="High" />
            <LegendItem colorClass="bg-purple-900" label="Critical" />
          </div>
        </section>
      )}
    </div>
  );
}

type LegendItemProps = {
  colorClass: string;
  label: string;
};

function LegendItem({ colorClass, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-6 rounded ring-1 ring-slate-200 ${colorClass}`} />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

export default LayerLegend;
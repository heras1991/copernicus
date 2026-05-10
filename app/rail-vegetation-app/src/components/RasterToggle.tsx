import { Loader2 } from "lucide-react";

type RasterToggleProps = {
  checked: boolean;
  loading?: boolean;
  onChange: (value: boolean) => void;
};

function RasterToggle({ checked, loading = false, onChange }: RasterToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm transition",
        checked
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
      aria-pressed={checked}
      title="Mostrar u ocultar capa de vegetación"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span
          className={[
            "inline-block h-2.5 w-2.5 rounded-full",
            checked ? "bg-green-400" : "bg-slate-300",
          ].join(" ")}
        />
      )}

      Vegetation
    </button>
  );
}

export default RasterToggle;
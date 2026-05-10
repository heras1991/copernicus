type BaseMapMode = "satellite" | "light" | "dark";

type MapBaseSwitcherProps = {
  value: BaseMapMode;
  onChange: (value: BaseMapMode) => void;
};

const OPTIONS: { value: BaseMapMode; label: string }[] = [
  { value: "satellite", label: "Satellite" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function MapBaseSwitcher({ value, onChange }: MapBaseSwitcherProps) {
  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {OPTIONS.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default MapBaseSwitcher;
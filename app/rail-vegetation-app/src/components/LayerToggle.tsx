type LayerToggleProps = {
  label?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function LayerToggle({ label, checked, onChange }: LayerToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span className="relative h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-slate-900">
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>

      {label && (
        <span className="select-none text-sm font-medium text-slate-700">
          {label}
        </span>
      )}
    </label>
  );
}

export default LayerToggle;
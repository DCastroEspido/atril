interface Option<T> {
  value: T;
  label: string;
  title?: string;
}

interface Props<T> {
  options: Option<T>[];
  /** Selected values; a segmented control can work as a radio (one) or as linked toggles (many). */
  selected: T[];
  onSelect: (value: T) => void;
  label: string;
  className?: string;
}

export function Segmented<T extends string | number>({ options, selected, onSelect, label, className }: Props<T>) {
  return (
    <div className={`segmented${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected.includes(o.value)}
          title={o.title}
          onClick={() => onSelect(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

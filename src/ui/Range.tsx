import type { CSSProperties, InputHTMLAttributes } from 'react';

/** A range input that paints the part before the thumb, which `accent-color` cannot do everywhere. */
export function Range(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { value: number; min: number; max: number },
) {
  const { value, min, max, className, style, ...rest } = props;
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      {...rest}
      type="range"
      min={min}
      max={max}
      value={value}
      className={`range${className ? ` ${className}` : ''}`}
      style={{ ...style, '--fill': `${fill}%` } as CSSProperties}
    />
  );
}

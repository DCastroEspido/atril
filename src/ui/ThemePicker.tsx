import { useEffect, useState } from 'react';
import { readPref, writePref } from '../storage/prefs';
import { MoonIcon, SunIcon, SystemIcon } from './icons';

export type Theme = 'light' | 'dark' | 'system';

const OPTIONS: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Claro', Icon: SunIcon },
  { value: 'dark', label: 'Oscuro', Icon: MoonIcon },
  { value: 'system', label: 'Sistema', Icon: SystemIcon },
];

/** Claro, Oscuro or Sistema. index.html applies the stored choice before the app loads. */
export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>(() => readPref<Theme>('theme', 'system'));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    writePref('theme', theme);
  }, [theme]);

  return (
    <div className="segmented theme-picker" role="radiogroup" aria-label="Tema">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-pressed={theme === value}
          title={label}
          onClick={() => setTheme(value)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

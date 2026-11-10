import { useEffect, useState } from 'react';
import { strings } from './strings';
import {
  applyTheme,
  deviceTheme,
  readStoredTheme,
  storeTheme,
  type Theme,
} from './theme';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: strings.themeLight },
  { value: 'dark', label: strings.themeDark },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () => readStoredTheme() ?? deviceTheme(),
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Until the person chooses, follow the device if it changes.
  useEffect(() => {
    if (readStoredTheme() !== null || typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readStoredTheme() === null) setTheme(deviceTheme());
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="seg" role="group" aria-label={strings.themeLabel}>
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => {
            storeTheme(value);
            setTheme(value);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

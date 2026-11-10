import { useEffect, useRef, useState } from 'react';
import styles from './ThemeToggle.module.css';
import { strings } from '../strings';
import {
  applyTheme,
  deviceTheme,
  readStoredTheme,
  storeTheme,
  type Theme,
} from '../theme/theme';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: strings.themeLight },
  { value: 'dark', label: strings.themeDark },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () => readStoredTheme() ?? deviceTheme(),
  );

  // True once the person has clicked, even if storage refused to save it.
  const chosen = useRef(false);

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
      if (!chosen.current && readStoredTheme() === null)
        setTheme(deviceTheme());
    };
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <div className={styles.group} role="group" aria-label={strings.themeLabel}>
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => {
            chosen.current = true;
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

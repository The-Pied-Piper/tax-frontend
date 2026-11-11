import styles from './StarLink.module.css';
import { strings } from '../strings';

const ENGINE_URL = 'https://github.com/The-Pied-Piper/tax-engine';

export function StarLink() {
  return (
    <div className={styles.row}>
      <a
        className={styles.button}
        href={ENGINE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3z" />
        </svg>
        {strings.starLink}
      </a>
      <span className={styles.note}>{strings.starNote}</span>
    </div>
  );
}

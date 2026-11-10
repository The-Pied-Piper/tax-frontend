import { strings } from './strings';

const ENGINE_URL = 'https://github.com/The-Pied-Piper/tax-engine';

export function StarLink() {
  return (
    <p>
      <a href={ENGINE_URL} target="_blank" rel="noopener noreferrer">
        {strings.starLink}
      </a>
    </p>
  );
}

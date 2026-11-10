import { StarLink } from './StarLink';
import { strings } from './strings';

export function App() {
  return (
    <main>
      <h1>{strings.title}</h1>
      <p>{strings.intro}</p>
      <StarLink />
    </main>
  );
}

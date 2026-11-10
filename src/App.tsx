import { strings } from './strings';
import { ThemeToggle } from './components/ThemeToggle';

export function App() {
  return (
    <main>
      <header className="page-header">
        <div>
          <h1>{strings.title}</h1>
          <p className="lede">{strings.intro}</p>
        </div>
        <ThemeToggle />
      </header>
    </main>
  );
}

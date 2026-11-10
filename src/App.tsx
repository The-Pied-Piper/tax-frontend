import type { ApiClient } from './api';
import { SalaryForm } from './components/SalaryForm';
import { StarLink } from './components/StarLink';
import { ThemeToggle } from './components/ThemeToggle';
import { useTakeHome } from './state/useTakeHome';
import { strings } from './strings';

type Props = { client?: ApiClient };

export function App({ client }: Props) {
  const page = useTakeHome(client);
  return (
    <main>
      <header className="page-header">
        <div>
          <h1>{strings.title}</h1>
          <p className="lede">{strings.intro}</p>
        </div>
        <ThemeToggle />
      </header>
      <SalaryForm
        jurisdictionsState={page.jurisdictionsState}
        values={page.values}
        salaryCheck={page.salaryCheck}
        canSubmit={page.canSubmit}
        loading={page.request.status === 'loading'}
        onJurisdictionChange={page.setJurisdictionCode}
        onYearChange={page.setYear}
        onSalaryChange={page.setSalary}
        onSubmit={page.submit}
      />
      {/* Placeholders until the answer card and the error display exist. */}
      {page.request.status === 'success' && (
        <p role="status">{strings.result.arrived}</p>
      )}
      {page.request.status === 'error' && (
        <p role="alert">{strings.result.failed}</p>
      )}
      <StarLink />
    </main>
  );
}

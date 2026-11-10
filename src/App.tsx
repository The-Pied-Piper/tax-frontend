import { SalaryForm } from './components/SalaryForm';
import type { ApiClient } from './api';
import { useTakeHome } from './state/useTakeHome';
import { strings } from './strings';

type Props = { client?: ApiClient };

export function App({ client }: Props) {
  const page = useTakeHome(client);
  return (
    <main>
      <h1>{strings.title}</h1>
      <p>{strings.intro}</p>
      <SalaryForm
        jurisdictionsState={page.jurisdictionsState}
        values={page.values}
        salaryCheck={page.salaryCheck}
        loading={page.request.status === 'loading'}
        onJurisdictionChange={page.setJurisdictionCode}
        onYearChange={page.setYear}
        onSalaryChange={page.setSalary}
        onSubmit={page.submit}
      />
      {/* Placeholder: the answer card (#5) and error display (#10) replace this. */}
      {page.request.status === 'success' && (
        <p role="status">{strings.result.arrived}</p>
      )}
      {page.request.status === 'error' && (
        <p role="alert">{strings.result.failed}</p>
      )}
    </main>
  );
}

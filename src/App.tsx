import type { ApiClient } from './api';
import { AnswerCard } from './components/AnswerCard';
import { ErrorNotice } from './components/ErrorNotice';
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
        salaryProblem={
          page.failure?.kind === 'salary' ? page.failure.message : null
        }
        canSubmit={page.canSubmit}
        loading={page.request.status === 'loading'}
        onJurisdictionChange={page.setJurisdictionCode}
        onYearChange={page.setYear}
        onSalaryChange={page.setSalary}
        onSubmit={page.submit}
      />
      {page.request.status === 'success' && (
        <AnswerCard
          salary={page.request.response.salary}
          totalDeductions={page.request.response.total_deductions}
          takeHome={page.request.response.take_home}
          provisional={page.request.response.provisional}
          payPeriod={page.payPeriod}
          onPayPeriodChange={page.setPayPeriod}
        />
      )}
      {page.failure?.kind === 'notice' && (
        <ErrorNotice message={page.failure.message} />
      )}
      <StarLink />
    </main>
  );
}

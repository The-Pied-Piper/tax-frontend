import type { AdapterRegistry } from './adapters';
import type { ApiClient } from './api';
import { AdvancedView } from './components/AdvancedView';
import { AnswerCard } from './components/AnswerCard';
import { Breakdown } from './components/Breakdown';
import { ErrorNotice } from './components/ErrorNotice';
import { ProvisionalNotice } from './components/ProvisionalNotice';
import { SalaryForm } from './components/SalaryForm';
import { StarLink } from './components/StarLink';
import { ThemeToggle } from './components/ThemeToggle';
import { useTakeHome } from './state/useTakeHome';
import { strings } from './strings';

type Props = { client?: ApiClient; registry?: AdapterRegistry };

export function App({ client, registry }: Props) {
  const page = useTakeHome(client, registry);
  return (
    <>
      <main>
        <header className="page-header">
          <div className="page-header-text">
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
        {page.failure?.kind === 'notice' && (
          <ErrorNotice message={page.failure.message} />
        )}
        {page.request.status === 'success' &&
          page.request.response.provisional && (
            <ProvisionalNotice year={page.request.asked.year} />
          )}
        {page.request.status === 'success' && (
          <>
            <AnswerCard
              salary={page.request.response.salary}
              totalDeductions={page.request.response.total_deductions}
              takeHome={page.request.response.take_home}
              unit={page.request.adapted.unit}
              place={page.request.asked.jurisdictionName}
              year={page.request.asked.year}
              payPeriod={page.payPeriod}
              onPayPeriodChange={page.setPayPeriod}
            >
              <Breakdown
                rows={page.request.adapted.rows}
                totals={page.request.adapted.totals}
                payPeriod={page.payPeriod}
              />
              <AdvancedView groups={page.request.adapted.advanced} />
            </AnswerCard>
          </>
        )}
        <StarLink />
      </main>
      <footer className="page-footer">{strings.footer}</footer>
    </>
  );
}

import type { AdapterRegistry } from './adapters';
import type { ApiClient } from './api';
import { AdvancedView } from './components/AdvancedView';
import { AnswerCard } from './components/AnswerCard';
import { Breakdown } from './components/Breakdown';
import { ErrorNotice } from './components/ErrorNotice';
import { ProvisionalNotice } from './components/ProvisionalNotice';
import { SalaryForm } from './components/SalaryForm';
import { SalaryIndexNav } from './components/SalaryIndexNav';
import { SalaryLinks } from './components/SalaryLinks';
import { StarLink } from './components/StarLink';
import { ThemeToggle } from './components/ThemeToggle';
import type { SalaryIndex } from './state/salaryIndex';
import { salaryPageText } from './state/salaryPageText';
import { useTakeHome, type SalaryPageData } from './state/useTakeHome';
import { strings } from './strings';

type Props = {
  client?: ApiClient;
  registry?: AdapterRegistry;
  initial?: SalaryPageData;
  /** Every pre-built salary page; none in a plain build. */
  salaryIndex?: SalaryIndex;
};

export function App({ client, registry, initial, salaryIndex }: Props) {
  const page = useTakeHome(client, registry, initial);
  const { request } = page;
  // Only a pre-built page carries a summary; a fresh calculation does not.
  const text =
    request.status === 'success' && request.links
      ? salaryPageText(
          request.response,
          request.asked.jurisdictionName,
          request.asked.year,
        )
      : null;
  return (
    <>
      <main>
        <header className="page-header">
          <div className="page-header-text">
            <h1>{text ? text.heading : strings.title}</h1>
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
              averageRate={page.request.response.average_income_tax_rate}
              marginalRate={page.request.response.marginal_income_tax_rate}
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
            {text && (
              <section className="page-summary-section">
                <h2>{strings.summaryHeading}</h2>
                <p className="page-summary">{text.paragraph}</p>
              </section>
            )}
            {page.request.links && (
              <SalaryLinks
                links={page.request.links}
                unit={page.request.adapted.unit}
              />
            )}
          </>
        )}
        <StarLink />
        {salaryIndex && !initial && <SalaryIndexNav index={salaryIndex} />}
      </main>
      <footer className="page-footer">{strings.footer}</footer>
    </>
  );
}

import type { AdapterRegistry } from './adapters';
import type { ApiClient } from './api';
import { AdvancedView } from './components/AdvancedView';
import { AnswerCard } from './components/AnswerCard';
import { Breadcrumb } from './components/Breadcrumb';
import { Breakdown } from './components/Breakdown';
import { ErrorNotice } from './components/ErrorNotice';
import { LearnMore } from './components/LearnMore';
import { ProvisionalNotice } from './components/ProvisionalNotice';
import { SalaryForm } from './components/SalaryForm';
import { SalaryLinks } from './components/SalaryLinks';
import { SiteFooter } from './components/SiteFooter';
import { StarLink } from './components/StarLink';
import { ThemeToggle } from './components/ThemeToggle';
import { displayWholeMoney } from './money/format';
import { salaryBreadcrumb } from './state/breadcrumbs';
import { salaryPageText } from './state/salaryPageText';
import { useTakeHome, type SalaryPageData } from './state/useTakeHome';
import { strings } from './strings';

type Props = {
  client?: ApiClient;
  registry?: AdapterRegistry;
  initial?: SalaryPageData;
  /** The date the default year is taken from; tests pin it. */
  clock?: () => Date;
};

export function App({ client, registry, initial, clock }: Props) {
  const page = useTakeHome(client, registry, initial, clock);
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
  // A pre-built salary page leads with its answer, so the first thing read, on
  // screen and in the source, is the figure; the provisional note sits just
  // under it and the form below. The calculator page has no answer yet, so its
  // form and note keep their old places.
  const answerFirst = initial !== undefined;
  const notice =
    page.request.status === 'success' && page.request.response.provisional ? (
      <ProvisionalNotice year={page.request.asked.year} />
    ) : null;
  const controls = (
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
  );
  return (
    <>
      <main>
        {request.status === 'success' && request.links && (
          <Breadcrumb
            {...salaryBreadcrumb(
              request.links.hub,
              displayWholeMoney(
                request.response.salary,
                'annually',
                request.adapted.unit,
              ),
            )}
          />
        )}
        <header className="page-header">
          <div className="page-header-text">
            <h1>{text ? text.heading : strings.title}</h1>
            <p className="lede">{strings.intro}</p>
          </div>
          <ThemeToggle />
        </header>
        {!answerFirst && controls}
        {page.failure?.kind === 'notice' && (
          <ErrorNotice message={page.failure.message} />
        )}
        {!answerFirst && notice}
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
            {answerFirst && notice}
            {text && (
              <section className="page-summary-section">
                <h2>{strings.summaryHeading}</h2>
                <p className="page-summary">{text.paragraph}</p>
              </section>
            )}
          </>
        )}
        {answerFirst && controls}
        {page.request.status === 'success' && (
          <>
            {page.request.links && (
              <SalaryLinks
                links={page.request.links}
                unit={page.request.adapted.unit}
              />
            )}
            {page.request.links && (
              <LearnMore links={page.request.links.learnMore} />
            )}
          </>
        )}
        <StarLink />
      </main>
      <SiteFooter />
    </>
  );
}

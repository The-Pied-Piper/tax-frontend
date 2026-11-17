import { useState } from 'react';
import type { AdapterRegistry } from './adapters';
import type { ApiClient } from './api';
import { AdvancedView } from './components/AdvancedView';
import { AnswerCard } from './components/AnswerCard';
import { Breadcrumb } from './components/Breadcrumb';
import { Breakdown } from './components/Breakdown';
import { ErrorNotice } from './components/ErrorNotice';
import { LearnMore } from './components/LearnMore';
import { PendingAnswer } from './components/PendingAnswer';
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
  // A pre-built salary page keeps its old answer on screen, faded, while a new
  // one loads, so the page does not move; the calculator page clears it.
  const answerFirst = initial !== undefined;
  const pending = request.status === 'loading';
  const shown =
    request.status === 'success'
      ? request
      : answerFirst && request.status === 'loading'
        ? request.previous
        : undefined;
  // The breadcrumb is the one the page was built with and stays through every
  // Calculate, so it keeps matching the page's address.
  const [crumb] = useState(() =>
    shown?.links
      ? salaryBreadcrumb(
          shown.links.hub,
          displayWholeMoney(
            shown.response.salary,
            'annually',
            shown.adapted.unit,
          ),
        )
      : null,
  );
  // A salary page writes its paragraph from whatever answer is on screen,
  // pre-built or freshly calculated; the calculator page has none.
  const text =
    shown && answerFirst
      ? salaryPageText(
          shown.response,
          shown.asked.jurisdictionName,
          shown.asked.year,
        )
      : null;
  // A pre-built salary page leads with its answer, so the first thing read, on
  // screen and in the source, is the figure; the provisional note sits just
  // under it and the form below. The calculator page has no answer yet, so its
  // form and note keep their old places. The order is fixed for the life of the
  // page: after Calculate the answer is a fresh one with no links (the paragraph is
  // written again), and the form stays below it, so the
  // layout does not flip.
  // The heading, like the breadcrumb, stays the one the page was built with.
  const [heading] = useState(() => (text ? text.heading : strings.title));
  const notice = shown?.response.provisional ? (
    <ProvisionalNotice year={shown.asked.year} />
  ) : null;
  const answer = shown ? (
    <>
      <AnswerCard
        salary={shown.response.salary}
        totalDeductions={shown.response.total_deductions}
        takeHome={shown.response.take_home}
        unit={shown.adapted.unit}
        averageRate={shown.response.average_income_tax_rate}
        marginalRate={shown.response.marginal_income_tax_rate}
        place={shown.asked.jurisdictionName}
        year={shown.asked.year}
        payPeriod={page.payPeriod}
        onPayPeriodChange={page.setPayPeriod}
      >
        <Breakdown
          rows={shown.adapted.rows}
          totals={shown.adapted.totals}
          payPeriod={page.payPeriod}
        />
        <AdvancedView groups={shown.adapted.advanced} />
      </AnswerCard>
      {answerFirst && notice}
      {text && (
        <section className="page-summary-section">
          <h2>{strings.summaryHeading}</h2>
          <p className="page-summary">{text.paragraph}</p>
        </section>
      )}
    </>
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
      showProgress={answerFirst}
      onJurisdictionChange={page.setJurisdictionCode}
      onYearChange={page.setYear}
      onSalaryChange={page.setSalary}
      onSubmit={page.submit}
    />
  );
  return (
    <>
      <main>
        {crumb && <Breadcrumb {...crumb} />}
        <header className="page-header">
          <div className="page-header-text">
            <h1>{heading}</h1>
            <p className="lede">{strings.intro}</p>
          </div>
          <ThemeToggle />
        </header>
        {!answerFirst && controls}
        {page.failure?.kind === 'notice' && (
          <ErrorNotice message={page.failure.message} />
        )}
        {!answerFirst && notice}
        {answerFirst && answer ? (
          <PendingAnswer pending={pending}>{answer}</PendingAnswer>
        ) : (
          answer
        )}
        {answerFirst && controls}
        {shown?.links && (
          <>
            <SalaryLinks links={shown.links} unit={shown.adapted.unit} />
            <LearnMore links={shown.links.learnMore} />
          </>
        )}
        <StarLink />
      </main>
      <SiteFooter />
    </>
  );
}

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import type { ApiClient } from './api';
import { strings } from './strings';
import { ontarioIndex } from './test/salaryIndexData';
import { compute70000, pageData } from './test/syntheticPages';
import jurisdictions from './api/fixtures/jurisdictions.json';

// The page's links come from the hook's request state, the nearby list from
// the index when the request carries no links, and App compares nothing with
// `initial.response`.
const links = {
  calculator: '/',
  previous: { salary: '65000', href: '/ca-on/65000/' },
  next: { salary: '75000', href: '/ca-on/75000/' },
  others: [],
};
const seeded = { ...pageData(compute70000, '70000'), links };

/** A client that answers every calculation with the very object the page was built from. */
function clientAnswering(answer: typeof compute70000): ApiClient {
  return {
    listJurisdictions: () => Promise.resolve(jurisdictions),
    computeTakeHomeCalculation: () => Promise.resolve(answer),
  };
}

const sameObjectClient = () => clientAnswering(compute70000);
const pageLinks = () =>
  screen.queryByRole('navigation', { name: strings.salaryLinks.label });
const nearby = () =>
  screen.queryByRole('navigation', { name: strings.salaryIndex.nearby });

async function calculate(salary: string) {
  const user = userEvent.setup();
  const box = screen.getByRole('textbox', { name: strings.form.salary });
  await user.clear(box);
  await user.type(box, salary);
  await user.click(
    screen.getByRole('button', { name: strings.form.calculate }),
  );
}

describe('App links on a pre-built salary page', () => {
  it('shows the links of the page and no nearby list when seeded', () => {
    render(
      <App
        client={sameObjectClient()}
        initial={seeded}
        salaryIndex={ontarioIndex}
      />,
    );
    expect(pageLinks()).toBeInTheDocument();
    expect(nearby()).not.toBeInTheDocument();
  });

  it.each([
    ['another salary', '80000', () => clientAnswering({ ...compute70000 })],
    ['the same salary', '70000', sameObjectClient],
  ])(
    'turns into the plain calculator after %s is calculated',
    async (_name, salary, makeClient) => {
      render(
        <App
          client={makeClient()}
          initial={seeded}
          salaryIndex={ontarioIndex}
        />,
      );
      await calculate(salary);
      await screen.findByRole('heading', { name: strings.answer.heading });
      await waitFor(() => {
        expect(pageLinks()).not.toBeInTheDocument();
      });
      expect(nearby()).not.toBeInTheDocument();
      expect(document.querySelector('.page-summary')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        strings.title,
      );
    },
  );
});

describe('App summary on a pre-built salary page', () => {
  it('shows the Take-home heading, About this estimate and the paragraph when seeded', () => {
    render(
      <App
        client={sameObjectClient()}
        initial={seeded}
        salaryIndex={ontarioIndex}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(
      /^Take-home pay on /,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'About this estimate',
    });
    const section = heading.closest('section');
    expect(section).toBeInTheDocument();
    const paragraph = section?.querySelector('.page-summary');
    expect(paragraph?.textContent).toBeTruthy();
    expect(paragraph?.tagName).toBe('P');
    expect(pageLinks()).toBeInTheDocument();
    expect(nearby()).not.toBeInTheDocument();
  });
});

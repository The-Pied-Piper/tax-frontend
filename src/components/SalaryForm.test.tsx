import { render, screen, within } from '@testing-library/react';
import { SalaryForm } from './SalaryForm';
import { COMING_SOON } from '../adapters';
import jurisdictionsFixture from '../api/fixtures/jurisdictions.json';
import { placeOptions } from '../state/places';
import type { JurisdictionsState } from '../state/useTakeHome';
import { languageCode, strings } from '../strings';
import { separatorsFor, toDisplaySalary } from '../money/salaryInput';

const jurisdictions = jurisdictionsFixture.jurisdictions;

const ready: JurisdictionsState = {
  status: 'ready',
  jurisdictions,
  places: placeOptions(jurisdictions, COMING_SOON),
};

function setup(
  jurisdictionsState: JurisdictionsState,
  loading = false,
  showProgress = false,
) {
  return render(
    <SalaryForm
      jurisdictionsState={jurisdictionsState}
      values={{ jurisdictionCode: 'CA-ON', year: 2025, salary: '70000' }}
      salaryCheck="ok"
      salaryProblem={null}
      loading={loading}
      showProgress={showProgress}
      canSubmit
      onJurisdictionChange={() => undefined}
      onYearChange={() => undefined}
      onSalaryChange={() => undefined}
      onSubmit={() => undefined}
    />,
  );
}

function formShape(container: HTMLElement) {
  const form = container.querySelector('form');
  return form
    ? Array.from(form.querySelectorAll('label, select, input, button')).map(
        (el) => el.tagName,
      )
    : null;
}

describe('SalaryForm while the places load', () => {
  it('renders the form, busy, in place of a one-line panel', () => {
    const { container } = setup({ status: 'loading' });
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute('aria-busy', 'true');
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(strings.form.loadingPlaces);
    expect(form).toContainElement(status);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('shows the place select disabled with only the loading option', () => {
    setup({ status: 'loading' });
    const place = screen.getByRole('combobox', { name: strings.form.place });
    expect(place).toBeDisabled();
    const options = within(place).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(strings.form.loadingPlaces);
  });

  it('shows the year select, the salary input with its hint and a disabled submit', () => {
    setup({ status: 'loading' });
    expect(
      screen.getByRole('combobox', { name: strings.form.year }),
    ).toBeDisabled();
    const salary = screen.getByRole('textbox', { name: strings.form.salary });
    const sep = separatorsFor(languageCode);
    expect(salary).toHaveAccessibleDescription(
      strings.form.salaryHint(
        toDisplaySalary('70000', sep),
        toDisplaySalary('70000.50', sep),
      ),
    );
    expect(
      screen.getByRole('button', { name: strings.form.calculate }),
    ).toBeDisabled();
  });

  it('has the same controls as the loaded form, so the height does not change', () => {
    const loading = setup({ status: 'loading' });
    const loadingShape = formShape(loading.container);
    loading.unmount();
    const loaded = setup(ready);
    expect(loadingShape).not.toBeNull();
    expect(formShape(loaded.container)).toEqual(loadingShape);
  });
});

describe('SalaryForm once the places are loaded', () => {
  it('is not busy and its controls work', () => {
    const { container } = setup(ready);
    expect(container.querySelector('form')).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const place = screen.getByRole('combobox', { name: strings.form.place });
    expect(place).toBeEnabled();
    expect(place).toHaveValue('CA-ON');
    expect(
      screen.getByRole('combobox', { name: strings.form.year }),
    ).toBeEnabled();
    expect(
      screen.queryByRole('option', { name: strings.form.loadingPlaces }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: strings.form.calculate }),
    ).toBeEnabled();
  });
});

describe('SalaryForm when the places failed', () => {
  it('shows the alert panel and no form', () => {
    const { container } = setup({ status: 'failed' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      strings.form.placesFailed,
    );
    expect(container.querySelector('form')).toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('SalaryForm button while an answer loads', () => {
  it('has the sweeping band only when progress is asked for', () => {
    const plain = setup(ready, true);
    const plainButton = within(plain.container).getByRole('button');
    plain.unmount();
    const withBand = setup(ready, true, true);
    const bandButton = within(withBand.container).getByRole('button');
    expect(bandButton.className).not.toBe(plainButton.className);
    expect(bandButton).toHaveTextContent(strings.form.calculating);
  });

  it('has no band when not loading, even if progress is asked for', () => {
    const idle = setup(ready, false, true);
    const idleButton = within(idle.container).getByRole('button');
    idle.unmount();
    const plain = setup(ready, false, false);
    expect(within(plain.container).getByRole('button').className).toBe(
      idleButton.className,
    );
  });
});

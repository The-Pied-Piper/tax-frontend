import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { AdapterRegistry, advancedGroups } from './adapters';
import {
  ApiError,
  createApiClient,
  NetworkError,
  RequestTimeoutError,
  type ApiClient,
  type ComputeTakeHomeCalculationRequest,
} from './api';
import compute2026 from './api/fixtures/compute-on-2026-70000.json';
import compute2025 from './api/fixtures/compute-on-2025-70000.json';
import invalidSalary from './api/fixtures/error-invalid-salary.json';
import jurisdictions from './api/fixtures/jurisdictions.json';
import { strings } from './strings';

// Real client, fake network: the saved engine responses are served as text.
function fixtureClient(
  onCompute: (body: ComputeTakeHomeCalculationRequest) => void = () => {},
  answer: unknown = compute2025,
): ApiClient {
  return createApiClient({
    baseUrl: 'http://test/api/v1',
    fetch: (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.endsWith('/jurisdictions')) {
        return Promise.resolve(new Response(JSON.stringify(jurisdictions)));
      }
      onCompute(
        JSON.parse(
          typeof init?.body === 'string' ? init.body : '',
        ) as ComputeTakeHomeCalculationRequest,
      );
      return Promise.resolve(new Response(JSON.stringify(answer)));
    },
  });
}

describe('App form', () => {
  it('shows the page title', () => {
    render(<App client={fixtureClient()} />);
    expect(
      screen.getByRole('heading', { name: strings.title, level: 1 }),
    ).toBeInTheDocument();
  });

  it('fills places and years from the API', async () => {
    render(<App client={fixtureClient()} />);
    const place = await screen.findByRole('combobox', {
      name: strings.form.place,
    });
    expect(place).toHaveValue('CA-ON');
    const year = screen.getByRole('combobox', { name: strings.form.year });
    expect(year).toHaveValue('2025');
    expect(
      screen.getByRole('option', {
        name: `2026 (${strings.form.provisionalYear})`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2025' })).toBeInTheDocument();
  });

  it('sends the trimmed salary text with the trace requested', async () => {
    const sent: ComputeTakeHomeCalculationRequest[] = [];
    const user = userEvent.setup();
    render(<App client={fixtureClient((b) => sent.push(b))} />);
    await user.selectOptions(
      await screen.findByRole('combobox', { name: strings.form.year }),
      '2026',
    );
    await user.type(
      screen.getByRole('textbox', { name: strings.form.salary }),
      ' 70000.00 ',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    expect(
      await screen.findByRole('heading', { name: strings.answer.heading }),
    ).toBeInTheDocument();
    expect(sent).toEqual([
      {
        jurisdiction_code: 'CA-ON',
        year: 2026,
        salary: '70000.00',
        language_code: 'en',
        include_trace: true,
      },
    ]);
  });

  it.each([
    ['', strings.form.salaryEmpty],
    ['70,000', strings.form.salaryInvalid],
    ['70000.123', strings.form.salaryInvalid],
    ['0.00', strings.form.salaryZero],
    ['0', strings.form.salaryZero],
  ])('refuses %j before sending', async (text, message) => {
    const sent: ComputeTakeHomeCalculationRequest[] = [];
    const user = userEvent.setup();
    render(<App client={fixtureClient((b) => sent.push(b))} />);
    const input = await screen.findByRole('textbox', {
      name: strings.form.salary,
    });
    if (text) await user.type(input, text);
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(input).toBeInvalid();
    expect(sent).toEqual([]);
    await user.type(input, '1');
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('disables the button while waiting and clears the old answer', async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    const base = fixtureClient();
    let calls = 0;
    const client: ApiClient = {
      listJurisdictions: (query) => base.listJurisdictions(query),
      computeTakeHomeCalculation: (body) => {
        calls += 1;
        if (calls === 1) return base.computeTakeHomeCalculation(body);
        return new Promise((resolve) => {
          release = () => {
            resolve(compute2025);
          };
        });
      },
    };
    render(<App client={client} />);
    const input = await screen.findByRole('textbox', {
      name: strings.form.salary,
    });
    await user.type(input, '70000');
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await screen.findByRole('heading', { name: strings.answer.heading });

    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    const busy = screen.getByRole('button', { name: strings.form.calculating });
    expect(busy).toBeDisabled();
    expect(
      screen.queryByRole('heading', { name: strings.answer.heading }),
    ).not.toBeInTheDocument();
    expect(input).toBeEnabled();
    release();
    await screen.findByRole('heading', { name: strings.answer.heading });
    expect(
      screen.getByRole('button', { name: strings.form.calculate }),
    ).toBeEnabled();
  });

  describe('when the request fails', () => {
    async function failWith(error: Error) {
      const user = userEvent.setup();
      const base = fixtureClient();
      let calls = 0;
      const client: ApiClient = {
        listJurisdictions: (query) => base.listJurisdictions(query),
        computeTakeHomeCalculation: (body) => {
          calls += 1;
          return calls === 1
            ? base.computeTakeHomeCalculation(body)
            : Promise.reject(error);
        },
      };
      render(<App client={client} />);
      const input = await screen.findByRole('textbox', {
        name: strings.form.salary,
      });
      await user.type(input, '70000');
      const calculate = () =>
        user.click(
          screen.getByRole('button', { name: strings.form.calculate }),
        );
      await calculate();
      await screen.findByRole('heading', { name: strings.answer.heading });
      await calculate();
      return { user, input };
    }

    it('shows a notice and hides the previous answer', async () => {
      await failWith(new ApiError(400, invalidSalary));
      expect(
        await screen.findByText(strings.errors.rejected),
      ).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(
        strings.errors.rejected,
      );
      expect(
        screen.queryByRole('heading', { name: strings.answer.heading }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('53,468.68')).not.toBeInTheDocument();
    });

    it('puts a salary problem under the salary box', async () => {
      const { user, input } = await failWith(
        new ApiError(400, { ...invalidSalary, field: 'salary' }),
      );
      expect(
        await screen.findByText(strings.errors.salaryRejected),
      ).toBeInTheDocument();
      expect(input).toBeInvalid();
      expect(
        screen.queryByText(strings.errors.rejected),
      ).not.toBeInTheDocument();
      await user.type(input, '1');
      expect(
        screen.queryByText(strings.errors.salaryRejected),
      ).not.toBeInTheDocument();
    });

    it('says the service could not be reached', async () => {
      await failWith(new NetworkError('offline'));
      expect(
        await screen.findByText(strings.errors.unreachable),
      ).toBeInTheDocument();
    });

    it('says the service took too long', async () => {
      await failWith(new RequestTimeoutError());
      expect(
        await screen.findByText(strings.errors.timeout),
      ).toBeInTheDocument();
    });

    it('lets the person try again after a failure', async () => {
      const user = userEvent.setup();
      let fail = true;
      const base = fixtureClient();
      const client: ApiClient = {
        listJurisdictions: (query) => base.listJurisdictions(query),
        computeTakeHomeCalculation: (body) =>
          fail
            ? Promise.reject(new ApiError(503, null))
            : base.computeTakeHomeCalculation(body),
      };
      render(<App client={client} />);
      await user.type(
        await screen.findByRole('textbox', { name: strings.form.salary }),
        '70000',
      );
      const calculate = () =>
        user.click(
          screen.getByRole('button', { name: strings.form.calculate }),
        );
      await calculate();
      await screen.findByText(strings.errors.serverProblem);
      fail = false;
      await calculate();
      await screen.findByRole('heading', { name: strings.answer.heading });
      expect(
        screen.queryByText(strings.errors.serverProblem),
      ).not.toBeInTheDocument();
    });
  });

  it('says so when the list of places cannot be loaded', async () => {
    const client: ApiClient = {
      listJurisdictions: () => Promise.reject(new NetworkError('offline')),
      computeTakeHomeCalculation: () => Promise.reject(new Error('unused')),
    };
    render(<App client={client} />);
    await waitFor(() =>
      expect(screen.getByText(strings.form.placesFailed)).toBeInTheDocument(),
    );
  });

  it('keeps Calculate off when no place has a year to choose', async () => {
    const client: ApiClient = {
      listJurisdictions: () =>
        Promise.resolve({
          jurisdictions: [{ code: 'CA-ON', years: [] }],
          next_page_token: '',
        }),
      computeTakeHomeCalculation: () => Promise.reject(new Error('unused')),
    };
    render(<App client={client} />);
    expect(
      await screen.findByRole('button', { name: strings.form.calculate }),
    ).toBeDisabled();
  });
});

describe('App answer card', () => {
  async function calculate(client: ApiClient) {
    const user = userEvent.setup();
    // No adapter, so only the answer card shows these figures.
    render(<App client={client} registry={new AdapterRegistry()} />);
    await user.type(
      await screen.findByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await screen.findByRole('heading', { name: strings.answer.heading });
    return user;
  }

  it('shows the 2025 figures with no provisional notice', async () => {
    await calculate(fixtureClient());
    expect(screen.getByText('53,468.68')).toBeInTheDocument();
    expect(screen.getAllByText('70,000.00')[0]).toBeVisible();
    expect(screen.getByText('16,531.32')).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('shows the 2026 figures with the provisional notice', async () => {
    await calculate(fixtureClient(undefined, compute2026));
    expect(screen.getByText('53,786.25')).toBeInTheDocument();
    expect(screen.getByText('16,213.75')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      strings.answer.provisional,
    );
  });

  it('divides all three amounts when the pay period changes', async () => {
    const user = await calculate(fixtureClient());
    await user.click(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    );
    expect(screen.getByText('4,455.72')).toBeInTheDocument();
    expect(screen.getByText('5,833.33')).toBeInTheDocument();
    expect(screen.getByText('1,377.61')).toBeInTheDocument();
    expect(screen.getByText(strings.answer.per.monthly)).toBeInTheDocument();
  });

  it('keeps the chosen pay period for the next answer', async () => {
    const user = await calculate(fixtureClient());
    await user.click(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await screen.findByRole('heading', { name: strings.answer.heading });
    expect(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    ).toBeChecked();
    expect(screen.getByText('4,455.72')).toBeInTheDocument();
  });
});

describe('App breakdown', () => {
  const code = jurisdictions.jurisdictions[0]?.code ?? '';
  const registry = new AdapterRegistry();
  registry.register({
    jurisdictionCode: code,
    adapt: (response) => ({
      rows: [
        {
          id: 'salary',
          name: 'Salary before tax',
          help: 'What you earn before anything is taken off.',
          amount: response.salary,
        },
      ],
      totals: [
        {
          id: 'taken-off',
          name: 'Total taken off',
          help: 'Tax and contributions together.',
          amount: response.total_deductions,
        },
      ],
      advanced: advancedGroups(response),
    }),
  });

  async function calculate(reg: AdapterRegistry) {
    const user = userEvent.setup();
    render(<App client={fixtureClient()} registry={reg} />);
    await user.type(
      await screen.findByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await screen.findByRole('heading', { name: strings.answer.heading });
    return user;
  }

  it('shows a folded breakdown from the adapter under the answer', async () => {
    const user = await calculate(registry);
    const details = screen
      .getByText(strings.breakdown.toggle)
      .closest('details');
    expect(details).not.toHaveAttribute('open');
    await user.click(screen.getByText(strings.breakdown.toggle));
    expect(details).toHaveAttribute('open');
    expect(screen.getByText('Total taken off')).toBeVisible();
    expect(screen.getAllByText('16,531.32').length).toBeGreaterThan(1);
  });

  it('shows no breakdown when no adapter is registered', async () => {
    await calculate(new AdapterRegistry());
    expect(
      screen.queryByText(strings.breakdown.toggle),
    ).not.toBeInTheDocument();
  });

  it('shows the error notice and stays usable when an adapter throws', async () => {
    const broken = new AdapterRegistry();
    broken.register({
      jurisdictionCode: code,
      adapt: () => {
        throw new Error('unreadable trace');
      },
    });
    const user = userEvent.setup();
    render(<App client={fixtureClient()} registry={broken} />);
    await user.type(
      await screen.findByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      strings.errors.unknown,
    );
    expect(
      screen.getByRole('button', { name: strings.form.calculate }),
    ).toBeEnabled();
  });
});

describe('App advanced view', () => {
  async function calculate(period?: string) {
    const user = userEvent.setup();
    render(<App client={fixtureClient()} registry={new AdapterRegistry()} />);
    await user.type(
      await screen.findByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await screen.findByRole('heading', { name: strings.answer.heading });
    if (period) await user.click(screen.getByLabelText(period));
    return user;
  }

  it('is folded under the answer and lists every form from the trace', async () => {
    const user = await calculate();
    const details = screen
      .getByText(strings.advanced.toggle)
      .closest('details');
    expect(details).not.toHaveAttribute('open');
    await user.click(screen.getByText(strings.advanced.toggle));
    for (const form of compute2025.trace) {
      expect(screen.getByText(form.form)).toBeVisible();
    }
  });

  it('puts every trace line in the page once all forms are opened', async () => {
    const user = await calculate();
    await user.click(screen.getByText(strings.advanced.toggle));
    for (const form of compute2025.trace) {
      await user.click(screen.getByText(form.form));
    }
    const lines = within(
      screen.getByRole('region', { name: strings.advanced.toggle }),
    ).getAllByRole('term');
    const expected = compute2025.trace.reduce(
      (count, form) => count + form.lines.length,
      0,
    );
    expect(lines).toHaveLength(expected);
    expect(expected).toBe(171);
  });

  it('shows the yearly figures from the engine whatever the pay period', async () => {
    const user = await calculate(strings.payPeriod.monthly);
    await user.click(screen.getByText(strings.advanced.toggle));
    await user.click(screen.getByText('ca-on/return'));
    const form = screen.getByText('ca-on/return').closest('details');
    expect(form).not.toBeNull();
    expect(within(form as HTMLElement).getByText('11,497.09')).toBeVisible();
  });
});

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

  it('shows the intro and the estimate footer', () => {
    render(<App client={fixtureClient()} />);
    expect(screen.getByText(strings.intro)).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent(strings.footer);
  });

  it('fills places and years from the API', async () => {
    render(<App client={fixtureClient()} />);
    const place = await screen.findByRole('combobox', {
      name: strings.form.place,
    });
    expect(place).toHaveValue('CA-ON');
    expect(
      within(place).getByRole('option', { name: 'Ontario' }),
    ).toBeInTheDocument();
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
    ['70000', '70,000', '70000'],
    ['70000.50', '70,000.50', '70000.50'],
    ['70,000.50', '70,000.50', '70000.50'],
  ])(
    'shows %s as %s in the box and sends the plain text',
    async (typed, shown, plain) => {
      const sent: ComputeTakeHomeCalculationRequest[] = [];
      const user = userEvent.setup();
      render(<App client={fixtureClient((b) => sent.push(b))} />);
      const input = await screen.findByRole('textbox', {
        name: strings.form.salary,
      });
      await user.type(input, typed);
      expect(input).toHaveValue(shown);
      await user.click(
        screen.getByRole('button', { name: strings.form.calculate }),
      );
      await screen.findByRole('heading', { name: strings.answer.heading });
      expect(sent.map((r) => r.salary)).toEqual([plain]);
    },
  );

  it('writes the hint example with the same separators', async () => {
    render(<App client={fixtureClient()} />);
    expect(
      await screen.findByText('For example 70,000 or 70,000.50'),
    ).toBeInTheDocument();
  });

  it('keeps the caret in place when typing in the middle', async () => {
    const user = userEvent.setup();
    render(<App client={fixtureClient()} />);
    const input = await screen.findByRole('textbox', {
      name: strings.form.salary,
    });
    await user.type(input, '7000');
    expect(input).toHaveValue('7,000');
    await user.type(input, '9', {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });
    expect(input).toHaveValue('79,000');
    expect(input).toHaveProperty('selectionStart', 2);
  });

  it.each([
    ['', strings.form.salaryEmpty],
    ['70,0,00x', strings.form.salaryInvalid],
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
      expect(screen.queryByText('$53,468.68')).not.toBeInTheDocument();
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

  it('shows the place code when its name is blank', async () => {
    const client: ApiClient = {
      listJurisdictions: () =>
        Promise.resolve({
          jurisdictions: [
            {
              code: 'CA-ON',
              name: '  ',
              years: [{ year: 2025, provisional: false }],
            },
          ],
          next_page_token: '',
        }),
      computeTakeHomeCalculation: () => Promise.reject(new Error('unused')),
    };
    render(<App client={client} />);
    const place = await screen.findByRole('combobox', {
      name: strings.form.place,
    });
    expect(
      within(place).getByRole('option', { name: 'CA-ON' }),
    ).toBeInTheDocument();
  });

  it('keeps Calculate off when no place has a year to choose', async () => {
    const client: ApiClient = {
      listJurisdictions: () =>
        Promise.resolve({
          jurisdictions: [{ code: 'CA-ON', name: 'Ontario', years: [] }],
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
  async function calculate(client: ApiClient, year?: string) {
    const user = userEvent.setup();
    // No adapter, so only the answer card shows these figures.
    render(<App client={client} registry={new AdapterRegistry()} />);
    if (year) {
      await user.selectOptions(
        await screen.findByRole('combobox', { name: strings.form.year }),
        year,
      );
    }
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
    expect(screen.getAllByText('$53,468.68')).toHaveLength(2);
    expect(screen.getAllByText('$70,000.00')[0]).toBeVisible();
    expect(screen.getByText('$16,531.32')).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('names the place and year that were asked', async () => {
    await calculate(fixtureClient());
    expect(
      screen.getByText('out of $70,000.00, Ontario, 2025'),
    ).toBeInTheDocument();
  });

  it('shows the 2026 figures with the provisional notice', async () => {
    await calculate(fixtureClient(undefined, compute2026), '2026');
    expect(screen.getAllByText('$53,786.25')).toHaveLength(2);
    expect(screen.getByText('$16,213.75')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      strings.notices.provisionalTitle(2026),
    );
    expect(screen.getByRole('note')).toHaveTextContent(
      strings.notices.provisionalBody(2026),
    );
  });

  it('divides all three amounts when the pay period changes', async () => {
    const user = await calculate(fixtureClient());
    await user.click(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    );
    expect(screen.getAllByText('$4,455.72')).toHaveLength(2);
    expect(screen.getByText('$5,833.33')).toBeInTheDocument();
    expect(screen.getByText('$1,377.61')).toBeInTheDocument();
    expect(screen.getByText(strings.answer.label.monthly)).toBeInTheDocument();
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
    expect(screen.getAllByText('$4,455.72')).toHaveLength(2);
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
    expect(
      within(details as HTMLElement).getByText('$16,531.32'),
    ).toBeVisible();
  });

  it('keeps the breakdown inside the answer panel', async () => {
    await calculate(registry);
    const panel = screen
      .getByRole('heading', { name: strings.answer.heading })
      .closest('section');
    expect(
      within(panel as HTMLElement).getByText(strings.breakdown.toggle),
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole('checkbox', { name: strings.advanced.toggle }),
    ).not.toBeChecked();
    await user.click(
      screen.getByRole('checkbox', { name: strings.advanced.toggle }),
    );
    for (const form of compute2025.trace) {
      expect(screen.getByText(form.name)).toBeVisible();
    }
  });

  it('puts every numbered trace line in the page once all forms are opened', async () => {
    const user = await calculate();
    await user.click(
      screen.getByRole('checkbox', { name: strings.advanced.toggle }),
    );
    const numbered = compute2025.trace
      .map((form) => ({
        ...form,
        lines: form.lines.filter((l) => (l.reference ?? '').trim() !== ''),
      }))
      .filter((form) => form.lines.length > 0);
    for (const form of numbered) {
      await user.click(screen.getByText(form.name));
    }
    const lines = within(
      screen.getByRole('group', { name: strings.advanced.heading }),
    ).getAllByRole('term');
    const expected = numbered.reduce(
      (count, form) => count + form.lines.length,
      0,
    );
    expect(lines).toHaveLength(expected);
    expect(expected).toBe(131);
    expect(
      screen.getByRole('button', {
        name: strings.breakdown.helpButton('Line 2'),
      }),
    ).toBeInTheDocument();
  });

  it('shows the yearly figures from the engine whatever the pay period', async () => {
    const user = await calculate(strings.payPeriod.monthly);
    await user.click(
      screen.getByRole('checkbox', { name: strings.advanced.toggle }),
    );
    await user.click(screen.getByText('Return summary'));
    const form = screen.getByText('Return summary').closest('details');
    expect(form).not.toBeNull();
    expect(within(form as HTMLElement).getByText('11,497.09')).toBeVisible();
  });
});

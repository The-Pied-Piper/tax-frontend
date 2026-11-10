import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import {
  ApiError,
  createApiClient,
  NetworkError,
  type ApiClient,
  type ComputeTakeHomeCalculationRequest,
} from './api';
import compute2025 from './api/fixtures/compute-on-2025-70000.json';
import invalidSalary from './api/fixtures/error-invalid-salary.json';
import jurisdictions from './api/fixtures/jurisdictions.json';
import { strings } from './strings';

// Real client, fake network: the saved engine responses are served as text.
function fixtureClient(
  onCompute: (body: ComputeTakeHomeCalculationRequest) => void = () => {},
): ApiClient {
  return createApiClient({
    baseUrl: 'http://test/api/v1',
    fetch: (input, init) => {
      const url = String(input);
      if (url.endsWith('/jurisdictions')) {
        return Promise.resolve(new Response(JSON.stringify(jurisdictions)));
      }
      onCompute(JSON.parse(String(init?.body)));
      return Promise.resolve(new Response(JSON.stringify(compute2025)));
    },
  });
}

describe('App form', () => {
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
    expect(await screen.findByText(strings.result.arrived)).toBeInTheDocument();
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
      listJurisdictions: base.listJurisdictions,
      computeTakeHomeCalculation: (body) => {
        calls += 1;
        if (calls === 1) return base.computeTakeHomeCalculation(body);
        return new Promise((resolve) => {
          release = () => resolve(compute2025);
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
    await screen.findByText(strings.result.arrived);

    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    const busy = screen.getByRole('button', { name: strings.form.calculating });
    expect(busy).toBeDisabled();
    expect(screen.queryByText(strings.result.arrived)).not.toBeInTheDocument();
    expect(input).toBeEnabled();
    release();
    await screen.findByText(strings.result.arrived);
    expect(
      screen.getByRole('button', { name: strings.form.calculate }),
    ).toBeEnabled();
  });

  it('shows a placeholder when the service rejects the request', async () => {
    const user = userEvent.setup();
    const base = fixtureClient();
    const client: ApiClient = {
      listJurisdictions: base.listJurisdictions,
      computeTakeHomeCalculation: () =>
        Promise.reject(new ApiError(400, invalidSalary)),
    };
    render(<App client={client} />);
    await user.type(
      await screen.findByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    expect(await screen.findByText(strings.result.failed)).toBeInTheDocument();
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

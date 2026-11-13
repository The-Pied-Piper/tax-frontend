import { useEffect, useRef, useState } from 'react';
import {
  adapters,
  COMING_SOON,
  type AdaptedResult,
  type AdapterRegistry,
} from '../adapters';
import {
  createApiClient,
  type ApiClient,
  type ComputeTakeHomeCalculationResponse,
  type ListJurisdictionsResponse,
} from '../api';
import type { PayPeriod } from '../money/payPeriod';
import { languageCode } from '../strings';
import { describeFailure } from './failure';
import { placeOptions, type PlaceOption } from './places';
import { checkSalary, type SalaryCheck } from './salary';

type Jurisdictions = ListJurisdictionsResponse['jurisdictions'];

export type JurisdictionsState =
  | { status: 'loading' }
  | {
      status: 'ready';
      jurisdictions: Jurisdictions;
      places: PlaceOption[];
    }
  | { status: 'failed' };

/** One request at a time; a new request clears the previous answer. */
export type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      /** What was asked, kept so the card names the place and year it answers. */
      asked: {
        jurisdictionName: string;
        year: number;
        jurisdictionCode: string;
      };
      response: ComputeTakeHomeCalculationResponse;
      adapted: AdaptedResult;
      /** Links of a pre-built page; set only by the seed, so a new calculation has none. */
      links?: SalaryPageLinks;
    }
  | { status: 'error'; error: unknown };

export type FormValues = {
  jurisdictionCode: string;
  year: number | null;
  salary: string;
};

/** One link to another pre-built page: the yearly salary it is for and its address. */
export type SalaryPageLink = { salary: string; href: string };

/** The links of a pre-built page: its neighbours, the calculator and other pages. */
export type SalaryPageLinks = {
  calculator: string;
  previous: SalaryPageLink | null;
  next: SalaryPageLink | null;
  others: SalaryPageLink[];
};

/** What a pre-built salary page carries so React can start where it left off. */
export type SalaryPageData = {
  jurisdictions: Jurisdictions;
  response: ComputeTakeHomeCalculationResponse;
  jurisdictionCode: string;
  year: number;
  salary: string;
  links?: SalaryPageLinks;
};

type Seed = {
  jurisdictionsState: JurisdictionsState;
  values: FormValues;
  request: RequestState;
};

/** The state a pre-built page starts in, or null if its answer cannot be read. */
function seedFrom(
  data: SalaryPageData | undefined,
  registry: AdapterRegistry,
): Seed | null {
  if (!data) return null;
  try {
    const adapted = registry.adapt(
      data.jurisdictionCode,
      data.year,
      data.response,
    );
    return {
      jurisdictionsState: {
        status: 'ready',
        jurisdictions: data.jurisdictions,
        places: placeOptions(data.jurisdictions, COMING_SOON),
      },
      values: {
        jurisdictionCode: data.jurisdictionCode,
        year: data.year,
        salary: data.salary,
      },
      request: {
        status: 'success',
        asked: {
          jurisdictionCode: data.jurisdictionCode,
          jurisdictionName:
            data.jurisdictions.find((j) => j.code === data.jurisdictionCode)
              ?.name ?? data.jurisdictionCode,
          year: data.year,
        },
        response: data.response,
        adapted,
        links: data.links,
      },
    };
  } catch {
    return null;
  }
}

const defaultClient = createApiClient();

export function useTakeHome(
  client: ApiClient = defaultClient,
  registry: AdapterRegistry = adapters,
  initial?: SalaryPageData,
) {
  const [seed] = useState(() => seedFrom(initial, registry));
  const [jurisdictionsState, setJurisdictionsState] =
    useState<JurisdictionsState>(
      seed?.jurisdictionsState ?? { status: 'loading' },
    );
  const [values, setValues] = useState<FormValues>(
    seed?.values ?? { jurisdictionCode: '', year: null, salary: '' },
  );
  const [salaryCheck, setSalaryCheck] = useState<SalaryCheck>('ok');
  const [payPeriod, setPayPeriod] = useState<PayPeriod>('annually');
  const [request, setRequest] = useState<RequestState>(
    seed?.request ?? { status: 'idle' },
  );
  // Only the latest request may write its answer.
  const latest = useRef(0);

  // The one effect: the list of places and years is needed to draw the form.
  // Calculating is triggered by submit, never by an effect.
  useEffect(() => {
    // A pre-built page already carries the list.
    if (seed) return;
    let cancelled = false;
    client.listJurisdictions().then(
      (response) => {
        if (cancelled) return;
        const first = response.jurisdictions[0];
        setJurisdictionsState({
          status: 'ready',
          jurisdictions: response.jurisdictions,
          places: placeOptions(response.jurisdictions, COMING_SOON),
        });
        if (first) {
          setValues((v) => ({
            ...v,
            jurisdictionCode: first.code,
            year: first.years[0]?.year ?? null,
          }));
        }
      },
      () => {
        if (!cancelled) setJurisdictionsState({ status: 'failed' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [client, seed]);

  const jurisdictions =
    jurisdictionsState.status === 'ready'
      ? jurisdictionsState.jurisdictions
      : [];

  function setJurisdictionCode(code: string) {
    const year = jurisdictions.find((j) => j.code === code)?.years[0]?.year;
    setValues((v) => ({ ...v, jurisdictionCode: code, year: year ?? null }));
  }

  function setYear(year: number) {
    setValues((v) => ({ ...v, year }));
  }

  function setSalary(salary: string) {
    setValues((v) => ({ ...v, salary }));
    setSalaryCheck('ok');
    // Editing starts afresh: any old error (salary problem or notice) is dropped.
    setRequest((r) => (r.status === 'error' ? { status: 'idle' } : r));
  }

  function submit() {
    const check = checkSalary(values.salary);
    setSalaryCheck(check);
    if (
      check !== 'ok' ||
      values.year === null ||
      request.status === 'loading'
    ) {
      return;
    }
    const jurisdictionCode = values.jurisdictionCode;
    const year = values.year;
    const jurisdictionName =
      jurisdictions.find((j) => j.code === jurisdictionCode)?.name ??
      jurisdictionCode;
    latest.current += 1;
    const mine = latest.current;
    setRequest({ status: 'loading' });
    client
      .computeTakeHomeCalculation({
        jurisdiction_code: jurisdictionCode,
        year,
        salary: values.salary.trim(),
        language_code: languageCode,
        include_trace: true,
      })
      .then(
        (response) => {
          if (latest.current !== mine) return;
          try {
            setRequest({
              status: 'success',
              asked: { jurisdictionName, year, jurisdictionCode },
              response,
              adapted: registry.adapt(jurisdictionCode, year, response),
            });
          } catch (error: unknown) {
            // An adapter that cannot read a trace must not leave the page loading.
            setRequest({ status: 'error', error });
          }
        },
        (error: unknown) => {
          if (latest.current === mine) setRequest({ status: 'error', error });
        },
      );
  }

  const failure =
    request.status === 'error' ? describeFailure(request.error) : null;

  return {
    failure,
    canSubmit: values.year !== null,
    jurisdictionsState,
    values,
    salaryCheck,
    request,
    payPeriod,
    setPayPeriod,
    setJurisdictionCode,
    setYear,
    setSalary,
    submit,
  };
}

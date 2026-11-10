import { useEffect, useRef, useState } from 'react';
import {
  adapters,
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
import { checkSalary, type SalaryCheck } from './salary';

type Jurisdictions = ListJurisdictionsResponse['jurisdictions'];

export type JurisdictionsState =
  | { status: 'loading' }
  | { status: 'ready'; jurisdictions: Jurisdictions }
  | { status: 'failed' };

/** One request at a time; a new request clears the previous answer. */
export type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      response: ComputeTakeHomeCalculationResponse;
      adapted: AdaptedResult;
    }
  | { status: 'error'; error: unknown };

export type FormValues = {
  jurisdictionCode: string;
  year: number | null;
  salary: string;
};

const defaultClient = createApiClient();

export function useTakeHome(
  client: ApiClient = defaultClient,
  registry: AdapterRegistry = adapters,
) {
  const [jurisdictionsState, setJurisdictionsState] =
    useState<JurisdictionsState>({ status: 'loading' });
  const [values, setValues] = useState<FormValues>({
    jurisdictionCode: '',
    year: null,
    salary: '',
  });
  const [salaryCheck, setSalaryCheck] = useState<SalaryCheck>('ok');
  const [payPeriod, setPayPeriod] = useState<PayPeriod>('annually');
  const [request, setRequest] = useState<RequestState>({ status: 'idle' });
  // Only the latest request may write its answer.
  const latest = useRef(0);

  // The one effect: the list of places and years is needed to draw the form.
  // Calculating is triggered by submit, never by an effect.
  useEffect(() => {
    let cancelled = false;
    client.listJurisdictions().then(
      (response) => {
        if (cancelled) return;
        const first = response.jurisdictions[0];
        setJurisdictionsState({
          status: 'ready',
          jurisdictions: response.jurisdictions,
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
  }, [client]);

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

  return {
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

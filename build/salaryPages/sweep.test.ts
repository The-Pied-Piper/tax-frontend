import { sweepSalaries } from '../../src/state/hubCharts';
import { languageCode } from '../../src/strings';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import { createBuildApi } from './buildApi';
import { provinces } from './provinces';
import { sweepProvinces } from './sweep';

const base = fixture70000 as ComputeTakeHomeCalculationResponse;
const baseUrl = 'https://api.test/api/v1';
const ontario = provinces.filter((p) => p.code === 'CA-ON');
const [ontarioProvince, albertaProvince] = provinces;
if (!ontarioProvince || !albertaProvince) throw new Error('province list');

type Body = { salary: string; jurisdiction_code: string };

function fakeApi(compute: (body: Body, call: number) => Response) {
  const bodies: Body[] = [];
  const fetchFake: typeof fetch = (_input, init) => {
    const body = JSON.parse(
      typeof init?.body === 'string' ? init.body : '{}',
    ) as Body;
    bodies.push(body);
    return Promise.resolve(compute(body, bodies.length));
  };
  return { fetch: fetchFake, bodies };
}

const answerFor = (body: Body): ComputeTakeHomeCalculationResponse => ({
  ...base,
  salary: body.salary,
  take_home: `take-${body.salary}`,
  total_deductions: `ded-${body.salary}`,
  unit: { ...base.unit, singular: 'CA$', plural: 'CA$' },
});

const apiOf = (fetchFake: typeof fetch, attempts = 2) =>
  createBuildApi({
    fetch: fetchFake,
    baseUrl,
    retry: { attempts, sleep: () => Promise.resolve() },
  });

describe('sweepProvinces', () => {
  it('asks once per sweep salary, lowest first, with no trace', async () => {
    const api = fakeApi((body) => Response.json(answerFor(body)));
    await sweepProvinces({ api: apiOf(api.fetch), provinces: ontario });
    expect(api.bodies.map((b) => b.salary)).toEqual(sweepSalaries());
    expect(api.bodies[0]).toEqual({
      jurisdiction_code: 'CA-ON',
      year: 2026,
      salary: '1000',
      language_code: languageCode,
      include_trace: false,
    });
  });

  it('sweeps each given province, one after the other', async () => {
    const api = fakeApi((body) => Response.json(answerFor(body)));
    const sweeps = await sweepProvinces({
      api: apiOf(api.fetch),
      provinces: [ontarioProvince, albertaProvince],
    });
    expect(sweeps.map((s) => s.slug)).toEqual(['ca-on', 'ca-ab']);
    expect(api.bodies).toHaveLength(600);
    expect(api.bodies[299]?.jurisdiction_code).toBe('CA-ON');
    expect(api.bodies[300]?.jurisdiction_code).toBe('CA-AB');
  });

  it('copies the API figures as text, the unit once with its dollar sign shown as "$"', async () => {
    const api = fakeApi((body) => Response.json(answerFor(body)));
    const [sweep] = await sweepProvinces({
      api: apiOf(api.fetch),
      provinces: ontario,
    });
    expect(sweep?.points).toHaveLength(300);
    expect(sweep?.points[1]).toEqual([
      '2000',
      'take-2000',
      'ded-2000',
      base.average_income_tax_rate.amount,
      base.marginal_income_tax_rate.amount,
    ]);
    expect(sweep?.unit.singular).toBe('$');
    expect(sweep?.year).toBe(2026);
    expect(sweep?.provisional).toBe(base.provisional);
  });

  it('retries a 429 and carries on', async () => {
    const api = fakeApi((body, call) =>
      call === 2
        ? new Response(null, { status: 429, headers: { 'Retry-After': '0' } })
        : Response.json(answerFor(body)),
    );
    const [sweep] = await sweepProvinces({
      api: apiOf(api.fetch),
      provinces: ontario,
    });
    expect(sweep?.points).toHaveLength(300);
    expect(api.bodies).toHaveLength(301);
  });

  it('fails naming the province and salary, and returns nothing, when a call keeps failing', async () => {
    const api = fakeApi((body) =>
      body.salary === '3000'
        ? new Response(null, { status: 429 })
        : Response.json(answerFor(body)),
    );
    await expect(
      sweepProvinces({ api: apiOf(api.fetch), provinces: ontario }),
    ).rejects.toThrow(
      'Salary sweep: ca-on/3000 failed: status 429 after 2 tries',
    );
  });

  it('fails on any other API error', async () => {
    const api = fakeApi(() => new Response(null, { status: 500 }));
    await expect(
      sweepProvinces({ api: apiOf(api.fetch), provinces: ontario }),
    ).rejects.toThrow('Salary sweep: ca-on/1000 failed: status 500');
  });

  it('fails when an answer carries no unit', async () => {
    const api = fakeApi((body) =>
      Response.json({ ...answerFor(body), unit: null }),
    );
    await expect(
      sweepProvinces({ api: apiOf(api.fetch), provinces: ontario }),
    ).rejects.toThrow('ca-on/1000 failed: the answer has no unit');
  });
});

import { ApiError, NetworkError, RequestTimeoutError } from '../api';
import invalidSalary from '../api/fixtures/error-invalid-salary.json';
import { strings } from '../strings';
import { describeFailure } from './failure';

const problem = (status: number, field?: string) => ({
  ...invalidSalary,
  status,
  ...(field ? { field } : {}),
});

describe('describeFailure', () => {
  it('puts a salary problem under the salary box', () => {
    expect(describeFailure(new ApiError(400, problem(400, 'salary')))).toEqual({
      kind: 'salary',
      message: strings.errors.salaryRejected,
    });
  });

  it.each([
    [new ApiError(400, invalidSalary), strings.errors.rejected],
    [new ApiError(400, problem(400, 'year')), strings.errors.rejected],
    [new ApiError(422, null), strings.errors.rejected],
    [new ApiError(429, null), strings.errors.tooManyRequests],
    [new ApiError(500, null), strings.errors.serverProblem],
    [new ApiError(503, problem(503)), strings.errors.serverProblem],
    [new NetworkError('offline'), strings.errors.unreachable],
    [new RequestTimeoutError(), strings.errors.timeout],
    [new Error('boom'), strings.errors.unknown],
    ['nope', strings.errors.unknown],
  ])('shows a notice for %j', (error, message) => {
    expect(describeFailure(error)).toEqual({ kind: 'notice', message });
  });

  it('never shows the service text, which is for developers', () => {
    const failure = describeFailure(new ApiError(400, invalidSalary));
    expect(failure.message).not.toContain(invalidSalary.detail);
  });
});

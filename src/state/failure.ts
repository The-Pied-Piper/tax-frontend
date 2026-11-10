import { ApiError, NetworkError, RequestTimeoutError } from '../api';
import { strings } from '../strings';

/** What the page shows for a failed request: under the salary box, or as a notice. */
export type Failure =
  { kind: 'salary'; message: string } | { kind: 'notice'; message: string };

export function describeFailure(error: unknown): Failure {
  if (error instanceof ApiError) {
    if (error.problem?.field === 'salary') {
      return { kind: 'salary', message: strings.errors.salaryRejected };
    }
    if (error.status === 429) {
      return { kind: 'notice', message: strings.errors.tooManyRequests };
    }
    if (error.status >= 500) {
      return { kind: 'notice', message: strings.errors.serverProblem };
    }
    if (error.status >= 400) {
      return { kind: 'notice', message: strings.errors.rejected };
    }
  }
  if (error instanceof RequestTimeoutError) {
    return { kind: 'notice', message: strings.errors.timeout };
  }
  if (error instanceof NetworkError) {
    return { kind: 'notice', message: strings.errors.unreachable };
  }
  return { kind: 'notice', message: strings.errors.unknown };
}

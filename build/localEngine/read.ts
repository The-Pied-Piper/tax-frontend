import { readFileSync } from 'node:fs';
import type { EngineAnswer, EngineAnswers } from '../salaryPages/generate';
import { responseChecker } from './openApiCheck';

/** What build/localEngine/engine_figures.py writes, once every page answer is checked. */
export type EngineFigures = {
  /** The tax-engine release that produced them. */
  engine: string;
  /** The answers for the pre-built salary pages. */
  answers: EngineAnswers;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads the file the Python step wrote. Every page answer must fit the
 * ComputeTakeHomeCalculationResponse schema of api/openapi.yml (a `provisional` is added
 * for the check, as the build adds the real one later), so a drift between the script and
 * the service's response shape fails the build here.
 */
export function readEngineFigures(
  file: string,
  check: (answer: unknown) => string[] = responseChecker(),
): EngineFigures {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Engine figures: cannot read ${file}`, { cause: error });
  }
  if (
    !isRecord(parsed) ||
    typeof parsed.engine !== 'string' ||
    !isRecord(parsed.provinces)
  ) {
    throw new Error(
      `Engine figures: ${file} is not what the Python step writes`,
    );
  }
  const answers: EngineAnswers = {};
  for (const [code, province] of Object.entries(parsed.provinces)) {
    if (!isRecord(province) || !isRecord(province.pages)) {
      throw new Error(`Engine figures: ${code} has no pages`);
    }
    const bySalary: Record<string, EngineAnswer> = {};
    for (const [salary, answer] of Object.entries(province.pages)) {
      if (!isRecord(answer)) {
        throw new Error(`Engine figures: ${code}/${salary} is not an object`);
      }
      const problems = check({ ...answer, provisional: false });
      if (problems.length > 0) {
        throw new Error(
          `Engine figures: ${code}/${salary} does not fit api/openapi.yml: ${problems.join('; ')}`,
        );
      }
      // Fit to the schema just above, so this is the engine answer's shape.
      bySalary[salary] = answer as EngineAnswer;
    }
    answers[code] = bySalary;
  }
  return { engine: parsed.engine, answers };
}

import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { load } from 'js-yaml';

/**
 * A checker for one answer of POST /take-home-calculations:compute, built from the
 * ComputeTakeHomeCalculationResponse schema of api/openapi.yml (the file the spec-drift
 * check keeps equal to tax-service's). Returns the problems found, empty when the answer fits.
 */
export function responseChecker(
  specFile = 'api/openapi.yml',
): (answer: unknown) => string[] {
  const spec: unknown = load(readFileSync(specFile, 'utf8'));
  if (typeof spec !== 'object' || spec === null) {
    throw new Error(`${specFile} is not an OpenAPI document`);
  }
  // OpenAPI 3.0 schemas use `nullable` and carry examples; Ajv knows `nullable`, and strict mode would refuse the rest.
  const ajv = new Ajv({ strict: false, allErrors: true });
  ajv.addSchema(spec, 'openapi');
  const validate = ajv.compile({
    $ref: 'openapi#/components/schemas/ComputeTakeHomeCalculationResponse',
  });
  return (answer) => {
    if (validate(answer)) return [];
    return (validate.errors ?? []).map(
      (e) =>
        `${e.instancePath === '' ? '/' : e.instancePath} ${e.message ?? 'is invalid'}`,
    );
  };
}

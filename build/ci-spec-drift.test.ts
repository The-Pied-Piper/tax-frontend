import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const start = workflow.indexOf('\n  spec-drift:');
const rest = start === -1 ? '' : workflow.slice(start + 1);
// The job ends at the next job key (two-space indent) or the end of the file.
const job = rest.split(/\n {2}(?=[A-Za-z0-9_-]+:)/, 1)[0] ?? '';
// Shell line continuations joined, so a flag split over lines is still seen.
const flat = job.replace(/\\\r?\n\s*/g, ' ');
const url =
  'https://raw.githubusercontent.com/The-Pied-Piper/tax-service/main/openapi/openapi.yml';

function lines(pattern: RegExp): string[] {
  return flat.split('\n').filter((line) => pattern.test(line));
}

const curlLine = lines(/\bcurl\b/)[0] ?? '';
const output = /(?:\s-o|\s--output)[\s=]+(\S+)/.exec(curlLine)?.[1] ?? '';

describe('ci.yml spec-drift job (public spec, no token)', () => {
  it('has a spec-drift job', () => {
    expect(job).toContain('spec-drift:');
  });

  it('uses no secret and no TAX_SERVICE_READ_TOKEN', () => {
    expect(job).not.toContain('TAX_SERVICE_READ_TOKEN');
    expect(job).not.toContain('secrets.');
  });

  it('has no skip branch and does not look at the event name', () => {
    expect(job).not.toMatch(/\bexit 0\b/);
    expect(job).not.toContain('github.event_name');
  });

  it('no longer calls tax-service private', () => {
    expect(job).not.toMatch(/private/i);
  });

  it('downloads the public raw spec URL with curl, not gh', () => {
    expect(curlLine, 'a curl line exists').not.toBe('');
    expect(curlLine).toContain(url);
    expect(job).not.toMatch(/\bgh\b/);
  });

  it('makes curl fail on an HTTP error (-f) and still print it (-S)', () => {
    const flags = [...curlLine.matchAll(/\s-([A-Za-z]+)/g)].map((m) => m[1]);
    const joined = flags.join('') + (curlLine.includes('--fail') ? 'f' : '');
    const withS = joined + (curlLine.includes('--show-error') ? 'S' : '');
    expect(joined).toContain('f');
    expect(withS).toContain('S');
  });

  it('saves the download to a file', () => {
    expect(output, 'curl writes with -o <file>').not.toBe('');
  });

  it('fails on an empty download before diffing', () => {
    const guard = flat.search(/\b(?:test|\[)\s+-s\s/);
    const diff = flat.search(/\bdiff\b/);
    expect(guard, 'a non-empty check (test -s / [ -s)').toBeGreaterThanOrEqual(
      0,
    );
    expect(diff, 'a diff command').toBeGreaterThanOrEqual(0);
    expect(guard).toBeLessThan(diff);
    expect(lines(/-s\s/).join('\n')).toContain(output);
  });

  it('diffs the committed spec against the downloaded file', () => {
    const diffLine = lines(/\bdiff\b/)[0] ?? '';
    expect(diffLine).toContain('api/openapi.yml');
    expect(output).not.toBe('');
    expect(diffLine).toContain(output);
  });

  it('lets a diff failure fail the job', () => {
    expect(job).not.toContain('|| true');
    expect(job).not.toContain('continue-on-error');
    expect(job).not.toMatch(/\bset \+e\b/);
  });
});

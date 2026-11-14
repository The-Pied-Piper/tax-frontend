import { existsSync, readFileSync, statSync } from 'node:fs';

function read(path: string): string {
  expect(existsSync(path), `${path} exists`).toBe(true);
  return readFileSync(path, 'utf8');
}

const docs = ['README.md', 'DEVELOPMENT.md', 'CONTRIBUTING.md'] as const;
const readme = existsSync('README.md') ? readFileSync('README.md', 'utf8') : '';
const opening = readme.split('\n').slice(0, 30).join('\n');

function headings(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((line) => /^#{1,6}\s/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, '').trim());
}

describe('README.md (the front door for strangers)', () => {
  it('starts with the heading "After Tax Lens"', () => {
    const first = headings(read('README.md'))[0];
    expect(first).toBe('After Tax Lens');
  });

  it('is under 80 lines', () => {
    expect(read('README.md').split('\n').length).toBeLessThan(80);
  });

  it('opens with a link to the live site', () => {
    expect(opening).toContain('https://aftertaxlens.com');
  });

  it('opens with the breakdown screenshot, which is under 1 MB', () => {
    expect(opening).toContain('readme/breakdown.png');
    expect(
      existsSync('readme/breakdown.png'),
      'readme/breakdown.png exists',
    ).toBe(true);
    expect(statSync('readme/breakdown.png').size).toBeLessThan(1024 * 1024);
  });

  it('opens with a CI badge for the ci.yml workflow', () => {
    expect(opening).toContain('actions/workflows/ci.yml');
    expect(opening).toMatch(/\[!\[[^\]]*\]\([^)]*ci\.yml[^)]*\)\]/);
  });

  it('says it follows the published forms and gives an estimate', () => {
    expect(opening).toContain('Follows the published forms');
    expect(opening.toLowerCase()).toContain('estimate');
  });

  it('opens with links to CONTRIBUTING.md and the issues list', () => {
    expect(opening).toContain('CONTRIBUTING.md');
    expect(opening).toContain(
      'https://github.com/The-Pied-Piper/tax-frontend/issues',
    );
  });

  it('has no Commands heading (that moved to DEVELOPMENT.md)', () => {
    expect(headings(read('README.md'))).not.toContain('Commands');
  });

  it('does not mention AI, Claude or LLM', () => {
    expect(readme).not.toMatch(/\b(AI|Claude|LLMs?)\b/i);
  });
});

describe('DEVELOPMENT.md (the working detail)', () => {
  it('keeps the section headings from the old README', () => {
    const found = headings(read('DEVELOPMENT.md'));
    for (const heading of [
      'Commands',
      'API client',
      'Local development',
      'Lint rules',
      'Deploying',
      'Dependency updates',
      'Search and sharing (SEO)',
      'Pre-built salary pages',
    ]) {
      expect(found, heading).toContain(heading);
    }
  });

  it('does not name TAX_SERVICE_READ_TOKEN and says the drift check runs on every pull request, including from forks', () => {
    const text = read('DEVELOPMENT.md');
    expect(text).not.toContain('TAX_SERVICE_READ_TOKEN');
    expect(text).toContain('every pull request');
    expect(text).toContain('forks');
  });
});

describe('CONTRIBUTING.md', () => {
  it('exists and is short', () => {
    const lines = read('CONTRIBUTING.md').split('\n').length;
    expect(lines).toBeGreaterThan(1);
    expect(lines).toBeLessThan(80);
  });
});

describe.each(docs)('%s wording', (path) => {
  it('does not claim to be checked against CRA', () => {
    expect(read(path).toLowerCase()).not.toContain('checked against cra');
  });

  it('does not point at docs/', () => {
    expect(read(path)).not.toContain('docs/');
  });

  it('does not describe the tax service as private', () => {
    const text = read(path);
    expect(text).not.toContain('TAX_SERVICE_READ_TOKEN is for a private');
    expect(text).not.toMatch(
      /private[^\n]{0,40}tax-service|tax-service[^\n]{0,40}private/i,
    );
  });
});

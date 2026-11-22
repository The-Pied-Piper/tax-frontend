import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// resolve_pin.py against a made-up tax-service repository and a made-up PyPI folder, both local.
const SCRIPT = 'build/localEngine/resolve_pin.py';
const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const COMMITTED = [
  'pyyaml==6.0.4 \\',
  `    --hash=sha256:${'1'.repeat(64)} \\`,
  `    --hash=sha256:${'2'.repeat(64)}`,
  '    # via tax-engine',
  'tax-engine==0.0.1 \\',
  `    --hash=sha256:${'3'.repeat(64)}`,
  '',
].join('\n');

const root = mkdtempSync(join(tmpdir(), 'resolve-pin-'));
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]) {
  execFileSync(
    'git',
    [
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'tag.gpgsign=false',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd, stdio: 'pipe' },
  );
}

/** A repository whose commits each carry the given requirements.txt; returns its path. */
function service(
  commits: { requirements: string; tag?: string; annotated?: boolean }[],
) {
  const dir = mkdtempSync(join(root, 'service-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'uploadpack.allowAnySHA1InWant', 'true');
  for (const commit of commits) {
    writeFileSync(join(dir, 'requirements.txt'), commit.requirements);
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'c');
    if (commit.tag) {
      if (commit.annotated) git(dir, 'tag', '-a', commit.tag, '-m', 'release');
      else git(dir, 'tag', commit.tag);
    }
  }
  return dir;
}

/** A folder laid out like PyPI's JSON API, holding the given versions of tax-engine. */
function pypi(versions: string[]) {
  const dir = mkdtempSync(join(root, 'pypi-'));
  for (const version of versions) {
    const folder = join(dir, 'tax-engine', version);
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      join(folder, 'json'),
      JSON.stringify({
        urls: [
          { digests: { sha256: HASH_B } },
          { digests: { sha256: HASH_A } },
        ],
      }),
    );
  }
  return dir;
}

function run(mode: string, repo: string, pypiDir: string) {
  const dir = mkdtempSync(join(root, 'run-'));
  const committed = join(dir, 'requirements.txt');
  const output = join(dir, 'out.txt');
  writeFileSync(committed, COMMITTED);
  const done = spawnSync('python3', ['-I', SCRIPT, mode, committed, output], {
    encoding: 'utf8',
    env: {
      ...process.env,
      TAX_SERVICE_URL: `file://${repo}`,
      PYPI_URL: `file://${pypiDir}`,
    },
  });
  return {
    status: done.status,
    stdout: done.stdout,
    stderr: done.stderr,
    output: existsSync(output) ? readFileSync(output, 'utf8') : null,
  };
}

const pin = (version: string) =>
  `tax-engine==${version}\n# a comment\nother==1.0\n`;

describe('resolve_pin.py', () => {
  it('main: takes the tax-engine pin of main, with PyPI hashes and the committed PyYAML block', () => {
    const repo = service([{ requirements: pin('0.5.0') }]);
    const done = run('main', repo, pypi(['0.5.0']));
    expect(done.stderr).toBe('');
    expect(done.status).toBe(0);
    expect(done.stdout).toMatch(
      /^tax-engine 0\.5\.0 from tax-service main \([0-9a-f]{40}\)\n$/,
    );
    expect(done.output).toBe(
      [
        'pyyaml==6.0.4 \\',
        `    --hash=sha256:${'1'.repeat(64)} \\`,
        `    --hash=sha256:${'2'.repeat(64)}`,
        'tax-engine==0.5.0 \\',
        `    --hash=sha256:${HASH_A} \\`,
        `    --hash=sha256:${HASH_B}`,
        '',
      ].join('\n'),
    );
  });

  it('main: follows main, not an older tag', () => {
    const repo = service([
      { requirements: pin('0.4.0'), tag: 'v1' },
      { requirements: pin('0.6.0') },
    ]);
    expect(run('main', repo, pypi(['0.4.0', '0.6.0'])).stdout).toContain(
      'tax-engine 0.6.0',
    );
  });

  it('release: takes the highest v<number> tag, numerically, annotated or not, and ignores other tags', () => {
    const repo = service([
      { requirements: pin('0.1.0'), tag: 'v2', annotated: true },
      { requirements: pin('0.2.0'), tag: 'v10', annotated: true },
      { requirements: pin('0.3.0'), tag: 'nightly' },
      { requirements: pin('0.9.0'), tag: 'v9' },
      { requirements: pin('0.7.0') },
    ]);
    const done = run(
      'release',
      repo,
      pypi(['0.1.0', '0.2.0', '0.3.0', '0.7.0', '0.9.0']),
    );
    expect(done.status).toBe(0);
    expect(done.stdout).toMatch(/^tax-engine 0\.2\.0 from tax-service v10 /);
  });

  describe('fails, writes nothing and never falls back', () => {
    const cases: [string, () => ReturnType<typeof run>, RegExp][] = [
      [
        'no release tag',
        () =>
          run(
            'release',
            service([{ requirements: pin('0.5.0') }]),
            pypi(['0.5.0']),
          ),
        /no release tag/,
      ],
      [
        'no tax-engine line',
        () =>
          run(
            'main',
            service([{ requirements: 'other==1.0\n' }]),
            pypi(['0.5.0']),
          ),
        /found 0/,
      ],
      [
        'two tax-engine lines',
        () =>
          run(
            'main',
            service([
              { requirements: 'tax-engine==0.5.0\ntax-engine==0.6.0\n' },
            ]),
            pypi(['0.5.0', '0.6.0']),
          ),
        /found 2/,
      ],
      [
        'a release PyPI does not know',
        () =>
          run(
            'main',
            service([{ requirements: pin('0.5.0') }]),
            pypi(['0.4.0']),
          ),
        /cannot read the files of tax-engine 0\.5\.0/,
      ],
      [
        'an unreachable repository',
        () => run('main', join(root, 'nowhere'), pypi(['0.5.0'])),
        /git ls-remote failed/,
      ],
      [
        'a mode that is neither main nor release',
        () =>
          run(
            'latest',
            service([{ requirements: pin('0.5.0') }]),
            pypi(['0.5.0']),
          ),
        /main or release/,
      ],
    ];
    it.each(cases)('%s', (_name, go, message) => {
      const done = go();
      expect(done.status).not.toBe(0);
      expect(done.stderr).toMatch(/^resolve_pin: /);
      expect(done.stderr).toMatch(message);
      expect(done.output).toBeNull();
    });
  });
});

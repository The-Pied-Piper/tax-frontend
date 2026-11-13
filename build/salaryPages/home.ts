import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SALARY_INDEX_ID, type SalaryIndex } from '../../src/state/salaryIndex';
import { strings } from '../../src/strings';
import { dataBlock } from './pageHtml';

// The end of the home page's static <main>, inside #root.
const END_OF_MAIN = /<\/main>(?=\s*<\/div>\s*(?:<script|<\/body>))/;

// What an earlier call wrote, so a second call leaves exactly one of each.
const OLD_NAV = new RegExp(
  `<details [^>]*><summary[^>]*>${strings.salaryIndex.label}</summary><nav [^>]*aria-label="${strings.salaryIndex.label}"[\\s\\S]*?</nav></details>`,
);
const OLD_BLOCK = new RegExp(
  `<script type="application/json" id="${SALARY_INDEX_ID}">[\\s\\S]*?</script>\\n  `,
);

/**
 * Gives dist/index.html a plain link to every pre-built page: the real nav as
 * static HTML at the end of the static main, and the index as the data block
 * React reads. An index with no groups leaves the file as it is; calling again
 * replaces what was written before.
 */
export async function rewriteHome(
  outDir: string,
  index: SalaryIndex,
  render: (index: SalaryIndex) => string,
): Promise<void> {
  if (index.groups.length === 0) return;
  const file = join(outDir, 'index.html');
  const html = (await readFile(file, 'utf8'))
    .replace(OLD_NAV, '')
    .replace(OLD_BLOCK, '');
  if (!END_OF_MAIN.test(html))
    throw new Error('index.html has no main in #root');
  const withNav = html.replace(END_OF_MAIN, () => `${render(index)}</main>`);
  await writeFile(
    file,
    withNav.replace(
      '</body>',
      () => `${dataBlock(SALARY_INDEX_ID, index)}\n  </body>`,
    ),
  );
}

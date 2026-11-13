import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SalaryIndex } from '../../src/state/salaryIndex';
import { indexBlock } from './indexBlock';

// The end of the home page's static <main>, inside #root.
const END_OF_MAIN = /<\/main>(?=\s*<\/div>\s*(?:<script|<\/body>))/;

/**
 * Gives dist/index.html a plain link to every pre-built page: the real nav as
 * static HTML at the end of the static main, and the index as the data block
 * React reads. An index with no groups leaves the file as it is.
 */
export async function rewriteHome(
  outDir: string,
  index: SalaryIndex,
  render: (index: SalaryIndex) => string,
): Promise<void> {
  if (index.groups.length === 0) return;
  const file = join(outDir, 'index.html');
  const html = await readFile(file, 'utf8');
  if (!END_OF_MAIN.test(html))
    throw new Error('index.html has no main in #root');
  const withNav = html.replace(END_OF_MAIN, () => `${render(index)}</main>`);
  await writeFile(
    file,
    withNav.replace('</body>', () => `${indexBlock(index)}\n  </body>`),
  );
}

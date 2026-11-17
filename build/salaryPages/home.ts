import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// The end of the home page's static <main>, inside #root.
const END_OF_MAIN = /<\/main>(?=\s*<\/div>\s*(?:<script|<\/body>))/;

// A footer an earlier call wrote right after the main, so a second call leaves exactly one.
const OLD_FOOTER = /(<\/main>)\s*<footer\b[\s\S]*?<\/footer>(?=\s*<\/div>)/;

/**
 * Gives dist/index.html plain links to the methodology page and the province
 * pages: the real site footer as static HTML after the static main, inside
 * #root. React replaces it with identical markup on load. Calling again
 * replaces what was written before.
 */
export async function rewriteHome(
  outDir: string,
  renderFooter: () => string,
): Promise<void> {
  const file = join(outDir, 'index.html');
  const html = (await readFile(file, 'utf8')).replace(
    OLD_FOOTER,
    (_m, main: string) => main,
  );
  if (!END_OF_MAIN.test(html))
    throw new Error('index.html has no main in #root');
  await writeFile(
    file,
    html.replace(END_OF_MAIN, () => `</main>${renderFooter()}`),
  );
}

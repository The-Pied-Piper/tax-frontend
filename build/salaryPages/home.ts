import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// The end of the home page's static <main>, inside #root.
const END_OF_MAIN = /<\/main>(?=\s*<\/div>\s*(?:<script|<\/body>))/;

// A footer an earlier call wrote, so a second call leaves exactly one.
const OLD_FOOTER = /<footer class="page-footer">[\s\S]*?<\/footer>/;

/**
 * Gives dist/index.html the site footer as static HTML after the static main,
 * inside #root: the plain links to the methodology page and the province pages
 * are then in the file a crawler reads, not only drawn once the script runs.
 * Calling again replaces the footer written before.
 */
export async function rewriteHomeFooter(
  outDir: string,
  footerHtml: string,
): Promise<void> {
  const file = join(outDir, 'index.html');
  const html = (await readFile(file, 'utf8')).replace(OLD_FOOTER, '');
  if (!END_OF_MAIN.test(html)) {
    throw new Error('index.html has no main in #root');
  }
  await writeFile(
    file,
    html.replace(END_OF_MAIN, () => `</main>${footerHtml}`),
  );
}

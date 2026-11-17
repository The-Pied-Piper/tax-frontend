import { formPages } from '../src/state/formPages';

/**
 * The Vite `define` that gives the calculator the ids of the published form
 * pages, so it can link to them without carrying their text. Used by both the
 * main build and the nested page build.
 */
export function formPageIdDefine(): Record<string, string> {
  return { __FORM_PAGE_IDS__: JSON.stringify(formPages.map((f) => f.id)) };
}

import { readFileSync } from 'node:fs';
import { formPages } from '../src/state/formPages';
import { formPageIdDefine } from './formPageIds';

describe('formPageIdDefine', () => {
  it('defines __FORM_PAGE_IDS__ as the ids of the published form pages', () => {
    expect(formPageIdDefine()).toEqual({
      __FORM_PAGE_IDS__: JSON.stringify(formPages.map((f) => f.id)),
    });
  });
});

describe('the build configs', () => {
  it('give the nested page build the same define', () => {
    const text = readFileSync('build/salaryPages.ts', 'utf8');
    expect(text).toMatch(/define:\s*formPageIdDefine\(\)/);
  });

  it('give the main build the same define', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toContain(
      'formPageIdDefine',
    );
  });
});

import { keepCssModules } from './keepCssModules';

function run(id: string): unknown {
  const hook = keepCssModules().transform;
  if (typeof hook !== 'function') throw new Error('no transform hook');
  return hook.call({} as never, 'x', id);
}

describe('keepCssModules', () => {
  it('keeps a CSS module that is only imported for its sheet', () => {
    expect(run('/src/components/A.module.css')).toMatchObject({
      moduleSideEffects: 'no-treeshake',
    });
    expect(run('/src/components/A.module.css?used')).toMatchObject({
      moduleSideEffects: 'no-treeshake',
    });
  });

  it('leaves every other file alone', () => {
    expect(run('/src/styles/global.css')).toBeNull();
    expect(run('/src/App.tsx')).toBeNull();
  });
});

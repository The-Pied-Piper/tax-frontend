import { salaryPages } from './salaryPages';

describe('salaryPages plugin', () => {
  it('writes nothing without an explicit API address (local builds and CI)', () => {
    expect(salaryPages(undefined).closeBundle).toBeUndefined();
    expect(salaryPages('').closeBundle).toBeUndefined();
    expect(salaryPages('  ').closeBundle).toBeUndefined();
  });

  it('runs after the bundle is written when the API address is set', () => {
    const plugin = salaryPages('https://api.example.com/api/v1');
    expect(plugin.name).toBe('salary-pages');
    expect(plugin.closeBundle).toBeDefined();
  });
});

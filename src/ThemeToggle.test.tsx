import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { strings } from './strings';
import { THEME_STORAGE_KEY } from './theme';

function mockDevice(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: dark && query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('theme toggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('offers only Light and Dark', () => {
    mockDevice(false);
    render(<App />);
    const group = screen.getByRole('group', { name: strings.themeLabel });
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });

  it('starts on a dark device setting', () => {
    mockDevice(true);
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button(strings.themeDark)).toHaveAttribute('aria-pressed', 'true');
    expect(button(strings.themeLight)).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts on a light device setting', () => {
    mockDevice(false);
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button(strings.themeLight)).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches and remembers the choice', () => {
    mockDevice(false);
    render(<App />);
    fireEvent.click(button(strings.themeDark));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    fireEvent.click(button(strings.themeLight));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('uses the remembered choice over the device setting', () => {
    mockDevice(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button(strings.themeLight)).toHaveAttribute('aria-pressed', 'true');
  });

  it('ignores an invalid remembered value', () => {
    mockDevice(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'system');
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('still works when storage is blocked', () => {
    mockDevice(false);
    const get = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    render(<App />);
    fireEvent.click(button(strings.themeDark));
    expect(document.documentElement.dataset.theme).toBe('dark');
    get.mockRestore();
    set.mockRestore();
  });
});

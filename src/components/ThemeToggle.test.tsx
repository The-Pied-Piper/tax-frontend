import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { strings } from '../strings';
import { THEME_STORAGE_KEY } from '../theme/theme';

type Listener = () => void;
const listeners = new Set<Listener>();
let deviceDark = false;

function mockDevice(dark: boolean) {
  deviceDark = dark;
  listeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return deviceDark && query === '(prefers-color-scheme: dark)';
    },
    media: query,
    addEventListener: (_type: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_type: string, fn: Listener) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
}

function changeDevice(dark: boolean) {
  deviceDark = dark;
  act(() => {
    listeners.forEach((fn) => {
      fn();
    });
  });
}

const button = (name: string) => screen.getByRole('button', { name });

describe('theme toggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('offers only Light and Dark', () => {
    mockDevice(false);
    render(<ThemeToggle />);
    const group = screen.getByRole('group', { name: strings.themeLabel });
    expect(within(group).getAllByRole('button')).toHaveLength(2);
  });

  it('starts on a dark device setting', () => {
    mockDevice(true);
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button(strings.themeDark)).toHaveAttribute('aria-pressed', 'true');
    expect(button(strings.themeLight)).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts on a light device setting', () => {
    mockDevice(false);
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button(strings.themeLight)).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches and remembers the choice', () => {
    mockDevice(false);
    render(<ThemeToggle />);
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
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button(strings.themeLight)).toHaveAttribute('aria-pressed', 'true');
  });

  it('ignores an invalid remembered value', () => {
    mockDevice(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'system');
    render(<ThemeToggle />);
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
    render(<ThemeToggle />);
    fireEvent.click(button(strings.themeDark));
    expect(document.documentElement.dataset.theme).toBe('dark');
    get.mockRestore();
    set.mockRestore();
  });

  it('follows the device until a choice is made', () => {
    mockDevice(false);
    render(<ThemeToggle />);
    changeDevice(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(button(strings.themeLight));
    changeDevice(true);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('keeps a click over the device even when storage is blocked', () => {
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
    render(<ThemeToggle />);
    fireEvent.click(button(strings.themeLight));
    changeDevice(true);
    expect(document.documentElement.dataset.theme).toBe('light');
    get.mockRestore();
    set.mockRestore();
  });

  it('stops listening to the device when removed', () => {
    mockDevice(false);
    const { unmount } = render(<ThemeToggle />);
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
  });
});

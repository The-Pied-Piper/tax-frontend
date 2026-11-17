import { THEME_TOGGLE_SLOT_ID } from './themeSlot';

describe('the theme switch slot', () => {
  it('has its own module, so the calculator never imports page copy', () => {
    expect(THEME_TOGGLE_SLOT_ID).toBe('content-theme-toggle');
  });
});

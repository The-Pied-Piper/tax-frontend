import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeToggle } from './components/ThemeToggle';
import { THEME_TOGGLE_SLOT_ID } from './state/themeSlot';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
// The pre-built page uses these components' styles; the page itself is plain
// HTML, so only their stylesheets are needed here.
import './components/ContentPage.module.css';
import './components/FormSections.module.css';
import './components/SiteFooter.module.css';

// A pre-built content page has a slot for the Light/Dark switch and nothing
// else to run: mount the switch there. No calculator, no visit beacon.
const toggleSlot = document.getElementById(THEME_TOGGLE_SLOT_ID);
if (toggleSlot) {
  createRoot(toggleSlot).render(
    <StrictMode>
      <ThemeToggle />
    </StrictMode>,
  );
}

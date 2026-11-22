import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { SalaryChartsCard } from './components/SalaryChartsCard';
import { ThemeToggle } from './components/ThemeToggle';
import { HUB_CHARTS_DATA_ID, parseHubChartsData } from './state/hubCharts';
import { HUB_CHARTS_SLOT_ID } from './state/hubSlots';
import { FOOTER_PROVINCE_SLUGS } from './state/siteLinks';
import { THEME_TOGGLE_SLOT_ID } from './state/themeSlot';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
// The pre-built page uses these components' styles; the page itself is plain
// HTML, so only their stylesheets are needed here.
import './components/Breadcrumb.module.css';
import './components/ContentPage.module.css';
import './components/FormSections.module.css';
import './components/LineChart.module.css';
import './components/SalaryChartsCard.module.css';
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

// A province hub has a slot for the salary charts card, drawn in the page's HTML
// from the figures in its data block. Hydrate the same card from that block: no
// fetch, no storage.
const chartsSlot = document.getElementById(HUB_CHARTS_SLOT_ID);
const chartsData = parseHubChartsData(
  document.getElementById(HUB_CHARTS_DATA_ID)?.textContent ?? null,
);
const chartsProvince = FOOTER_PROVINCE_SLUGS.find(
  (slug) => slug === chartsSlot?.dataset.province,
);
if (chartsSlot && chartsData && chartsProvince) {
  hydrateRoot(
    chartsSlot,
    <StrictMode>
      <SalaryChartsCard data={chartsData} province={chartsProvince} />
    </StrictMode>,
  );
}

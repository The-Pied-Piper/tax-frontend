import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProvinceComparison } from './components/ProvinceComparison';
import { ThemeToggle } from './components/ThemeToggle';
import { PROVINCE_COMPARISON_SLOT_ID } from './state/hubChartSlots';
import { HUB_CHARTS_DATA_ID, parseHubChartsData } from './state/hubCharts';
import { THEME_TOGGLE_SLOT_ID } from './state/themeSlot';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
// The pre-built page uses these components' styles; the page itself is plain
// HTML, so only their stylesheets are needed here.
import './components/Breadcrumb.module.css';
import './components/ContentPage.module.css';
import './components/FormSections.module.css';
import './components/SiteFooter.module.css';

// A pre-built content page has a slot for the Light/Dark switch: mount the
// switch there. No calculator, no visit beacon.
const toggleSlot = document.getElementById(THEME_TOGGLE_SLOT_ID);
if (toggleSlot) {
  createRoot(toggleSlot).render(
    <StrictMode>
      <ThemeToggle />
    </StrictMode>,
  );
}

// A province hub also has a slot for the province comparison, drawn from the
// data block embedded in the same page: nothing is fetched.
const comparisonSlot = document.getElementById(PROVINCE_COMPARISON_SLOT_ID);
const province = comparisonSlot?.dataset.province;
const chartsData = parseHubChartsData(
  document.getElementById(HUB_CHARTS_DATA_ID)?.textContent ?? null,
);
if (comparisonSlot && province && chartsData) {
  createRoot(comparisonSlot).render(
    <StrictMode>
      <ProvinceComparison data={chartsData} province={province} />
    </StrictMode>,
  );
}

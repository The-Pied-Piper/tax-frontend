import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ProvinceComparison } from './components/ProvinceComparison';
import { RatesChart } from './components/RatesChart';
import { SalaryChart } from './components/SalaryChart';
import { ThemeToggle } from './components/ThemeToggle';
import { HUB_CHART_IDS, parseHubChartsData } from './state/hubCharts';
import {
  HUB_CHARTS_DATA_ID,
  HUB_CHART_SLOT_IDS,
  PROVINCE_COMPARISON_SLOT_ID,
  RATES_CHART_SLOT_ID,
} from './state/hubSlots';
import { FOOTER_PROVINCE_SLUGS } from './state/siteLinks';
import { strings } from './strings';
import { THEME_TOGGLE_SLOT_ID } from './state/themeSlot';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
// The pre-built page uses these components' styles; the page itself is plain
// HTML, so only their stylesheets are needed here.
import './components/Breadcrumb.module.css';
import './components/ContentPage.module.css';
import './components/ChartPeriodSwitch.module.css';
import './components/FoldingList.module.css';
import './components/FormSections.module.css';
import './components/LineChart.module.css';
import './components/RatesChart.module.css';
import './components/SalaryChart.module.css';
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

// A province hub has a slot for each salary chart, drawn in the page's HTML from the
// figures in its data block. Hydrate the same charts from that block: no fetch, no
// storage. The charts share their marker and period through state/hubChartView.
const chartsData = parseHubChartsData(
  document.getElementById(HUB_CHARTS_DATA_ID)?.textContent ?? null,
);
for (const chart of HUB_CHART_IDS) {
  const slot = document.getElementById(HUB_CHART_SLOT_IDS[chart]);
  const province = FOOTER_PROVINCE_SLUGS.find(
    (slug) => slug === slot?.dataset.province,
  );
  if (slot && chartsData && province) {
    hydrateRoot(
      slot,
      <StrictMode>
        <SalaryChart data={chartsData} province={province} chart={chart} />
      </StrictMode>,
    );
  }
}

// A province hub also has a slot for the province comparison, drawn from the same
// data block. Hydrate it from that block too: no fetch, no storage.
const comparisonSlot = document.getElementById(PROVINCE_COMPARISON_SLOT_ID);
const comparisonProvince = FOOTER_PROVINCE_SLUGS.find(
  (slug) => slug === comparisonSlot?.dataset.province,
);
// The compare page has no province: its slot has no data-province and its bars highlight none.
if (
  comparisonSlot &&
  chartsData &&
  (comparisonProvince !== undefined ||
    comparisonSlot.dataset.province === undefined)
) {
  hydrateRoot(
    comparisonSlot,
    <StrictMode>
      <ProvinceComparison data={chartsData} province={comparisonProvince} />
    </StrictMode>,
  );
}

// A rates page has a slot for its chart, drawn in the page's HTML from the same data block.
const ratesSlot = document.getElementById(RATES_CHART_SLOT_ID);
const ratesProvince = FOOTER_PROVINCE_SLUGS.find(
  (slug) => slug === ratesSlot?.dataset.province,
);
const ratesSweep = chartsData?.provinces.find(
  (sweep) => sweep.slug === ratesProvince,
);
if (ratesSlot && ratesProvince && ratesSweep) {
  hydrateRoot(
    ratesSlot,
    <StrictMode>
      <RatesChart
        sweep={ratesSweep}
        place={strings.siteNav.provinceNames[ratesProvince]}
      />
    </StrictMode>,
  );
}

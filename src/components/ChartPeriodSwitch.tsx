import type { ChartPeriod } from '../state/hubChartView';
import { strings } from '../strings';
import styles from './ChartPeriodSwitch.module.css';

type Props = {
  value: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
};

const OPTIONS = [
  ['annually', strings.hubCharts.perYear],
  ['monthly', strings.hubCharts.perMonth],
] as const;

// Controlled switch: the card keeps the chosen period (Per year by default).
export function ChartPeriodSwitch({ value, onChange }: Props) {
  return (
    <div className={styles.group}>
      {OPTIONS.map(([period, label]) => (
        <button
          key={period}
          type="button"
          aria-pressed={value === period}
          onClick={() => {
            onChange(period);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

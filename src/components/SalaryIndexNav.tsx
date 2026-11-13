import { useId } from 'react';
import { displayMoney } from '../money/format';
import { nearestSteps } from '../money/nearestSteps';
import type { SalaryIndex, SalaryIndexGroup } from '../state/salaryIndex';
import { strings } from '../strings';
import styles from './SalaryIndexNav.module.css';

function Link({
  group,
  salary,
  href,
}: {
  group: SalaryIndexGroup;
  salary: string;
  href: string;
}) {
  const amount = displayMoney(salary, 'annually', group.unit);
  return (
    <li>
      <a className={styles.link} href={href}>
        {strings.salaryIndex.link(amount, group.name)}
      </a>
    </li>
  );
}

function Group({ group }: { group: SalaryIndexGroup }) {
  const headingId = useId();
  return (
    <section>
      <h2 id={headingId} className={styles.heading}>
        {group.name}
      </h2>
      <ul className={styles.list} aria-labelledby={headingId}>
        {group.pages.map((page) => (
          <Link
            key={page.href}
            group={group}
            salary={page.salary}
            href={page.href}
          />
        ))}
      </ul>
    </section>
  );
}

type Props = {
  /** Every pre-built page, by province. */
  index: SalaryIndex;
};

/** Plain links to every pre-built salary page, grouped by province. */
export function SalaryIndexNav({ index }: Props) {
  if (index.groups.length === 0) return null;
  return (
    <nav className={styles.nav} aria-label={strings.salaryIndex.label}>
      {index.groups.map((group) => (
        <Group key={group.code} group={group} />
      ))}
    </nav>
  );
}

type NearbyProps = {
  /** The pre-built pages of the province the answer is for. */
  group: SalaryIndexGroup;
  /** The yearly salary of the answer. */
  salary: string;
};

/** Plain links to the pre-built pages nearest to a salary. */
export function NearbySalaries({ group, salary }: NearbyProps) {
  const headingId = useId();
  const steps = nearestSteps(
    salary,
    group.pages.map((page) => page.salary),
  );
  const pages = steps.flatMap((step) =>
    group.pages.filter((page) => page.salary === step),
  );
  if (pages.length === 0) return null;
  return (
    <nav className={styles.nav} aria-label={strings.salaryIndex.nearby}>
      <p id={headingId} className={styles.heading}>
        {strings.salaryIndex.nearby}
      </p>
      <ul className={styles.list} aria-labelledby={headingId}>
        {pages.map((page) => (
          <Link
            key={page.href}
            group={group}
            salary={page.salary}
            href={page.href}
          />
        ))}
      </ul>
    </nav>
  );
}

import { strings } from '../strings';
import styles from './ProvisionalNotice.module.css';

type Props = { year: number };

export function ProvisionalNotice({ year }: Props) {
  return (
    <div className={styles.notice} role="note">
      <strong className={styles.title}>
        {strings.notices.provisionalTitle(year)}
      </strong>{' '}
      {strings.notices.provisionalBody(year)}
    </div>
  );
}

import styles from './ErrorNotice.module.css';

type Props = { message: string };

export function ErrorNotice({ message }: Props) {
  return (
    <p className={styles.notice} role="alert">
      {message}
    </p>
  );
}

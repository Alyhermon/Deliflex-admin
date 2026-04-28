type Props = {
  title: string;
  value: string;
};

import styles from "./metric.module.css";

export default function Metric({ title, value }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.title}>{title}</p>
      <p className={styles.value}>{value}</p>
    </div>
  );
}
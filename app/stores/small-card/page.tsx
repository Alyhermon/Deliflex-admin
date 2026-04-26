type Props = {
  title: string;
  value: string;
};

import styles from "./smallcard.module.css";

export default function SmallCard({ title, value }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.title}>{title}</p>
      <p className={styles.value}>{value}</p>
    </div>
  );
}
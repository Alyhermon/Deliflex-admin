import styles from "./breadcrumb.module.css";
import Link from "next/link";

type Item = {
  label: string;
  href?: string;
};

type Props = {
  items: Item[];
};

export default function Breadcrumb({ items }: Props) {
  return (
    <div className={styles.breadcrumb}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className={styles.item}>
            {!isLast && item.href ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}

            {!isLast && <span className={styles.separator}>›</span>}
          </div>
        );
      })}
    </div>
  );
}
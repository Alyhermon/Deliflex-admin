type Props = {
  name: string;
  value: string;
  featured?: boolean;
};

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import styles from "./product.module.css";

export default function Product({ name, value, featured = false }: Props) {
  return (
    <div className={styles.item}>
      <span className={styles.name}>
        {name}
        {featured && (
          <FontAwesomeIcon
            icon={faCircleCheck}
            className={styles.badge}
            title="Top 3 en ventas"
          />
        )}
      </span>
      <span className={styles.price}>{value}</span>
    </div>
  );
}

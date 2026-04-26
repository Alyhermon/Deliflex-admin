type Props = {
  name: string;
  price: string;
};

import styles from "./product.module.css";

export default function Product({ name, price }: Props) {
  return (
    <div className={styles.item}>
      <span>{name}</span>
      <span className={styles.price}>{price}</span>
    </div>
  );
}
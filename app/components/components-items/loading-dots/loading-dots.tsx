import styles from "./loading-dots.module.css";

type Props = {
  /** Texto opcional al lado de los puntos, ej. "Subiendo..." */
  label?: string;
  size?: "sm" | "md" | "lg";
};

// Loader generico de puntos animados, color naranja de Deliflex. Pensado
// para cualquier espera corta (subir una imagen, guardar un cambio) donde
// un spinner generico se sentiria menos "vivo" que este rebote escalonado.
export default function LoadingDots({ label, size = "md" }: Props) {
  return (
    <span className={styles.wrapper}>
      <span className={`${styles.dots} ${styles[size]}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}

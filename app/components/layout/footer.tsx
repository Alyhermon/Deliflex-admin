import styles from "./footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <span className={styles.copy}>
        <span className={styles.brand}>DELIFLEX</span>© {year} Deliflex SRL.
        Todos los derechos reservados.
      </span>

      <span className={styles.links}>
        <a className={styles.link} href="#">
          Términos
        </a>
        <a className={styles.link} href="#">
          Privacidad
        </a>
        <a className={styles.link} href="#">
          Soporte
        </a>
      </span>
    </footer>
  );
}

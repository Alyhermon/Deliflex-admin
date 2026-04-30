import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./modal.module.css";
import { ReactNode, useEffect } from "react";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  width?: string;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "800px",
}: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: width }}>
        
        <div className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FontAwesomeIcon icon={faCircleXmark} color="#ff7a00" size="lg" />
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
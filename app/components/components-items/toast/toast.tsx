"use client";
import { useEffect } from "react";
import styles from "./toast.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleInfo, faCircleXmark, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

type ToastType = "success" | "error" | "warning" | "info" | "danger";

type Props = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

const icons = {
  success: faCircleCheck,
  error: faCircleXmark,
  warning: faTriangleExclamation,
  info: faCircleInfo,
  // Rojo pero con check: la accion destructiva se completo bien.
  danger: faCircleCheck,
};

export default function Toast({
  message,
  type = "error",
  duration = 3500,
  onClose,
}: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <FontAwesomeIcon icon={icons[type]} className={styles.icon} />
      <span>{message}</span>
      <button className={styles.close} onClick={onClose}>
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
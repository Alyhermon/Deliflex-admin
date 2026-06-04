"use client";
import { useEffect, useState } from "react";
import styles from "./toast.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

type ToastType = "success" | "error" | "warning";

type Props = {
  message: string;
  type?: ToastType;
  onClose: () => void;
};

const icons = {
  success: faCircleCheck,
  error: faCircleXmark,
  warning: faTriangleExclamation,
};

export default function Toast({ message, type = "error", onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

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
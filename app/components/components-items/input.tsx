"use client";

import React from "react";
import styles from "./input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  ...props
}: InputProps) {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={`${styles.inputWrapper} ${error ? styles.error : ""}`}>
        {icon && <div className={styles.icon}>{icon}</div>}

        <input className={styles.input} {...props} />
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
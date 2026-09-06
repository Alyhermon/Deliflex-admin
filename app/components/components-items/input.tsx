"use client";

import React, { useState } from "react";
import styles from "./input.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  type,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const esPassword = type === "password";

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={`${styles.inputWrapper} ${error ? styles.error : ""}`}>
        {icon && <div className={styles.icon}>{icon}</div>}

        <input
          className={styles.input}
          type={esPassword ? (showPassword ? "text" : "password") : type}
          {...props}
        />

        {esPassword && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
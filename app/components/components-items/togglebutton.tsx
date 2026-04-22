"use client";

import { useState } from "react";
import styles from "./togglebutton.module.css";

interface ToggleButtonProps {
  label?: boolean;
  initialState?: boolean;
  onChange?: (state: boolean) => void;
  labelOn?: string;
  labelOff?: string;
  activeColor?: string;
  inactiveColor?: string;
  size?: "sm" | "md" | "lg";
}

export default function ToggleButton({
  initialState = false,
  onChange,
  label = true,
  labelOn = "Activo",
  labelOff = "Inactivo",
  activeColor = "#f57b24",
  inactiveColor = "#e5e7eb",
  size = "md",
}: ToggleButtonProps) {
  const [isActive, setIsActive] = useState(initialState);

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);

    if (onChange) {
      onChange(newState);
    }
  };

  return (
    <button
      className={`${styles.toggle} ${styles[size]} ${
        isActive ? styles.active : styles.inactive
      }`}
      style={{
        backgroundColor: isActive ? activeColor : inactiveColor,
        justifyContent: isActive ? "flex-end" : "flex-start",
        color: isActive ? "#fff" : "#555",
      }}
      onClick={handleToggle}
    >
      <span className={styles.circle}></span>
      {(label) && (
        <span className={styles.label}>{isActive ? labelOn : labelOff}</span>
      )}
    </button>
  );
}

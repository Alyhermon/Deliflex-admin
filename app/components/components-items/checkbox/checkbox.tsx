import { useEffect, useRef } from "react";
import styles from "./checkbox.module.css";

type Variant = "primary" | "success" | "danger";
type Size = "sm" | "md" | "lg";

type CheckboxProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  variant?: Variant;
  size?: Size;
  indeterminate?: boolean;
};

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  name,
  variant = "primary",
  size = "md",
  indeterminate = false,
}: CheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // 🔥 Manejo de estado indeterminate
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={`${styles.container} ${styles[variant]} ${styles[size]} ${
        disabled ? styles.disabled : ""
      }`}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        name={name}
      />

      <span className={styles.checkmark}></span>

      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
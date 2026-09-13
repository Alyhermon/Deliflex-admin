import styles from "./radio.module.css";

type Variant = "primary" | "success" | "danger";
type Size = "sm" | "md" | "lg";

type RadioProps = {
  label?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  name?: string;
  variant?: Variant;
  size?: Size;
};

export default function Radio({
  label,
  checked,
  onChange,
  disabled = false,
  name,
  variant = "primary",
  size = "md",
}: RadioProps) {
  return (
    <label
      className={`${styles.container} ${styles[variant]} ${styles[size]} ${
        disabled ? styles.disabled : ""
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
      />

      <span className={styles.dot}></span>

      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}

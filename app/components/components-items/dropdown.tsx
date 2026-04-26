"use client";

import { useState } from "react";
import styles from "./dropdown.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
}: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.select}
        onClick={() => setOpen(!open)}
      >
        {value || placeholder}
        <span className={styles.arrow}>{open ? <FontAwesomeIcon icon={faAngleUp} /> : <FontAwesomeIcon icon={faAngleDown} />}</span>
      </div>

      {open && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option}
              className={`${styles.option} ${
                value === option ? styles.active : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
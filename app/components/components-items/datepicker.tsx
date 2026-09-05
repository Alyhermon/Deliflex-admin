"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./datepicker.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  /** Fecha en formato YYYY-MM-DD. Vacio = sin fecha. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Se trabaja con las piezas de la fecha y no con Date directo,
// para que no se corra un dia por la zona horaria.
const partes = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);

  return { year, month, day };
};

const aIso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function DatePicker({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  error,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hoy = useMemo(() => new Date(), []);

  // Mes que se esta mirando en el calendario.
  const [vista, setVista] = useState(() => {
    if (value) {
      const { year, month } = partes(value);
      return { year, month };
    }

    return { year: hoy.getFullYear(), month: hoy.getMonth() + 1 };
  });

  // Al abrir, el calendario salta al mes de la fecha elegida.
  useEffect(() => {
    if (isOpen && value) {
      const { year, month } = partes(value);
      setVista({ year, month });
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const diasDelMes = new Date(vista.year, vista.month, 0).getDate();
  const primerDia = new Date(vista.year, vista.month - 1, 1).getDay();

  const moverMes = (delta: number) => {
    setVista((prev) => {
      const month = prev.month + delta;

      if (month < 1) return { year: prev.year - 1, month: 12 };
      if (month > 12) return { year: prev.year + 1, month: 1 };

      return { ...prev, month };
    });
  };

  const seleccionar = (day: number) => {
    onChange(aIso(vista.year, vista.month, day));
    setIsOpen(false);
  };

  const textoVisible = () => {
    if (!value) return placeholder;

    const { year, month, day } = partes(value);

    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  };

  const esHoy = (day: number) =>
    hoy.getFullYear() === vista.year &&
    hoy.getMonth() + 1 === vista.month &&
    hoy.getDate() === day;

  const esSeleccionado = (day: number) =>
    value === aIso(vista.year, vista.month, day);

  return (
    <div className={styles.wrapper} ref={ref}>
      <div
        className={`${styles.input} ${isOpen ? styles.open : ""} ${
          error ? styles.inputError : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "" : styles.placeholder}>
          {textoVisible()}
        </span>
        <FontAwesomeIcon color="#f97316" icon={faCalendarDays} />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.head}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => moverMes(-1)}
            >
              <FontAwesomeIcon icon={faChevronLeft} size="xs" />
            </button>

            <span className={styles.month}>
              {MESES[vista.month - 1]} {vista.year}
            </span>

            <button
              type="button"
              className={styles.navBtn}
              onClick={() => moverMes(1)}
            >
              <FontAwesomeIcon icon={faChevronRight} size="xs" />
            </button>
          </div>

          <div className={styles.week}>
            {DIAS.map((dia) => (
              <span key={dia} className={styles.weekDay}>
                {dia}
              </span>
            ))}
          </div>

          <div className={styles.days}>
            {Array.from({ length: primerDia }, (_, i) => (
              <span key={`hueco-${i}`} className={styles.empty} />
            ))}

            {Array.from({ length: diasDelMes }, (_, i) => i + 1).map((day) => (
              <button
                type="button"
                key={day}
                className={`${styles.day} ${esHoy(day) ? styles.today : ""} ${
                  esSeleccionado(day) ? styles.selected : ""
                }`}
                onClick={() => seleccionar(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.footerBtn}
              onClick={() => {
                onChange(
                  aIso(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()),
                );
                setIsOpen(false);
              }}
            >
              Hoy
            </button>

            <button
              type="button"
              className={`${styles.footerBtn} ${styles.clearBtn}`}
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

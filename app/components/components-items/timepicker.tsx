"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./timepicker.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

interface TimePickerProps {
  /** Hora en formato "10:30 AM". Si se pasa, el componente la refleja. */
  value?: string;
  onChange?: (time: string) => void;
}

// "10:30 AM" -> { hour: 10, minute: 30, period: "AM" }
const leerHora = (valor?: string) => {
  const match = valor?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    period: match[3].toUpperCase() as "AM" | "PM",
  };
};

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const inicial = leerHora(value);

  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(inicial?.hour ?? 10);
  const [minute, setMinute] = useState(inicial?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(inicial?.period ?? "AM");

  const ref = useRef<HTMLDivElement>(null);

  // Si el valor cambia desde fuera, el componente se sincroniza.
  useEffect(() => {
    const leido = leerHora(value);

    if (!leido) return;

    setHour(leido.hour);
    setMinute(leido.minute);
    setPeriod(leido.period);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (h = hour, m = minute, p = period) => {
    const time = `${h}:${String(m).padStart(2, "0")} ${p}`;
    onChange?.(time);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* Input */}
      <div className={styles.input} onClick={() => setIsOpen(!isOpen)}>
        {hour}:{String(minute).padStart(2, "0")} {period}
        <FontAwesomeIcon color="#f97316" icon={faClock} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Horas */}
          <div className={styles.column}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <div
                key={h}
                className={`${styles.item} ${h === hour ? styles.active : ""}`}
                onClick={() => {
                  setHour(h);
                  formatTime(h, minute, period);
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Minutos */}
          <div className={styles.column}>
            {Array.from({ length: 60 }, (_, i) => i)
              .filter((_, i) => i % 1 === 0)
              .map((m) => (
                <div
                  key={m}
                  className={`${styles.item} ${
                    m === minute ? styles.active : ""
                  }`}
                  onClick={() => {
                    setMinute(m);
                    formatTime(hour, m, period);
                  }}
                >
                  {String(m).padStart(2, "0")}
                </div>
              ))}
          </div>

          {/* AM / PM */}
          <div className={styles.column}>
            {["AM", "PM"].map((p) => (
              <div
                key={p}
                className={`${styles.item} ${
                  p === period ? styles.active : ""
                }`}
                onClick={() => {
                  setPeriod(p as "AM" | "PM");
                  formatTime(hour, minute, p as "AM" | "PM");
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

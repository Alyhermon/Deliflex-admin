"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./timepicker.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

interface TimePickerProps {
  onChange?: (time: string) => void;
}

export default function TimePicker({ onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  const ref = useRef<HTMLDivElement>(null);

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

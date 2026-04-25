"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./stepper.module.css";

const steps = [
  { path: "/stores/register/information", label: "Información" },
  { path: "/stores/register/schedule", label: "Horario" },
];

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  const normalizedPath = pathname.replace(/\/$/, "");
  const stepIndex = steps.findIndex(s => s.path === normalizedPath);
  const currentStep = stepIndex >= 0 ? stepIndex + 1 : 0;

  const next = () => {
    if (stepIndex < steps.length - 1) {
      router.push(steps[stepIndex + 1].path);
    }
  };

  const prev = () => {
    if (stepIndex > 0) {
      router.push(steps[stepIndex - 1].path);
    }
  };

  return (
    <div className={styles.wrapper}>

      {/* HEADER STEPPER */}
      <div className={styles.header}>
        <div className={styles.steps}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepContainer}>
              
              <div
                className={`${styles.stepCircle} ${
                  currentStep >= index + 1 ? styles.active : ""
                }`}
              >
                {index + 1}
              </div>

              <span className={styles.stepLabel}>{step.label}</span>

              {index < steps.length - 1 && (
                <div
                  className={`${styles.line} ${
                    currentStep > index + 1 ? styles.activeLine : ""
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className={styles.contentWrapper}>
        <div className={styles.card}>
          {children}

          {/* BUTTONS */}
          <div className={styles.buttons}>
            {currentStep > 1 && (
              <button onClick={prev} className={styles.secondary}>
                Atrás
              </button>
            )}

            {currentStep < steps.length ? (
              <button onClick={next} className={styles.btnNext}>
                Siguiente
              </button>
            ) : (
          <button className={styles.btnNext}>Continuar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
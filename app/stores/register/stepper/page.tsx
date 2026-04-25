"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./stepper.module.css";

const steps = [
  "/stores/register/information/page",
  "/stores/register/schedule/page",
  // "/stores/register/step-3",
  // "/stores/register/step-4",
  // "/stores/register/step-5",
];

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  const normalizedPath = pathname.replace(/\/$/, "");
  const stepIndex = steps.indexOf(normalizedPath);
  const currentStep = stepIndex >= 0 ? stepIndex + 1 : 0;

  // TODO: mejorar la navegacion entre pasos, actualmente solo se puede avanzar o retroceder un paso, no saltar pasos
  const next = () => {
    if (stepIndex < steps.length - 1) {
      router.push(steps[stepIndex + 1]);
    } else if (stepIndex === -1 && steps.length > 0) {
      // If we're not on any step yet, go to first step
      router.push(steps[0]);
    }
  };

  //TODO: mejorar la navegacion entre pasos, actualmente solo se puede avanzar o retroceder un paso, no saltar pasos

  const prev = () => {
    if (stepIndex > 0) {
      router.push(steps[stepIndex - 1]);
    }
  };

  return (
    <div className={styles.container}>
      
      {/* STEPPER */}
      <div className={styles.steps}>
        {steps.map((_, index) => (
          <div
            key={index}
            className={`${styles.step} ${
              currentStep >= index + 1 ? styles.active : ""
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* CONTENIDO DE LA PAGINA */}
      <div className={styles.content}>
        {children}
      </div>

      {/* BOTONES */}
      <div className={styles.buttons}>
        {currentStep > 1 && (
          <button onClick={prev} className={styles.secondary}>
            Atrás
          </button>
        )}

        {currentStep < steps.length ? (
          <button onClick={next} className={styles.primary}>
            Siguiente
          </button>
        ) : (
          <button className={styles.primary}>
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./stepper.module.css";
import {
  RegisterBusinessProvider,
  useRegisterBusiness,
} from "./RegisterBusinessContext";

const steps = [
  { path: "/stores/register/information", label: "Información" },
  { path: "/stores/register/schedule", label: "Horarios" },
  { path: "/stores/register/services-stores", label: "Servicios" },
  { path: "/stores/register/confirmation", label: "Confirmación" },
];

function CreateLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { form } = useRegisterBusiness();
  const [error, setError] = useState("");

  const normalizedPath = pathname.replace(/\/$/, "");
  const stepIndex = steps.findIndex((s) => s.path === normalizedPath);
  const currentStep = stepIndex >= 0 ? stepIndex + 1 : 0;

  const next = () => {
    setError("");

    // El paso de Informacion trae los datos que el backend exige de verdad
    // (taxId, coordenadas): sin esto completo no tiene sentido dejar avanzar,
    // el envio final fallaria igual.
    if (stepIndex === 0) {
      if (!form.nameBusisness.trim()) {
        setError("Escribe el nombre del negocio");
        return;
      }
      if (!/^\d{9}$|^\d{11}$/.test(form.taxId)) {
        setError("La cédula (11 dígitos) o el RNC (9 dígitos) es obligatorio");
        return;
      }
      if (!form.storeAddress.trim()) {
        setError("Escribe la dirección del negocio");
        return;
      }
      if (form.latitude == null || form.longitude == null) {
        setError(
          "Falta la ubicación del negocio (usa 'Usar mi ubicación actual' o escríbela a mano)",
        );
        return;
      }
      if (!form.bannerUrl) {
        setError("Sube una foto del negocio antes de continuar");
        return;
      }
    }

    if (stepIndex < steps.length - 1) {
      router.push(steps[stepIndex + 1].path);
    }
  };

  const prev = () => {
    setError("");
    if (stepIndex > 0) {
      router.push(steps[stepIndex - 1].path);
    }
  };

  const esUltimoPaso = currentStep === steps.length;

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

          {error && <p className={styles.stepError}>{error}</p>}

          {/* En el ultimo paso, Confirmacion trae su propio boton de envio -
              aqui solo queda "Atras" para no duplicar la accion final. */}
          {!esUltimoPaso && (
            <div className={styles.buttons}>
              {currentStep > 1 && (
                <button onClick={prev} className={styles.secondary}>
                  Atrás
                </button>
              )}

              <button onClick={next} className={styles.btnNext}>
                Siguiente
              </button>
            </div>
          )}

          {esUltimoPaso && currentStep > 1 && (
            <div className={styles.buttons}>
              <button onClick={prev} className={styles.secondary}>
                Atrás
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RegisterBusinessProvider>
      <CreateLayoutInner>{children}</CreateLayoutInner>
    </RegisterBusinessProvider>
  );
}

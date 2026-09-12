"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./stepper.module.css";
import {
  RegisterBusinessProvider,
  useRegisterBusiness,
  FieldErrors,
} from "./RegisterBusinessContext";
import { soloDigitos } from "./format-utils";

const steps = [
  { path: "/stores/register/information", label: "Información" },
  { path: "/stores/register/schedule", label: "Horarios" },
  { path: "/stores/register/services-stores", label: "Servicios" },
  { path: "/stores/register/confirmation", label: "Confirmación" },
];

function CreateLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { form, setFieldErrors } = useRegisterBusiness();

  const normalizedPath = pathname.replace(/\/$/, "");
  const stepIndex = steps.findIndex((s) => s.path === normalizedPath);
  const currentStep = stepIndex >= 0 ? stepIndex + 1 : 0;

  const next = () => {
    setFieldErrors({});

    // El paso de Informacion trae los datos que el backend exige de verdad
    // (taxId, coordenadas): sin esto completo no tiene sentido dejar avanzar,
    // el envio final fallaria igual. Cada error se pinta debajo de su campo,
    // no como mensaje generico.
    if (stepIndex === 0) {
      const errors: FieldErrors = {};

      if (!/^\d{11}$/.test(soloDigitos(form.taxId))) {
        errors.taxId = "La cédula debe tener 11 dígitos";
      }
      if (form.rnc && !/^\d{9}$/.test(soloDigitos(form.rnc))) {
        errors.rnc = "El RNC debe tener 9 dígitos";
      }
      if (!form.nameBusisness.trim()) {
        errors.nameBusisness = "El nombre del negocio es obligatorio";
      }
      if (!form.categoryId) {
        errors.categoryId = "Selecciona una categoría para tu negocio";
      }
      if (!form.ownerFirstName.trim()) {
        errors.ownerFirstName = "El nombre del propietario es obligatorio";
      }
      if (!form.ownerLastName.trim()) {
        errors.ownerLastName = "El apellido del propietario es obligatorio";
      }
      if (!form.ownerBirthDate) {
        errors.ownerBirthDate = "La fecha de nacimiento es obligatoria";
      }
      if (!form.email.trim()) {
        errors.email = "El correo es obligatorio";
      }
      if (!form.phoneBusiness.trim()) {
        errors.phoneBusiness = "El teléfono de contacto es obligatorio";
      }
      if (!form.storeAddress.trim()) {
        errors.storeAddress = "La dirección es obligatoria";
      }
      if (form.latitude == null || form.longitude == null) {
        errors.latitude =
          "Falta la ubicación del negocio (usa 'Usar mi ubicación actual' o escríbela a mano)";
      }
      if (!form.bannerUrl) {
        errors.bannerUrl = "Sube una foto del negocio antes de continuar";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    if (stepIndex < steps.length - 1) {
      router.push(steps[stepIndex + 1].path);
    }
  };

  const prev = () => {
    setFieldErrors({});
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

"use client";

import { useState } from "react";
import styles from "./stepper.module.css";
import Schedule from "./page"

export default function StepperForm() {
  const [step, setStep] = useState(1);

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);

  return (
    <div className={styles.container}>
      
      {/* STEP INDICATOR */}
      <div className={styles.steps}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`${styles.step} ${step >= s ? styles.active : ""}`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className={styles.content}>
        {step === 1 && <Step1 />}
        {step === 2 && <Schedule />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 />}
      </div>

      {/* BOTONES */}
      <div className={styles.buttons}>
        {step > 1 && (
          <button onClick={prev} className={styles.secondary}>
            Atrás
          </button>
        )}

        {step < 5 ? (
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

/* ===== STEPS ===== */

function Step1() {
  return (
    <>
      <h2>Información básica</h2>
      <input placeholder="Nombre del negocio" />
      <select>
        <option>Categoría</option>
      </select>
    </>
  );
}

function Step2() {
  return (
    <>
      <h2>Contacto</h2>
      <input placeholder="Teléfono" />
      <input placeholder="Email" />
    </>
  );
}

function Step3() {
  return (
    <>
      <h2>Ubicación</h2>
      <input placeholder="Dirección" />
    </>
  );
}

function Step4() {
  return (
    <>
      <h2>Horario</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <select>
          <option>Hora</option>
        </select>
        <select>
          <option>Min</option>
        </select>
      </div>
    </>
  );
}

function Step5() {
  return <h2>Confirmación final 🚀</h2>;
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "../components/modal/modal";
import styles from "./inactivity-guard.module.css";

// 10 minutos sin actividad -> aparece el aviso. 12 minutos -> cierra la
// sesion sola (2 minutos de margen para que alguien vea el aviso y
// reaccione). No toca el token en si (sigue valiendo lo que dure el login,
// 1 hora o 30 dias con "Mantener sesión iniciada") - esto es una capa
// aparte: si te vas de la compu con la sesion abierta, no se queda
// esperando ahi con datos de negocio a la vista.
const AVISO_MS = 10 * 60 * 1000;
const CIERRE_MS = 12 * 60 * 1000;

const EVENTOS_ACTIVIDAD = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export default function InactivityGuard() {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const ultimaActividad = useRef<number | null>(null);

  const registrarActividad = useCallback(() => {
    ultimaActividad.current = Date.now();
    setMostrarAviso(false);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/core/login";
    }
  }, []);

  useEffect(() => {
    ultimaActividad.current = Date.now();

    EVENTOS_ACTIVIDAD.forEach((evento) =>
      window.addEventListener(evento, registrarActividad, { passive: true }),
    );

    const intervalo = setInterval(() => {
      const inactivoPorMs = Date.now() - (ultimaActividad.current ?? Date.now());

      if (inactivoPorMs >= CIERRE_MS) {
        cerrarSesion();
        return;
      }

      if (inactivoPorMs >= AVISO_MS) {
        setMostrarAviso(true);
        setSegundosRestantes(Math.max(0, Math.ceil((CIERRE_MS - inactivoPorMs) / 1000)));
      }
    }, 1000);

    return () => {
      EVENTOS_ACTIVIDAD.forEach((evento) =>
        window.removeEventListener(evento, registrarActividad),
      );
      clearInterval(intervalo);
    };
  }, [registrarActividad, cerrarSesion]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;

  return (
    <Modal
      isOpen={mostrarAviso}
      onClose={registrarActividad}
      title="¿Sigues ahí?"
      width="380px"
    >
      <div className={styles.body}>
        <p>
          Por tu seguridad, la sesión se va a cerrar por inactividad en{" "}
          <strong>
            {minutos}:{String(segundos).padStart(2, "0")}
          </strong>
          .
        </p>
        <button type="button" className={styles.stayBtn} onClick={registrarActividad}>
          Seguir conectado
        </button>
      </div>
    </Modal>
  );
}

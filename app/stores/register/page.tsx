"use client";

import styles from "./register.module.css";

export default function CrearNegocio() {
  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Crear Negocio</h1>
        <p>Completa la información para registrar tu negocio en DeliFlex.</p>
      </div>

      {/* STEPPER */}
      <div className={styles.stepper}>
        <div className={styles.stepActive}>1 Información</div>
        <div className={styles.stepActive}>2 Horarios</div>
        <div className={styles.step}>3 Servicios</div>
        <div className={styles.step}>4 Confirmación</div>
      </div>

      {/* CARD PRINCIPAL */}
      <div className={styles.card}>

        {/* INFO */}
        <div className={styles.infoBox}>
          <h3>Configura cuándo está abierto tu negocio</h3>
          <p>Puedes establecer horarios diferentes por día o usar el mismo para todos.</p>
        </div>

        {/* TOGGLE */}
        <div className={styles.rowBetween}>
          <div>
            <h4>Mismo horario todos los días</h4>
            <p>Ahorra tiempo aplicando el mismo horario.</p>
          </div>
          <div className={styles.switch}></div>
        </div>

        {/* INPUTS GENERALES */}
        <div className={styles.grid2}>
          <div>
            <label>Hora de apertura</label>
            <input type="time" />
          </div>

          <div>
            <label>Hora de cierre</label>
            <input type="time" />
          </div>
        </div>

        {/* TABLA HORARIOS */}
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Día</span>
            <span>Activo</span>
            <span>Apertura</span>
            <span>Cierre</span>
          </div>

          {[
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
            "Domingo",
          ].map((day) => (
            <div key={day} className={styles.tableRow}>
              <span>{day}</span>
              <div className={styles.switchSmall}></div>
              <input type="time" />
              <input type="time" />
            </div>
          ))}
        </div>

        {/* BOTONES */}
        <div className={styles.actions}>
          <button className={styles.btnBack}>Atrás</button>
          <button className={styles.btnNext}>Continuar</button>
        </div>

      </div>
    </div>
  );
}
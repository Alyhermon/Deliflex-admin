"use client";

import styles from "./schedule.module.css";
import ToggleButton from "../../../components/components-items/togglebutton";
import TimePicker from "@/app/components/components-items/timepicker";

export default function CrearNegocio() {
  const handleChange = (state: boolean) => {
    console.log("Estado:", state);
  };
  return (
    <div className={styles.container}>

      {/* CARD PRINCIPAL */}
      <div className={styles.card}>
        {/* INFO */}
        <div className={styles.infoBox}>
          <h3>Configura cuándo está abierto tu negocio</h3>
          <p>
            Puedes establecer horarios diferentes por día o usar el mismo para
            todos.
          </p>
        </div>
        <div className={styles.rowBetween}>
          <div>
            <h4>Mismo horario todos los días</h4>
            <p>Ahorra tiempo aplicando el mismo horario.</p>
          </div>
          <ToggleButton
            initialState={true}
            onChange={handleChange}
            labelOn="Abierto"
            labelOff="Cerrado"
            size="md"
          />
        </div>

        {/* INPUTS GENERALES */}
        <div className={styles.grid2}>
          <div className={styles.dateOpen}>
            <label>Hora de apertura</label>
            <TimePicker onChange={(time) => console.log(time)} />
          </div>

          <div className={styles.dateClosed}>
            <label>Hora de cierre</label>
            <TimePicker onChange={(time) => console.log(time)} />
          </div>
        </div>

        {/* TABLA HORARIOS */}
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Día</span>
            <span className={styles.activeDay}>Activo</span>
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
              <ToggleButton
                initialState={true}
                onChange={handleChange}
                label={false}
                size="sm"
              />
            <TimePicker onChange={(time) => console.log(time)} />
            <TimePicker onChange={(time) => console.log(time)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

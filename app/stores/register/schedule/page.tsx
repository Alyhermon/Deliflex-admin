"use client";

import styles from "./schedule.module.css";
import ToggleButton from "../../../components/components-items/togglebutton";
import TimePicker from "@/app/components/components-items/timepicker";
import { useRegisterBusiness } from "../RegisterBusinessContext";

export default function SchedulePage() {
  const { form, update, updateSchedule, applyGenericHoursToAllDays } =
    useRegisterBusiness();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
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
            key={String(form.sameHoursAllDays)}
            initialState={form.sameHoursAllDays}
            onChange={(state) => update({ sameHoursAllDays: state })}
            labelOn="Activo"
            labelOff="Desactivado"
            size="md"
          />
        </div>

        {form.sameHoursAllDays && (
          <div className={styles.grid2}>
            <div className={styles.dateOpen}>
              <label>Hora de apertura</label>
              <TimePicker
                value={form.genericOpenTime}
                onChange={(time) =>
                  applyGenericHoursToAllDays(time, form.genericCloseTime)
                }
              />
            </div>

            <div className={styles.dateClosed}>
              <label>Hora de cierre</label>
              <TimePicker
                value={form.genericCloseTime}
                onChange={(time) =>
                  applyGenericHoursToAllDays(form.genericOpenTime, time)
                }
              />
            </div>
          </div>
        )}

        {/* TABLA HORARIOS */}
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Día</span>
            <span className={styles.activeDay}>Abierto</span>
            <span>Apertura</span>
            <span>Cierre</span>
          </div>

          {form.schedules.map((day) => (
            <div key={day.dayOfWeek} className={styles.tableRow}>
              <span>{day.label}</span>
              <ToggleButton
                key={`${day.dayOfWeek}-${day.isClosed}`}
                initialState={!day.isClosed}
                onChange={(abierto) =>
                  updateSchedule(day.dayOfWeek, { isClosed: !abierto })
                }
                label={false}
                size="sm"
              />
              <TimePicker
                value={day.openTime}
                onChange={(time) => {
                  updateSchedule(day.dayOfWeek, { openTime: time });
                  update({ sameHoursAllDays: false });
                }}
              />
              <TimePicker
                value={day.closeTime}
                onChange={(time) => {
                  updateSchedule(day.dayOfWeek, { closeTime: time });
                  update({ sameHoursAllDays: false });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

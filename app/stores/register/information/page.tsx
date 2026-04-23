"use client";

import { useState } from "react";
import styles from "./information.module.css";

export default function CreateStorePage() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    openHour: "",
    openMin: "",
    closeHour: "",
    closeMin: "",
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("DATA:", form);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear Negocio</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Nombre del negocio</label>
              <input name="name" onChange={handleChange} required />
            </div>

            <div className={styles.inputGroup}>
              <label>Categoría</label>
              <select name="category" onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option value="restaurant">Restaurante</option>
                <option value="cafe">Cafetería</option>
                <option value="bakery">Panadería</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Teléfono</label>
              <input name="phone" onChange={handleChange} />
            </div>

            <div className={styles.inputGroup}>
              <label>Email</label>
              <input name="email" type="email" onChange={handleChange} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Dirección</label>
            <input name="address" onChange={handleChange} />
          </div>

          <div className={styles.inputGroup}>
            <label>Descripción</label>
            <textarea name="description" onChange={handleChange} />
          </div>

          {/* HORARIO */}
          <div className={styles.schedule}>
            <label>Horario</label>

            <div className={styles.scheduleRow}>
              <span>Apertura</span>

              <select name="openHour" onChange={handleChange}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>

              <span>:</span>

              <select name="openMin" onChange={handleChange}>
                <option value="00">00</option>
                <option value="30">30</option>
              </select>
            </div>

            <div className={styles.scheduleRow}>
              <span>Cierre</span>

              <select name="closeHour" onChange={handleChange}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>

              <span>:</span>

              <select name="closeMin" onChange={handleChange}>
                <option value="00">00</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>

          <button className={styles.button}>Guardar negocio</button>
        </form>
      </div>
    </div>
  );
}

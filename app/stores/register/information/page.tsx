"use client";

import React, { useState } from "react";
import styles from "./information.module.css";
import DFInput from "../../../components/components-items/input";
import Dropdown from "../../../components/components-items/dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function InformationPage() {
  const [businessType, setBusinessType] = useState("");
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

  const options = [
    "Restaurante",
    "Cafetería",
    "Bar",
    "Food Truck",
    "Repostería",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, type, value, checked } = target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DATA:", form);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear Negocio</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* SECCIÓN 1 */}
          <div className={styles.section}>
            <h2>Información básica</h2>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="ejemplo@email.com"
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                />
              </div>

              <Dropdown
                options={options}
                value={businessType}
                onChange={setBusinessType}
                placeholder="Tipo de negocio"
              />
            </div>
          </div>

          {/* SECCIÓN 2 */}
          <div className={styles.section}>
            <h2>Contacto</h2>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="ejemplo@email.com"
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                />
              </div>

              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="ejemplo@email.com"
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3 */}
          <div className={styles.section}>
            <h2>Ubicación</h2>

            <div className={styles.inputGroup}>
              <DFInput
                placeholder="ejemplo@email.com"
                icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
              />
            </div>

            <div className={styles.inputGroup}>
              <DFInput
                placeholder="ejemplo@email.com"
                icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

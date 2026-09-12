"use client";

import styles from "./services-stores.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollar, faMotorcycle, faCreditCard, faTruckPickup, faBank, faMobile } from "@fortawesome/free-solid-svg-icons";
import { PaymentOptions, SellOptions, useRegisterBusiness } from "../RegisterBusinessContext";

export default function ServicesPage() {
  const { form, update } = useRegisterBusiness();

  const toggleSell = (key: keyof SellOptions) => {
    update({ sellOptions: { ...form.sellOptions, [key]: !form.sellOptions[key] } });
  };

  const togglePayment = (key: keyof PaymentOptions) => {
    update({ payments: { ...form.payments, [key]: !form.payments[key] } });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Servicios</h1>

      {/* INFO BOX */}
      <div className={styles.infoBox}>
        <h3>Configura cómo vendes y entregas tus pedidos</h3>
        <p>Elige los servicios que ofrecerás.</p>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        {/* LEFT */}
        <div className={styles.card}>
          <h3>¿Cómo quieres vender?</h3>

          <div className={styles.options}>
            <div
              className={`${styles.option} ${
                form.sellOptions.delivery && styles.active
              }`}
              onClick={() => toggleSell("delivery")}
            >
              <FontAwesomeIcon icon={faMotorcycle} /> Delivery
            </div>

            <div
              className={`${styles.option} ${
                form.sellOptions.pickup && styles.active
              }`}
              onClick={() => toggleSell("pickup")}
            >
              <FontAwesomeIcon icon={faTruckPickup} /> Pickup
            </div>

            <div
              className={`${styles.option} ${
                form.sellOptions.dineIn && styles.active
              }`}
              onClick={() => toggleSell("dineIn")}
            >
              🍽 Comer en el local
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.card}>
          <h3>Métodos de pago</h3>

          <div className={styles.options}>
            <div
              className={`${styles.option} ${form.payments.cash && styles.active}`}
              onClick={() => togglePayment("cash")}
            >
              <FontAwesomeIcon icon={faDollar} /> Efectivo
            </div>

            <div
              className={`${styles.option} ${form.payments.card && styles.active}`}
              onClick={() => togglePayment("card")}
            >
              <FontAwesomeIcon icon={faCreditCard} /> Tarjeta
            </div>

            <div
              className={`${styles.option} ${
                form.payments.transfer && styles.active
              }`}
              onClick={() => togglePayment("transfer")}
            >
              <FontAwesomeIcon icon={faBank} /> Transferencia
            </div>

            <div
              className={`${styles.option} ${form.payments.app && styles.active}`}
              onClick={() => togglePayment("app")}
            >
              <FontAwesomeIcon icon={faMobile} /> App
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

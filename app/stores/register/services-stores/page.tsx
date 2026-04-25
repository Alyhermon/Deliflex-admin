"use client";

import { useState } from "react";
import styles from "./services-stores.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollar, faMotorcycle, faCreditCard, faTruckPickup, faBank, faMobile } from "@fortawesome/free-solid-svg-icons";

type SellOptions = {
  delivery: boolean;
  pickup: boolean;
  dineIn: boolean;
};

type PaymentOptions = {
  cash: boolean;
  card: boolean;
  transfer: boolean;
  app: boolean;
};

export default function ServicesPage() {
  const [sellOptions, setSellOptions] = useState<SellOptions>({
    delivery: true,
    pickup: true,
    dineIn: false,
  });

  const [payments, setPayments] = useState<PaymentOptions>({
    cash: true,
    card: true,
    transfer: true,
    app: false,
  });

  function toggleOption<T>(
    group: T,
    key: keyof T,
    setter: React.Dispatch<React.SetStateAction<T>>,
  ) {
    setter({
      ...group,
      [key]: !group[key],
    });
  }

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
                sellOptions.delivery && styles.active
              }`}
              onClick={() =>
                toggleOption(sellOptions, "delivery", setSellOptions)
              }
            >
              <FontAwesomeIcon icon={faMotorcycle} /> Delivery
            </div>

            <div
              className={`${styles.option} ${
                sellOptions.pickup && styles.active
              }`}
              onClick={() =>
                toggleOption(sellOptions, "pickup", setSellOptions)
              }
            >
              <FontAwesomeIcon icon={faTruckPickup} /> Pickup
            </div>

            <div
              className={`${styles.option} ${
                sellOptions.dineIn && styles.active
              }`}
              onClick={() =>
                toggleOption(sellOptions, "dineIn", setSellOptions)
              }
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
              className={`${styles.option} ${payments.cash && styles.active}`}
              onClick={() => toggleOption(payments, "cash", setPayments)}
            >
              <FontAwesomeIcon icon={faDollar} /> Efectivo
            </div>

            <div
              className={`${styles.option} ${payments.card && styles.active}`}
              onClick={() => toggleOption(payments, "card", setPayments)}
            >
              <FontAwesomeIcon icon={faCreditCard} /> Tarjeta
            </div>

            <div
              className={`${styles.option} ${
                payments.transfer && styles.active
              }`}
              onClick={() => toggleOption(payments, "transfer", setPayments)}
            >
              <FontAwesomeIcon icon={faBank} /> Transferencia
            </div>

            <div
              className={`${styles.option} ${payments.app && styles.active}`}
              onClick={() => toggleOption(payments, "app", setPayments)}
            >
              <FontAwesomeIcon icon={faMobile} /> App
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

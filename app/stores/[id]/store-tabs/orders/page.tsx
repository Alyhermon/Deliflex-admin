"use client";

import styles from "./orders-tab.module.css";
import { useState } from "react";

type OrderStatus = "pending" | "preparing" | "ready" | "cancelled";

type OrderType = {
  id: string;
  customer: string;
  phone: string;
  type: string;
  total: number;
  status: OrderStatus;
  time: string;
  products: string[];
  notes: string;
};

const MOCK_ORDERS: OrderType[] = [
  {
    id: "#A-102",
    customer: "Juan Perez",
    phone: "809-555-1234",
    type: "Delivery",
    total: 850,
    status: "pending",
    time: "Hace 5 min",
    products: ["2x Hamburguesa Clásica", "1x Coca Cola 355ml"],
    notes: "Sin cebolla, extra salsa"
  },
  {
    id: "#A-101",
    customer: "María García",
    phone: "809-555-7788",
    type: "Delivery",
    total: 650,
    status: "preparing",
    time: "Hace 12 min",
    products: ["1x Pizza Pepperoni", "1x Agua"],
    notes: ""
  },
  {
    id: "#A-100",
    customer: "Carlos López",
    phone: "809-555-9988",
    type: "Retiro en tienda",
    total: 450,
    status: "ready",
    time: "Hace 18 min",
    products: ["6x Empanadas", "1x Jugo Natural"],
    notes: ""
  }
];

export default function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<OrderType>(
    MOCK_ORDERS[0]
  );

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "preparing":
        return "En preparación";
      case "ready":
        return "Listo";
      case "cancelled":
        return "Cancelado";
    }
  };

  return (
    <div className={styles.ordersPage}>
      <div className={styles.topStats}>
        <div className={`${styles.statCard} ${styles.orange}`}>
          <span className={styles.statValue}>24</span>
          <span className={styles.statLabel}>Pendientes</span>
        </div>

        <div className={`${styles.statCard} ${styles.blue}`}>
          <span className={styles.statValue}>6</span>
          <span className={styles.statLabel}>En preparación</span>
        </div>

        <div className={`${styles.statCard} ${styles.green}`}>
          <span className={styles.statValue}>15</span>
          <span className={styles.statLabel}>Listos</span>
        </div>

        <div className={`${styles.statCard} ${styles.gray}`}>
          <span className={styles.statValue}>3</span>
          <span className={styles.statLabel}>Cancelados</span>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar pedido, cliente o teléfono..."
          className={styles.searchInput}
        />

        <select className={styles.select}>
          <option>Estado: Todos</option>
        </select>

        <select className={styles.select}>
          <option>Tipo: Todos</option>
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.ordersList}>
          {MOCK_ORDERS.map((order) => (
            <button
              key={order.id}
              className={`${styles.orderCard} ${
                selectedOrder.id === order.id ? styles.selected : ""
              }`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className={styles.orderHeader}>
                <h3>{order.id}</h3>
                <strong>RD${order.total}</strong>
              </div>

              <p>{order.customer}</p>

              <span>{order.type}</span>

              <div className={styles.orderFooter}>
                <small>{order.time}</small>

                <span
                  className={`${styles.status} ${styles[order.status]}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.detailsPanel}>
          <div className={styles.detailsHeader}>
            <div>
              <h2>Pedido {selectedOrder.id}</h2>
              <p>{selectedOrder.customer}</p>
            </div>

            <span
              className={`${styles.status} ${styles[selectedOrder.status]}`}
            >
              {getStatusLabel(selectedOrder.status)}
            </span>
          </div>

          <div className={styles.detailsGrid}>
            <div>
              <span className={styles.detailLabel}>Cliente</span>
              <p>{selectedOrder.customer}</p>
              <p>{selectedOrder.phone}</p>
            </div>

            <div>
              <span className={styles.detailLabel}>Tipo de pedido</span>
              <p>{selectedOrder.type}</p>
            </div>

            <div>
              <span className={styles.detailLabel}>Tiempo</span>
              <p>{selectedOrder.time}</p>
            </div>
          </div>

          <div className={styles.productsSection}>
            <span className={styles.detailLabel}>Productos</span>

            {selectedOrder.products.map((product) => (
              <div key={product} className={styles.productRow}>
                {product}
              </div>
            ))}
          </div>

          <div className={styles.notesSection}>
            <span className={styles.detailLabel}>Notas del cliente</span>
            <p>{selectedOrder.notes || "Sin notas"}</p>
          </div>

          <div className={styles.paymentTotal}>
            <div>
              <span className={styles.detailLabel}>Método de pago</span>
              <p>Tarjeta de crédito</p>
            </div>

            <div className={styles.totalBox}>
              <span>Total</span>
              <strong>RD${selectedOrder.total}</strong>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.dangerButton}>Cancelar</button>
            <button className={styles.warningButton}>Aceptar</button>
            <button className={styles.primaryButton}>Preparando</button>
            <button className={styles.successButton}>Marcar listo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

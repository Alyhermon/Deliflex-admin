

"use client";

import styles from "./details.module.css";
import Metric from "../metric/page";
import SmallCard from "../small-card/page";
import Product from "../product/page";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../components/layout/adminLayout";

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "Tiendas", href: "/stores" }, { label: "Cocorao" }]} />
        {/* 🧡 HEADER */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Cocorao</h1>
            <span className={styles.subtitle}>ID: #{id}</span>
          </div>

          <span className={styles.status}>Abierto</span>
        </div>

        {/* 🧡 TABS */}
        <div className={styles.tabs}>
          <span className={styles.activeTab}>Resumen</span>
          <span>Menú</span>
          <span>Pedidos</span>
          <span>Estadísticas</span>
        </div>

        {/* 🧡 MÉTRICAS */}
        <div className={styles.metrics}>
          <Metric title="Ventas hoy" value="$620,000" />
          <Metric title="Pedidos" value="32" />
          <Metric title="Ticket promedio" value="$19,375" />
          <Metric title="Rating" value="4.8 ⭐" />
        </div>

        {/* 🧡 GRID */}
        <div className={styles.grid}>
          
          <div className={styles.chart}>
            <h3>Rendimiento</h3>
            <div className={styles.chartBox}>Gráfica aquí</div>
          </div>

          <div className={styles.orders}>
            <h3>Pedidos</h3>

            <div className={styles.orderItem}>
              <span>#1245</span>
              <span className={styles.price}>$32,000</span>
            </div>

            <div className={styles.orderItem}>
              <span>#1244</span>
              <span className={styles.price}>$45,500</span>
            </div>
          </div>

        </div>

        {/* 🧡 CTA */}
        <div className={styles.cta}>
          <p>Impulsa más ventas</p>
          <button>Crear promoción</button>
        </div>

        {/* 🧡 CARDS */}
        <div className={styles.cards}>
          <SmallCard title="Menú" value="45 productos" />
          <SmallCard title="Promociones" value="2 activas" />
          <SmallCard title="Horario" value="9am - 11pm" />
        </div>

        {/* 🧡 PRODUCTOS */}
        <div className={styles.products}>
          <h3>Top productos</h3>

          <Product name="Hamburguesa Clásica" price="$324K" />
          <Product name="Papas DeliFlex" price="$112K" />
        </div>

      </div>
    </AdminLayout>
  );
}
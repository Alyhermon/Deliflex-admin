"use client";

import styles from "./details.module.css";
import { useRouter } from "next/navigation";
import Metric from "../metric/page";
import SmallCard from "../small-card/page";
import Product from "../product/page";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../components/layout/adminLayout";
import { useEffect, useState } from "react";

export default function StoreDetailPage({id}: {id: string}) {
  const router = useRouter();
  const [store, setStore] = useState<{
    id: string;
    name: string;
    category: string | null;
    banner_url: string;
    logo_url: string;
    rating?: number;
    status?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
 useEffect(() => {
  const loadStore = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/register-business/${id}`,
      );

      const data = await res.json();

      const stores = Array.isArray(data) ? data : data.data || [];

      const foundStore = stores.find((store: { id: string }) => store.id === id);

      setStore(foundStore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (id) loadStore();
}, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!store) return <p>No encontrado</p>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[{ label: "Tiendas", href: "/stores" }, { label: store.name }]}
        />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{store.name}</h1>
            <span className={styles.subtitle}>ID: #{id}</span>
          </div>

          <span className={styles.status}>Abierto</span>
        </div>

        <div className={styles.tabs}>
          <span className={styles.activeTab}>Resumen</span>
          <span>Menú</span>
          <span>Pedidos</span>
          <span>Estadísticas</span>
        </div>

        <div className={styles.metrics}>
          <Metric title="Ventas hoy" value="$620,000" />
          <Metric title="Pedidos" value="32" />
          <Metric title="Ticket promedio" value="$19,375" />
          <Metric title="Rating" value="4.8 ⭐" />
        </div>

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

        <div className={styles.cta}>
          <div className={styles.ctaText}>
            <p>Impulsa más ventas</p>
            <p>Crea promociones y destaca tu negocio en DeliFlex</p>
          </div>
          <button
            onClick={() => {
              if (id) return;
              router.push(`/stores/${id}/promotions`);
            }}
          >
            Crear promoción
          </button>
        </div>

        <div className={styles.cards}>
          <SmallCard title="Menú" value="45 productos" />
          <SmallCard title="Promociones" value="2 activas" />
          <SmallCard title="Horario" value="9am - 11pm" />
        </div>

        <div className={styles.products}>
          <h3>Top productos</h3>

          <Product name="Hamburguesa Clásica" price="$324K" />
          <Product name="Papas DeliFlex" price="$112K" />
        </div>
      </div>
    </AdminLayout>
  );
}

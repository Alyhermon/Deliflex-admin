"use client";

import styles from "./details.module.css";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../components/layout/adminLayout";
import { JSX, useEffect, useState } from "react";

// Tabs components
import ResumeTab from "./store-tabs/resume";
import MenuTab from "./store-tabs/menu";
import OrderTab from "./store-tabs/orders";
import StatisticsTab from "./store-tabs/statistics";

type TabKey = "resumen" | "menu" | "pedidos" | "estadisticas";

export default function StoreDetailPage({ id }: { id: string }) {
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

  const [activeTab, setActiveTab] = useState<TabKey>("resumen");
  const [loading, setLoading] = useState(true);

  // ✅ Tabs definidos correctamente (AQUÍ ESTABA EL ERROR 🔥)
  const tabs: { key: TabKey; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "menu", label: "Menú" },
    { key: "pedidos", label: "Pedidos" },
    { key: "estadisticas", label: "Estadísticas" },
  ];

  useEffect(() => {
    const loadStore = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/register-business/${id}`
        );

        const data = await res.json();
        const stores = Array.isArray(data) ? data : data.data || [];

        const foundStore = stores.find(
          (store: { id: string }) => store.id === id
        );

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

  const TAB_COMPONENTS: Record<TabKey, JSX.Element> = {
    resumen: <ResumeTab id={id} />,
    menu: <MenuTab />,
    pedidos: <OrderTab />,
    estadisticas: <StatisticsTab />,
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Tiendas", href: "/stores" },
            { label: store.name },
          ]}
        />

        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{store.name}</h1>
            <span className={styles.subtitle}>ID: #{id}</span>
          </div>

          <span className={styles.status}>Abierto</span>
        </div>

        {/* 🔥 TABS */}
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.tab} ${
                activeTab === tab.key ? styles.active : ""
              }`}
            >
              {tab.label}
              <span className={styles.indicator} />
            </button>
          ))}
        </div>

        {/* 🔥 CONTENIDO */}
        <div className={styles.tabContent}>
          {TAB_COMPONENTS[activeTab]}
        </div>
      </div>
    </AdminLayout>
  );
}
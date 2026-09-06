"use client";

import styles from "./details.module.css";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../components/layout/adminLayout";
import { JSX, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import ResumeTab from "./store-tabs/resume/resume";
import MenuScreen from "../../menu/[storeId]/MenuScreen";
import InventoryScreen from "../../inventory/[storeId]/InventoryScreen";
import FinanceScreen from "../../finanzas/[storeId]/FinanceScreen";
import OrderTab from "./store-tabs/orders/orders";
import { isStoreOpenNow, ScheduleRow } from "./schedule-utils";

type TabKey = "resumen" | "inventario" | "menu" | "pedidos" | "finanzas";

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
  // null = todavia no se sabe / sin horarios guardados -> se usa store.status.
  const [abiertoPorHorario, setAbiertoPorHorario] = useState<boolean | null>(
    null,
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "inventario", label: "Inventario" },
    { key: "menu", label: "Menú" },
    { key: "pedidos", label: "Pedidos" },
    { key: "finanzas", label: "Finanzas" },
  ];

  useEffect(() => {
    const loadStore = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/register-business/${id}`,
          { credentials: "include" },
        );

        const data = await res.json();
        const stores = Array.isArray(data) ? data : data.data || [];

        const foundStore = stores.find(
          (store: { id: string }) => store.id === id,
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

  // El "Abierto"/"Cerrado" de la cabecera depende del horario real,
  // no del estado de aprobacion de la tienda (PENDING_APPROVAL/ACTIVE/etc).
  useEffect(() => {
    if (!id) return;

    const loadSchedule = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/register-business/edit/${id}`,
          { credentials: "include" },
        );
        const data = await res.json();
        const schedules: ScheduleRow[] = Array.isArray(data.schedules)
          ? data.schedules
          : [];

        setAbiertoPorHorario(isStoreOpenNow(schedules));
      } catch (error) {
        console.error(error);
      }
    };

    loadSchedule();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!store) return <p>No encontrado</p>;

  const TAB_COMPONENTS: Record<TabKey, JSX.Element> = {
    resumen: <ResumeTab id={id} />,
    inventario: <InventoryScreen storeId={id} />,
    menu: <MenuScreen storeId={id} />,
    pedidos: <OrderTab id={id} />,
    finanzas: <FinanceScreen storeId={id} />,
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[{ label: "Tiendas", href: "/stores" }, { label: store.name }]}
        />
        <div className={styles.header}>
          <div className={styles.left}>
            <div className={styles.logo}>
              <img
                src={store.banner_url || "/assets/no-image.png"}
                alt={store.name}
              />
            </div>

            <div className={styles.info}>
              <div className={styles.topRow}>
                <h1 className={styles.title}>{store.name}</h1>

                <span
                  className={`${styles.status} ${
                    (abiertoPorHorario ?? store.status === "ACTIVE")
                      ? ""
                      : styles.statusClosed
                  }`}
                >
                  {(abiertoPorHorario ?? store.status === "ACTIVE")
                    ? "Abierto"
                    : "Cerrado"}
                </span>
              </div>

              <span className={styles.subtitle}>ID: #{id}</span>

              <p className={styles.location}>
                Repostería • Santo Domingo, República Dominicana
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <span
              className={styles.editButton}
              onClick={() => router.push(`/stores/${id}/edit`)}
            >
              <FontAwesomeIcon icon={faEdit} color="#ffffff" />
              Editar negocio
            </span>

            <span className={styles.storeButton}>Ver en la tienda ↗</span>
          </div>
        </div>

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
        <div className={styles.tabContent}>{TAB_COMPONENTS[activeTab]}</div>
      </div>
    </AdminLayout>
  );
}

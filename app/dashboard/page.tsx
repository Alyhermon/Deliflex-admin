"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import { useAuth } from "../hooks/useAuth";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import Toast from "../components/components-items/toast/toast";
import styles from "./dashboard.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShop,
  faCircleCheck,
  faClock,
  faBoxOpen,
  faTags,
  faArrowRight,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type PendingStore = {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
};

type Summary = {
  totalBusinesses: number;
  totalStores: number;
  activeStores: number;
  pendingStores: number;
  inactiveStores: number;
  totalProducts: number;
  activePromotions: number;
  pendingApproval: PendingStore[];
};

const haceTiempo = (iso: string) => {
  const dias = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Hace 1 día";

  return `Hace ${dias} días`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingStoreId, setActingStoreId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  // 100 = SUPER_ADMIN (la duena de la plataforma): ve TODOS los negocios.
  // 90  = ADMIN normal: solo ve el total de sus propios negocios.
  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const cargarResumen = useCallback(async () => {
    if (!user) return;

    const url = esSuperAdmin
      ? "http://localhost:3001/register-business/dashboard-summary"
      : `http://localhost:3001/register-business/accessible/${user.id}/dashboard-summary`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, esSuperAdmin]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace("/core/login");
      return;
    }

    cargarResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, esSuperAdmin, router]);

  // Unica decision que le toca a la plataforma: aprobar deja el negocio
  // ACTIVE, declinar lo deja INACTIVE (no lo borra, solo no queda publicado).
  const decidirNegocio = async (
    storeId: string,
    status: "ACTIVE" | "INACTIVE",
  ) => {
    setActingStoreId(storeId);

    try {
      const res = await fetch(
        `http://localhost:3001/register-business/store/${storeId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar el negocio");

      setToast({
        message:
          status === "ACTIVE"
            ? "Negocio aprobado"
            : "Negocio declinado",
        type: status === "ACTIVE" ? "success" : "danger",
      });

      await cargarResumen();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setActingStoreId(null);
    }
  };

  const hoyCrudo = new Date().toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  // Solo la primera letra en mayuscula ("Jueves, 3 de septiembre"),
  // toLocaleDateString ya la devuelve toda en minuscula.
  const hoy = hoyCrudo.charAt(0).toUpperCase() + hoyCrudo.slice(1);

  if (loading || !summary) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <Skeleton width={180} height={22} style={{ marginBottom: 8 }} />
                <Skeleton width={280} height={13} />
              </div>
            </div>
          </div>

          <SkeletonStatCards count={5} />

          <div className={styles.content}>
            {esSuperAdmin && (
              <div className={`${styles.panel} ${styles.panelPending}`}>
                <Skeleton width="60%" height={14} style={{ marginBottom: 16 }} />
                <Skeleton height={44} radius={10} style={{ marginBottom: 10 }} />
                <Skeleton height={44} radius={10} />
              </div>
            )}

            <div
              className={`${styles.panel} ${styles.panelStatus} ${
                esSuperAdmin ? "" : styles.panelStatusFull
              }`}
            >
              <Skeleton width="50%" height={14} style={{ marginBottom: 16 }} />
              <Skeleton height={10} radius={999} />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { totalStores, activeStores, pendingStores, inactiveStores } = summary;
  const base = totalStores || 1;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>{esSuperAdmin ? "Panel general" : "Mis negocios"}</h1>
              <p>
                {esSuperAdmin
                  ? "Vista completa de todos los negocios que operan en la plataforma Deliflex."
                  : "Resumen de todos tus negocios en Deliflex."}
              </p>
            </div>

            <span className={styles.fecha}>{hoy}</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconOrange}`}>
              <FontAwesomeIcon icon={faShop} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>{summary.totalStores}</div>
              <div className={styles.statLabel}>
                {esSuperAdmin ? "Negocios registrados" : "Mis negocios"}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconGreen}`}>
              <FontAwesomeIcon icon={faCircleCheck} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>{summary.activeStores}</div>
              <div className={styles.statLabel}>Negocios activos</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconAmber}`}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>{summary.pendingStores}</div>
              <div className={styles.statLabel}>Por aprobar</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconBlue}`}>
              <FontAwesomeIcon icon={faBoxOpen} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>{summary.totalProducts}</div>
              <div className={styles.statLabel}>Productos en menús</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconPurple}`}>
              <FontAwesomeIcon icon={faTags} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>
                {summary.activePromotions}
              </div>
              <div className={styles.statLabel}>Promociones activas</div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {/* Aprobar o rechazar un negocio es una decision de la plataforma,
              no de quien lo administra: solo la super admin la ve. */}
          {esSuperAdmin && (
            <div className={`${styles.panel} ${styles.panelPending}`}>
              <div className={styles.panelHead}>
                <h3>Negocios pendientes de aprobación</h3>
                <Link href="/stores" className={styles.panelLink}>
                  Ver todos <FontAwesomeIcon icon={faArrowRight} size="2xs" />
                </Link>
              </div>

              {summary.pendingApproval.length === 0 ? (
                <div className={styles.emptyState}>
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className={styles.emptyIcon}
                  />
                  No hay negocios esperando aprobación.
                </div>
              ) : (
                summary.pendingApproval.map((store) => (
                  <div key={store.id} className={styles.pendingItem}>
                    <Link
                      href={`/stores/${store.id}`}
                      className={styles.pendingInfo}
                    >
                      <span className={styles.pendingName}>{store.name}</span>
                      <span className={styles.pendingMeta}>
                        {store.category || "Sin categoría"} ·{" "}
                        {haceTiempo(store.created_at)}
                      </span>
                    </Link>

                    <div className={styles.pendingActions}>
                      <button
                        type="button"
                        className={styles.declineBtn}
                        disabled={actingStoreId === store.id}
                        onClick={() => decidirNegocio(store.id, "INACTIVE")}
                        title="Declinar negocio"
                      >
                        <FontAwesomeIcon icon={faXmark} /> Declinar
                      </button>
                      <button
                        type="button"
                        className={styles.approveBtn}
                        disabled={actingStoreId === store.id}
                        onClick={() => decidirNegocio(store.id, "ACTIVE")}
                        title="Aprobar negocio"
                      >
                        <FontAwesomeIcon icon={faCheck} /> Aprobar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div
            className={`${styles.panel} ${styles.panelStatus} ${
              esSuperAdmin ? "" : styles.panelStatusFull
            }`}
          >
            <div className={styles.panelHead}>
              <h3>Estado de los negocios</h3>
            </div>

            <div className={styles.statusBar}>
              <div
                className={styles.segActive}
                style={{ width: `${(activeStores / base) * 100}%` }}
              />
              <div
                className={styles.segPending}
                style={{ width: `${(pendingStores / base) * 100}%` }}
              />
              <div
                className={styles.segInactive}
                style={{ width: `${(inactiveStores / base) * 100}%` }}
              />
            </div>

            <div className={styles.statusLegend}>
              <div className={styles.legendRow}>
                <span
                  className={styles.dot}
                  style={{ background: "#059669" }}
                />
                <span className={styles.legendLabel}>Activos</span>
                <span className={styles.legendValue}>{activeStores}</span>
              </div>

              <div className={styles.legendRow}>
                <span
                  className={styles.dot}
                  style={{ background: "#ff7a00" }}
                />
                <span className={styles.legendLabel}>Pendientes</span>
                <span className={styles.legendValue}>{pendingStores}</span>
              </div>

              <div className={styles.legendRow}>
                <span
                  className={styles.dot}
                  style={{ background: "#d1d5db" }}
                />
                <span className={styles.legendLabel}>
                  Inactivos / cerrados
                </span>
                <span className={styles.legendValue}>{inactiveStores}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}

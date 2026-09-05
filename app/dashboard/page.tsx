"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import { useAuth } from "../hooks/useAuth";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import styles from "./dashboard.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShop,
  faCircleCheck,
  faClock,
  faBoxOpen,
  faTags,
  faArrowRight,
  faLock,
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

  // 100 = SUPER_ADMIN (la duena de la plataforma): ve TODOS los negocios.
  // 90  = ADMIN normal: solo ve el total de sus propios negocios.
  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace("/core/login");
      return;
    }

    const url = esSuperAdmin
      ? "http://localhost:3001/register-business/dashboard-summary"
      : `http://localhost:3001/register-business/accessible/${user.id}/dashboard-summary`;

    const cargar = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();

        setSummary(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [authLoading, user, esSuperAdmin, router]);

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
            <div className={`${styles.panel} ${styles.panelPending}`}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 16 }} />
              <Skeleton height={44} radius={10} style={{ marginBottom: 10 }} />
              <Skeleton height={44} radius={10} />
            </div>

            <div className={`${styles.panel} ${styles.panelStatus}`}>
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
              summary.pendingApproval.map((store) =>
                esSuperAdmin ? (
                  <Link
                    key={store.id}
                    href={`/stores/${store.id}`}
                    className={styles.pendingItem}
                  >
                    <div className={styles.pendingInfo}>
                      <span className={styles.pendingName}>{store.name}</span>
                      <span className={styles.pendingMeta}>
                        {store.category || "Sin categoría"} ·{" "}
                        {haceTiempo(store.created_at)}
                      </span>
                    </div>

                    <span className={styles.pendingBadge}>
                      <FontAwesomeIcon icon={faClock} /> Pendiente
                    </span>
                  </Link>
                ) : (
                  // Un negocio pendiente todavia no lo aprobo la
                  // plataforma: hasta que eso pase, nadie que no sea el
                  // super admin puede entrar a administrarlo.
                  <div
                    key={store.id}
                    className={`${styles.pendingItem} ${styles.pendingItemLocked}`}
                    title="Este negocio esta pendiente de aprobacion"
                  >
                    <div className={styles.pendingInfo}>
                      <span className={styles.pendingName}>{store.name}</span>
                      <span className={styles.pendingMeta}>
                        {store.category || "Sin categoría"} ·{" "}
                        {haceTiempo(store.created_at)}
                      </span>
                    </div>

                    <span className={styles.pendingBadge}>
                      <FontAwesomeIcon icon={faLock} /> Pendiente
                    </span>
                  </div>
                ),
              )
            )}
          </div>

          <div className={`${styles.panel} ${styles.panelStatus}`}>
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
    </AdminLayout>
  );
}

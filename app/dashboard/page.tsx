"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  faCircleXmark,
  faClock,
  faBoxOpen,
  faTags,
  faArrowRight,
  faSackDollar,
  faStar,
  faReceipt,
  faTicket,
  faUsers,
  faArrowTrendUp,
  faArrowTrendDown,
  faChevronDown,
  faChartColumn,
  faUtensils,
  faCakeCandles,
  faMugSaucer,
  faKitMedical,
  faCartShopping,
  faEllipsis,
  faIceCream,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// Un icono propio por categoria para que cada fila del donut se
// reconozca de un vistazo, en vez de solo un color. "Sin categoria" y
// cualquier categoria nueva que no este en este mapa caen en faShop.
const CATEGORY_ICONS: Record<string, IconDefinition> = {
  Restaurante: faUtensils,
  Reposteria: faCakeCandles,
  Cafeteria: faMugSaucer,
  Farmacias: faKitMedical,
  Mercado: faCartShopping,
  Heladeria: faIceCream,
  "Sin categoría": faEllipsis,
};

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
  totalRevenue?: number;
  boostRevenue?: number;
  totalOrders?: number;
  avgTicket?: number;
  totalCustomers?: number;
  revenueTrend?: { month: string; total: number }[];
  byCategory?: { category: string; total: number }[];
  availableYears?: number[];
  pendingApproval: PendingStore[];
};

const CATEGORY_COLORS = [
  "#ff7a00",
  "#2f7cf6",
  "#7c3aed",
  "#0d9488",
  "#b8860b",
  "#2da44e",
  "#e53935",
  "#9a9a9a",
];

const dinero = (valor: number | string) =>
  `RD$${Number(valor).toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;

const mesCorto = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const texto = new Date(y, m - 1, 1).toLocaleDateString("es-DO", {
    month: "short",
  });
  const limpio = texto.replace(".", "");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
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

  // El selector de "Ingresos mensuales" siempre tiene un anio real elegido
  // (arranca en el actual); el de "Negocios por categoria" arranca en
  // "Total" (sin filtrar), por eso empieza en undefined.
  const [revenueYear, setRevenueYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [categoryYear, setCategoryYear] = useState<number | undefined>(
    undefined,
  );

  // 100 = SUPER_ADMIN (la duena de la plataforma): ve TODOS los negocios.
  // 90  = ADMIN normal: solo ve el total de sus propios negocios.
  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const cargarResumen = useCallback(async () => {
    if (!user) return;

    const base = esSuperAdmin
      ? `${process.env.NEXT_PUBLIC_API_URL}/register-business/dashboard-summary`
      : `${process.env.NEXT_PUBLIC_API_URL}/register-business/accessible/${user.id}/dashboard-summary`;

    const params = new URLSearchParams({ revenueYear: String(revenueYear) });
    if (categoryYear) params.set("categoryYear", String(categoryYear));

    try {
      const res = await fetch(`${base}?${params}`, { credentials: "include" });
      const data = await res.json();

      // Si la peticion falla (401, 500, etc.) el cuerpo no trae la forma
      // de Summary - sin este chequeo, renderizar con datos a medias
      // revienta toda la pantalla en vez de solo mostrar vacio.
      if (!res.ok || !Array.isArray(data.pendingApproval)) {
        console.error("Resumen del dashboard invalido:", data);
        setSummary(null);
        return;
      }

      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, esSuperAdmin, revenueYear, categoryYear]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace("/core/login");
      return;
    }

    cargarResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, esSuperAdmin, router, revenueYear, categoryYear]);

  // Unica decision que le toca a la plataforma: aprobar deja el negocio
  // ACTIVE, declinar lo deja INACTIVE (no lo borra, solo no queda publicado).
  const decidirNegocio = async (
    storeId: string,
    status: "ACTIVE" | "INACTIVE",
  ) => {
    setActingStoreId(storeId);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register-business/store/${storeId}/status`,
        {
          credentials: "include",
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

          <SkeletonStatCards count={esSuperAdmin ? 10 : 5} />

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

        {esSuperAdmin && (
          <div className={styles.statsSection}>
            <h3 className={styles.statsSectionTitle}>Ingresos</h3>
            <div className={styles.statsHighlights}>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.iconTeal}`}>
                  <FontAwesomeIcon icon={faSackDollar} />
                </span>
                <div className={styles.statBody}>
                  <div className={styles.statValue}>
                    {dinero(summary.totalRevenue ?? 0)}
                  </div>
                  <div className={styles.statLabel}>
                    Ingresos totales de la plataforma
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.iconGold}`}>
                  <FontAwesomeIcon icon={faStar} />
                </span>
                <div className={styles.statBody}>
                  <div className={styles.statValue}>
                    {dinero(summary.boostRevenue ?? 0)}
                  </div>
                  <div className={styles.statLabel}>
                    Ingresos por Negocios Destacados
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.iconGold}`}>
                  <FontAwesomeIcon icon={faTicket} />
                </span>
                <div className={styles.statBody}>
                  <div className={styles.statValue}>
                    {dinero(summary.avgTicket ?? 0)}
                  </div>
                  <div className={styles.statLabel}>Ticket promedio</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.statsSection}>
          <h3 className={styles.statsSectionTitle}>
            {esSuperAdmin ? "Métricas generales de los negocios" : "Resumen"}
          </h3>
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

            {esSuperAdmin && (
              <>
                <div className={styles.statCard}>
                  <span className={`${styles.statIcon} ${styles.iconTeal}`}>
                    <FontAwesomeIcon icon={faReceipt} />
                  </span>
                  <div className={styles.statBody}>
                    <div className={styles.statValue}>
                      {summary.totalOrders ?? 0}
                    </div>
                    <div className={styles.statLabel}>Pedidos totales</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <span className={`${styles.statIcon} ${styles.iconBlue}`}>
                    <FontAwesomeIcon icon={faUsers} />
                  </span>
                  <div className={styles.statBody}>
                    <div className={styles.statValue}>
                      {summary.totalCustomers ?? 0}
                    </div>
                    <div className={styles.statLabel}>Clientes registrados</div>
                  </div>
                </div>
              </>
            )}
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
                  <span className={styles.emptyIconWrap}>
                    <FontAwesomeIcon icon={faShop} className={styles.emptyIcon} />
                  </span>
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
                        <FontAwesomeIcon icon={faCircleXmark} />
                      </button>
                      <button
                        type="button"
                        className={styles.approveBtn}
                        disabled={actingStoreId === store.id}
                        onClick={() => decidirNegocio(store.id, "ACTIVE")}
                        title="Aprobar negocio"
                      >
                        <FontAwesomeIcon icon={faCircleCheck} />
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

            <div className={styles.statusBarTrack}>
              <div className={styles.statusBar}>
                {activeStores > 0 && (
                  <div
                    className={styles.segActive}
                    style={{ width: `${(activeStores / base) * 100}%` }}
                  />
                )}
                {pendingStores > 0 && (
                  <div
                    className={styles.segPending}
                    style={{ width: `${(pendingStores / base) * 100}%` }}
                  />
                )}
                {inactiveStores > 0 && (
                  <div
                    className={styles.segInactive}
                    style={{ width: `${(inactiveStores / base) * 100}%` }}
                  />
                )}
              </div>
            </div>

            <div className={styles.statusLegendCompact}>
              <div className={styles.statusLegendItem}>
                <span
                  className={styles.categoryCount}
                  style={{ color: "#2da44e", width: 26, height: 26, fontSize: 11 }}
                >
                  {activeStores}
                </span>
                <span className={styles.legendLabel}>Activos</span>
              </div>
              <div className={styles.statusLegendItem}>
                <span
                  className={styles.categoryCount}
                  style={{ color: "#ff7a00", width: 26, height: 26, fontSize: 11 }}
                >
                  {pendingStores}
                </span>
                <span className={styles.legendLabel}>Pendientes</span>
              </div>
              <div className={styles.statusLegendItem}>
                <span
                  className={styles.categoryCount}
                  style={{ color: "#9aa1ab", width: 26, height: 26, fontSize: 11 }}
                >
                  {inactiveStores}
                </span>
                <span className={styles.legendLabel}>Inactivos / cerrados</span>
              </div>
            </div>
          </div>
        </div>

        {(summary.revenueTrend || summary.byCategory) && (
          <div className={styles.chartsRow}>
            <RevenueCard
              trend={summary.revenueTrend ?? []}
              year={revenueYear}
              availableYears={summary.availableYears ?? [revenueYear]}
              onYearChange={setRevenueYear}
            />

            <CategoryCard
              categorias={summary.byCategory ?? []}
              esSuperAdmin={esSuperAdmin}
              year={categoryYear}
              availableYears={summary.availableYears ?? [revenueYear]}
              onYearChange={setCategoryYear}
            />
          </div>
        )}
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

// ---------- Selector de anio en forma de pildora (reusado por ambas tarjetas) ----------

function YearPillSelect({
  value,
  options,
  onChange,
  allLabel,
}: {
  value: number | undefined;
  options: number[];
  onChange: (year: number | undefined) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClickFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [open]);

  const label = value ?? allLabel ?? "";

  return (
    <div className={styles.yearPillWrap} ref={ref}>
      <button
        type="button"
        className={styles.revenueYearPill}
        onClick={() => setOpen((v) => !v)}
      >
        {label} <FontAwesomeIcon icon={faChevronDown} size="2xs" />
      </button>

      {open && (
        <div className={styles.yearPillMenu}>
          {allLabel && (
            <button
              type="button"
              className={`${styles.yearPillOption} ${
                value === undefined ? styles.yearPillOptionActive : ""
              }`}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              {allLabel}
            </button>
          )}
          {options.map((y) => (
            <button
              key={y}
              type="button"
              className={`${styles.yearPillOption} ${
                value === y ? styles.yearPillOptionActive : ""
              }`}
              onClick={() => {
                onChange(y);
                setOpen(false);
              }}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Tarjeta de ingresos: encabezado + barras + resumen ----------

function RevenueCard({
  trend,
  year,
  availableYears,
  onYearChange,
}: {
  trend: { month: string; total: number }[];
  year: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}) {
  const data = trend.map((r) => ({ label: mesCorto(r.month), value: r.total }));

  const total = trend.reduce((acc, r) => acc + r.total, 0);
  const actual = trend[trend.length - 1]?.total ?? 0;
  const previo = trend[trend.length - 2]?.total ?? 0;

  let deltaLabel: string;
  let subiendo = true;

  if (previo === 0) {
    deltaLabel = actual > 0 ? "Nuevo" : "0%";
    subiendo = actual >= 0;
  } else {
    const pct = Math.round(((actual - previo) / previo) * 100);
    subiendo = pct >= 0;
    deltaLabel = `${subiendo ? "+" : ""}${pct}%`;
  }

  return (
    <div className={`${styles.panel} ${styles.chartPanel} ${styles.revenueCard}`}>
      <div className={styles.revenueHead}>
        <span className={styles.revenueHeadIcon}>
          <FontAwesomeIcon icon={faChartColumn} />
        </span>
        <div className={styles.revenueHeadTitles}>
          <h3>Ingresos mensuales</h3>
          <p>Total de ingresos por mes</p>
        </div>
        <YearPillSelect
          value={year}
          options={availableYears}
          onChange={(y) => y !== undefined && onYearChange(y)}
        />
      </div>

      <BarChart data={data} />

      <div className={styles.revenueFooter}>
        <div className={styles.revenueStat}>
          <span className={`${styles.revenueStatIcon} ${styles.revenueStatIconOrange}`}>
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </span>
          <div>
            <div className={styles.revenueStatLabel}>Ingresos totales</div>
            <div className={styles.revenueStatValue}>{dinero(total)}</div>
          </div>
        </div>

        <div className={styles.revenueDivider} />

        <div className={styles.revenueStat}>
          <span
            className={`${styles.revenueStatIcon} ${
              subiendo ? styles.revenueStatIconGreen : styles.revenueStatIconRed
            }`}
          >
            <FontAwesomeIcon icon={subiendo ? faArrowTrendUp : faArrowTrendDown} />
          </span>
          <div>
            <div
              className={`${styles.revenueDelta} ${
                subiendo ? styles.revenueDeltaUp : styles.revenueDeltaDown
              }`}
            >
              {deltaLabel}
            </div>
            <div className={styles.revenueStatLabel}>vs. mes anterior</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Grafica de barras: ingresos por mes ----------

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const width = 320;
  const height = 230;
  const padTop = 30;
  const padBottom = 26;
  const padLeft = 30;
  const padRight = 6;

  const max = Math.max(...data.map((d) => d.value), 1);
  const plotHeight = height - padTop - padBottom;
  const slot = (width - padLeft - padRight) / (data.length || 1);
  const barWidth = Math.min(30, slot * 0.6);

  const compacto = (v: number) => {
    if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
    return `${Math.round(v)}`;
  };

  if (data.every((d) => d.value === 0)) {
    return (
      <div className={styles.emptyState}>Todavía no hay ingresos registrados.</div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
      <defs>
        <linearGradient id="barActivo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9a3d" />
          <stop offset="100%" stopColor="#ff6a00" />
        </linearGradient>
        <linearGradient id="barMuted" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe4c2" />
          <stop offset="100%" stopColor="#ffd3a0" />
        </linearGradient>
        <filter id="barSombra" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3.5"
            floodColor="#ff7a00"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padTop + plotHeight * (1 - f);
        return (
          <g key={f}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#f0ebe3"
              strokeWidth={1}
              strokeDasharray={f === 0 ? undefined : "2 4"}
            />
            <text x={0} y={y + 3} fontSize="9" fill="#b0aaa2">
              {compacto(max * f)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barHeight = max > 0 ? (d.value / max) * plotHeight : 0;
        // La barra nunca baja de este alto (para que un mes en $0 se vea
        // como una pildora chata, no como un punto) - pero hay que medir
        // "y" desde este alto real, si no la pildora queda colgando por
        // debajo de la linea base en vez de apoyada sobre ella.
        const alturaMinima = barWidth * 0.3;
        const alturaEfectiva = Math.max(barHeight, alturaMinima);
        const x = padLeft + slot * i + (slot - barWidth) / 2;
        const y = padTop + plotHeight - alturaEfectiva;
        const esUltimo = i === data.length - 1;
        const rx = 6;

        return (
          <g key={i}>
            <text
              x={x + barWidth / 2}
              y={y - 9}
              textAnchor="middle"
              fontSize={esUltimo ? "11.5" : d.value > 0 ? "10" : "9.5"}
              fontWeight={esUltimo ? 800 : d.value > 0 ? 700 : 500}
              fill={esUltimo ? "#c94800" : d.value > 0 ? "#4a4038" : "#c2b8ab"}
            >
              ${compacto(d.value)}
            </text>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={alturaEfectiva}
              rx={rx}
              fill={esUltimo ? "url(#barActivo)" : "url(#barMuted)"}
              filter={esUltimo ? "url(#barSombra)" : undefined}
            />
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={esUltimo ? 700 : 500}
              fill={esUltimo ? "#c94800" : "#a89f93"}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Tarjeta de categorias: encabezado + donut + filas con barra ----------

function CategoryCard({
  categorias,
  esSuperAdmin,
  year,
  availableYears,
  onYearChange,
}: {
  categorias: { category: string; total: number }[];
  esSuperAdmin: boolean;
  year: number | undefined;
  availableYears: number[];
  onYearChange: (year: number | undefined) => void;
}) {
  const total = categorias.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className={`${styles.panel} ${styles.chartPanel} ${styles.categoryCard}`}>
      <div className={styles.revenueHead}>
        <span className={styles.revenueHeadIcon}>
          <FontAwesomeIcon icon={faShop} />
        </span>
        <div className={styles.revenueHeadTitles}>
          <h3>{esSuperAdmin ? "Negocios por categoría" : "Tus negocios por categoría"}</h3>
          <p>
            Distribución de {esSuperAdmin ? "" : "tus "}
            {total} negocio{total === 1 ? "" : "s"}
            {year ? ` registrados en ${year}` : ""}
          </p>
        </div>
        <YearPillSelect
          value={year}
          options={availableYears}
          onChange={onYearChange}
          allLabel="Total"
        />
      </div>

      <div className={styles.donutRow}>
        <DonutChart
          data={categorias.map((c, i) => ({
            label: c.category,
            value: c.total,
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
          }))}
        />

        <div className={styles.categoryList}>
          {categorias.map((c, i) => {
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
            const icon = CATEGORY_ICONS[c.category] ?? faShop;

            return (
              <div
                key={c.category}
                className={styles.categoryRow}
                style={{ background: `color-mix(in srgb, ${color} 9%, white)` }}
              >
                <span
                  className={styles.categoryIcon}
                  style={{ background: color }}
                >
                  <FontAwesomeIcon icon={icon} />
                </span>

                <div className={styles.categoryMain}>
                  <span className={styles.categoryName}>{c.category}</span>
                  <div className={styles.categoryTrack}>
                    <div
                      className={styles.categoryFill}
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>

                <span className={styles.categoryPct} style={{ color }}>
                  {pct}%
                </span>
                <span className={styles.categoryCount} style={{ color }}>
                  {c.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Grafica de pastel: negocios por categoria ----------

function DonutChart({
  data,
  size = 200,
  strokeWidth = 44,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={styles.donutSvg}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="#f1f1f1"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={styles.donutSvg}
    >
      <defs>
        <filter id="donutSombra" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#1a1a1a"
            floodOpacity="0.12"
          />
        </filter>
      </defs>

      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f4f2ef"
        strokeWidth={strokeWidth}
      />

      <g
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        filter="url(#donutSombra)"
      >
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </g>

      {data.map((d, i) => {
        const fraction = d.value / total;
        if (fraction <= 0) return null;

        const midFraction = data
          .slice(0, i)
          .reduce((acc, prev) => acc + prev.value / total, fraction / 2);
        const angle = -90 + midFraction * 360;
        const rad = (angle * Math.PI) / 180;
        const lx = size / 2 + radius * Math.cos(rad);
        const ly = size / 2 + radius * Math.sin(rad);

        return (
          <text
            key={`pct-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13.5"
            fontWeight="800"
            fill="#fff"
          >
            {Math.round(fraction * 100)}%
          </text>
        );
      })}

      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="800"
        fill="#1a1a1a"
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9.5"
        fontWeight="600"
        letterSpacing="0.4"
        fill="#a89f93"
      >
        NEGOCIOS
      </text>
    </svg>
  );
}

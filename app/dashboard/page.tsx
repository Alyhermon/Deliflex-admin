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
  faSackDollar,
  faStar,
  faReceipt,
  faTicket,
  faUsers,
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
  totalRevenue?: number;
  boostRevenue?: number;
  totalOrders?: number;
  avgTicket?: number;
  totalCustomers?: number;
  revenueTrend?: { month: string; total: number }[];
  byCategory?: { category: string; total: number }[];
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

  // 100 = SUPER_ADMIN (la duena de la plataforma): ve TODOS los negocios.
  // 90  = ADMIN normal: solo ve el total de sus propios negocios.
  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const cargarResumen = useCallback(async () => {
    if (!user) return;

    const url = esSuperAdmin
      ? `${process.env.NEXT_PUBLIC_API_URL}/register-business/dashboard-summary`
      : `${process.env.NEXT_PUBLIC_API_URL}/register-business/accessible/${user.id}/dashboard-summary`;

    try {
      const res = await fetch(url, { credentials: "include" });
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

            <div className={styles.statusRings}>
              <RingStat
                icon={faCircleCheck}
                value={activeStores}
                total={base}
                label="Activos"
                color="#059669"
                colorLight="#34d399"
              />
              <RingStat
                icon={faClock}
                value={pendingStores}
                total={base}
                label="Pendientes"
                color="#ff7a00"
                colorLight="#ffb057"
              />
              <RingStat
                icon={faXmark}
                value={inactiveStores}
                total={base}
                label="Inactivos / cerrados"
                color="#9aa1ab"
                colorLight="#c7ccd3"
              />
            </div>
          </div>
        </div>

        {(summary.revenueTrend || summary.byCategory) && (
          <div className={styles.chartsRow}>
            <div className={`${styles.panel} ${styles.chartPanel}`}>
              <div className={styles.panelHead}>
                <h3>Ingresos mensuales</h3>
              </div>
              <BarChart
                data={(summary.revenueTrend ?? []).map((r) => ({
                  label: mesCorto(r.month),
                  value: r.total,
                }))}
              />
            </div>

            <div className={`${styles.panel} ${styles.chartPanel}`}>
              <div className={styles.panelHead}>
                <h3>
                  {esSuperAdmin ? "Negocios por categoría" : "Tus negocios por categoría"}
                </h3>
              </div>
              <div className={styles.donutRow}>
                <DonutChart
                  data={(summary.byCategory ?? []).map((c, i) => ({
                    label: c.category,
                    value: c.total,
                    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                  }))}
                />
                <div className={styles.statusLegend}>
                  {(() => {
                    const categorias = summary.byCategory ?? [];
                    const totalCategorias = categorias.reduce(
                      (acc, c) => acc + c.total,
                      0,
                    );

                    return categorias.map((c, i) => (
                      <div key={c.category} className={styles.legendRow}>
                        <span
                          className={styles.legendSwatch}
                          style={{
                            background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          }}
                        />
                        <span className={styles.legendLabel}>{c.category}</span>
                        <span className={styles.legendPct}>
                          {totalCategorias > 0
                            ? Math.round((c.total / totalCategorias) * 100)
                            : 0}
                          %
                        </span>
                        <span className={styles.legendValue}>{c.total}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
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

// ---------- Anillo individual: participacion de un estado de negocio ----------

function RingStat({
  icon,
  value,
  total,
  label,
  color,
  colorLight,
}: {
  icon: typeof faCircleCheck;
  value: number;
  total: number;
  label: string;
  color: string;
  colorLight: string;
}) {
  const size = 76;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? value / total : 0;
  const dash = pct * circumference;
  const gradientId = `ring-${label.replace(/[^a-zA-Z]/g, "")}`;

  return (
    <div className={styles.ringStat}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorLight} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f0ed"
          strokeWidth={strokeWidth}
        />
        {value > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        <foreignObject x={0} y={0} width={size} height={size}>
          <div className={styles.ringIcon} style={{ color }}>
            <FontAwesomeIcon icon={icon} />
          </div>
        </foreignObject>
      </svg>
      <div className={styles.ringValue}>{value}</div>
      <div className={styles.ringLabel}>{label}</div>
    </div>
  );
}

// ---------- Grafica de barras: ingresos por mes ----------

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const width = 320;
  const height = 230;
  const padTop = 34;
  const padBottom = 30;
  const padLeft = 8;
  const padRight = 8;

  const max = Math.max(...data.map((d) => d.value), 1);
  const plotHeight = height - padTop - padBottom;
  const slot = (width - padLeft - padRight) / (data.length || 1);
  const barWidth = Math.min(36, slot * 0.62);

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

      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={padLeft}
          y1={padTop + plotHeight * (1 - f)}
          x2={width - padRight}
          y2={padTop + plotHeight * (1 - f)}
          stroke="#f0ebe3"
          strokeWidth={1}
          strokeDasharray={f === 0 ? undefined : "2 4"}
        />
      ))}

      {data.map((d, i) => {
        const barHeight = max > 0 ? (d.value / max) * plotHeight : 0;
        const x = padLeft + slot * i + (slot - barWidth) / 2;
        const y = padTop + plotHeight - barHeight;
        const esUltimo = i === data.length - 1;

        return (
          <g key={i}>
            <text
              x={x + barWidth / 2}
              y={y - 10}
              textAnchor="middle"
              fontSize={esUltimo ? "12" : "9.5"}
              fontWeight={esUltimo ? 800 : 600}
              fill={esUltimo ? "#c94800" : "#c2b8ab"}
            >
              {compacto(d.value)}
            </text>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 3)}
              rx={9}
              fill="url(#barActivo)"
              opacity={esUltimo ? 1 : 0.32}
              filter={esUltimo ? "url(#barSombra)" : undefined}
            />
            <text
              x={x + barWidth / 2}
              y={height - 10}
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

// ---------- Grafica de pastel: negocios por categoria ----------

function DonutChart({
  data,
  size = 148,
  strokeWidth = 22,
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
  // Un pequeño hueco entre cada porcion, para que se lean como piezas
  // separadas en vez de un anillo solido - solo tiene sentido si hay mas
  // de una porcion con valor real.
  const conHueco = data.filter((d) => d.value > 0).length > 1;
  const hueco = conHueco ? 3 : 0;
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
          const rawDash = fraction * circumference;
          const dash = Math.max(rawDash - hueco, 0);
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += rawDash;
          return circle;
        })}
      </g>

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

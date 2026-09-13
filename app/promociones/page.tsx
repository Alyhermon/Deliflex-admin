"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import {
  useAuth,
  getRoleForStore,
  tieneRolGerencial,
  type User,
} from "../hooks/useAuth";
import { useActiveStore } from "../hooks/useActiveStore";
import Modal from "../components/components/modal/modal";
import DFInput from "../components/components-items/input";
import Dropdown from "../components/components-items/dropdown";
import Toast from "../components/components-items/toast/toast";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import styles from "./promociones.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faStar,
  faClock,
  faCalendarDays,
  faCircleCheck,
  faPlus,
  faPen,
  faPowerOff,
  faEye,
  faImage,
  faCheck,
  faXmark,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const API = process.env.NEXT_PUBLIC_API_URL;

type BoostPlan = {
  id: string;
  name: string;
  price: string;
  billing_cycle: "MONTHLY" | "BIWEEKLY" | "WEEKLY";
  features: string[];
  is_highlighted: boolean;
  is_active: boolean;
  sort_order: number;
};

// El banner lo sube el negocio y lo aprueba la plataforma: hasta que este
// en APPROVED no deberia salir en la app de clientes.
type BannerStatus = "PENDING" | "APPROVED" | "REJECTED";

type StoreBoost = {
  id: string;
  status: "ACTIVE" | "PENDING" | "OVERDUE" | "PAUSED" | "CANCELLED";
  amount: string;
  next_billing_date: string | null;
  started_at: string;
  store_id: string;
  store_name: string;
  store_category: string | null;
  plan_id: string;
  plan_name: string;
  billing_cycle: "MONTHLY" | "BIWEEKLY" | "WEEKLY";
  // Arte que el negocio quiere que se muestre en el espacio destacado.
  banner_url?: string | null;
  banner_status?: BannerStatus | null;
  banner_note?: string | null;
  banner_submitted_at?: string | null;
  banner_reject_reason?: string | null;
  // Pausa: dias que le quedaban del ciclo el dia que se pauso. Mientras
  // este pausado el reloj no corre.
  paused_at?: string | null;
  days_left_on_pause?: number | null;
};

type Summary = {
  revenueThisMonth: number;
  revenueLastMonth: number;
  activeCount: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  pausedCount: number;
  dueThisWeek: number;
  totalStores: number;
};

const CADENCIA: Record<string, string> = {
  MONTHLY: "mes",
  BIWEEKLY: "quincena",
  WEEKLY: "semana",
};

// Lo que se ve en el selector del formulario de plan <-> lo que guarda la
// base. En dos mapas y no en un ternario para que agregar otra frecuencia
// sea una linea y no haya que tocar tres sitios.
const CICLO_LABEL: Record<string, string> = {
  MONTHLY: "Mensual",
  BIWEEKLY: "Quincenal",
  WEEKLY: "Semanal",
};

const CICLO_DESDE_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(CICLO_LABEL).map(([codigo, label]) => [label, codigo]),
);

const ESTADO_LABEL: Record<StoreBoost["status"], string> = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  OVERDUE: "Vencido",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

const ESTADO_PILL: Record<StoreBoost["status"], string> = {
  ACTIVE: styles.pillActive,
  PENDING: styles.pillPending,
  OVERDUE: styles.pillOverdue,
  PAUSED: styles.pillPaused,
  CANCELLED: styles.pillCancelled,
};

const BANNER_LABEL: Record<BannerStatus, string> = {
  PENDING: "Banner por aprobar",
  APPROVED: "Banner aprobado",
  REJECTED: "Banner rechazado",
};

const BANNER_PILL: Record<BannerStatus, string> = {
  PENDING: styles.pillPending,
  APPROVED: styles.pillActive,
  REJECTED: styles.pillOverdue,
};

// Tono suave por estado para los tabs del filtro.
const CHIP_TONO: Record<string, string> = {
  TODOS: styles.chipAll,
  ACTIVE: styles.chipToneActive,
  PENDING: styles.chipTonePending,
  OVERDUE: styles.chipToneOverdue,
  PAUSED: styles.chipTonePaused,
};

const dinero = (valor: number | string) =>
  `RD$${Number(valor).toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;

const iniciales = (nombre: string) => {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

const formatFecha = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-DO") : "—";

const diasHasta = (iso: string | null): number | null => {
  if (!iso) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(iso + "T00:00:00");
  return Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
};

const formatVencimiento = (iso: string | null) => {
  if (!iso) return { label: "—", className: styles.dueOk };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(iso + "T00:00:00");
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);

  if (dias < 0) {
    const abs = Math.abs(dias);
    return {
      label: `venció hace ${abs} día${abs === 1 ? "" : "s"}`,
      className: styles.dueLate,
    };
  }
  if (dias === 0) return { label: "hoy", className: styles.dueSoon };
  if (dias === 1) return { label: "mañana", className: styles.dueSoon };
  if (dias <= 7)
    return { label: `en ${dias} días`, className: styles.dueSoon };
  return { label: `en ${dias} días`, className: styles.dueOk };
};

// Lo que le queda de plan. Si esta pausado el reloj esta detenido: vale lo
// que quedaba el dia de la pausa, no la fecha de cobro que quedo vieja.
const diasRestantes = (boost: StoreBoost): number | null =>
  boost.status === "PAUSED"
    ? (boost.days_left_on_pause ?? null)
    : diasHasta(boost.next_billing_date);

const enDias = (dias: number) => `${dias} día${dias === 1 ? "" : "s"}`;

// A que fecha se correria el proximo cobro si se reanuda hoy.
const fechaAlReanudar = (dias: number) => {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toLocaleDateString("es-DO");
};

export default function PromocionesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;
  const puedeVer = esSuperAdmin || tieneRolGerencial(user);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/core/login");
      return;
    }

    if (!puedeVer) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, puedeVer, router]);

  if (authLoading || !user || !puedeVer) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <Skeleton width={220} height={22} style={{ marginBottom: 8 }} />
                <Skeleton width={320} height={13} />
              </div>
            </div>
          </div>
          <SkeletonStatCards count={4} />
        </div>
      </AdminLayout>
    );
  }

  return esSuperAdmin ? <SuperAdminBoostsView /> : <MyBusinessBoostsView user={user} />;
}

// ---------- Vista de super admin: gestiona toda la plataforma ----------

function SuperAdminBoostsView() {
  const { stores } = useActiveStore();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [boosts, setBoosts] = useState<StoreBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"plans" | "boosts">("plans");
  const [filtro, setFiltro] = useState<"TODOS" | StoreBoost["status"]>("TODOS");
  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BoostPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<BoostPlan | null>(null);
  const [borrandoPlan, setBorrandoPlan] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailBoost, setDetailBoost] = useState<StoreBoost | null>(null);

  const cargarTodo = useCallback(async () => {
    try {
      const [resSummary, resPlans, resBoosts] = await Promise.all([
        fetch(`${API}/boosts/summary`, { credentials: "include" }),
        fetch(`${API}/boosts/plans`, { credentials: "include" }),
        fetch(`${API}/boosts`, { credentials: "include" }),
      ]);

      setSummary(await resSummary.json());
      setPlans(await resPlans.json());
      setBoosts(await resBoosts.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  // Pausar congela lo que queda del ciclo y reanudar lo retoma desde hoy:
  // el negocio no gana ni pierde dias por haber estado en pausa. Los dias
  // van calculados en el body para no depender de cuando corrio el cron.
  const cambiarEstadoBoost = async (
    boost: StoreBoost,
    status: StoreBoost["status"],
  ) => {
    const congelados = boost.days_left_on_pause ?? null;
    const reanuda = status === "ACTIVE" && congelados !== null;

    const body: Record<string, unknown> = { status };

    if (status === "PAUSED") {
      body.remainingDays = Math.max(diasHasta(boost.next_billing_date) ?? 0, 0);
    }

    if (reanuda) {
      body.resume = true;
      body.remainingDays = congelados;
    }

    setActingId(boost.id);
    try {
      const res = await fetch(`${API}/boosts/${boost.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("No se pudo actualizar la suscripción");

      setToast({
        message:
          status === "ACTIVE"
            ? reanuda
              ? `Reanudada — le quedan ${enDias(congelados!)} (cobra el ${fechaAlReanudar(congelados!)})`
              : "Pago registrado"
            : status === "PAUSED"
              ? `Pausada — se congelan ${enDias(Number(body.remainingDays))}`
              : "Suscripción cancelada",
        type: status === "CANCELLED" ? "danger" : "success",
      });

      await cargarTodo();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setActingId(null);
    }
  };

  // Aprobar o rechazar el arte que subio el negocio.
  const decidirBanner = async (
    boost: StoreBoost,
    bannerStatus: BannerStatus,
    reason?: string,
  ) => {
    setActingId(boost.id);
    try {
      const res = await fetch(`${API}/boosts/${boost.id}/banner`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bannerStatus, reason }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar el banner");

      setToast({
        message:
          bannerStatus === "APPROVED"
            ? "Banner aprobado, ya puede salir en la app"
            : "Banner rechazado, el negocio verá el motivo",
        type: bannerStatus === "APPROVED" ? "success" : "danger",
      });

      setDetailBoost(null);
      await cargarTodo();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setActingId(null);
    }
  };

  const togglePlanActivo = async (plan: BoostPlan) => {
    try {
      const res = await fetch(`${API}/boosts/plans/${plan.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.is_active }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar el plan");

      setToast({
        message: plan.is_active ? "Plan desactivado" : "Plan activado",
        type: "success",
      });
      await cargarTodo();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  const borrarPlan = async () => {
    if (!deletingPlan) return;

    setBorrandoPlan(true);
    try {
      const res = await fetch(`${API}/boosts/plans/${deletingPlan.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo eliminar el plan");
      }

      setToast({ message: "Plan eliminado", type: "success" });
      setDeletingPlan(null);
      await cargarTodo();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar el plan",
        type: "danger",
      });
    } finally {
      setBorrandoPlan(false);
    }
  };

  const conteosPorEstado = useMemo(() => {
    const base: Record<string, number> = {
      TODOS: boosts.length,
      ACTIVE: 0,
      PENDING: 0,
      OVERDUE: 0,
      PAUSED: 0,
      CANCELLED: 0,
    };
    boosts.forEach((b) => {
      base[b.status] = (base[b.status] ?? 0) + 1;
    });
    return base;
  }, [boosts]);

  const boostsFiltrados =
    filtro === "TODOS" ? boosts : boosts.filter((b) => b.status === filtro);

  const suscriptoresPorPlan = useMemo(() => {
    const map: Record<string, number> = {};
    boosts.forEach((b) => {
      if (b.status === "ACTIVE") map[b.plan_id] = (map[b.plan_id] ?? 0) + 1;
    });
    return map;
  }, [boosts]);

  if (loading || !summary) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <Skeleton width={220} height={22} style={{ marginBottom: 8 }} />
                <Skeleton width={320} height={13} />
              </div>
            </div>
          </div>
          <SkeletonStatCards count={4} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Negocios Destacados</h1>
              <p>
                Los negocios pagan para aparecer destacados en la app de
                clientes. Aquí administras los planes y el estado de cobro de
                cada suscripción.
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.btnGhost}
                onClick={() => {
                  setEditingPlan(null);
                  setPlanModalOpen(true);
                }}
              >
                + Nuevo plan
              </button>
              <button
                className={styles.btnSolid}
                onClick={() => setAssignModalOpen(true)}
              >
                + Asignar negocio
              </button>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconOrange}`}>
              <FontAwesomeIcon icon={faCoins} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>
                {dinero(summary.revenueThisMonth)}
              </div>
              <div className={styles.statLabel}>Ingresos este mes</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconGreen}`}>
              <FontAwesomeIcon icon={faStar} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>{summary.activeCount}</div>
              <div className={styles.statLabel}>
                Negocios destacados activos
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconAmber}`}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>
                {dinero(summary.pendingAmount)}
              </div>
              <div className={styles.statLabel}>
                Pagos pendientes ({summary.pendingCount})
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.iconRed}`}>
              <FontAwesomeIcon icon={faCalendarDays} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statValue}>{summary.dueThisWeek}</div>
              <div className={styles.statLabel}>Vencen esta semana</div>
              {summary.overdueCount > 0 && (
                <div className={styles.statHint}>
                  {summary.overdueCount} ya vencidos
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab("plans")}
            className={`${styles.tab} ${
              activeTab === "plans" ? styles.tabActive : ""
            }`}
          >
            Planes de promoción
            <span className={styles.tabIndicator} />
          </button>
          <button
            onClick={() => setActiveTab("boosts")}
            className={`${styles.tab} ${
              activeTab === "boosts" ? styles.tabActive : ""
            }`}
          >
            Negocios con promoción
            <span className={styles.tabIndicator} />
          </button>
        </div>

        {activeTab === "plans" && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2>Planes de promoción</h2>
              <p>Lo que un negocio compra para ganar visibilidad.</p>
            </div>
          </div>

          <div className={styles.plansGrid}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`${styles.planCard} ${
                  plan.is_highlighted ? styles.planFeatured : ""
                } ${!plan.is_active ? styles.planCardInactive : ""}`}
              >
                <div className={styles.planTopRow}>
                  <span className={styles.planName}>{plan.name}</span>
                  <div className={styles.planIconBtns}>
                    <button
                      className={styles.planIconBtn}
                      title="Editar plan"
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanModalOpen(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      className={styles.planIconBtn}
                      title={plan.is_active ? "Desactivar plan" : "Activar plan"}
                      onClick={() => togglePlanActivo(plan)}
                    >
                      <FontAwesomeIcon icon={faPowerOff} />
                    </button>
                    <button
                      className={styles.planIconBtn}
                      title="Eliminar plan"
                      onClick={() => setDeletingPlan(plan)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>
                    {dinero(plan.price)}
                  </span>
                  <span className={styles.planCadence}>
                    / {CADENCIA[plan.billing_cycle]}
                  </span>
                </div>

                <ul className={styles.planFeatures}>
                  {plan.features.map((f, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faCircleCheck} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className={styles.planFoot}>
                  <span>{plan.is_active ? "Vigentes" : "Desactivado"}</span>
                  <span className="count">
                    {suscriptoresPorPlan[plan.id] ?? 0}
                  </span>
                </div>
              </div>
            ))}

            <div
              className={styles.addPlanCard}
              onClick={() => {
                setEditingPlan(null);
                setPlanModalOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
              Nuevo plan
            </div>
          </div>
        </div>
        )}

        {activeTab === "boosts" && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2>Negocios con promoción</h2>
              <p>Estado de cobro de cada suscripción.</p>
            </div>
            <div className={styles.filters}>
              {(
                [
                  ["TODOS", "Todos"],
                  ["ACTIVE", "Activos"],
                  ["PENDING", "Pendientes"],
                  ["OVERDUE", "Vencidos"],
                  ["PAUSED", "Pausados"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={`${styles.chip} ${CHIP_TONO[key]} ${
                    filtro === key ? styles.chipActive : ""
                  }`}
                  onClick={() => setFiltro(key)}
                >
                  <span className={styles.chipLabel}>{label}</span>
                  <span className={styles.chipCount}>
                    {conteosPorEstado[key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableContainer}>
            {boostsFiltrados.length === 0 ? (
              <div className={styles.emptyState}>
                Ningún negocio con este estado todavía.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Negocio</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Monto</th>
                    <th>Próx. cobro</th>
                    <th>Vence</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {boostsFiltrados.map((boost) => {
                    const vencimiento = formatVencimiento(
                      boost.next_billing_date,
                    );
                    const pausado = boost.status === "PAUSED";
                    const restantes = diasRestantes(boost);
                    return (
                      <tr
                        key={boost.id}
                        className={
                          boost.status === "OVERDUE" ? styles.rowOverdue : ""
                        }
                      >
                        <td>
                          <div className={styles.bizCell}>
                            <span className={styles.avatar}>
                              {iniciales(boost.store_name)}
                            </span>
                            <div>
                              <div className={styles.bizName}>
                                {boost.store_name}
                              </div>
                              <div className={styles.bizCat}>
                                {boost.store_category || "Sin categoría"}
                              </div>
                              {boost.banner_status && (
                                <span
                                  className={`${styles.bannerBadge} ${
                                    BANNER_PILL[boost.banner_status]
                                  }`}
                                >
                                  <FontAwesomeIcon icon={faImage} />
                                  {BANNER_LABEL[boost.banner_status]}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{boost.plan_name}</td>
                        <td>
                          <span
                            className={`${styles.pill} ${
                              ESTADO_PILL[boost.status]
                            }`}
                          >
                            {ESTADO_LABEL[boost.status]}
                          </span>
                        </td>
                        <td className={styles.montoCell}>{dinero(boost.amount)}</td>
                        <td className={styles.fechaCell}>
                          {pausado ? "En pausa" : formatFecha(boost.next_billing_date)}
                        </td>
                        <td
                          className={`${styles.due} ${
                            pausado ? styles.dueOk : vencimiento.className
                          }`}
                        >
                          {pausado
                            ? restantes === null
                              ? "sin datos"
                              : `quedan ${enDias(restantes)}`
                            : vencimiento.label}
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.rowIconBtn} ${
                                boost.banner_status === "PENDING"
                                  ? styles.rowIconBtnAlert
                                  : ""
                              }`}
                              title="Ver detalles y banner"
                              onClick={() => setDetailBoost(boost)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>

                            {boost.status === "CANCELLED" ? (
                              <span style={{ color: "#c4c4c4" }}>—</span>
                            ) : (
                              <>
                                {boost.status !== "ACTIVE" && (
                                  <button
                                    className={`${styles.rowBtn} ${styles.rowBtnPrimary}`}
                                    disabled={actingId === boost.id}
                                    onClick={() =>
                                      cambiarEstadoBoost(boost, "ACTIVE")
                                    }
                                    title={
                                      pausado && restantes !== null
                                        ? `Retoma con ${enDias(restantes)}, cobra el ${fechaAlReanudar(restantes)}`
                                        : undefined
                                    }
                                  >
                                    {pausado ? "Reanudar" : "Marcar pagado"}
                                  </button>
                                )}
                                {boost.status === "ACTIVE" && (
                                  <button
                                    className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
                                    disabled={actingId === boost.id}
                                    onClick={() =>
                                      cambiarEstadoBoost(boost, "PAUSED")
                                    }
                                    title={
                                      restantes !== null
                                        ? `Se congelan ${enDias(restantes)}`
                                        : undefined
                                    }
                                  >
                                    Pausar
                                  </button>
                                )}
                                <button
                                  className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
                                  disabled={actingId === boost.id}
                                  onClick={() =>
                                    cambiarEstadoBoost(boost, "CANCELLED")
                                  }
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}
      </div>

      <PlanFormModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        plan={editingPlan}
        onSaved={async () => {
          setPlanModalOpen(false);
          await cargarTodo();
        }}
      />

      <Modal
        isOpen={deletingPlan !== null}
        onClose={() => setDeletingPlan(null)}
        title="Eliminar plan"
        width="420px"
      >
        <p>
          ¿Eliminar el plan <strong>{deletingPlan?.name}</strong>? Esta acción
          no se puede deshacer.
        </p>
        <div className={styles.bannerActions}>
          <button
            type="button"
            className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
            onClick={() => setDeletingPlan(null)}
            disabled={borrandoPlan}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
            onClick={borrarPlan}
            disabled={borrandoPlan}
          >
            {borrandoPlan ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </Modal>

      <BoostDetailModal
        boost={detailBoost}
        onClose={() => setDetailBoost(null)}
        onDecidirBanner={decidirBanner}
        working={actingId !== null}
      />

      <AssignBoostModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        plans={plans.filter((p) => p.is_active)}
        stores={stores}
        onSaved={async () => {
          setAssignModalOpen(false);
          await cargarTodo();
        }}
      />

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

// ---------- Modal: ficha completa de una suscripcion + visto bueno del banner ----------

function BoostDetailModal({
  boost,
  onClose,
  onDecidirBanner,
  working,
}: {
  boost: StoreBoost | null;
  onClose: () => void;
  onDecidirBanner: (
    boost: StoreBoost,
    status: BannerStatus,
    reason?: string,
  ) => void;
  working: boolean;
}) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    setRechazando(false);
    setMotivo("");
  }, [boost]);

  if (!boost) return null;

  const restantes = diasRestantes(boost);
  const bannerStatus = boost.banner_status ?? null;

  const datos: [string, string][] = [
    ["Plan", boost.plan_name],
    ["Estado", ESTADO_LABEL[boost.status]],
    ["Monto", `${dinero(boost.amount)} / ${CADENCIA[boost.billing_cycle]}`],
    ["Inicio", formatFecha(boost.started_at.slice(0, 10))],
    [
      "Próximo cobro",
      boost.status === "PAUSED"
        ? "En pausa"
        : formatFecha(boost.next_billing_date),
    ],
    [
      "Tiempo restante",
      restantes === null ? "—" : enDias(Math.max(restantes, 0)),
    ],
  ];

  if (boost.status === "PAUSED") {
    datos.push([
      "Pausado desde",
      boost.paused_at ? formatFecha(boost.paused_at.slice(0, 10)) : "—",
    ]);
    if (restantes !== null) {
      datos.push(["Si reanudas hoy", `cobra el ${fechaAlReanudar(restantes)}`]);
    }
  }

  return (
    <Modal
      isOpen={!!boost}
      onClose={onClose}
      title={`${boost.store_name} — ${boost.store_category || "Sin categoría"}`}
      width="620px"
    >
      <div className={styles.form}>
        <div className={styles.detailGrid}>
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className={styles.detailItem}>
              <span className={styles.detailLabel}>{etiqueta}</span>
              <span className={styles.detailValue}>{valor}</span>
            </div>
          ))}
        </div>

        <div>
          <div className={styles.bannerHead}>
            <label className={styles.label}>Banner que quiere publicar</label>
            {bannerStatus && (
              <span className={`${styles.pill} ${BANNER_PILL[bannerStatus]}`}>
                {BANNER_LABEL[bannerStatus]}
              </span>
            )}
          </div>

          {boost.banner_url ? (
            <img
              src={boost.banner_url}
              alt={`Banner de ${boost.store_name}`}
              className={styles.bannerImg}
            />
          ) : (
            <div className={styles.bannerEmpty}>
              <FontAwesomeIcon icon={faImage} />
              El negocio todavía no subió su imagen.
            </div>
          )}

          {boost.banner_note && (
            <p className={styles.bannerNote}>{boost.banner_note}</p>
          )}

          {boost.banner_submitted_at && (
            <span className={styles.fieldHint}>
              Enviado el {formatFecha(boost.banner_submitted_at.slice(0, 10))}
            </span>
          )}

          {bannerStatus === "REJECTED" && boost.banner_reject_reason && (
            <p className={styles.bannerReject}>
              Motivo del rechazo: {boost.banner_reject_reason}
            </p>
          )}
        </div>

        {boost.banner_url && bannerStatus !== "APPROVED" && (
          <>
            {rechazando ? (
              <div>
                <label className={styles.label}>Motivo del rechazo</label>
                <textarea
                  className={styles.textArea}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="La imagen se ve pixelada, súbela en mejor calidad."
                />
                <div className={styles.bannerActions}>
                  <button
                    className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
                    onClick={() => setRechazando(false)}
                  >
                    Volver
                  </button>
                  <button
                    className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                    disabled={working || !motivo.trim()}
                    onClick={() =>
                      onDecidirBanner(boost, "REJECTED", motivo.trim())
                    }
                  >
                    Confirmar rechazo
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.bannerActions}>
                <button
                  className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
                  disabled={working}
                  onClick={() => setRechazando(true)}
                >
                  <FontAwesomeIcon icon={faXmark} /> Rechazar
                </button>
                <button
                  className={styles.submitBtn}
                  style={{ width: "auto" }}
                  disabled={working}
                  onClick={() => onDecidirBanner(boost, "APPROVED")}
                >
                  <FontAwesomeIcon icon={faCheck} /> Aprobar banner
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------- Subir la imagen del banner (la usa el negocio) ----------

function BannerPicker({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (url: string) => void;
  onError: (mensaje: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);

  const subir = async (file: File) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onChange(data.url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div>
      <label className={styles.label}>Imagen del banner</label>

      <label className={styles.uploadBox}>
        {value ? (
          <img src={value} alt="Banner" className={styles.uploadPreview} />
        ) : (
          <span className={styles.uploadHint}>
            <FontAwesomeIcon icon={faImage} />
            {subiendo ? "Subiendo..." : "Toca aquí para subir tu imagen"}
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={subiendo}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) subir(file);
            e.target.value = "";
          }}
        />
      </label>

      <span className={styles.fieldHint}>
        Horizontal, ideal 1200x600. JPG, PNG o WEBP hasta 5 MB. Deliflex la
        revisa antes de publicarla.
      </span>
    </div>
  );
}

// ---------- Modal: el negocio sube o cambia su banner ----------

function BannerModal({
  boost,
  onClose,
  onSaved,
}: {
  boost: StoreBoost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!boost) return;
    setUrl(boost.banner_url ?? "");
    setNota(boost.banner_note ?? "");
    setError("");
  }, [boost]);

  const guardar = async () => {
    if (!boost) return;

    if (!url) {
      setError("Sube la imagen que quieres que se muestre");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API}/boosts/mine/${boost.id}/banner`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerUrl: url,
          bannerNote: nota.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "No se pudo guardar");

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!boost}
      onClose={onClose}
      title={`Banner de ${boost?.store_name ?? ""}`}
      width="520px"
    >
      <div className={styles.form}>
        <BannerPicker value={url} onChange={setUrl} onError={setError} />

        <div>
          <label className={styles.label}>Nota para Deliflex (opcional)</label>
          <textarea
            className={styles.textArea}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Es la promo del Día de las Madres, va del 20 al 30 de mayo."
          />
        </div>

        <span className={styles.fieldHint}>
          Al enviarla queda como Por aprobar. Sale en la app cuando Deliflex la
          apruebe.
        </span>

        {error && (
          <span style={{ color: "#e53935", fontSize: 12.5 }}>{error}</span>
        )}

        <button className={styles.submitBtn} onClick={guardar} disabled={saving}>
          {saving ? "Enviando..." : "Enviar para aprobación"}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Modal: crear/editar plan ----------

function PlanFormModal({
  isOpen,
  onClose,
  plan,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  plan: BoostPlan | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("Mensual");
  const [features, setFeatures] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (plan) {
      setName(plan.name);
      setPrice(String(plan.price));
      setBillingCycle(CICLO_LABEL[plan.billing_cycle] ?? "Mensual");
      setFeatures(plan.features.join("\n"));
      setIsHighlighted(plan.is_highlighted);
    } else {
      setName("");
      setPrice("");
      setBillingCycle("Mensual");
      setFeatures("");
      setIsHighlighted(false);
    }
    setError("");
  }, [isOpen, plan]);

  const guardar = async () => {
    if (!name.trim() || !price) {
      setError("Nombre y precio son requeridos");
      return;
    }

    setSaving(true);
    setError("");

    const body = {
      name: name.trim(),
      price: Number(price),
      billingCycle: CICLO_DESDE_LABEL[billingCycle] ?? "MONTHLY",
      features: features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      isHighlighted,
    };

    try {
      const res = await fetch(
        plan
          ? `${API}/boosts/plans/${plan.id}`
          : `${API}/boosts/plans`,
        {
          method: plan ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) throw new Error("No se pudo guardar el plan");

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? "Editar plan" : "Nuevo plan"}
      width="480px"
    >
      <div className={styles.form}>
        <DFInput
          label="Nombre del plan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Destacado Premium"
        />

        <div className={styles.formRow}>
          <DFInput
            label="Precio (RD$)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3500"
          />
          <div>
            <label className={styles.label}>Frecuencia de cobro</label>
            <Dropdown
              options={Object.values(CICLO_LABEL)}
              value={billingCycle}
              onChange={setBillingCycle}
              fullWidth
            />
          </div>
        </div>

        <div>
          <label className={styles.label}>Beneficios (uno por línea)</label>
          <textarea
            className={styles.textArea}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder={
              "Insignia \"Destacado\" en su categoría\nPrioridad en resultados de búsqueda"
            }
          />
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isHighlighted}
            onChange={(e) => setIsHighlighted(e.target.checked)}
          />
          Marcar como "Más elegido"
        </label>

        {error && (
          <span style={{ color: "#e53935", fontSize: 12.5 }}>{error}</span>
        )}

        <button
          className={styles.submitBtn}
          onClick={guardar}
          disabled={saving}
        >
          {saving ? "Guardando..." : plan ? "Guardar cambios" : "Crear plan"}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Modal: asignar un plan a un negocio ----------

function AssignBoostModal({
  isOpen,
  onClose,
  plans,
  stores,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  plans: BoostPlan[];
  stores: { id: string; name: string; category: string | null }[];
  onSaved: () => void;
}) {
  const [storeLabel, setStoreLabel] = useState("");
  const [planLabel, setPlanLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setStoreLabel("");
    setPlanLabel("");
    setAmount("");
    setError("");
  }, [isOpen]);

  const etiquetaNegocio = (s: (typeof stores)[number]) =>
    `${s.name} — ${s.category || "Sin categoría"}`;

  const etiquetaPlan = (p: BoostPlan) =>
    `${p.name} — RD$${Number(p.price).toLocaleString("es-DO")}/${CADENCIA[p.billing_cycle]}`;

  const storeOptions = stores.map(etiquetaNegocio);
  const planOptions = plans.map(etiquetaPlan);

  const guardar = async () => {
    const store = stores.find((s) => etiquetaNegocio(s) === storeLabel);
    const plan = plans.find((p) => etiquetaPlan(p) === planLabel);

    if (!store || !plan) {
      setError("Elige un negocio y un plan");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API}/boosts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          planId: plan.id,
          amount: amount ? Number(amount) : undefined,
        }),
      });

      if (!res.ok) throw new Error("No se pudo asignar el plan");

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo asignar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar negocio a un plan" width="480px">
      <div className={styles.form}>
        <div>
          <label className={styles.label}>Negocio</label>
          <Dropdown
            options={storeOptions}
            value={storeLabel}
            onChange={setStoreLabel}
            placeholder="Selecciona un negocio"
            fullWidth
          />
        </div>

        <div>
          <label className={styles.label}>Plan</label>
          <Dropdown
            options={planOptions}
            value={planLabel}
            onChange={setPlanLabel}
            placeholder="Selecciona un plan"
            fullWidth
          />
        </div>

        <DFInput
          label="Monto (opcional, si es distinto al del plan)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Se usa el precio del plan si se deja vacío"
        />

        <span className={styles.fieldHint}>
          Queda como "Pendiente" hasta que marques el primer pago desde la tabla.
        </span>

        {error && (
          <span style={{ color: "#e53935", fontSize: 12.5 }}>{error}</span>
        )}

        <button className={styles.submitBtn} onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Asignar"}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Vista de dueno / gerente general: solo sus propios negocios ----------
// El pago SIEMPRE lo confirma la plataforma (super admin): aqui solo se
// puede pedir un plan, pausar o cancelar - nunca marcarse "Activo" solo.

function MyBusinessBoostsView({ user }: { user: User }) {
  const { stores } = useActiveStore();

  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [boostsByStore, setBoostsByStore] = useState<Record<string, StoreBoost[]>>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [subscribeStore, setSubscribeStore] = useState<{
    id: string;
    name: string;
    category: string | null;
  } | null>(null);
  const [bannerBoost, setBannerBoost] = useState<StoreBoost | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const misNegocios = useMemo(
    () => stores.filter((s) => (getRoleForStore(user, s.id) ?? 0) >= 80),
    [stores, user],
  );

  const cargarTodo = useCallback(async () => {
    try {
      const resPlans = await fetch(`${API}/boosts/plans`, {
        credentials: "include",
      });
      setPlans(await resPlans.json());

      const entries = await Promise.all(
        misNegocios.map(async (s) => {
          const res = await fetch(`${API}/boosts/mine/${s.id}`, {
            credentials: "include",
          });
          const data = await res.json();
          return [s.id, Array.isArray(data) ? data : []] as const;
        }),
      );
      setBoostsByStore(Object.fromEntries(entries));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misNegocios.map((s) => s.id).join(",")]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const cambiarEstado = async (id: string, status: StoreBoost["status"]) => {
    setActingId(id);
    try {
      const res = await fetch(`${API}/boosts/mine/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "No se pudo actualizar");
      }

      setToast({
        message:
          status === "PENDING"
            ? "Solicitud de reactivación enviada"
            : "Suscripción cancelada",
        type: status === "CANCELLED" ? "danger" : "success",
      });

      await cargarTodo();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <Skeleton width={220} height={22} style={{ marginBottom: 8 }} />
                <Skeleton width={320} height={13} />
              </div>
            </div>
          </div>
          <SkeletonStatCards count={3} />
        </div>
      </AdminLayout>
    );
  }

  const planesActivos = plans.filter((p) => p.is_active);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Negocios Destacados</h1>
              <p>
                Paga para que tu negocio aparezca destacado en la app de
                clientes: insignia, mejor posición en resultados y espacio en
                el home. Elige un plan y espera la confirmación de pago de
                Deliflex.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2>Planes disponibles</h2>
              <p>Lo que ganas al destacar tu negocio.</p>
            </div>
          </div>

          <div className={styles.plansGrid}>
            {planesActivos.map((plan) => (
              <div
                key={plan.id}
                className={`${styles.planCard} ${
                  plan.is_highlighted ? styles.planFeatured : ""
                }`}
              >
                <div className={styles.planTopRow}>
                  <span className={styles.planName}>{plan.name}</span>
                </div>

                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>
                    {dinero(plan.price)}
                  </span>
                  <span className={styles.planCadence}>
                    / {CADENCIA[plan.billing_cycle]}
                  </span>
                </div>

                <ul className={styles.planFeatures}>
                  {plan.features.map((f, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faCircleCheck} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2>Tus negocios</h2>
              <p>Estado de la promoción de cada uno.</p>
            </div>
          </div>

          {misNegocios.length === 0 ? (
            <div className={styles.emptyState}>
              No administras ningún negocio todavía.
            </div>
          ) : (
            <div className={styles.myBizGrid}>
              {misNegocios.map((store) => {
                const actual = (boostsByStore[store.id] ?? [])[0] ?? null;
                const sinPromocion = !actual || actual.status === "CANCELLED";

                return (
                  <div key={store.id} className={styles.myBizCard}>
                    <div className={styles.myBizHead}>
                      <span className={styles.avatar}>
                        {iniciales(store.name)}
                      </span>
                      <div>
                        <div className={styles.bizName}>{store.name}</div>
                        <div className={styles.bizCat}>
                          {store.category || "Sin categoría"}
                        </div>
                      </div>
                    </div>

                    {sinPromocion ? (
                      <>
                        <p className={styles.myBizHint}>
                          Sin promoción activa.
                        </p>
                        <button
                          className={styles.submitBtn}
                          onClick={() =>
                            setSubscribeStore({
                              id: store.id,
                              name: store.name,
                              category: store.category,
                            })
                          }
                        >
                          Suscribirme a un plan
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={styles.myBizStatusRow}>
                          <span
                            className={`${styles.pill} ${ESTADO_PILL[actual.status]}`}
                          >
                            {ESTADO_LABEL[actual.status]}
                          </span>
                          <span className={styles.myBizPlan}>
                            {actual.plan_name}
                          </span>
                        </div>

                        <div className={styles.myBizMeta}>
                          {dinero(actual.amount)} / {CADENCIA[actual.billing_cycle]}
                          {actual.status === "PAUSED"
                            ? " · en pausa"
                            : actual.next_billing_date
                              ? ` · próx. cobro ${formatFecha(actual.next_billing_date)}`
                              : ""}
                        </div>

                        <div className={styles.myBizBanner}>
                          {actual.banner_url ? (
                            <img
                              src={actual.banner_url}
                              alt={`Banner de ${store.name}`}
                              className={styles.myBizBannerImg}
                            />
                          ) : (
                            <div className={styles.bannerEmpty}>
                              <FontAwesomeIcon icon={faImage} />
                              Todavía no subiste el banner que quieres mostrar.
                            </div>
                          )}

                          <div className={styles.myBizBannerFoot}>
                            {actual.banner_status && (
                              <span
                                className={`${styles.pill} ${BANNER_PILL[actual.banner_status]}`}
                              >
                                {BANNER_LABEL[actual.banner_status]}
                              </span>
                            )}
                            <button
                              className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
                              onClick={() => setBannerBoost(actual)}
                            >
                              <FontAwesomeIcon icon={faImage} />
                              {actual.banner_url
                                ? "Cambiar banner"
                                : "Subir banner"}
                            </button>
                          </div>

                          {actual.banner_status === "REJECTED" &&
                            actual.banner_reject_reason && (
                              <p className={styles.bannerReject}>
                                Deliflex rechazó tu imagen:{" "}
                                {actual.banner_reject_reason}
                              </p>
                            )}
                        </div>

                        {actual.status === "PAUSED" &&
                          diasRestantes(actual) !== null && (
                            <p className={styles.myBizHint}>
                              En pausa con {enDias(diasRestantes(actual)!)}{" "}
                              guardados. Al reactivar sigues con esos mismos
                              días: la pausa no te quita ni te suma tiempo.
                            </p>
                          )}

                        {actual.status === "PENDING" && (
                          <p className={styles.myBizHint}>
                            Esperando que Deliflex confirme tu pago.
                          </p>
                        )}
                        {actual.status === "OVERDUE" && (
                          <p className={styles.myBizHint}>
                            Pago vencido — contacta a Deliflex.
                          </p>
                        )}
                        {actual.status === "ACTIVE" &&
                          (() => {
                            const dias = diasHasta(actual.next_billing_date);
                            return dias !== null && dias <= 3 ? (
                              <p
                                className={styles.myBizHint}
                                style={{ color: "#b8860b" }}
                              >
                                Tu plan se renueva el{" "}
                                {formatFecha(actual.next_billing_date)}.
                                Cancélalo antes de esa fecha si no deseas
                                continuar.
                              </p>
                            ) : (
                              <p className={styles.myBizHint}>
                                Ya confirmado: no se puede pausar. Podrás
                                cancelarlo desde 3 días antes de tu próxima
                                renovación ({formatFecha(actual.next_billing_date)}).
                              </p>
                            );
                          })()}

                        <div
                          className={styles.rowActions}
                          style={{ justifyContent: "flex-start", marginTop: 10 }}
                        >
                          {actual.status === "PAUSED" && (
                            <button
                              className={`${styles.rowBtn} ${styles.rowBtnPrimary}`}
                              disabled={actingId === actual.id}
                              onClick={() => cambiarEstado(actual.id, "PENDING")}
                            >
                              Reactivar
                            </button>
                          )}
                          {(actual.status !== "ACTIVE" ||
                            (diasHasta(actual.next_billing_date) ?? 99) <= 3) && (
                            <button
                              className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
                              disabled={actingId === actual.id}
                              onClick={() =>
                                cambiarEstado(actual.id, "CANCELLED")
                              }
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <SubscribeModal
        store={subscribeStore}
        plans={planesActivos}
        onClose={() => setSubscribeStore(null)}
        onSaved={async () => {
          setSubscribeStore(null);
          await cargarTodo();
        }}
      />

      <BannerModal
        boost={bannerBoost}
        onClose={() => setBannerBoost(null)}
        onSaved={async () => {
          setBannerBoost(null);
          setToast({
            message: "Banner enviado, Deliflex lo revisará",
            type: "success",
          });
          await cargarTodo();
        }}
      />

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

// ---------- Modal: suscribir mi propio negocio a un plan ----------

function SubscribeModal({
  store,
  plans,
  onClose,
  onSaved,
}: {
  store: { id: string; name: string; category: string | null } | null;
  plans: BoostPlan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [planLabel, setPlanLabel] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerNote, setBannerNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!store) return;
    setPlanLabel("");
    setBannerUrl("");
    setBannerNote("");
    setError("");
  }, [store]);

  const etiquetaPlan = (p: BoostPlan) =>
    `${p.name} — RD$${Number(p.price).toLocaleString("es-DO")}/${CADENCIA[p.billing_cycle]}`;

  const guardar = async () => {
    if (!store) return;
    const plan = plans.find((p) => etiquetaPlan(p) === planLabel);

    if (!plan) {
      setError("Elige un plan");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API}/boosts/mine/${store.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          bannerUrl: bannerUrl || undefined,
          bannerNote: bannerNote.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "No se pudo enviar la solicitud");
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!store}
      onClose={onClose}
      title={`Suscribir a ${store?.name ?? ""}`}
      width="420px"
    >
      <div className={styles.form}>
        <div>
          <label className={styles.label}>Plan</label>
          <Dropdown
            options={plans.map(etiquetaPlan)}
            value={planLabel}
            onChange={setPlanLabel}
            placeholder="Selecciona un plan"
            fullWidth
          />
        </div>

        <BannerPicker
          value={bannerUrl}
          onChange={setBannerUrl}
          onError={setError}
        />

        <div>
          <label className={styles.label}>Nota para Deliflex (opcional)</label>
          <textarea
            className={styles.textArea}
            value={bannerNote}
            onChange={(e) => setBannerNote(e.target.value)}
            placeholder="Es la promo del Día de las Madres, va del 20 al 30 de mayo."
          />
        </div>

        <span className={styles.fieldHint}>
          Queda como "Pendiente" hasta que Deliflex confirme tu pago. Puedes
          subir el banner ahora o después desde la tarjeta de tu negocio.
        </span>

        {error && (
          <span style={{ color: "#e53935", fontSize: 12.5 }}>{error}</span>
        )}

        <button className={styles.submitBtn} onClick={guardar} disabled={saving}>
          {saving ? "Enviando..." : "Suscribirme"}
        </button>
      </div>
    </Modal>
  );
}

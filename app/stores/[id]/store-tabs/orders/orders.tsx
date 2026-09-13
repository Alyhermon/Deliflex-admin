"use client";

import styles from "./order.module.css";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DFInput from "@/app/components/components-items/input";
import Dropdown from "@/app/components/components-items/dropdown";
import DatePicker from "@/app/components/components-items/datepicker";
import Toast from "@/app/components/components-items/toast/toast";
import Skeleton, {
  SkeletonStatCards,
  SkeletonCardGrid,
} from "@/app/components/components-items/skeleton/skeleton";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

type Order = {
  id: string;
  order_code: string | null;
  status: string;
  order_type: string;
  total: string;
  subtotal: string;
  delivery_fee: string;
  payment_method: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  items_summary: string | null;
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

type OrderDetail = Order & {
  driver_name: string | null;
  items: OrderItem[];
  coupon_code: string | null;
  coupon_name: string | null;
};

type Summary = {
  pending: number;
  accepted: number;
  preparing: number;
  readyForPickup: number;
  onTheWay: number;
  delivered: number;
  cancelled: number;
};

// Mismo ciclo que reconoce el backend (ORDER_STATUSES, que a su vez refleja
// el CHECK constraint real de la tabla orders). "css" es la clase del badge
// y "cardBg" la del fondo sutil de la tarjeta, mismo tono que el badge.
const ESTADO_META: Record<string, { label: string; css: string; cardBg: string }> = {
  PENDING: { label: "Pendiente", css: "pending", cardBg: "cardPending" },
  ACCEPTED: { label: "Aceptado", css: "accepted", cardBg: "cardAccepted" },
  PREPARING: { label: "En preparación", css: "preparing", cardBg: "cardPreparing" },
  READY_FOR_PICKUP: { label: "Listo para retirar", css: "ready", cardBg: "cardReady" },
  ON_THE_WAY: { label: "En camino", css: "onTheWay", cardBg: "cardOnTheWay" },
  DELIVERED: { label: "Entregado", css: "delivered", cardBg: "cardDelivered" },
  CANCELLED: { label: "Cancelado", css: "cancelled", cardBg: "cardCancelled" },
};

const TIPO_META: Record<string, string> = {
  DELIVERY: "Delivery",
  PICKUP: "Retiro en tienda",
};

const TODOS_ESTADOS = "Todos los estados";
const TODOS_TIPOS = "Todos los tipos";

const ESTADO_FILTROS = [TODOS_ESTADOS, ...Object.values(ESTADO_META).map((m) => m.label)];

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const dinero = (valor: string | number) =>
  `RD$${Number(valor).toLocaleString("es-DO")}`;

export default function OrdersTab({ id }: { id: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>({
    pending: 0,
    accepted: 0,
    preparing: 0,
    readyForPickup: 0,
    onTheWay: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const cargarDatos = useCallback(
    async (reintentar = true) => {
      setLoading(true);

      try {
        const [resOrders, resSummary] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/store/${id}`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/summary/${id}`, { credentials: "include" }),
        ]);

        if (!resOrders.ok || !resSummary.ok) throw new Error("fetch fallido");

        const lista = await resOrders.json();
        const resumen = await resSummary.json();

        setOrders(Array.isArray(lista) ? lista : []);
        setSummary(resumen);
        setLoadError(false);

        setSelectedId((actual) =>
          actual && lista.some((o: Order) => o.id === actual)
            ? actual
            : (lista[0]?.id ?? null),
        );
      } catch (error) {
        console.error(error);

        if (reintentar) {
          setTimeout(() => cargarDatos(false), 1200);
          return;
        }

        setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Al cambiar de pedido seleccionado se limpia el estado del cupon y el
  // detalle anterior. Se ajusta durante el render (no en un efecto) para
  // no disparar un set de estado sincrono dentro del cuerpo del efecto:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId);
    setCouponInput("");
    setCouponError("");
    setDetail(null);
  }

  useEffect(() => {
    if (!selectedId) return;

    let cancelado = false;
    setLoadingDetail(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${selectedId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setDetail(data);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelado) setDetail(null);
      })
      .finally(() => {
        if (!cancelado) setLoadingDetail(false);
      });

    return () => {
      cancelado = true;
    };
  }, [selectedId]);

  const normalize = (text: string) => text.toLowerCase().trim();
  const normalizedSearch = normalize(search);

  const filteredOrders = orders.filter((o) => {
    if (normalizedSearch) {
      const enNombre = normalize(o.customer_name ?? "").includes(normalizedSearch);
      const enCodigo = normalize(o.order_code ?? "").includes(normalizedSearch);
      if (!enNombre && !enCodigo) return false;
    }

    if (statusFilter && ESTADO_META[o.status]?.label !== statusFilter) {
      return false;
    }

    if (typeFilter && (TIPO_META[o.order_type] ?? o.order_type) !== typeFilter) {
      return false;
    }

    const fechaPedido = o.created_at.slice(0, 10);
    if (startDate && fechaPedido < startDate) return false;
    if (endDate && fechaPedido > endDate) return false;

    return true;
  });

  // Solo se ofrecen los tipos que de verdad existen en este negocio, para
  // no mostrar un filtro que nunca va a devolver nada.
  const tiposFiltros = [
    TODOS_TIPOS,
    ...Array.from(new Set(orders.map((o) => TIPO_META[o.order_type] ?? o.order_type))),
  ];

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!detail) return;

    setUpdating(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${detail.id}/status`,
        {
          credentials: "include",
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nuevoEstado }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar el pedido");

      setDetail((prev) => (prev ? { ...prev, status: nuevoEstado } : prev));
      setOrders((prev) =>
        prev.map((o) => (o.id === detail.id ? { ...o, status: nuevoEstado } : o)),
      );
      setToast({
        message: `Pedido marcado como "${ESTADO_META[nuevoEstado]?.label ?? nuevoEstado}"`,
        type: nuevoEstado === "CANCELLED" ? "danger" : "success",
      });

      const resSummary = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/summary/${id}`, { credentials: "include" });
      setSummary(await resSummary.json());
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setUpdating(false);
    }
  };

  const aplicarCupon = async () => {
    if (!detail || !couponInput.trim()) return;

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${detail.id}/coupon`,
        {
          credentials: "include",
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: couponInput }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo aplicar el cupón");
      }

      setDetail((prev) =>
        prev
          ? { ...prev, coupon_code: data.couponCode, coupon_name: data.promotionName }
          : prev,
      );
      setCouponInput("");
      setToast({ message: "Cupón aplicado", type: "success" });
    } catch (error) {
      setCouponError(
        error instanceof Error ? error.message : "No se pudo aplicar el cupón",
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className={styles.ordersPage}>
      {loading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className={styles.topStats}>
          <div className={`${styles.statCard} ${styles.orange}`}>
            <span className={styles.statValue}>{summary.pending}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>

          <div className={`${styles.statCard} ${styles.blue}`}>
            <span className={styles.statValue}>
              {summary.accepted + summary.preparing}
            </span>
            <span className={styles.statLabel}>En preparación</span>
          </div>

          <div className={`${styles.statCard} ${styles.green}`}>
            <span className={styles.statValue}>
              {summary.readyForPickup + summary.onTheWay}
            </span>
            <span className={styles.statLabel}>Listos / en camino</span>
          </div>

          <div className={`${styles.statCard} ${styles.red}`}>
            <span className={styles.statValue}>{summary.cancelled}</span>
            <span className={styles.statLabel}>Cancelados</span>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <DFInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pedido, cliente o teléfono..."
            icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
          />
        </div>

        <div className={styles.rangePicker}>
          <div className={styles.rangeDateWrap}>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Desde" />
          </div>
          <span className={styles.rangeSeparator}>–</span>
          <div className={styles.rangeDateWrap}>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Hasta" />
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              className={styles.rangeClearBtn}
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              aria-label="Quitar filtro de fechas"
              title="Quitar filtro de fechas"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        <Dropdown
          options={ESTADO_FILTROS}
          value={statusFilter || TODOS_ESTADOS}
          onChange={(v) => setStatusFilter(v === TODOS_ESTADOS ? "" : v)}
          placeholder="Estado"
        />

        <Dropdown
          options={tiposFiltros}
          value={typeFilter || TODOS_TIPOS}
          onChange={(v) => setTypeFilter(v === TODOS_TIPOS ? "" : v)}
          placeholder="Tipo"
        />
      </div>

      {loading ? (
        <SkeletonCardGrid count={3} />
      ) : loadError ? (
        <div className={styles.emptyState}>No se pudo cargar los pedidos.</div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          Todavía no hay pedidos para este negocio.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          Ningún pedido coincide con ese filtro.
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.ordersList}>
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                className={`${styles.orderCard} ${
                  styles[ESTADO_META[order.status]?.cardBg ?? "cardCancelled"]
                } ${selectedId === order.id ? styles.selected : ""}`}
                onClick={() => setSelectedId(order.id)}
              >
                <div className={styles.orderHeader}>
                  <h3>{order.order_code ?? order.id.slice(0, 8)}</h3>
                  <strong>{dinero(order.total)}</strong>
                </div>

                <p>{order.customer_name ?? "Cliente sin nombre"}</p>

                <span>{TIPO_META[order.order_type] ?? order.order_type}</span>

                <div className={styles.orderFooter}>
                  <small>{fechaHora(order.created_at)}</small>

                  <span
                    className={`${styles.status} ${
                      styles[ESTADO_META[order.status]?.css ?? "cancelled"]
                    }`}
                  >
                    {ESTADO_META[order.status]?.label ?? order.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div
            className={`${styles.detailsPanel} ${
              detail ? styles[ESTADO_META[detail.status]?.cardBg ?? "cardCancelled"] : ""
            }`}
          >
            {loadingDetail || !detail ? (
              <>
                <div className={styles.detailsHeader}>
                  <div style={{ flex: 1 }}>
                    <Skeleton width="55%" height={20} />
                  </div>
                  <Skeleton width={90} height={28} radius={999} />
                </div>

                <div className={styles.actions}>
                  <Skeleton width={120} height={48} radius={14} />
                  <Skeleton width={170} height={48} radius={14} />
                </div>

                <div className={styles.detailsGrid}>
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <Skeleton width="50%" height={11} style={{ marginBottom: 8 }} />
                      <Skeleton width="80%" height={14} />
                    </div>
                  ))}
                </div>

                <div className={styles.productsSection}>
                  <Skeleton width="30%" height={11} style={{ marginBottom: 16 }} />
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={styles.productRow}>
                      <Skeleton width="60%" height={13} />
                      <Skeleton width="15%" height={13} />
                    </div>
                  ))}
                </div>

                <div className={styles.notesSection}>
                  <Skeleton width="35%" height={11} style={{ marginBottom: 10 }} />
                  <Skeleton width="90%" height={13} />
                </div>

                <div className={styles.paymentTotal}>
                  <div>
                    <Skeleton width="45%" height={11} style={{ marginBottom: 8 }} />
                    <Skeleton width="60%" height={14} />
                  </div>
                  <div className={styles.totalBox}>
                    <Skeleton width={50} height={11} style={{ marginBottom: 8, marginLeft: "auto" }} />
                    <Skeleton width={90} height={28} style={{ marginLeft: "auto" }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.detailsHeader}>
                  <div>
                    <h2>Pedido {detail.order_code ?? detail.id.slice(0, 8)}</h2>
                  </div>

                  <span
                    className={`${styles.status} ${
                      styles[ESTADO_META[detail.status]?.css ?? "cancelled"]
                    }`}
                  >
                    {ESTADO_META[detail.status]?.label ?? detail.status}
                  </span>
                </div>

                <div className={styles.actions}>
                  {detail.status === "PENDING" && (
                    <>
                      <button
                        className={styles.dangerButton}
                        disabled={updating}
                        onClick={() => cambiarEstado("CANCELLED")}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles.warningButton}
                        disabled={updating}
                        onClick={() => cambiarEstado("ACCEPTED")}
                      >
                        Aceptar
                      </button>
                    </>
                  )}

                  {detail.status === "ACCEPTED" && (
                    <>
                      <button
                        className={styles.dangerButton}
                        disabled={updating}
                        onClick={() => cambiarEstado("CANCELLED")}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles.primaryButton}
                        disabled={updating}
                        onClick={() => cambiarEstado("PREPARING")}
                      >
                        Empezar a preparar
                      </button>
                    </>
                  )}

                  {detail.status === "PREPARING" && (
                    <>
                      <button
                        className={styles.dangerButton}
                        disabled={updating}
                        onClick={() => cambiarEstado("CANCELLED")}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles.successButton}
                        disabled={updating}
                        onClick={() => cambiarEstado("READY_FOR_PICKUP")}
                      >
                        Marcar listo
                      </button>
                    </>
                  )}

                  {detail.status === "READY_FOR_PICKUP" && (
                    <button
                      className={styles.primaryButton}
                      disabled={updating}
                      onClick={() => cambiarEstado("ON_THE_WAY")}
                    >
                      Salió en camino
                    </button>
                  )}

                  {detail.status === "ON_THE_WAY" && (
                    <button
                      className={styles.successButton}
                      disabled={updating}
                      onClick={() => cambiarEstado("DELIVERED")}
                    >
                      Marcar entregado
                    </button>
                  )}

                  {(detail.status === "DELIVERED" ||
                    detail.status === "CANCELLED") && (
                    <p className={styles.finishedNote}>
                      Este pedido ya está finalizado.
                    </p>
                  )}
                </div>

                <div className={styles.detailsGrid}>
                  <div>
                    <span className={styles.detailLabel}>Cliente</span>
                    <p>{detail.customer_name ?? "—"}</p>
                    <p>{detail.customer_phone ?? "—"}</p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>Tipo de pedido</span>
                    <p>{TIPO_META[detail.order_type] ?? detail.order_type}</p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>Fecha</span>
                    <p>{fechaHora(detail.created_at)}</p>
                  </div>
                </div>

                <div className={styles.productsSection}>
                  <span className={styles.detailLabel}>Productos</span>

                  {detail.items.length === 0 ? (
                    <div className={styles.productRow}>Sin productos</div>
                  ) : (
                    detail.items.map((item) => (
                      <div key={item.id} className={styles.productRow}>
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>
                            {item.product_name}
                          </span>
                          <span className={styles.productMeta}>
                            {item.quantity} x {dinero(item.unit_price)}
                          </span>
                        </div>

                        <span className={styles.productSubtotal}>
                          {dinero(item.subtotal)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.notesSection}>
                  <span className={styles.detailLabel}>Notas del cliente</span>
                  <p>{detail.notes || "Sin notas"}</p>
                </div>

                <div className={styles.couponSection}>
                  <span className={styles.detailLabel}>Cupón</span>

                  {detail.coupon_code ? (
                    <div className={styles.couponApplied}>
                      <span className={styles.couponAppliedCode}>
                        {detail.coupon_code}
                      </span>
                      <span className={styles.couponAppliedName}>
                        {detail.coupon_name}
                      </span>
                    </div>
                  ) : detail.status === "CANCELLED" ? (
                    <p className={styles.hint}>—</p>
                  ) : (
                    <div className={styles.couponForm}>
                      <input
                        className={couponError ? styles.couponInputError : ""}
                        placeholder="Código que dio el cliente"
                        value={couponInput}
                        maxLength={30}
                        onChange={(e) => {
                          setCouponError("");
                          setCouponInput(
                            e.target.value.toUpperCase().replace(/\s+/g, ""),
                          );
                        }}
                      />
                      <button
                        type="button"
                        disabled={applyingCoupon || !couponInput.trim()}
                        onClick={aplicarCupon}
                      >
                        {applyingCoupon ? "Aplicando..." : "Aplicar"}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <span className={styles.errorText}>{couponError}</span>
                  )}
                </div>

                <div className={styles.paymentTotal}>
                  <div>
                    <span className={styles.detailLabel}>Método de pago</span>
                    <p>{detail.payment_method === "cash" ? "Efectivo" : "Tarjeta"}</p>
                  </div>

                  <div className={styles.totalBox}>
                    <span>Total</span>
                    <strong>{dinero(detail.total)}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

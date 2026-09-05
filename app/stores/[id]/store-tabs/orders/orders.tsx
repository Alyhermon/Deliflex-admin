"use client";

import styles from "./order.module.css";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DFInput from "@/app/components/components-items/input";
import Dropdown from "@/app/components/components-items/dropdown";
import Toast from "@/app/components/components-items/toast/toast";
import {
  SkeletonStatCards,
  SkeletonCardGrid,
} from "@/app/components/components-items/skeleton/skeleton";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

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
// el CHECK constraint real de la tabla orders). "css" es la clase en
// order.module.css para el badge de cada estado.
const ESTADO_META: Record<string, { label: string; css: string }> = {
  PENDING: { label: "Pendiente", css: "pending" },
  ACCEPTED: { label: "Aceptado", css: "accepted" },
  PREPARING: { label: "En preparación", css: "preparing" },
  READY_FOR_PICKUP: { label: "Listo para retirar", css: "ready" },
  ON_THE_WAY: { label: "En camino", css: "onTheWay" },
  DELIVERED: { label: "Entregado", css: "delivered" },
  CANCELLED: { label: "Cancelado", css: "cancelled" },
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
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const cargarDatos = useCallback(
    async (reintentar = true) => {
      setLoading(true);

      try {
        const [resOrders, resSummary] = await Promise.all([
          fetch(`http://localhost:3001/orders/store/${id}`),
          fetch(`http://localhost:3001/orders/summary/${id}`),
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

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);

    fetch(`http://localhost:3001/orders/${selectedId}`)
      .then((res) => res.json())
      .then(setDetail)
      .catch((error) => {
        console.error(error);
        setDetail(null);
      })
      .finally(() => setLoadingDetail(false));
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
        `http://localhost:3001/orders/${detail.id}/status`,
        {
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

      const resSummary = await fetch(`http://localhost:3001/orders/summary/${id}`);
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

          <div className={`${styles.statCard} ${styles.gray}`}>
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
                  selectedId === order.id ? styles.selected : ""
                }`}
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

          <div className={styles.detailsPanel}>
            {loadingDetail || !detail ? (
              <div className={styles.emptyState}>Cargando pedido...</div>
            ) : (
              <>
                <div className={styles.detailsHeader}>
                  <div>
                    <h2>Pedido {detail.order_code ?? detail.id.slice(0, 8)}</h2>
                    <p>{detail.customer_name ?? "Cliente sin nombre"}</p>
                  </div>

                  <span
                    className={`${styles.status} ${
                      styles[ESTADO_META[detail.status]?.css ?? "cancelled"]
                    }`}
                  >
                    {ESTADO_META[detail.status]?.label ?? detail.status}
                  </span>
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
                        <span>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span>{dinero(item.subtotal)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.notesSection}>
                  <span className={styles.detailLabel}>Notas del cliente</span>
                  <p>{detail.notes || "Sin notas"}</p>
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

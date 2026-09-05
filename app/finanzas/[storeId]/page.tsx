"use client";

import { use, useEffect, useState } from "react";
import AdminLayout from "../../components/layout/adminLayout";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import Skeleton, {
  SkeletonStatCards,
  SkeletonTableRows,
} from "../../components/components-items/skeleton/skeleton";
import styles from "./finance.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSackDollar,
  faReceipt,
  faTicket,
  faMoneyBill1Wave,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

type Summary = {
  totalOrders: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalDeliveryFees: number;
  avgTicket: number;
  cash: { total: number; count: number };
  card: { total: number; count: number };
  other: { total: number; count: number };
  ordersByStatus: { status: string; total: number }[];
};

type DailyPoint = {
  date: string;
  orders: number;
  revenue: number;
};

type Order = {
  id: string;
  order_code: string | null;
  total: string;
  subtotal: string;
  delivery_fee: string;
  payment_method: string;
  status: string;
  order_type: string;
  created_at: string;
};

const PERIODOS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

const dinero = (valor: number) =>
  `RD$${valor.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short" });

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const METODO_META: Record<string, { label: string; badge: string }> = {
  cash: { label: "Efectivo", badge: "badgeCash" },
  card: { label: "Tarjeta", badge: "badgeCard" },
};

const ESTADO_META: Record<string, string> = {
  DELIVERED: "badgeDelivered",
  CANCELLED: "badgeCancelled",
};

export default function StoreFinancePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  const [storeName, setStoreName] = useState("Negocio");
  const [days, setDays] = useState(30);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const cargarNombre = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/register-business/edit/${storeId}`,
        );
        const data = await res.json();
        if (data?.store_name) setStoreName(data.store_name);
      } catch (error) {
        console.error(error);
      }
    };

    cargarNombre();
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;

    const cargarDatos = async () => {
      setLoading(true);

      try {
        const [resSummary, resDaily, resOrders] = await Promise.all([
          fetch(`http://localhost:3001/finance/summary/${storeId}?days=${days}`),
          fetch(`http://localhost:3001/finance/daily/${storeId}?days=${days}`),
          fetch(
            `http://localhost:3001/finance/orders/${storeId}?days=${days}&limit=20`,
          ),
        ]);

        setSummary(await resSummary.json());
        setDaily(await resDaily.json());
        const listaOrders = await resOrders.json();
        setOrders(Array.isArray(listaOrders) ? listaOrders : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [storeId, days]);

  const maxRevenue = Math.max(1, ...daily.map((d) => d.revenue));

  const totalPagos =
    (summary?.cash.total ?? 0) + (summary?.card.total ?? 0) + (summary?.other.total ?? 0);

  const pct = (valor: number) => (totalPagos > 0 ? (valor / totalPagos) * 100 : 0);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Finanzas", href: "/finanzas" },
            { label: storeName },
          ]}
        />

        <div className={styles.header}>
          <div>
            <h1>Finanzas</h1>
            <p>Ingresos y pagos de {storeName}.</p>
          </div>

          <div className={styles.periodToggle}>
            {PERIODOS.map((p) => (
              <button
                key={p.days}
                type="button"
                className={`${styles.periodBtn} ${
                  days === p.days ? styles.periodBtnActive : ""
                }`}
                onClick={() => setDays(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading || !summary ? (
          <>
            <SkeletonStatCards count={5} />
            <div className={styles.content}>
              <div className={styles.panel}>
                <Skeleton width="40%" height={14} style={{ marginBottom: 16 }} />
                <Skeleton height={160} radius={10} />
              </div>
              <div className={styles.panel}>
                <Skeleton width="55%" height={14} style={{ marginBottom: 16 }} />
                <Skeleton height={10} radius={999} style={{ marginBottom: 16 }} />
                <Skeleton width="70%" height={13} style={{ marginBottom: 10 }} />
                <Skeleton width="70%" height={13} />
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <div className={styles.tableHead}>
                <Skeleton width={140} height={14} />
              </div>
              <table className={styles.table}>
                <tbody>
                  <SkeletonTableRows rows={5} columns={7} />
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Ingresos totales</div>
                  <div className={styles.statValue}>
                    {dinero(summary.totalRevenue)}
                  </div>
                  <div className={styles.statSub}>últimos {days} días</div>
                </div>
                <span className={`${styles.statIcon} ${styles.iconGreen}`}>
                  <FontAwesomeIcon icon={faSackDollar} />
                </span>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Pedidos</div>
                  <div className={styles.statValue}>{summary.totalOrders}</div>
                  <div className={styles.statSub}>no cancelados</div>
                </div>
                <span className={`${styles.statIcon} ${styles.iconBlue}`}>
                  <FontAwesomeIcon icon={faReceipt} />
                </span>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Ticket promedio</div>
                  <div className={styles.statValue}>
                    {dinero(summary.avgTicket)}
                  </div>
                  <div className={styles.statSub}>por pedido</div>
                </div>
                <span className={`${styles.statIcon} ${styles.iconPurple}`}>
                  <FontAwesomeIcon icon={faTicket} />
                </span>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Efectivo</div>
                  <div className={styles.statValue}>
                    {dinero(summary.cash.total)}
                  </div>
                  <div className={styles.statSub}>{summary.cash.count} pedidos</div>
                </div>
                <span className={`${styles.statIcon} ${styles.iconTeal}`}>
                  <FontAwesomeIcon icon={faMoneyBill1Wave} />
                </span>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Tarjeta</div>
                  <div className={styles.statValue}>
                    {dinero(summary.card.total)}
                  </div>
                  <div className={styles.statSub}>{summary.card.count} pedidos</div>
                </div>
                <span className={`${styles.statIcon} ${styles.iconAmber}`}>
                  <FontAwesomeIcon icon={faCreditCard} />
                </span>
              </div>
            </div>

            <div className={styles.content}>
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Ingresos por día</h3>

                {daily.length === 0 ? (
                  <div className={styles.chartEmpty}>
                    Sin ingresos en este periodo.
                  </div>
                ) : (
                  <div className={styles.chart}>
                    {daily.map((d) => (
                      <div key={d.date} className={styles.chartBarWrap}>
                        <div
                          className={styles.chartBar}
                          style={{
                            height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%`,
                          }}
                          title={`${fechaCorta(d.date)}: ${dinero(d.revenue)}`}
                        />
                        <span className={styles.chartLabel}>
                          {fechaCorta(d.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Métodos de pago</h3>

                <div className={styles.paymentTrack}>
                  <div
                    className={styles.paymentFillCash}
                    style={{ width: `${pct(summary.cash.total)}%` }}
                  />
                  <div
                    className={styles.paymentFillCard}
                    style={{ width: `${pct(summary.card.total)}%` }}
                  />
                  <div
                    className={styles.paymentFillOther}
                    style={{ width: `${pct(summary.other.total)}%` }}
                  />
                </div>

                <div className={styles.paymentRow}>
                  <span>
                    <span
                      className={styles.paymentDot}
                      style={{ background: "#16a34a" }}
                    />
                    Efectivo
                  </span>
                  <span>{dinero(summary.cash.total)}</span>
                </div>
                <div className={styles.paymentRow}>
                  <span>
                    <span
                      className={styles.paymentDot}
                      style={{ background: "#2563eb" }}
                    />
                    Tarjeta
                  </span>
                  <span>{dinero(summary.card.total)}</span>
                </div>
                {summary.other.total > 0 && (
                  <div className={styles.paymentRow}>
                    <span>
                      <span
                        className={styles.paymentDot}
                        style={{ background: "#9ca3af" }}
                      />
                      Otros
                    </span>
                    <span>{dinero(summary.other.total)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <div className={styles.tableHead}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>
                  Pedidos recientes
                </h3>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Fecha</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Subtotal</th>
                    <th>Envío</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyTable}>
                        No hay pedidos en este periodo.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td className={styles.orderCode}>
                          {o.order_code || o.id.slice(0, 8)}
                        </td>
                        <td>{fechaHora(o.created_at)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[
                                METODO_META[o.payment_method]?.badge ??
                                  "badgeOther"
                              ]
                            }`}
                          >
                            {METODO_META[o.payment_method]?.label ??
                              o.payment_method}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[ESTADO_META[o.status] ?? "badgeOther"]
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td>{dinero(Number(o.subtotal))}</td>
                        <td>{dinero(Number(o.delivery_fee))}</td>
                        <td>{dinero(Number(o.total))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

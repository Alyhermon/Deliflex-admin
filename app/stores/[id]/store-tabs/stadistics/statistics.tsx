import styles from "./stadistics.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faDollarSign,
  faChartLine,
  faUsers,
  faBagShopping,
  faClock,
  faMotorcycle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const stats = [
  {
    icon: (<FontAwesomeIcon color="#3d9c2f" icon={faDollarSign} />),
    label: "Ventas totales",
    value: "RD$ 12,500",
    change: "↑ 18.5% vs semana anterior",
    color: "green",
  },
  {
    icon: (<FontAwesomeIcon color="#0f4bf1" icon={faBagShopping} />),
    label: "Pedidos totales",
    value: "48",
    change: "↑ 12.3% vs semana anterior",
    color: "blue",
  },
  {
    icon: (<FontAwesomeIcon color="#8d17ed" icon={faUsers} />),
    label: "Clientes nuevos",
    value: "12",
    change: "↑ 9.1% vs semana anterior",
    color: "purple",
  },
  {
    icon: (<FontAwesomeIcon color="#ed7b17" icon={faChartLine} />),
    label: "Ticket promedio",
    value: "RD$ 430",
    change: "↑ 6.4% vs semana anterior",
    color: "orange",
  },
  {
    icon: (<FontAwesomeIcon color="#edbb17" icon={faStar} />),
    label: "Calificación promedio",
    value: "4.8",
    change: "",
    color: "pink",
    rating: true,
  },
];

const products = [
  {
    name: "Pastel de Chocolate",
    sales: "120 ventas",
    progress: "100%",
  },
  {
    name: "Cheesecake de Fresa",
    sales: "98 ventas",
    progress: "85%",
  },
  {
    name: "Cupcake de Vainilla",
    sales: "72 ventas",
    progress: "70%",
  },
  {
    name: "Tarta de Manzana",
    sales: "56 ventas",
    progress: "55%",
  },
  {
    name: "Brownie con Helado",
    sales: "45 ventas",
    progress: "45%",
  },
];

const peakHours = [
  {
    time: "12:00 PM - 2:00 PM",
    percent: "24%",
  },
  {
    time: "7:00 PM - 9:00 PM",
    percent: "21%",
  },
  {
    time: "1:00 PM - 3:00 PM",
    percent: "15%",
  },
  {
    time: "8:00 PM - 10:00 PM",
    percent: "12%",
  },
];

export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.statsGrid}>
        {stats.map((item, index) => (
          <div className={styles.statCard} key={index}>
            <div
              className={`${styles.icon} ${styles[item.color]}`}
            >
              {item.icon}
            </div>

            <div>
              <p className={styles.label}>{item.label}</p>

              <h2 className={styles.value}>{item.value}</h2>

              <span className={styles.success}>
                {item.change}
              </span>

              {item.rating && (
                <div className={styles.rating}>
                  ⭐⭐⭐⭐⭐ <span>(234)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.middleGrid}>
        {/* CHART */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Ventas por día</h3>

            <select className={styles.select}>
              <option>Ventas (RD$)</option>
            </select>
          </div>

          <div className={styles.chart}>
            <svg width="100%" height="260">
              <polyline
                fill="none"
                stroke="#2f6bff"
                strokeWidth="4"
                points="20,180 100,120 180,150 260,120 340,180 420,150 500,60"
              />

              {[
                [20, 180],
                [100, 120],
                [180, 150],
                [260, 120],
                [340, 180],
                [420, 150],
                [500, 60],
              ].map(([x, y], index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#2f6bff"
                />
              ))}
            </svg>

            <div className={styles.days}>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Productos más vendidos</h3>
            <a href="#">Ver todos</a>
          </div>

          <div className={styles.products}>
            {products.map((product, index) => (
              <div
                className={styles.productItem}
                key={index}
              >
                <div className={styles.productInfo}>
                  <div className={styles.productImage}></div>

                  <div className={styles.productDetails}>
                    <p>{product.name}</p>

                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: product.progress,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <span>{product.sales}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Estado de órdenes</h3>

          <div className={styles.donutWrapper}>
            <div className={styles.donut}>
              <div className={styles.donutCenter}>
                <span>Total</span>

                <h2>480</h2>
              </div>
            </div>

            <div className={styles.legend}>
              <div>
                <span
                  className={`${styles.dot} ${styles.greenDot}`}
                ></span>
                Entregadas
              </div>

              <div>
                <span
                  className={`${styles.dot} ${styles.blueDot}`}
                ></span>
                En camino
              </div>

              <div>
                <span
                  className={`${styles.dot} ${styles.orangeDot}`}
                ></span>
                Pendientes
              </div>

              <div>
                <span
                  className={`${styles.dot} ${styles.redDot}`}
                ></span>
                Canceladas
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <h3>Horas pico</h3>
          <p className={styles.subText}>
            Las horas con más pedidos
          </p>

          <div className={styles.peakHours}>
            {peakHours.map((item, index) => (
              <div
                className={styles.peakItem}
                key={index}
              >
                <span>{item.time}</span>

                <div className={styles.peakBar}>
                  <div
                    className={styles.peakFill}
                    style={{ width: item.percent }}
                  ></div>
                </div>

                <span>{item.percent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT */}
        <div className={styles.card}>
          <h3>Métodos de pago</h3>

          <div className={styles.paymentWrapper}>
            <div className={styles.paymentDonut}></div>

            <div className={styles.legend}>
              <div>
                <span
                  className={`${styles.dot} ${styles.greenDot}`}
                ></span>
                Efectivo
              </div>

              <div>
                <span
                  className={`${styles.dot} ${styles.blueDot}`}
                ></span>
                Tarjeta
              </div>

              <div>
                <span
                  className={`${styles.dot} ${styles.purpleDot}`}
                ></span>
                Billetera digital
              </div>

              <div>
                <span
                  className={`${styles.dot} ${styles.orangeDot}`}
                ></span>
                Otros
              </div>
            </div>
          </div>
        </div>

        {/* DELIVERY */}
        {/**DELIVERY */}
        <div className={styles.card}>
          <h3>Rendimiento de delivery</h3>

          <div className={styles.deliveryGrid}>
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>
                <FontAwesomeIcon color="#ed7b17" icon={faClock} />
              </div>

              <p>Tiempo promedio</p>

              <h2>32 min</h2>

              <span className={styles.success}>
                ↓ 8% vs semana anterior
              </span>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>
                <FontAwesomeIcon color="#b42929" icon={faMotorcycle} />
              </div>

              <p>Entrega a tiempo</p>

              <h2>92%</h2>

              <span className={styles.success}>
                ↑ 5% vs semana anterior
              </span>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>
                <FontAwesomeIcon color="#ed1717" icon={faXmark} />
              </div>

              <p>Tasa de cancelación</p>

              <h2>3.2%</h2>

              <span className={styles.success}>
                ↓ 1% vs semana anterior
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {/*Vengo ahora*/}
      {/*Hoy dia de cheese cake*/}
      <div className={styles.footer}>
        ● Los datos se actualizan cada 30 minutos
      </div>
    </div>
  );
}
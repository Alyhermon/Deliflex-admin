import { CSSProperties } from "react";
import styles from "./skeleton.module.css";

type Props = {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: CSSProperties;
};

// Bloque base: una barra gris con brillo animado. Todo lo demas en este
// archivo son composiciones de este mismo bloque en distintos tamaños.
export default function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  className = "",
  style,
}: Props) {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

// Grid de tarjetas tipo "stat card" (los cuadros de metricas con icono
// a la derecha que ya usan dashboard/inventario/finanzas/usuarios).
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: "1 1 190px",
            minWidth: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            background: "white",
            padding: "18px 20px",
            borderRadius: 14,
            border: "1px solid #f1f1f1",
            boxShadow: "0 2px 10px rgba(20, 20, 20, 0.05)",
          }}
        >
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height={12} style={{ marginBottom: 10 }} />
            <Skeleton width="45%" height={22} style={{ marginBottom: 8 }} />
            <Skeleton width="55%" height={10} />
          </div>
          <Skeleton width={42} height={42} radius={12} />
        </div>
      ))}
    </div>
  );
}

// Grid de tarjetas de negocio/tienda (picker de inventario, finanzas,
// listado de negocios).
export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "white",
            border: "1px solid #f1f1f1",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(20, 20, 20, 0.05)",
          }}
        >
          <Skeleton height={100} radius={0} />
          <div style={{ padding: "14px 16px" }}>
            <Skeleton width="70%" height={15} style={{ marginBottom: 8 }} />
            <Skeleton width="45%" height={11} style={{ marginBottom: 12 }} />
            <Skeleton width="35%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Filas de tabla: mismo numero de columnas que le pases, ancho variado
// para que no se vea como una cuadricula perfecta.
export function SkeletonTableRows({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  const anchos = ["85%", "60%", "70%", "50%", "65%", "40%"];

  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} style={{ padding: "12px 16px" }}>
              <Skeleton width={anchos[(r + c) % anchos.length]} height={13} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

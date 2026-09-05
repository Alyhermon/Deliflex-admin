"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faShop,
  faChartLine,
  faCalculator,
  faChartColumn,
  faGear,
  faUser,
  faCircleUser,
  faBox,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";
import { useAuth, getRoleForStore, tieneAlgunRolDeGestion } from "../../hooks/useAuth";
import Skeleton from "../components-items/skeleton/skeleton";
import styles from "./sidebar.module.css";

interface MenuItem {
  name: string;
  path: string;
  icon?: ReactNode;
}

// Los items que dependen de una tienda (Inventario, Finanzas) apuntan al
// picker por defecto, pero si ya estamos dentro de una tienda puntual
// (storeId en la URL) deben seguir apuntando a ESA misma tienda, no
// mandarte de vuelta al selector.
const buildMenuItems = (storeId: string | null): MenuItem[] => [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FontAwesomeIcon icon={faChartColumn} />,
  },
  {
    name: "Negocios",
    path: "/stores",
    icon: <FontAwesomeIcon icon={faShop} />,
  },
  {
    name: "Menú",
    path: storeId ? `/menu/${storeId}` : "/menu",
    icon: <FontAwesomeIcon icon={faBarcode} />,
  },
  {
    name: "Inventario",
    path: storeId ? `/inventory/${storeId}` : "/inventory",
    icon: <FontAwesomeIcon icon={faBox} />,
  },
  {
    name: "Operaciones",
    path: "/operaciones",
    icon: <FontAwesomeIcon icon={faChartLine} />,
  },
  {
    name: "Finanzas",
    path: storeId ? `/finanzas/${storeId}` : "/finanzas",
    icon: <FontAwesomeIcon icon={faCalculator} />,
  },
  {
    name: "Usuarios y Roles",
    path: "/users-rols",
    icon: <FontAwesomeIcon icon={faUser} />,
  },
  {
    name: "Configuraciones",
    path: "/configuracion",
    icon: <FontAwesomeIcon icon={faGear} />,
  },
  {
    name: "Login",
    path: "core/login",
    icon: <FontAwesomeIcon icon={faCircleUser} />,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { user, loading } = useAuth();

  // "storeId" en /inventory/[storeId] y /finanzas/[storeId]; "id" en
  // /stores/[id] (el detalle de negocio, donde tambien se "entra" a una
  // tienda puntual al hacer click en una tarjeta de "Negocios").
  const storeId =
    typeof params?.storeId === "string"
      ? params.storeId
      : typeof params?.id === "string"
        ? params.id
        : null;

  // Rol con el que operas EN LA TIENDA que estas viendo ahora mismo
  // (null si todavia no elegiste ninguna, o si esta no es tuya).
  const rolEnEstaTienda = getRoleForStore(user, storeId);

  const esAdminPlataforma = Number(user?.global_role_id ?? 0) >= 90;
  const puedeGestionarEquipo = tieneAlgunRolDeGestion(user);

  const menuItems = buildMenuItems(storeId);

  let items: MenuItem[];

  if (storeId && rolEnEstaTienda !== null) {
    // Ya elegiste una tienda: el menu se ajusta a lo que puedes hacer
    // AHI, no a tu mejor rol en otro negocio distinto.
    if (rolEnEstaTienda === 60) {
      items = menuItems.filter(
        (item) =>
          item.name === "Finanzas" ||
          item.path === "/stores" ||
          item.path === "core/login",
      );
    } else if (rolEnEstaTienda === 50) {
      items = menuItems.filter((item) => item.path !== "/users-rols");
    } else {
      items = menuItems;
    }
  } else {
    // Todavia no hay una tienda especifica seleccionada: se ve el menu
    // general, con "Usuarios y Roles" visible solo si en ALGUN negocio
    // (el que sea) puede de verdad gestionar equipo.
    items = menuItems.filter(
      (item) => item.path !== "/users-rols" || puedeGestionarEquipo,
    );
  }

  // Con que rol y en que negocio entraste: para alguien que es staff en
  // varios negocios a la vez, esto le aclara donde tiene cual sombrero.
  const staffBusinesses = user?.staff_businesses ?? [];

  // Mientras no sabemos quien es (o que rol tiene), armar el menu real
  // es puro adivinar: mostrar unos items y luego hacerlos aparecer o
  // desaparecer de golpe se ve peor que solo esperar con un skeleton.
  if (loading) {
    return (
      <div className={styles.sidebar}>
        <h1 className={styles.logo}>DELIFLEX</h1>

        <div className={styles.menu}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.menuItem}>
              <Skeleton width={16} height={16} radius={4} />
              <Skeleton width={`${60 + ((i * 13) % 30)}%`} height={13} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <h1 className={styles.logo}>DELIFLEX</h1>

      <div className={styles.menu}>
        {items.map((item) => (
          <div
            key={item.name}
            onClick={() => router.push(item.path)}
            className={`${styles.menuItem} ${
              pathname === item.path ? styles.active : ""
            }`}
          >
            {item.icon}
            {item.name}
          </div>
        ))}
      </div>

      {user && (
        <div className={styles.roleContext}>
          <div className={styles.roleContextTitle}>
            <FontAwesomeIcon icon={faShieldHalved} /> Tu acceso
          </div>

          {Number(user.global_role_id) >= 100 ? (
            <div className={styles.roleRow}>Super Administrador</div>
          ) : (
            <>
              {esAdminPlataforma && (
                <div className={styles.roleRow}>Administrador</div>
              )}
              {staffBusinesses.map((sb) => (
                <div key={sb.business_id} className={styles.roleRow}>
                  <span className={styles.roleName}>{sb.role_name}</span>
                  {sb.store_name ? ` · ${sb.store_name}` : ""}
                </div>
              ))}
              {!esAdminPlataforma && staffBusinesses.length === 0 && (
                <div className={styles.roleRow}>Sin negocios asignados</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

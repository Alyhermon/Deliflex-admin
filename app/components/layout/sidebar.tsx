"use client";

import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faShop,
  faReceipt,
  faCalculator,
  faChartColumn,
  faGear,
  faUser,
  faCircleUser,
  faBox,
  faShieldHalved,
  faChevronDown,
  faStar,
  faLightbulb,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  useAuth,
  getRoleForStore,
  tieneAlgunRolDeGestion,
  tieneRolGerencial,
} from "../../hooks/useAuth";
import { useActiveStore, ALL_STORES_ID } from "../../hooks/useActiveStore";
import Skeleton from "../components-items/skeleton/skeleton";
import styles from "./sidebar.module.css";

interface MenuItem {
  name: string;
  path: string;
  icon?: ReactNode;
  // Prefijo real de la seccion (ej. "/menu"), para saber si esta activa
  // aunque `path` este apuntando de respaldo a "/stores" por no haber
  // todavia un negocio activo elegido.
  sectionPrefix?: string;
}

// Los items que dependen de un negocio (Menu, Inventario, Finanzas, Pedidos)
// siguen al negocio activo elegido arriba en el selector. Sin negocio
// activo, mandan a "Negocios" a elegir uno en vez de a un picker aparte.
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
    path: storeId ? `/menu/${storeId}` : "/stores",
    icon: <FontAwesomeIcon icon={faBarcode} />,
    sectionPrefix: "/menu",
  },
  {
    name: "Inventario",
    path: storeId ? `/inventory/${storeId}` : "/stores",
    icon: <FontAwesomeIcon icon={faBox} />,
    sectionPrefix: "/inventory",
  },
  {
    name: "Pedidos",
    path: storeId ? `/pedidos/${storeId}` : "/stores",
    icon: <FontAwesomeIcon icon={faReceipt} />,
    sectionPrefix: "/pedidos",
  },
  {
    name: "Finanzas",
    path: storeId ? `/finanzas/${storeId}` : "/stores",
    icon: <FontAwesomeIcon icon={faCalculator} />,
    sectionPrefix: "/finanzas",
  },
  {
    name: "Usuarios y Roles",
    path: "/users-rols",
    icon: <FontAwesomeIcon icon={faUser} />,
  },
  {
    name: "Promociones",
    path: "/promociones",
    icon: <FontAwesomeIcon icon={faStar} />,
  },
  {
    name: "Mi Roadmap",
    path: "/roadmap",
    icon: <FontAwesomeIcon icon={faLightbulb} />,
  },
  {
    name: "Soporte",
    path: "/soporte",
    icon: <FontAwesomeIcon icon={faHeadset} />,
  },
  {
    name: "Configuraciones",
    path: "/configuracion",
    icon: <FontAwesomeIcon icon={faGear} />,
  },
  {
    name: "Login",
    path: "/core/login",
    icon: <FontAwesomeIcon icon={faCircleUser} />,
  },
];

// Si estas dentro de una seccion de negocio (Menu/Inventario/Finanzas/
// Pedidos/detalle de Negocios) y cambias el negocio activo, te quedas en
// la MISMA seccion pero para el negocio nuevo, en vez de perder el lugar
// donde estabas.
const SECCIONES_POR_NEGOCIO = ["menu", "inventory", "finanzas", "pedidos", "stores"];

function construirRutaParaNegocio(pathname: string, nuevoStoreId: string): string | null {
  const segmentos = pathname.split("/").filter(Boolean);
  if (segmentos.length < 2) return null;
  if (!SECCIONES_POR_NEGOCIO.includes(segmentos[0])) return null;

  const resto = segmentos.slice(2);
  return `/${segmentos[0]}/${nuevoStoreId}${resto.length ? "/" + resto.join("/") : ""}`;
}

function esItemActivo(item: MenuItem, pathname: string): boolean {
  if (item.sectionPrefix) return pathname.startsWith(`${item.sectionPrefix}/`);
  if (item.path === "/stores") return pathname === "/stores" || pathname.startsWith("/stores/");
  return pathname === item.path;
}

// Mismos role_id que reparte el modal de invitar en Usuarios y Roles.
const ROLE_LABELS: Record<number, string> = {
  100: "Super Administrador",
  90: "Administrador",
  80: "Gerente General",
  70: "Supervisor",
  60: "Cajero",
  50: "Staff",
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const {
    stores,
    loading: loadingStores,
    activeStoreId,
    setActiveStoreId,
  } = useActiveStore();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!switcherOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSwitcherOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [switcherOpen]);

  // Nombres que se repiten entre negocios (ej. varias sucursales con el
  // mismo nombre): a esos hay que agregarles la categoria en el selector
  // para poder distinguirlos, si no, no hay forma de saber cual es cual.
  const nombresRepetidos = new Set(
    Object.entries(
      stores.reduce<Record<string, number>>((acc, s) => {
        acc[s.name] = (acc[s.name] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .filter(([, count]) => count > 1)
      .map(([name]) => name),
  );

  // "Todos los negocios" no es un negocio real: para todo lo que depende
  // de un negocio puntual (rol, links de Menu/Inventario/etc.) cuenta
  // igual que no haber elegido ninguno todavia.
  const realStoreId = activeStoreId === ALL_STORES_ID ? null : activeStoreId;

  // Rol con el que operas EN EL NEGOCIO activo ahora mismo (null si
  // todavia no elegiste ninguno, o si ese negocio no es tuyo).
  const rolEnEstaTienda = getRoleForStore(user, realStoreId);

  const esAdminPlataforma = Number(user?.global_role_id ?? 0) >= 90;
  const puedeGestionarEquipo = tieneAlgunRolDeGestion(user);
  // "Destacados" (pagar para aparecer resaltado en la app) le toca a quien
  // DIRIGE el negocio - dueno, gerente general, o super admin - no a un
  // Supervisor/Cajero/Staff.
  const puedeVerDestacados = tieneRolGerencial(user);
  // "Mi Roadmap" es una lista privada de la super admin sobre la app en
  // general - ni siquiera un Administrador dueno de negocios la ve.
  const esSuperAdmin = Number(user?.global_role_id ?? 0) >= 100;

  const menuItems = buildMenuItems(realStoreId);

  let items: MenuItem[];

  if (realStoreId && rolEnEstaTienda !== null) {
    // Ya elegiste un negocio: el menu se ajusta a lo que puedes hacer
    // AHI, no a tu mejor rol en otro negocio distinto.
    if (rolEnEstaTienda === 60) {
      // Cajero: maneja caja (Finanzas) y toma/despacha pedidos (Pedidos).
      items = menuItems.filter(
        (item) =>
          item.name === "Finanzas" ||
          item.name === "Pedidos" ||
          item.path === "/stores" ||
          item.path === "/core/login",
      );
    } else if (rolEnEstaTienda === 50) {
      items = menuItems.filter((item) => item.path !== "/users-rols");
    } else {
      items = menuItems;
    }
  } else {
    // Todavia no hay un negocio especifico seleccionado: se ve el menu
    // general, con "Usuarios y Roles" visible solo si en ALGUN negocio
    // (el que sea) puede de verdad gestionar equipo.
    items = menuItems.filter(
      (item) => item.path !== "/users-rols" || puedeGestionarEquipo,
    );
  }

  items = items.filter(
    (item) => item.path !== "/promociones" || puedeVerDestacados,
  );
  items = items.filter((item) => item.path !== "/roadmap" || esSuperAdmin);
  items = items.filter((item) => item.path !== "/soporte" || esSuperAdmin);

  // Con que rol y en que negocio entraste: para alguien que es staff en
  // varios negocios a la vez, esto le aclara donde tiene cual sombrero.
  const staffBusinesses = user?.staff_businesses ?? [];

  const etiquetaNegocio = (s: (typeof stores)[number]) =>
    nombresRepetidos.has(s.name)
      ? `${s.name} · ${s.category || "Sin categoría"}`
      : s.name;

  const etiquetaActiva =
    activeStoreId === ALL_STORES_ID
      ? "Todos los negocios"
      : (stores.find((s) => s.id === activeStoreId) &&
          etiquetaNegocio(stores.find((s) => s.id === activeStoreId)!)) ||
        "Selecciona un negocio";

  // Por id, no por nombre: puede haber mas de un negocio con el mismo
  // nombre (ej. varias sucursales "Cocorao Zona Colonial"), y elegir por
  // nombre terminaria siempre en la primera que coincida.
  const handleElegirNegocio = (nuevoStoreId: string) => {
    if (!nuevoStoreId) return;

    setActiveStoreId(nuevoStoreId);
    setSwitcherOpen(false);

    if (nuevoStoreId === ALL_STORES_ID) {
      // "Todos" no tiene una vista propia para Menu/Inventario/Finanzas/
      // Pedidos ni para el detalle de un negocio puntual: si estabas ahi,
      // te manda de vuelta a la lista en vez de dejarte en una pantalla
      // que ya no tiene sentido para lo que elegiste.
      const segmentos = pathname.split("/").filter(Boolean);
      if (segmentos.length >= 2 && SECCIONES_POR_NEGOCIO.includes(segmentos[0])) {
        router.push("/stores");
      }
      return;
    }

    const rutaEnNuevoNegocio = construirRutaParaNegocio(pathname, nuevoStoreId);
    if (rutaEnNuevoNegocio && rutaEnNuevoNegocio !== pathname) {
      router.push(rutaEnNuevoNegocio);
    }
  };

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

      {user && (
        <div className={styles.storeSwitcher} ref={switcherRef}>
          <span className={styles.storeSwitcherLabel}>Negocio actual</span>
          {loadingStores ? (
            <Skeleton height={36} radius={8} />
          ) : (
            <div className={styles.storeSwitcherWrap}>
              <button
                type="button"
                className={styles.storeSwitcherControl}
                onClick={() => setSwitcherOpen((v) => !v)}
              >
                <FontAwesomeIcon icon={faShop} className={styles.storeSwitcherIcon} />
                <span className={styles.storeSwitcherValue}>{etiquetaActiva}</span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`${styles.storeSwitcherChevron} ${
                    switcherOpen ? styles.storeSwitcherChevronOpen : ""
                  }`}
                />
              </button>

              {switcherOpen && (
                <div className={styles.storeSwitcherPopup}>
                  <div
                    className={`${styles.storeSwitcherOption} ${
                      activeStoreId === ALL_STORES_ID ? styles.storeSwitcherOptionActive : ""
                    }`}
                    onClick={() => handleElegirNegocio(ALL_STORES_ID)}
                  >
                    Todos los negocios
                  </div>

                  {stores.length > 0 && <div className={styles.storeSwitcherDivider} />}

                  {stores.map((s) => (
                    <div
                      key={s.id}
                      className={`${styles.storeSwitcherOption} ${
                        activeStoreId === s.id ? styles.storeSwitcherOptionActive : ""
                      }`}
                      onClick={() => handleElegirNegocio(s.id)}
                    >
                      {etiquetaNegocio(s)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comportamiento por rol a la vista: si estas viendo un negocio
              puntual, aqui se ve con que rol operas justo en ese negocio,
              no tu mejor rol en otro negocio distinto. */}
          {realStoreId && rolEnEstaTienda !== null && (
            <div className={styles.storeSwitcherRole}>
              Tu rol aquí: <strong>{ROLE_LABELS[rolEnEstaTienda] ?? "—"}</strong>
            </div>
          )}
        </div>
      )}

      <div className={styles.menu}>
        {items.map((item) => {
          // Con "Todos los negocios" elegido, las secciones de un solo
          // negocio (Menu/Inventario/Pedidos/Finanzas) no tienen que
          // mostrar: se bloquean en vez de mandarte a una pantalla vacia.
          const disabled = Boolean(item.sectionPrefix) && !realStoreId;

          return (
            <div
              key={item.name}
              onClick={() => {
                if (!disabled) router.push(item.path);
              }}
              className={`${styles.menuItem} ${
                esItemActivo(item, pathname) ? styles.active : ""
              } ${disabled ? styles.menuItemDisabled : ""}`}
              title={disabled ? "Elige un negocio para ver esto" : undefined}
            >
              {item.icon}
              {item.name}
            </div>
          );
        })}
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

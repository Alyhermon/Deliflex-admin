"use client";

import { useRouter, usePathname } from "next/navigation";
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
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";
import styles from "./sidebar.module.css";

interface MenuItem {
  name: string;
  path: string;
  icon?: ReactNode;
}

const menuItems: MenuItem[] = [
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
  { name: "Menú", path: "/menu", icon: <FontAwesomeIcon icon={faBarcode} /> },
  {
    name: "Inventario",
    path: "/inventory",
    icon: <FontAwesomeIcon icon={faBox} />,
  },
  {
    name: "Operaciones",
    path: "/operaciones",
    icon: <FontAwesomeIcon icon={faChartLine} />,
  },
  {
    name: "Finanzas",
    path: "/finanzas",
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

  return (
    <div className={styles.sidebar}>
      <h1 className={styles.logo}>DELIFLEX</h1>

      <div className={styles.menu}>
        {menuItems.map((item) => (
          <div
            key={item.path}
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
    </div>
  );
}

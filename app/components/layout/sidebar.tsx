"use client";

import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faBarcode,
  faShop,
  faChartLine,
  faCalculator,
  faChartColumn,
  faGear,
  faContactBook,
  faContactCard,
  faUser,
  faCircleUser,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";

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
  {
    name: "Menú",
    path: "/menu",
    icon: <FontAwesomeIcon icon={faBarcode} />,
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
    <div className="w-[250px] h-screen bg-[#121B27] text-white p-5">
      <h1 className="text-2xl font-bold text-orange-500 mb-10">DELIFLEX</h1>

      <div className="space-y-4">
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`cursor-pointer p-2 rounded-lg flex items-center gap-2 ${
              pathname === item.path ? "bg-orange-500" : "hover:bg-gray-700"
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

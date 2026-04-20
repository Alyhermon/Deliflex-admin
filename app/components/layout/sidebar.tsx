"use client";

import { useRouter, usePathname } from "next/navigation";
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
    icon: <span>🏠</span>,
  },
  {
    name: "Negocios",
    path: "/stores",
    icon: <span>🍔</span>,
  },
  {
    name: "Menú",
    path: "/menu",
    icon: <span>🍔</span>,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-[250px] h-screen bg-[#1a1a1a] text-white p-5">
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
            {/* 👇 ICONO */}
            {item.icon}

            {/* 👇 TEXTO */}
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Sidebar from "./sidebar";
import Footer from "./footer";
import InactivityGuard from "./inactivity-guard";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useAuth, getRoleForStore } from "../../hooks/useAuth";
import styles from "./layout.module.css";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const storeId =
    typeof params?.storeId === "string"
      ? params.storeId
      : typeof params?.id === "string"
        ? params.id
        : null;
  const rolEnEstaTienda = getRoleForStore(user, storeId);

  // Dentro de una tienda donde eres Cajero, solo Finanzas y Pedidos (de esa
  // misma tienda) y el listado de Negocios (para poder salir a otra) tienen
  // sentido. Si entra por URL directa a cualquier otra cosa de esa
  // tienda, lo regresamos - ocultar el link del menu no alcanza, alguien
  // puede tener el link guardado o escribirlo a mano.
  useEffect(() => {
    if (loading) return;
    if (!storeId || rolEnEstaTienda !== 60) return;

    const permitido =
      pathname?.startsWith(`/finanzas/${storeId}`) ||
      pathname?.startsWith(`/pedidos/${storeId}`) ||
      pathname === "/stores";

    if (!permitido) {
      router.replace(`/finanzas/${storeId}`);
    }
  }, [loading, storeId, rolEnEstaTienda, pathname, router]);

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.content}>
        <main className={styles.main}>{children}</main>

        <Footer />
      </div>

      {user && <InactivityGuard />}
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import AdminLayout from "../../components/layout/adminLayout";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import { useActiveStore } from "../../hooks/useActiveStore";
import OrdersTab from "../../stores/[id]/store-tabs/orders/orders";

export default function StoreOrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { activeStore } = useActiveStore();
  // El selector del sidebar ya tiene el nombre real cargado de antes: se
  // usa como valor inicial para no mostrar "Negocio" mientras se confirma.
  const [storeName, setStoreName] = useState(
    () => (activeStore?.id === storeId ? activeStore.name : "Negocio"),
  );

  useEffect(() => {
    if (!storeId) return;

    const cargarNombre = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/register-business/edit/${storeId}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (data?.store_name) setStoreName(data.store_name);
      } catch (error) {
        console.error(error);
      }
    };

    cargarNombre();
  }, [storeId]);

  return (
    <AdminLayout>
      <Breadcrumb
        items={[
          { label: "Pedidos", href: "/stores" },
          { label: storeName },
        ]}
      />

      <div style={{ padding: "4px 0 20px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>
            Pedidos
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            Pedidos de {storeName}.
          </p>
        </div>

        <OrdersTab id={storeId} />
      </div>
    </AdminLayout>
  );
}

"use client";

import { use, useState } from "react";
import AdminLayout from "../../components/layout/adminLayout";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import { useActiveStore } from "../../hooks/useActiveStore";
import MenuScreen from "./MenuScreen";

export default function StoreMenuPage({
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

  return (
    <AdminLayout>
      <Breadcrumb
        items={[
          { label: "Menú", href: "/stores" },
          { label: storeName },
        ]}
      />
      <MenuScreen storeId={storeId} onStoreNameLoaded={setStoreName} />
    </AdminLayout>
  );
}

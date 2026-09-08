import { useState, useEffect } from "react";

type StaffBusiness = {
  business_id: string;
  role_id: number;
  role_name: string;
  store_id: string | null;
  store_name: string | null;
};

type OwnedStore = {
  store_id: string;
  business_id: string;
  store_name: string;
};

export type User = {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  global_role_id: number | null;
  type_user: string;
  staff_businesses?: StaffBusiness[];
  owned_stores?: OwnedStore[];
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
      })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

// El rol con el que este usuario opera EN UNA TIENDA puntual: alguien
// puede ser Cajero en una sucursal y Supervisor en otra, asi que "mejor
// rol global" no alcanza para decidir que mostrar cuando ya elegiste
// una tienda especifica. null = sin ningun vinculo con esa tienda.
export function getRoleForStore(
  user: User | null,
  storeId: string | null | undefined,
): number | null {
  if (!user || !storeId) return null;
  if (Number(user.global_role_id ?? 0) >= 100) return 100;

  const esDueno = (user.owned_stores ?? []).some((s) => s.store_id === storeId);
  if (esDueno) return 90;

  const staff = (user.staff_businesses ?? []).find(
    (sb) => sb.store_id === storeId,
  );

  return staff ? staff.role_id : null;
}

// Si tiene algun rol >= 70 (Supervisor o mejor) en AL MENOS una tienda,
// sin importar cual este viendo ahora mismo. Sirve para decisiones que
// no dependen de una tienda puntual, como si vale la pena mostrarle
// "Usuarios y Roles" cuando todavia no eligio ningun negocio.
export function tieneAlgunRolDeGestion(user: User | null): boolean {
  if (!user) return false;
  if (Number(user.global_role_id ?? 0) >= 90) return true;

  return (user.staff_businesses ?? []).some((sb) => sb.role_id >= 70);
}

// Dueno o Gerente General (rol >= 80) en AL MENOS un negocio, o super
// admin. "Negocios Destacados" (pagar para aparecer resaltado en la app)
// es una decision de quien dirige el negocio, no de un Supervisor/Cajero/
// Staff - por eso el umbral es mas alto que tieneAlgunRolDeGestion.
export function tieneRolGerencial(user: User | null): boolean {
  if (!user) return false;
  if (Number(user.global_role_id ?? 0) >= 100) return true;
  if ((user.owned_stores ?? []).length > 0) return true;

  return (user.staff_businesses ?? []).some((sb) => sb.role_id >= 80);
}

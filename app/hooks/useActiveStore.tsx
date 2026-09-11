"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { useAuth } from "./useAuth";

export type ActiveStoreOption = {
  id: string;
  name: string;
  category: string | null;
  banner_url: string;
};

// Sentinel para "Todos los negocios": no es un id real, pero se guarda y
// compara igual que uno. Asi el selector nunca queda en un estado vacio
// ambiguo ("no se que tengo elegido") - o hay un negocio puntual, o estas
// viendo todos a la vez, nunca "nada".
export const ALL_STORES_ID = "__todos__";

export const ACTIVE_STORE_STORAGE_KEY = "deliflex_active_store_id";
const STORAGE_KEY = ACTIVE_STORE_STORAGE_KEY;

type ActiveStoreContextValue = {
  stores: ActiveStoreOption[];
  loading: boolean;
  activeStoreId: string;
  activeStore: ActiveStoreOption | null;
  setActiveStoreId: (id: string) => void;
};

// Un solo "negocio activo" para toda la navegacion (sidebar + pantallas de
// Inventario/Menu/Finanzas/Pedidos/Roles), compartido via contexto en vez
// de que cada componente lea su propia copia: si no fuera compartido, el
// selector del sidebar podria cambiar de negocio sin que una pantalla que
// no navega (como Usuarios y Roles) se enterara.
const ActiveStoreContext = createContext<ActiveStoreContextValue | null>(null);

export function ActiveStoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();

  const [stores, setStores] = useState<ActiveStoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoreId, setActiveStoreIdState] = useState<string>(ALL_STORES_ID);

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const url = esSuperAdmin
      ? `${process.env.NEXT_PUBLIC_API_URL}/register-business/all`
      : `${process.env.NEXT_PUBLIC_API_URL}/register-business/accessible/${user.id}`;

    const cargar = async () => {
      try {
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [authLoading, user, esSuperAdmin]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActiveStoreIdState(saved);
    } catch {
      // Sin localStorage disponible (modo privado, etc.): se queda en "Todos".
    }
  }, []);

  const urlStoreId =
    typeof params?.storeId === "string"
      ? params.storeId
      : typeof params?.id === "string"
        ? params.id
        : null;

  useEffect(() => {
    if (!urlStoreId) return;

    setActiveStoreIdState(urlStoreId);
    try {
      localStorage.setItem(STORAGE_KEY, urlStoreId);
    } catch {
      // Sin localStorage disponible: la tienda activa solo dura esta sesion de navegacion.
    }
  }, [urlStoreId]);

  const setActiveStoreId = useCallback((id: string) => {
    setActiveStoreIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Sin localStorage disponible: la tienda activa solo dura esta sesion de navegacion.
    }
  }, []);

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? null;

  return (
    <ActiveStoreContext.Provider
      value={{ stores, loading, activeStoreId, activeStore, setActiveStoreId }}
    >
      {children}
    </ActiveStoreContext.Provider>
  );
}

export function useActiveStore() {
  const ctx = useContext(ActiveStoreContext);

  if (!ctx) {
    throw new Error("useActiveStore debe usarse dentro de <ActiveStoreProvider>");
  }

  return ctx;
}

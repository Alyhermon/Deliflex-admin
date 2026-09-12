"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./stores.module.css";
import AdminLayout from "../components/layout/adminLayout";
import Dropdown from "../components/components-items/dropdown";
import DFInput from "../components/components-items/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faMagnifyingGlass,
  faStar,
  faStoreSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { SkeletonCardGrid } from "../components/components-items/skeleton/skeleton";

type Store = {
  id: string;
  name: string;
  category: string | null;
  banner_url: string;
  logo_url: string;
  rating?: number;
  status?: string;
};

// Mismo enum que usa la BD (stores_status). Una sola fuente de verdad
// para el filtro y para el badge de cada tarjeta, asi no se desincronizan.
const STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  PENDING_APPROVAL: {
    label: "Pendiente",
    badge: "pending",
    dot: "dotPending",
  },
  ACTIVE: { label: "Activo", badge: "statusActive", dot: "dotActive" },
  INACTIVE: { label: "Inactivo", badge: "statusInactive", dot: "dotInactive" },
  CLOSED: { label: "Cerrado", badge: "statusClosed", dot: "dotClosed" },
  BANNED: { label: "Suspendido", badge: "statusBanned", dot: "dotBanned" },
};

// Orden en que se muestran en el select de filtro.
const STATUS_FILTROS = [
  "PENDING_APPROVAL",
  "ACTIVE",
  "CLOSED",
  "INACTIVE",
  "BANNED",
];

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessType, setBusinessType] = useState("");
  const [search, setSearch] = useState("");

  const TODOS = "Todos los estados";
  const options = [
    TODOS,
    ...STATUS_FILTROS.map((status) => STATUS_META[status].label),
  ];

  // El Dropdown solo habla en texto ("Pendiente"), asi que hay que
  // volver a mapearlo al valor real de la BD para poder filtrar.
  const statusSeleccionado = STATUS_FILTROS.find(
    (status) => STATUS_META[status].label === businessType,
  );

  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();

  const normalizedSearch = normalizeText(search);

  const { user, loading: authLoading } = useAuth();

  // 100 = SUPER_ADMIN: ve TODOS los negocios de la plataforma (incluso los
  // que todavia no tienen business_id asignado). El resto solo ve los
  // negocios propios o donde es staff - mismo criterio que el dashboard y
  // el selector del sidebar.
  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  useEffect(() => {
  // Esperamos a que /api/auth/me responda antes de decidir nada.
  if (authLoading) return;

  // Sin sesion valida no hay nada que cargar: al login, sin dejar el spinner colgado.
  if (!user) {
    setLoading(false);
    router.replace("/core/login");
    return;
  }

  const url = esSuperAdmin
    ? `${process.env.NEXT_PUBLIC_API_URL}/register-business/all`
    : `${process.env.NEXT_PUBLIC_API_URL}/register-business/accessible/${user.id}`;

  const loadStores = async () => {
    try {
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setStores(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error(error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  loadStores();
}, [user, authLoading, esSuperAdmin, router]);

  // Las tiendas eliminadas (borrado logico) nunca deben verse aqui,
  // sin importar el filtro que se elija.
  const visibleStores = stores.filter((store) => store.status !== "DELETED");

  const filteredStores = visibleStores
    .filter((store) =>
      normalizedSearch.length >= 3
        ? normalizeText(store.name).includes(normalizedSearch)
        : true,
    )
    .filter((store) =>
      statusSeleccionado ? store.status === statusSeleccionado : true,
    );

  const handleCreate = () => {
    router.push("/stores/register");
  };

  return (
    <AdminLayout>
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <span className={styles.title}>Mis Negocios</span>
            <p className={styles.subtitle}>Administra todos tus negocios</p>
          </div>

          <button className={styles.btnCreate} onClick={handleCreate}>
            + Crear negocio
          </button>
        </div>

        <div className={styles.filters}>
          <DFInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar Negocio"
            icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
          />

          <Dropdown
            options={options}
            value={businessType}
            onChange={setBusinessType}
            placeholder="Selecciona estado"
          />

          {statusSeleccionado && (
            <button
              type="button"
              className={styles.clearFilter}
              onClick={() => setBusinessType("")}
            >
              Quitar filtro ×
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonCardGrid count={3} />
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <h3>No hay negocios en Deliflex registrados</h3>
            <p>Los negocios que se registren en la plataforma aparecerán aquí</p>
          </div>
        ) : filteredStores.length === 0 &&
          (search.trim().length >= 3 || statusSeleccionado) ? (
          <div className={styles.noResultsWrapper}>
            <p className={styles.noResults}>
              <FontAwesomeIcon icon={faStoreSlash} color="#ff6b00" />
              <div className={styles.noResultsText}>
                {search.trim().length >= 3 ? (
                  <>
                    No se encontraron resultados para
                    <span className={styles.searchTerm}>{` ${search} `}</span>
                  </>
                ) : (
                  <>
                    Ningun negocio esta{" "}
                    <span className={styles.searchTerm}>{businessType}</span>
                  </>
                )}
              </div>
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredStores.map((store) => {
              const pendiente = store.status === "PENDING_APPROVAL";

              return (
              <div
                key={store.id}
                className={`${styles.card} ${pendiente ? styles.cardDisabled : ""}`}
              >
                <div className={styles.banner}>
                  <Image
                    src={store.banner_url || "/assets/no-image.png"}
                    alt="banner"
                    fill
                    className={styles.bannerImg}
                  />

                  <div className={styles.overlay}></div>

                  <span
                    className={
                      styles[
                        STATUS_META[store.status ?? ""]?.badge ??
                          "statusInactive"
                      ]
                    }
                  >
                    <span
                      className={
                        styles[
                          STATUS_META[store.status ?? ""]?.dot ?? "dotInactive"
                        ]
                      }
                    ></span>
                    {STATUS_META[store.status ?? ""]?.label ?? "Inactivo"}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.header}>
                    <div>
                      <h3 className={styles.title}>{store.name}</h3>

                      <div className={styles.categoryRow}>
                        <p className={styles.category}>
                          {store.category || "Negocio sin categoría"}
                        </p>

                        <div className={styles.ratingBadge}>
                          <FontAwesomeIcon icon={faStar} />
                          <span className={styles.ratingValue}>
                            {store.rating || 4.5}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.actions}>
                    <button className={styles.secondaryBtn} disabled={pendiente}>
                      <FontAwesomeIcon icon={faEdit} />
                      Editar
                    </button>

                    <button
                      className={styles.primaryBtn}
                      disabled={pendiente}
                      title={
                        pendiente
                          ? "Este negocio está pendiente de aprobación"
                          : undefined
                      }
                      onClick={() => router.push(`/stores/${store.id}`)}
                    >
                      Ver detalle →
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

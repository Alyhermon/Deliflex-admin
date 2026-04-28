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

type Store = {
  id: string;
  name: string;
  category: string | null;
  banner_url: string;
  logo_url: string;
  rating?: number;
  status?: string;
};

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessType, setBusinessType] = useState("");
  const [search, setSearch] = useState("");
  const options = ["Todos", "Abiertos", "Cerrados"];

  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();

  const normalizedSearch = normalizeText(search);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await fetch(
          "http://localhost:3001/register-business/owner/f4fbf456-4a9a-44d5-8584-ca90c720fbb5",
        );
        const data = await res.json();

        console.log("TIENDAS REALES:", data);

        setStores(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error(error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  const filteredStores =
    normalizedSearch.length >= 3
      ? stores.filter((store) =>
          normalizeText(store.name).includes(normalizedSearch),
        )
      : stores;

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
        </div>

        {loading ? (
          <div className={styles.empty}>
            <p>Cargando negocios...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <h3>No tienes negocios aún</h3>
            <p>Crea tu primer negocio para empezar</p>

            <button className={styles.btnCreate}>Crear negocio</button>
          </div>
        ) : filteredStores.length === 0 && search.trim().length >= 3 ? (
          <div className={styles.noResultsWrapper}>
            <p className={styles.noResults}>
              <FontAwesomeIcon icon={faStoreSlash} color="#ff6b00" />
              <div className={styles.noResultsText}>
                No se encontraron resultados para
                <span className={styles.searchTerm}>{` ${search} `}</span>
              </div>
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredStores.map((store) => (
              <div key={store.id} className={styles.card}>
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
                      store.status === "PENDING_APPROVAL"
                        ? styles.pending
                        : store.status === "ACTIVE"
                          ? styles.statusActive
                          : store.status === "INACTIVE"
                            ? styles.statusInactive
                            : styles.statusBadge
                    }
                  >
                    <span
                      className={
                        store.status === "PENDING_APPROVAL"
                          ? styles.dotPending
                          : store.status === "ACTIVE"
                            ? styles.dotActive
                            : store.status === "INACTIVE"
                              ? styles.dotInactive
                              : styles.dotDefault
                      }
                    ></span>
                    {store.status === "PENDING_APPROVAL"
                      ? "Pendiente"
                      : store.status === "ACTIVE"
                        ? "Activo"
                        : "Inactivo"}
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
                    <button className={styles.secondaryBtn}>
                      <FontAwesomeIcon icon={faEdit} />
                      Editar
                    </button>

                    <button
                      className={styles.primaryBtn}
                      onClick={() => router.push(`/stores/${store.id}`)}
                    >
                      Ver detalle →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

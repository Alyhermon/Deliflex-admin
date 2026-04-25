"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./stores.module.css";
import AdminLayout from "../components/layout/adminLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faStar } from "@fortawesome/free-solid-svg-icons";
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

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await fetch(
          "http://localhost:3001/register-business/owner/f4fbf456-4a9a-44d5-8584-ca90c720fbb5",
        );
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
  }, []);

  const handleCreate = () => {
    router.push('/stores/register/stepper');
  }

  return (
    <AdminLayout>

        {/* Main */}
        <main className={styles.main}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1>Mis Negocios</h1>
              <p className={styles.subtitle}>
                Administra todos tus negocios
              </p>
            </div>

            <button className={styles.btnCreate}
            onClick={handleCreate}
            >+ Crear negocio</button>
          </div>

          {/* Filtros */}
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar negocio..."
              className={styles.input}
            />

            <select className={styles.select}>
              <option>Todos</option>
              <option>Aprobados</option>
              <option>Pendientes</option>
            </select>
          </div>

          {/* Contenido */}
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
          ) : (
            <div className={styles.grid}>
              {stores.map((store) => (
                <div key={store.id} className={styles.card}>
                  {/* Banner */}
                  <div className={styles.banner}>
                    <Image
                      src={store.banner_url || "/assets/no-image.png"}
                      alt="banner"
                      fill
                      className={styles.bannerImg}
                    />

                    {/* Overlay */}
                    <div className={styles.overlay}></div>

                    {/* Contenido del banner */}
                    <div className={styles.bannerContent}>
                      <div>
                        <h3 className={styles.title}>{store.name}</h3>
                        <p className={styles.category}>
                          {store.category || "Restaurante"}
                        </p>
                      </div>

                      {/* Rating */}
                      <div className={styles.ratingBadge}>
                        <FontAwesomeIcon color="#ddb936" icon={faStar} /> {store.rating || 4.5}
                      </div>
                    </div>

                    {/* Logo
                    <div className={styles.logo}>
                      <Image
                        src={store.logo_url || "/assets/no-image.png"}
                        alt="logo"
                        width={60}
                        height={60}
                      />
                    </div> */}
                    
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    {/* Estado */}
                    <div className={styles.statusRow}>
                      <span className={styles.status}>
                        {store.status || "Activo"}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className={styles.actions}>
                      <button className={styles.secondaryBtn}>
                        <FontAwesomeIcon color="#747474" icon={faEdit}/>
                          Editar
                        </button>

                      <button className={styles.primaryBtn}>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminLayout from "../components/layout/adminLayout";
import { useAuth } from "../hooks/useAuth";
import styles from "./picker.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { SkeletonCardGrid } from "../components/components-items/skeleton/skeleton";

type Store = {
  id: string;
  name: string;
  category: string | null;
  banner_url: string;
  status?: string;
};

export default function InventoryPickerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace("/core/login");
      return;
    }

    const url = esSuperAdmin
      ? "http://localhost:3001/register-business/all"
      : `http://localhost:3001/register-business/accessible/${user.id}`;

    const cargar = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();

        setStores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [authLoading, user, esSuperAdmin, router]);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Inventario</h1>
          <p>Elige el negocio del que quieres administrar el inventario.</p>
        </div>

        {loading ? (
          <SkeletonCardGrid count={3} />
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <FontAwesomeIcon icon={faBoxOpen} size="2x" />
            <p>
              {esSuperAdmin
                ? "Todavia no hay negocios en la plataforma."
                : "Todavia no tienes negocios registrados."}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {stores.map((store) => (
              <div
                key={store.id}
                className={styles.card}
                onClick={() => router.push(`/inventory/${store.id}`)}
              >
                <div className={styles.banner}>
                  <Image
                    src={store.banner_url || "/assets/no-image.png"}
                    alt={store.name}
                    fill
                    className={styles.bannerImg}
                  />
                </div>

                <div className={styles.body}>
                  <div className={styles.name}>{store.name}</div>
                  <div className={styles.category}>
                    {store.category || "Sin categoría"}
                  </div>
                  <span className={styles.link}>
                    Ver inventario <FontAwesomeIcon icon={faArrowRight} size="2xs" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

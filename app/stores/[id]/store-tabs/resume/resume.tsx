"use client";

import styles from "./resume.module.css";
import { useRouter } from "next/navigation";
import Metric from "../resume/metric/page";
import SmallCard from "../resume/small-card/page";
import Product from "../resume/product/page";
import { useEffect, useState } from "react";
import { Product as ProductType } from "@/app/types/products";
import { mapProductFromApi } from "../../maps/product.mapper";

export default function ResumeTab({ id }: { id: string }) {
  const router = useRouter();
  const [totalProducts, setTotalProducts] = useState(0);
  const [store, setStore] = useState<{
    id: string;
    name: string;
    category: string | null;
    banner_url: string;
    logo_url: string;
    rating?: number;
    status?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<ProductType[]>([]);
  const [activePromotions, setActivePromotions] = useState(0);
useEffect(() => {
  if (!id) return;

  const loadStore = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/register-business/${id}`
      );

      const data = await res.json();

      const stores = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      if (!stores.length) {
        console.warn("No hay stores en la respuesta", data);
        return;
      }

      const foundStore = stores.find(
        (store: { id: string }) => store.id === id
      );

      if (!foundStore) {
        console.warn("No se encontró el store con ese id", id);
        return;
      }

      setStore(foundStore);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  loadStore();
  
}, [id]);

useEffect(() => {
  if (!id) return;

  const loadCount = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/products/count/${id}`
      );

      const data = await res.json();

      setTotalProducts(data.total);
    } catch (error) {
      console.error(error);
    }
  };

  loadCount();
}, [id]);

useEffect(() => {
  if (!id) return;

  const loadPromotions = async () => {
    try {
      const res = await fetch(`http://localhost:3001/promotions/count/${id}`);
      const data = await res.json();

      setActivePromotions(data.total ?? 0);
    } catch (error) {
      console.error(error);
    }
  };

  loadPromotions();
}, [id]);

// Top productos: primero los destacados (top 3 en ventas) y el resto
// por unidades vendidas. Solo los 10 primeros.
useEffect(() => {
  if (!id) return;

  const loadTopProducts = async () => {
    try {
      const res = await fetch(`http://localhost:3001/products/store/${id}`);
      const data = await res.json();
      const products = Array.isArray(data) ? data : data.data || [];

      const ordenados = products
        .map(mapProductFromApi)
        .sort((a: ProductType, b: ProductType) => {
          if (a.isBestSeller !== b.isBestSeller) {
            return a.isBestSeller ? -1 : 1;
          }

          if (b.unitsSold !== a.unitsSold) {
            return b.unitsSold - a.unitsSold;
          }

          return a.name.localeCompare(b.name);
        })
        .slice(0, 10);

      setTopProducts(ordenados);
    } catch (error) {
      console.error(error);
    }
  };

  loadTopProducts();
}, [id]);


//   if (loading) return <p>Cargando...</p>;
//   if (!store) return <p>No encontrado</p>;

  return (

      <div className={styles.container}>

        <div className={styles.metrics}>
          <Metric title="Ventas hoy" value="$620,000" />
          <Metric title="Pedidos" value="32" />
          <Metric title="Ticket promedio" value="$19,375" />
          <Metric title="Rating" value="4.8" />
        </div>

        <div className={styles.grid}>
          <div className={styles.chart}>
            <span className={styles.titleGrafic}>Rendimiento</span>
            <div className={styles.chartBox}>Gráfica aquí</div>
          </div>

          <div className={styles.orders}>
            <h3>Pedidos</h3>

            <div className={styles.orderItem}>
              <span>#1245</span>
              <span className={styles.price}>$32,000</span>
            </div>

            <div className={styles.orderItem}>
              <span>#1244</span>
              <span className={styles.price}>$45,500</span>
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <div className={styles.ctaText}>
            <span className={styles.moreTitle}>Impulsa más ventas</span>
            <p>Crea promociones y destaca tu negocio en DeliFlex</p>
          </div>
          <button
            onClick={() => {
              if (!id) return;
              router.push(`/stores/${id}/promotions`);
            }}
          >
            Crear promoción
          </button>
        </div>

        <div className={styles.cards}>
          <SmallCard title="Menú" value={`${totalProducts} productos`} />
          <SmallCard
            title="Promociones"
            value={
              activePromotions === 1
                ? "1 activa"
                : `${activePromotions} activas`
            }
          />
          <SmallCard title="Horario" value="9am - 11pm" />
        </div>

        <div className={styles.products}>
          <span className={styles.top}>Top productos</span>

          {topProducts.length === 0 ? (
            <p className={styles.empty}>Todavia no hay productos que mostrar.</p>
          ) : (
            topProducts.map((product) => (
              <Product
                key={product.id}
                name={product.name}
                value={`$${product.price.toLocaleString("es-DO")}`}
                featured={product.isBestSeller}
              />
            ))
          )}
        </div>
      </div>
  );
}

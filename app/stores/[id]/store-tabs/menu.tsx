"use client";

import styles from "../details.module.css";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faEllipsis,
  faMagnifyingGlass,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import DFInput from "@/app/components/components-items/input";
import Dropdown from "@/app/components/components-items/dropdown";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  image_url: string | null;
  products_name: string;
  category_name: string;
  price: number;
  status: string;
  sales: number | null;
};

export default function MenuTab({ id }: { id: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const options = ["Todas", "Hamburguesas", "Bebidas", "Postres"];
  const [status, setStatus] = useState("");
  const optionsStatus = ["Todos", "Abiertos", "Cerrados"];

  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();

  const normalizedSearch = normalizeText(search);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const res = await fetch(`http://localhost:3001/products/${id}`);

        const data = await res.json();

        const products = Array.isArray(data) ? data : data.data || [];

        setProducts(products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadStore();
  }, [id]);

  const filteredProducts =
    normalizedSearch.length >= 2
      ? products.filter((product) =>
          normalizeText(product.products_name).includes(normalizedSearch),
        )
      : products;

  return (
    <div className={styles.menuWrapper}>
      <div className={styles.filters}>
        <DFInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar Negocio"
          icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
        />

        <Dropdown
          options={options}
          value={category}
          onChange={setCategory}
          placeholder="Selecciona categoría"
        />

        <Dropdown
          options={optionsStatus}
          value={status}
          onChange={setStatus}
          placeholder="Selecciona estado"
        />

        <button className={styles.addBtn}>+ Agregar producto</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Ventas</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={`${product.id}-${index}`}>
                <td className={styles.productCell}>
                  <div className={styles.img}>
                    <Image
                      src={product.image_url || "/assets/no-image.png"}
                      alt="banner"
                      width={70}
                      height={70}
                      className={styles.bannerImg}
                    />
                  </div>
                  {/* <img src={product.image_url} alt={product.name} /> */}
                </td>
                <td>{product.products_name}</td>

                <td>{product.category_name}</td>

                <td>${product.price}</td>

                <td>
                  <span
                    className={
                      product.status === "active"
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }
                  >
                    {product.status}
                  </span>
                </td>

                <td>{product.sales ?? "-"}</td>

                <td className={styles.actions}>
                  <button>
                    <FontAwesomeIcon icon={faEdit} color="#ff6a00" />
                  </button>
                  <button>
                    <FontAwesomeIcon icon={faTrash} color="#f82727" />
                  </button>
                  <button>
                    <FontAwesomeIcon icon={faEllipsis} color="#494949" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {/* <div className={styles.pagination}>
        <span className={styles.pageActive}>1</span>
        <span>2</span>
        <span>3</span>
        <span>...</span>
        <span>6</span>

        <div className={styles.pageSize}>8 por página ⌄</div>
      </div> */}
    </div>
  );
}

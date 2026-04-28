"use client";

import styles from "../details.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import DFInput from "@/app/components/components-items/input";
import Dropdown from "@/app/components/components-items/dropdown";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: "Activo" | "Inactivo";
  sales: number | null;
};

export default function MenuTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const options = ["Todas", "Hamburguesas", "Bebidas", "Postres"];
  const [status, setStatus] = useState("");
    const optionsStatus = ["Todos", "Abiertos", "Cerrados"];
  const [products] = useState<Product[]>([
    {
      id: "1",
      name: "Hamburguesa Clásica",
      category: "Hamburguesas",
      price: 280,
      status: "Activo",
      sales: 1245,
    },
    {
      id: "2",
      name: "Papas DeliFlex",
      category: "Acompañamientos",
      price: 120,
      status: "Activo",
      sales: 982,
    },
    {
      id: "3",
      name: "Coca Cola 355ml",
      category: "Bebidas",
      price: 80,
      status: "Activo",
      sales: 876,
    },
    {
      id: "4",
      name: "Limonada Natural",
      category: "Bebidas",
      price: 95,
      status: "Inactivo",
      sales: null,
    },
  ]);

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
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Ventas</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className={styles.productCell}>
                  <div className={styles.img}>🍔</div>
                  {p.name}
                </td>

                <td>{p.category}</td>

                <td>${p.price}</td>

                <td>
                  <span
                    className={
                      p.status === "Activo"
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }
                  >
                    {p.status}
                  </span>
                </td>

                <td>{p.sales ?? "-"}</td>

                <td className={styles.actions}>
                  <button>✏️</button>
                  <button>⋯</button>
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
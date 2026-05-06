"use client";

import styles from "../details.module.css";
// import Image from "next/image";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faEllipsis,
  faMagnifyingGlass,
  faTrash,
  faBurger,
  faCoffee,
  faUtensils,
  faCircleNotch,
  faCakeCandles,
  faBreadSlice,
  faLeaf,
  faAppleWhole,
  faPizzaSlice,
  faPumpSoap,
  faCookieBite,
  faWineBottle,
  faBagShopping,
  faHeart,
  faAnkh,
} from "@fortawesome/free-solid-svg-icons";
import DFInput from "@/app/components/components-items/input";
import Dropdown from "@/app/components/components-items/dropdown";
import ProductForm from "./menu/products-form";
import { useEffect, useState } from "react";
import { Product } from "@/app/types/products";
import { mapProductFromApi } from "../maps/product.mapper";
import Modal from "@/app/components/components/modal/modal";
import SidePanel from "@/app/components/components/side-panel/side-panel";

const iconMap: Record<string, IconDefinition> = {
  coffee: faCoffee,
  burger: faBurger,
  cake: faCakeCandles,
  circlenotch: faCircleNotch,
  breadslice: faBreadSlice,
  leaf: faLeaf,
  utensils: faUtensils,
  applewhole: faAppleWhole,
  pizzaside: faPizzaSlice,
  pumpsoap: faPumpSoap,
  cookiebite: faCookieBite,
  winebottle: faWineBottle,
  bagshopping: faBagShopping,
  heart: faHeart,
  ankh: faAnkh,
};

export default function MenuTab({ id }: { id: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]); // 🔥 CLAVE
  const [loading, setLoading] = useState(true);
  const options = ["Todas", "Hamburguesas", "Bebidas", "Postres"];
  const [status, setStatus] = useState("");
  const optionsStatus = ["Todos", "Abiertos", "Cerrados"];
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [openPanel, setOpenPanel] = useState(false);

  function handleOpenPanel() {
    setOpenPanel(true);
  }

  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();

  const normalizedSearch = normalizeText(search);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const res = await fetch(`http://localhost:3001/products/store/${id}`);
        const data = await res.json();
        const products = Array.isArray(data) ? data : data.data || [];

        const mappedProducts = products.map(mapProductFromApi); // 🔥 AQUÍ

        setProducts(mappedProducts);

        console.log("DATA COMPLETA:", data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadStore();
  }, [id]);

  const filteredProducts = products.filter((product) => {
    if (
      normalizedSearch.length >= 2 &&
      !normalizeText(product.name).includes(normalizedSearch)
    ) {
      return false;
    }
    if (category && category !== "Todas" && product.categoryName !== category) {
      return false;
    }
    if (status && status !== "Todos") {
      const isActive = product.status === true;
      if (status === "Abiertos" && !isActive) return false;
      if (status === "Cerrados" && isActive) return false;
    }
    return true;
  });

  const deleteProduct = async (productId: string, storeId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3001/products/${productId}?storeId=${storeId}`,
        { method: "DELETE" },
      );

      const data = await res.json();
      console.log(data);

      if (!res.ok) throw new Error(data.message);

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      alert("Producto eliminado correctamente ✅");
    } catch (error) {
      console.error(error);
      alert(
        `Error al eliminar: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  const reloadProducts = async () => {
    try {
      const res = await fetch(`http://localhost:3001/products/store/${id}`);
      const data = await res.json();
      const products = Array.isArray(data) ? data : data.data || [];
      const mappedProducts = products.map(mapProductFromApi);
      setProducts(mappedProducts);
    } catch (error) {
      console.error(error);
    }
  };

  const editProduct = (product: Product) => {
    setSelectedProduct(product);
    setOpen(true);
  };

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

        <button className={styles.addBtn} onClick={() => setOpen(true)}>
          + Agregar menu
        </button>

        <Modal
          isOpen={open}
          onClose={() => {
            setOpen(false);
            setSelectedProduct(null);
          }}
          title={selectedProduct ? "Editar producto" : "Nuevo producto"}
          width="900px"
        >
          <ProductForm
            key={selectedProduct?.id || "new"}
            storeId={id}
            product={selectedProduct}
            onClose={() => {
              setOpen(false);
              setSelectedProduct(null);
              reloadProducts();
            }}
          />
        </Modal>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Icono</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Ventas</th>
              <th>Codigo</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={`${product.id}-${index}`}>
                <td className={styles.productCell}>
                  <div className={styles.img}>
                    <FontAwesomeIcon
                      icon={iconMap[product.categoryIcon] || faUtensils}
                      color="#b81515"
                      className={styles.zoomIcon}
                    />
                    {/* <Image
                      src={product.image_url || "/assets/no-image.png"}
                      alt="banner"
                      width={70}
                      height={70}
                      className={styles.bannerImg}
                    /> */}
                  </div>
                  {/* <img src={product.image_url} alt={product.name} /> */}
                </td>
                <td>{product.name}</td>

                <td>{product.categoryName}</td>

                <td>${product.price}</td>

                <td>
                  <span
                    className={
                      product.status === true
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }
                  >
                    {product.status === true ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td>-</td>
                <td>{product.productCode}</td>

                <td className={styles.actions}>
                  <button onClick={() => editProduct(product)}>
                    <FontAwesomeIcon icon={faEdit} color="#da6614" />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id, product.storeId)}
                  >
                    <FontAwesomeIcon icon={faTrash} color="#c12424" />
                  </button>

                  <button onClick={handleOpenPanel}>
                    <FontAwesomeIcon icon={faEllipsis} color="#494949" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <SidePanel
          open={openPanel}
          title="Gestionar producto"
          side="right"
          background="#FFFFFF"
          width="440px"
        >
          <button onClick={() => setOpenPanel(false)}>Cerrar panel</button>
        </SidePanel>
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

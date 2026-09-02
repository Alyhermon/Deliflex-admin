"use client";

import styles from "../details.module.css";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
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
  faDrumstickBite,
  faIcicles,
  faCheese,
} from "@fortawesome/free-solid-svg-icons";
import DFInput from "@/app/components/components-items/input";
import Dropdown from "@/app/components/components-items/dropdown";
import ProductForm from "./menu/products-form";
import { useEffect, useState } from "react";
import { Product } from "@/app/types/products";
import { mapProductFromApi } from "../maps/product.mapper";
import Modal from "@/app/components/components/modal/modal";
import ConfirmDialog from "@/app/components/components/modal/confirm-dialog";
import Toast from "@/app/components/components-items/toast/toast";
import SidePanel from "@/app/components/components/side-panel/side-panel";
import ProductManagementPanel from "@/app/stores/[id]/store-tabs/menu/(components)/sidePanelProduct"

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
  drumstickbite: faDrumstickBite,
  icicles: faIcicles,
  cheese: faCheese
};

export default function MenuTab({ id }: { id: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const options = ["Todas", "Hamburguesas", "Bebidas", "Postres"];
  const [status, setStatus] = useState("");
  const optionsStatus = ["Todos", "Abiertos", "Cerrados"];
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [openPanel, setOpenPanel] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  function handleOpenPanel(product: Product) {
    setSelectedProduct(product);
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

        const mappedProducts = products.map(mapProductFromApi);

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

  // La confirmacion la pide ConfirmDialog; aqui solo se ejecuta el borrado.
  const deleteProduct = async () => {
    if (!productToDelete) return;

    const { id: productId, storeId } = productToDelete;

    setDeleting(true);

    try {
      const res = await fetch(
        `http://localhost:3001/products/${productId}?storeId=${storeId}`,
        { method: "DELETE" },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setProductToDelete(null);
      setToast({ message: "Producto eliminado correctamente", type: "danger" });
    } catch (error) {
      console.error(error);
      alert(
        `Error al eliminar: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setDeleting(false);
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
            onSuccess={(action) =>
              setToast(
                action === "created"
                  ? {
                      message: "Producto agregado correctamente",
                      type: "success",
                    }
                  : {
                      message: "Producto editado correctamente",
                      type: "info",
                    },
              )
            }
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
                <td>
                  <div className={styles.nameCell}>
                    {product.name}

                    {product.isBestSeller && (
                      <span
                        className={styles.badgeFeatured}
                        title={`Top 3 en ventas: ${product.unitsSold} unidades en los ultimos 30 dias`}
                      >
                        <FontAwesomeIcon icon={faCircleCheck} />
                        Destacado
                      </span>
                    )}
                  </div>
                </td>

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

                <td>{product.unitsSold > 0 ? product.unitsSold : "-"}</td>
                <td>{product.productCode}</td>

                <td className={styles.actions}>
                  <button onClick={() => editProduct(product)}>
                    <FontAwesomeIcon icon={faEdit} color="#da6614" />
                  </button>
                  <button onClick={() => setProductToDelete(product)}>
                    <FontAwesomeIcon icon={faTrash} color="#c12424" />
                  </button>

                  <button onClick={() => handleOpenPanel(product)}>
                    <FontAwesomeIcon icon={faEllipsis} color="#494949" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <ConfirmDialog
          isOpen={productToDelete !== null}
          title="Eliminar producto"
          message={
            <>
              ¿Seguro que deseas eliminar{" "}
              <strong>{productToDelete?.name}</strong>{" "}
              del menu?
            </>
          }
          note="El producto dejara de aparecer en la tienda y en la app."
          confirmLabel="Si, eliminar"
          cancelLabel="Cancelar"
          loading={deleting}
          onConfirm={deleteProduct}
          onCancel={() => setProductToDelete(null)}
        />

        <SidePanel
          open={openPanel}
          title="Gestionar producto"
          side="right"
          background="#FFFFFF"
          width="440px"
          onClose={() => setOpenPanel(false)}
        >
          <ProductManagementPanel  product={selectedProduct}/>
        </SidePanel>
      </div>
    </div>
  );
}

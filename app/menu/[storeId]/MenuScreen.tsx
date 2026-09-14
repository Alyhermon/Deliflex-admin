"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DFInput from "../../components/components-items/input";
import DFDropdown from "../../components/components-items/dropdown";
import Modal from "../../components/components/modal/modal";
import SidePanel from "../../components/components/side-panel/side-panel";
import ConfirmDialog from "../../components/components/modal/confirm-dialog";
import Toast from "../../components/components-items/toast/toast";
import {
  SkeletonStatCards,
  SkeletonTableRows,
} from "../../components/components-items/skeleton/skeleton";
import { useActiveStore } from "../../hooks/useActiveStore";
import styles from "./menu.module.css";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faBarcode,
  faTags,
  faFire,
  faStar,
  faEllipsisVertical,
  faBoxOpen,
  faCamera,
  faTrash,
  faGripVertical,
  faPen,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import DFCheckbox from "../../components/components-items/checkbox/checkbox";
import LoadingDots from "../../components/components-items/loading-dots/loading-dots";

type Product = {
  id: string;
  store_id: string;
  category_id: string;
  product_name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  status: boolean | null;
  is_available: boolean;
  product_code: string | null;
  is_featured: boolean;
  units_sold: number;
  is_best_seller: boolean;
  category_name: string;
  created_at: string;
};

type Category = { id: string; name: string };

type ProductOption = {
  id: string;
  group_id: string;
  name: string;
  extra_price: string;
  is_active: boolean;
  display_order: number;
};

type OptionGroup = {
  id: string;
  name: string;
  selection_type: "SINGLE" | "MULTIPLE";
  is_required: boolean;
  display_order: number;
  options: ProductOption[];
};

const TIPO_SELECCION_UNICA = "Selección única";
const TIPO_SELECCION_MULTIPLE = "Selección múltiple";

type ProductForm = {
  name: string;
  categoryId: string;
  price: string;
  description: string;
  imageUrl: string;
  productCode: string;
  status: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
};

const PAGE_SIZE = 8;

const FORM_VACIO: ProductForm = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  imageUrl: "",
  productCode: "",
  status: true,
  isAvailable: true,
  isFeatured: false,
};

const ESTADO_FILTROS = ["Activo", "Inactivo", "Disponible", "Agotado"];

// El primero es el orden por defecto: lo que mas se pidio va arriba,
// que es como cualquier dueno de negocio quiere ver su menu de entrada.
const ORDEN_OPCIONES = [
  "Más vendidos",
  "Menos vendidos",
  "Agregados recientemente",
  "Precio: mayor a menor",
  "Precio: menor a mayor",
  "Nombre (A-Z)",
];

const ordenarProductos = (lista: Product[], orden: string): Product[] => {
  const copia = [...lista];

  switch (orden) {
    case "Menos vendidos":
      return copia.sort((a, b) => a.units_sold - b.units_sold);
    case "Agregados recientemente":
      return copia.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "Precio: mayor a menor":
      return copia.sort((a, b) => Number(b.price) - Number(a.price));
    case "Precio: menor a mayor":
      return copia.sort((a, b) => Number(a.price) - Number(b.price));
    case "Nombre (A-Z)":
      return copia.sort((a, b) => a.product_name.localeCompare(b.product_name));
    case "Más vendidos":
    default:
      return copia.sort((a, b) => b.units_sold - a.units_sold);
  }
};

function RowMenu({
  onEditar,
  onOpciones,
  onEliminar,
}: {
  onEditar: () => void;
  onOpciones: () => void;
  onEliminar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.right - 150 });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!btnRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div className={styles.rowMenu}>
      <button
        type="button"
        ref={btnRef}
        className={styles.iconBtn}
        onClick={toggleOpen}
        aria-label="Mas acciones"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.rowMenuDropdown}
            style={{ top: coords.top, left: coords.left }}
          >
            <button type="button" onClick={() => { setOpen(false); onEditar(); }}>
              Editar
            </button>
            <button type="button" onClick={() => { setOpen(false); onOpciones(); }}>
              Opciones y extras
            </button>
            <button
              type="button"
              className={styles.rowMenuDanger}
              onClick={() => { setOpen(false); onEliminar(); }}
            >
              Eliminar
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ---------- Opciones y extras de un producto (tamanos, extras, etc.) ----------
// Vive aparte del form principal porque necesita un productId real: recien
// se puede editar despues de guardar el producto por primera vez.
function ProductOptionsEditor({
  productId,
  onError,
}: {
  productId: string;
  onError: (mensaje: string) => void;
}) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [nombreGrupo, setNombreGrupo] = useState("");
  const [tipoGrupo, setTipoGrupo] = useState(TIPO_SELECCION_UNICA);
  const [requerido, setRequerido] = useState(false);
  const [creandoGrupo, setCreandoGrupo] = useState(false);

  const [nuevaOpcion, setNuevaOpcion] = useState<
    Record<string, { nombre: string; precio: string }>
  >({});
  const [agregandoOpcionEn, setAgregandoOpcionEn] = useState<string | null>(null);

  const [grupoArrastrado, setGrupoArrastrado] = useState<string | null>(null);
  const [opcionArrastrada, setOpcionArrastrada] = useState<string | null>(null);

  const [editandoGrupoId, setEditandoGrupoId] = useState<string | null>(null);
  const [nombreGrupoEditado, setNombreGrupoEditado] = useState("");
  const [guardandoGrupoId, setGuardandoGrupoId] = useState<string | null>(null);

  const [editandoOpcionId, setEditandoOpcionId] = useState<string | null>(null);
  const [nombreOpcionEditado, setNombreOpcionEditado] = useState("");
  const [guardandoOpcionId, setGuardandoOpcionId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/options`,
        { credentials: "include" },
      );
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crearGrupo = async () => {
    if (!nombreGrupo.trim()) return;

    setCreandoGrupo(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nombreGrupo.trim(),
            selectionType:
              tipoGrupo === TIPO_SELECCION_MULTIPLE ? "MULTIPLE" : "SINGLE",
            isRequired: requerido,
          }),
        },
      );

      if (!res.ok) throw new Error("No se pudo crear el grupo de opciones");

      setNombreGrupo("");
      setTipoGrupo(TIPO_SELECCION_UNICA);
      setRequerido(false);
      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo crear el grupo",
      );
    } finally {
      setCreandoGrupo(false);
    }
  };

  const eliminarGrupo = async (groupId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${groupId}`,
        { method: "DELETE", credentials: "include" },
      );

      if (!res.ok) throw new Error("No se pudo eliminar el grupo");

      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo eliminar el grupo",
      );
    }
  };

  const alternarRequerido = async (group: OptionGroup) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${group.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRequired: !group.is_required }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar el grupo");

      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo actualizar el grupo",
      );
    }
  };

  const abrirEdicionGrupo = (group: OptionGroup) => {
    setEditandoGrupoId(group.id);
    setNombreGrupoEditado(group.name);
  };

  const guardarNombreGrupo = async (groupId: string) => {
    if (!nombreGrupoEditado.trim()) return;

    setGuardandoGrupoId(groupId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${groupId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nombreGrupoEditado.trim() }),
        },
      );

      if (!res.ok) throw new Error("No se pudo renombrar el grupo");

      setEditandoGrupoId(null);
      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo renombrar el grupo",
      );
    } finally {
      setGuardandoGrupoId(null);
    }
  };

  const abrirEdicionOpcion = (option: ProductOption) => {
    setEditandoOpcionId(option.id);
    setNombreOpcionEditado(option.name);
  };

  const guardarNombreOpcion = async (groupId: string, optionId: string) => {
    if (!nombreOpcionEditado.trim()) return;

    setGuardandoOpcionId(optionId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${groupId}/options/${optionId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nombreOpcionEditado.trim() }),
        },
      );

      if (!res.ok) throw new Error("No se pudo renombrar la opción");

      setEditandoOpcionId(null);
      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo renombrar la opción",
      );
    } finally {
      setGuardandoOpcionId(null);
    }
  };

  const agregarOpcion = async (groupId: string) => {
    const datos = nuevaOpcion[groupId];
    if (!datos?.nombre.trim()) return;

    setAgregandoOpcionEn(groupId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${groupId}/options`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: datos.nombre.trim(),
            extraPrice: datos.precio ? Number(datos.precio) : 0,
          }),
        },
      );

      if (!res.ok) throw new Error("No se pudo agregar la opción");

      setNuevaOpcion((prev) => ({ ...prev, [groupId]: { nombre: "", precio: "" } }));
      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo agregar la opción",
      );
    } finally {
      setAgregandoOpcionEn(null);
    }
  };

  const eliminarOpcion = async (groupId: string, optionId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${groupId}/options/${optionId}`,
        { method: "DELETE", credentials: "include" },
      );

      if (!res.ok) throw new Error("No se pudo eliminar la opción");

      await cargar();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo eliminar la opción",
      );
    }
  };

  const moverGrupo = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const actuales = [...groups];
    const desdeIdx = actuales.findIndex((g) => g.id === draggedId);
    const hastaIdx = actuales.findIndex((g) => g.id === targetId);
    if (desdeIdx === -1 || hastaIdx === -1) return;

    const [movido] = actuales.splice(desdeIdx, 1);
    actuales.splice(hastaIdx, 0, movido);
    setGroups(actuales);

    try {
      await Promise.all(
        actuales.map((g, index) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${g.id}`,
            {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayOrder: index }),
            },
          ),
        ),
      );
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo reordenar el grupo",
      );
      await cargar();
    }
  };

  const moverOpcion = async (groupId: string, draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const grupoIdx = groups.findIndex((g) => g.id === groupId);
    if (grupoIdx === -1) return;

    const opciones = [...groups[grupoIdx].options];
    const desdeIdx = opciones.findIndex((o) => o.id === draggedId);
    const hastaIdx = opciones.findIndex((o) => o.id === targetId);
    if (desdeIdx === -1 || hastaIdx === -1) return;

    const [movida] = opciones.splice(desdeIdx, 1);
    opciones.splice(hastaIdx, 0, movida);

    const actuales = [...groups];
    actuales[grupoIdx] = { ...actuales[grupoIdx], options: opciones };
    setGroups(actuales);

    try {
      await Promise.all(
        opciones.map((o, index) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/option-groups/${groupId}/options/${o.id}`,
            {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayOrder: index }),
            },
          ),
        ),
      );
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "No se pudo reordenar la opción",
      );
      await cargar();
    }
  };

  if (loading) {
    return <p className={styles.optionsHint}>Cargando opciones...</p>;
  }

  return (
    <div className={styles.optionsEditor}>
      {groups.map((group) => (
        <div
          key={group.id}
          className={styles.optionGroupCard}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (grupoArrastrado) moverGrupo(grupoArrastrado, group.id);
            setGrupoArrastrado(null);
          }}
        >
          <div className={styles.optionGroupHead}>
            <span
              className={styles.dragHandle}
              draggable
              title="Arrastrar para reordenar"
              onDragStart={() => setGrupoArrastrado(group.id)}
              onDragEnd={() => setGrupoArrastrado(null)}
            >
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
            <div>
              {editandoGrupoId === group.id ? (
                <div className={styles.inlineEditRow}>
                  <input
                    className={styles.inlineEditInput}
                    value={nombreGrupoEditado}
                    autoFocus
                    onChange={(e) => setNombreGrupoEditado(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") guardarNombreGrupo(group.id);
                      if (e.key === "Escape") setEditandoGrupoId(null);
                    }}
                  />
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title="Guardar"
                    disabled={guardandoGrupoId === group.id}
                    onClick={() => guardarNombreGrupo(group.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title="Cancelar"
                    onClick={() => setEditandoGrupoId(null)}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ) : (
                <span className={styles.optionGroupName}>
                  {group.name}
                  <button
                    type="button"
                    className={styles.editPencilBtn}
                    title="Editar nombre del grupo"
                    onClick={() => abrirEdicionGrupo(group)}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                </span>
              )}
              <span className={styles.optionGroupMeta}>
                {group.selection_type === "MULTIPLE"
                  ? TIPO_SELECCION_MULTIPLE
                  : TIPO_SELECCION_UNICA}
                {" · "}
                {group.is_required ? "Obligatorio" : "Opcional"}
              </span>
            </div>
            <div className={styles.optionGroupActions}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => alternarRequerido(group)}
              >
                {group.is_required ? "Hacer opcional" : "Hacer obligatorio"}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                title="Eliminar grupo"
                onClick={() => eliminarGrupo(group.id)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>

          {group.options.length > 0 && (
            <ul className={styles.optionList}>
              {group.options.map((option) => (
                <li
                  key={option.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (opcionArrastrada) moverOpcion(group.id, opcionArrastrada, option.id);
                    setOpcionArrastrada(null);
                  }}
                >
                  <span
                    className={styles.dragHandle}
                    draggable
                    title="Arrastrar para reordenar"
                    onDragStart={() => setOpcionArrastrada(option.id)}
                    onDragEnd={() => setOpcionArrastrada(null)}
                  >
                    <FontAwesomeIcon icon={faGripVertical} />
                  </span>
                  {editandoOpcionId === option.id ? (
                    <div className={styles.inlineEditRow}>
                      <input
                        className={styles.inlineEditInput}
                        value={nombreOpcionEditado}
                        autoFocus
                        onChange={(e) => setNombreOpcionEditado(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") guardarNombreOpcion(group.id, option.id);
                          if (e.key === "Escape") setEditandoOpcionId(null);
                        }}
                      />
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Guardar"
                        disabled={guardandoOpcionId === option.id}
                        onClick={() => guardarNombreOpcion(group.id, option.id)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Cancelar"
                        onClick={() => setEditandoOpcionId(null)}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ) : (
                    <span>
                      {option.name}
                      <button
                        type="button"
                        className={styles.editPencilBtn}
                        title="Editar nombre de la opción"
                        onClick={() => abrirEdicionOpcion(option)}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                    </span>
                  )}
                  <span>
                    {Number(option.extra_price) > 0
                      ? `+RD$${Number(option.extra_price).toLocaleString("es-DO")}`
                      : "Sin costo extra"}
                  </span>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title="Eliminar opción"
                    onClick={() => eliminarOpcion(group.id, option.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.newOptionRow}>
            <input
              placeholder="Ej. Grande"
              value={nuevaOpcion[group.id]?.nombre ?? ""}
              onChange={(e) =>
                setNuevaOpcion((prev) => ({
                  ...prev,
                  [group.id]: { ...prev[group.id], nombre: e.target.value, precio: prev[group.id]?.precio ?? "" },
                }))
              }
            />
            <input
              type="number"
              min="0"
              placeholder="Precio extra"
              value={nuevaOpcion[group.id]?.precio ?? ""}
              onChange={(e) =>
                setNuevaOpcion((prev) => ({
                  ...prev,
                  [group.id]: { nombre: prev[group.id]?.nombre ?? "", precio: e.target.value },
                }))
              }
            />
            <button
              type="button"
              className={styles.addCategoryBtn}
              onClick={() => agregarOpcion(group.id)}
              disabled={
                agregandoOpcionEn === group.id || !nuevaOpcion[group.id]?.nombre.trim()
              }
            >
              {agregandoOpcionEn === group.id ? "..." : "+ Opción"}
            </button>
          </div>
        </div>
      ))}

      <div className={styles.newGroupRow}>
        <input
          placeholder="Nombre del grupo (ej. Tamaño)"
          value={nombreGrupo}
          onChange={(e) => setNombreGrupo(e.target.value)}
        />
        <DFDropdown
          options={[TIPO_SELECCION_UNICA, TIPO_SELECCION_MULTIPLE]}
          value={tipoGrupo}
          onChange={setTipoGrupo}
        />
        <DFCheckbox label="Obligatorio" checked={requerido} onChange={setRequerido} />
        <button
          type="button"
          className={styles.addCategoryBtn}
          onClick={crearGrupo}
          disabled={creandoGrupo || !nombreGrupo.trim()}
        >
          {creandoGrupo ? "..." : "+ Grupo"}
        </button>
      </div>
    </div>
  );
}

type Props = {
  storeId: string;
  onStoreNameLoaded?: (name: string) => void;
};

export default function MenuScreen({ storeId, onStoreNameLoaded }: Props) {
  const { activeStore } = useActiveStore();
  // El selector del sidebar ya tiene el nombre real cargado de antes: se
  // usa como valor inicial para no mostrar "Negocio" mientras se confirma.
  const [storeName, setStoreName] = useState(
    () => (activeStore?.id === storeId ? activeStore.name : "Negocio"),
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orden, setOrden] = useState(ORDEN_OPCIONES[0]);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [optionsPanelOpen, setOptionsPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(FORM_VACIO);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [imagenError, setImagenError] = useState("");
  const [imagenCargada, setImagenCargada] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState(false);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const cargarNombre = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/register-business/edit/${storeId}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (data?.store_name) {
          setStoreName(data.store_name);
          onStoreNameLoaded?.(data.store_name);
        }
      } catch (error) {
        console.error(error);
      }
    };

    cargarNombre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/categories/${storeId}`,
        { credentials: "include" },
      );
      const data = await res.json();
      setCategories(Array.isArray(data?.result) ? data.result : []);
    } catch (error) {
      console.error(error);
    }
  }, [storeId]);

  const cargarDatos = useCallback(
    async (reintentar = true) => {
      setLoading(true);

      try {
        const [resProductos] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/store/${storeId}`, { credentials: "include" }),
          cargarCategorias(),
        ]);

        if (!resProductos.ok) throw new Error("fetch fallido");

        const lista = await resProductos.json();
        setProducts(Array.isArray(lista) ? lista : []);
        setLoadError(false);
      } catch (error) {
        console.error(error);

        if (reintentar) {
          setTimeout(() => cargarDatos(false), 1200);
          return;
        }

        setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [storeId, cargarCategorias],
  );

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const normalize = (text: string) => text.toLowerCase().trim();
  const normalizedSearch = normalize(search);

  const filtered = products.filter((p) => {
    if (normalizedSearch && !normalize(p.product_name).includes(normalizedSearch)) {
      return false;
    }
    if (categoryFilter && p.category_name !== categoryFilter) return false;

    if (statusFilter === "Activo" && p.status === false) return false;
    if (statusFilter === "Inactivo" && p.status !== false) return false;
    if (statusFilter === "Disponible" && !p.is_available) return false;
    if (statusFilter === "Agotado" && p.is_available) return false;

    return true;
  });

  const ordenados = ordenarProductos(filtered, orden);

  const totalPages = Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE));
  const paginaSegura = Math.min(page, totalPages);
  const paginated = ordenados.slice(
    (paginaSegura - 1) * PAGE_SIZE,
    paginaSegura * PAGE_SIZE,
  );

  // ---- Resumen ----
  const totalProductos = products.length;
  const disponibles = products.filter((p) => p.is_available).length;
  const destacados = products.filter((p) => p.is_featured).length;

  // ---- Formulario ----
  const abrirCrear = () => {
    setEditingProduct(null);
    setForm({ ...FORM_VACIO, categoryId: categories[0]?.id ?? "" });
    setFormErrors({});
    setNuevaCategoria(false);
    setNombreNuevaCategoria("");
    setImagenError("");
    setImagenCargada(false);
    setShowModal(true);
  };

  const abrirEditar = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.product_name,
      categoryId: p.category_id,
      price: String(Number(p.price)),
      description: p.description ?? "",
      imageUrl: p.image_url ?? "",
      productCode: p.product_code ?? "",
      status: p.status !== false,
      isAvailable: p.is_available,
      isFeatured: p.is_featured,
    });
    setFormErrors({});
    setNuevaCategoria(false);
    setNombreNuevaCategoria("");
    setImagenError("");
    setImagenCargada(!!p.image_url);
    setShowModal(true);
  };

  // Abre el panel de opciones directo desde el "..." de la fila, sin pasar
  // por el modal de editar producto.
  const abrirOpciones = (p: Product) => {
    setEditingProduct(p);
    setOptionsPanelOpen(true);
  };

  const handleFormChange = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) => {
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const subirImagenProducto = async (file: File) => {
    setSubiendoImagen(true);
    setImagenError("");
    setImagenCargada(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "productos");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      handleFormChange("imageUrl", data.url);
    } catch (err) {
      setImagenError(
        err instanceof Error ? err.message : "No se pudo subir la imagen",
      );
    } finally {
      setSubiendoImagen(false);
    }
  };

  const crearCategoria = async () => {
    if (!nombreNuevaCategoria.trim()) return;

    setCreandoCategoria(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/categories/${storeId}`,
        {
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nombreNuevaCategoria.trim() }),
        },
      );

      const nueva = await res.json();
      if (!res.ok) throw new Error("No se pudo crear la categoria");

      await cargarCategorias();
      handleFormChange("categoryId", nueva.id);
      setNuevaCategoria(false);
      setNombreNuevaCategoria("");
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo crear la categoria",
        type: "danger",
      });
    } finally {
      setCreandoCategoria(false);
    }
  };

  const guardarProducto = async () => {
    const errors: Partial<Record<keyof ProductForm, string>> = {};

    if (!form.name.trim()) errors.name = "El nombre es obligatorio";
    if (!form.categoryId) errors.categoryId = "Elige una categoria";
    if (!form.price.trim() || Number(form.price) < 0) {
      errors.price = "El precio es obligatorio";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    try {
      const esEdicion = editingProduct !== null;
      const url = esEdicion
        ? `${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/products/${storeId}`;

      const res = await fetch(url, {
        credentials: "include",
        method: esEdicion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryId: form.categoryId,
          price: Number(form.price),
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
          productCode: form.productCode.trim() || undefined,
          status: form.status,
          isAvailable: form.isAvailable,
          isFeatured: form.isFeatured,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : data.message,
        );
      }

      setShowModal(false);
      setToast({
        message: esEdicion ? "Producto actualizado" : "Producto agregado",
        type: esEdicion ? "info" : "success",
      });
      cargarDatos();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo guardar",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminarProducto = async () => {
    if (!productToDelete) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productToDelete.id}?storeId=${storeId}`,
        { credentials: "include", method: "DELETE" },
      );

      if (!res.ok) throw new Error("No se pudo eliminar");

      setToast({
        message: `${productToDelete.product_name} fue eliminado`,
        type: "danger",
      });
      cargarDatos();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar",
        type: "danger",
      });
    } finally {
      setDeleting(false);
      setProductToDelete(null);
    }
  };

  const toggleDisponible = async (p: Product) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${p.id}`, {
        credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.product_name,
          categoryId: p.category_id,
          price: Number(p.price),
          description: p.description ?? undefined,
          imageUrl: p.image_url ?? undefined,
          productCode: p.product_code ?? undefined,
          status: p.status !== false,
          isAvailable: !p.is_available,
          isFeatured: p.is_featured,
        }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar");

      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_available: !x.is_available } : x)),
      );
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  const toggleDestacado = async (p: Product) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${p.id}`, {
        credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.product_name,
          categoryId: p.category_id,
          price: Number(p.price),
          description: p.description ?? undefined,
          imageUrl: p.image_url ?? undefined,
          productCode: p.product_code ?? undefined,
          status: p.status !== false,
          isAvailable: p.is_available,
          isFeatured: !p.is_featured,
        }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar");

      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_featured: !x.is_featured } : x)),
      );
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Menú</h1>
          <p>Administra los productos del menú de {storeName}.</p>
        </div>

        {loading ? (
          <SkeletonStatCards count={4} />
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>Productos</div>
                <div className={styles.statValue}>{totalProductos}</div>
                <div className={styles.statSub}>en el menú</div>
              </div>
              <span className={`${styles.statIcon} ${styles.iconBlue}`}>
                <FontAwesomeIcon icon={faBarcode} />
              </span>
            </div>

            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>Disponibles</div>
                <div className={styles.statValue}>{disponibles}</div>
                <div className={styles.statSub}>de {totalProductos} productos</div>
              </div>
              <span className={`${styles.statIcon} ${styles.iconGreen}`}>
                <FontAwesomeIcon icon={faBoxOpen} />
              </span>
            </div>

            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>Destacados</div>
                <div className={styles.statValue}>{destacados}</div>
                <div className={styles.statSub}>marcados manualmente</div>
              </div>
              <span className={`${styles.statIcon} ${styles.iconAmber}`}>
                <FontAwesomeIcon icon={faStar} />
              </span>
            </div>

            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>Categorías</div>
                <div className={styles.statValue}>{categories.length}</div>
                <div className={styles.statSub}>en este negocio</div>
              </div>
              <span className={`${styles.statIcon} ${styles.iconPurple}`}>
                <FontAwesomeIcon icon={faTags} />
              </span>
            </div>
          </div>
        )}

        <div className={styles.filters}>
          <div className={styles.searchField}>
            <DFInput
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar producto"
              icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
            />
          </div>
          <DFDropdown
            options={categories.map((c) => c.name)}
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            placeholder="Todas las categorías"
          />
          <DFDropdown
            options={ESTADO_FILTROS}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            placeholder="Todos los estados"
          />
          <DFDropdown
            options={ORDEN_OPCIONES}
            value={orden}
            onChange={(v) => { setOrden(v); setPage(1); }}
            placeholder="Ordenar por"
          />
          <span className={styles.spacer} />
          <button className={styles.primaryBtn} onClick={abrirCrear}>
            + Producto
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Disponible</th>
                <th>Destacado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={5} columns={7} />
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    No se pudo cargar el menú.
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    {products.length === 0
                      ? "Todavía no hay productos en el menú."
                      : "Ningún producto coincide con ese filtro."}
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.productCell}>
                        {p.image_url ? (
                          <div className={styles.productThumb}>
                            <Image
                              src={p.image_url}
                              alt={p.product_name}
                              fill
                              className={styles.productThumbImg}
                            />
                          </div>
                        ) : (
                          <div className={styles.productIconFallback}>
                            <FontAwesomeIcon icon={faBarcode} />
                          </div>
                        )}
                        <div>
                          <div className={styles.productName}>{p.product_name}</div>
                          {p.is_best_seller && (
                            <div className={styles.bestSeller}>
                              <FontAwesomeIcon icon={faFire} /> Top ventas
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{p.category_name}</td>
                    <td className={styles.price}>
                      RD${Number(p.price).toLocaleString("es-DO")}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          p.status !== false ? styles.badgeActive : styles.badgeInactive
                        }`}
                      >
                        {p.status !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.badge} ${
                          p.is_available ? styles.badgeAvailable : styles.badgeSoldOut
                        }`}
                        style={{ border: "none", cursor: "pointer" }}
                        onClick={() => toggleDisponible(p)}
                      >
                        {p.is_available ? "Disponible" : "Agotado"}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.starBtn} ${p.is_featured ? styles.starActive : ""}`}
                        onClick={() => toggleDestacado(p)}
                        aria-label="Destacar producto"
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </button>
                    </td>
                    <td>
                      <RowMenu
                        onEditar={() => abrirEditar(p)}
                        onOpciones={() => abrirOpciones(p)}
                        onEliminar={() => setProductToDelete(p)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && !loadError && ordenados.length > 0 && (
            <div className={styles.pagination}>
              <span>
                Mostrando {(paginaSegura - 1) * PAGE_SIZE + 1}-
                {Math.min(paginaSegura * PAGE_SIZE, ordenados.length)} de {ordenados.length}
              </span>

              <div className={styles.pageBtns}>
                <button
                  className={styles.pageBtn}
                  disabled={paginaSegura <= 1}
                  onClick={() => setPage(paginaSegura - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.pageBtn} ${
                      paginaSegura === i + 1 ? styles.pageBtnActive : ""
                    }`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className={styles.pageBtn}
                  disabled={paginaSegura >= totalPages}
                  onClick={() => setPage(paginaSegura + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear/editar producto */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setOptionsPanelOpen(false);
        }}
        title={editingProduct ? "Editar producto" : "Nuevo producto"}
        width="480px"
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <input
              value={form.name}
              placeholder="Ej. Pastel de chocolate"
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
            {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Categoría</label>
            <div className={styles.categoryRow}>
              <div>
                <DFDropdown
                  fullWidth
                  options={categories.map((c) => c.name)}
                  value={categories.find((c) => c.id === form.categoryId)?.name ?? ""}
                  onChange={(nombre) => {
                    const cat = categories.find((c) => c.name === nombre);
                    if (cat) handleFormChange("categoryId", cat.id);
                  }}
                  placeholder="Selecciona una categoría"
                  error={formErrors.categoryId}
                />
              </div>
              <button
                type="button"
                className={styles.addCategoryBtn}
                onClick={() => setNuevaCategoria((v) => !v)}
              >
                + Nueva
              </button>
            </div>

            {nuevaCategoria && (
              <div className={styles.newCategoryRow}>
                <input
                  value={nombreNuevaCategoria}
                  placeholder="Nombre de la categoría"
                  onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.addCategoryBtn}
                  onClick={crearCategoria}
                  disabled={creandoCategoria || !nombreNuevaCategoria.trim()}
                >
                  {creandoCategoria ? "..." : "Crear"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Precio</label>
              <input
                type="number"
                min="0"
                value={form.price}
                placeholder="0"
                onChange={(e) => handleFormChange("price", e.target.value)}
              />
              {formErrors.price && <span className={styles.errorText}>{formErrors.price}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Código (opcional)</label>
              <input
                value={form.productCode}
                placeholder="Ej. PZ-001"
                onChange={(e) => handleFormChange("productCode", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Imagen (opcional)</label>
            <div className={styles.imageUploadRow}>
              <div
                className={
                  form.imageUrl ? styles.imagePreview : styles.imagePlaceholder
                }
              >
                {form.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.imageUrl}
                    alt="Imagen del producto"
                    style={{ opacity: imagenCargada ? 1 : 0 }}
                    onLoad={() => setImagenCargada(true)}
                  />
                )}

                {(subiendoImagen || (form.imageUrl && !imagenCargada)) && (
                  <div className={styles.imageLoadingOverlay}>
                    <LoadingDots size="sm" />
                  </div>
                )}

                {!subiendoImagen && !form.imageUrl && (
                  <FontAwesomeIcon icon={faCamera} />
                )}
              </div>

              <div className={styles.imageUploadActions}>
                <label className={styles.uploadImageBtn}>
                  {subiendoImagen ? (
                    <LoadingDots size="sm" />
                  ) : (
                    <FontAwesomeIcon icon={faCamera} />
                  )}
                  {subiendoImagen
                    ? "Subiendo..."
                    : form.imageUrl
                      ? "Cambiar imagen"
                      : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={subiendoImagen}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) subirImagenProducto(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {form.imageUrl && (
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={() => handleFormChange("imageUrl", "")}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Quitar
                  </button>
                )}

                {imagenError && (
                  <span className={styles.errorText}>{imagenError}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción (opcional)</label>
            <textarea
              rows={3}
              value={form.description}
              placeholder="Ingredientes, tamaño, notas..."
              onChange={(e) => handleFormChange("description", e.target.value)}
            />
          </div>

          <div className={styles.toggleRow}>
            <DFCheckbox
              label="Activo"
              checked={form.status}
              onChange={(checked) => handleFormChange("status", checked)}
            />
            <DFCheckbox
              label="Disponible"
              checked={form.isAvailable}
              onChange={(checked) => handleFormChange("isAvailable", checked)}
            />
            <DFCheckbox
              label="Destacado"
              checked={form.isFeatured}
              onChange={(checked) => handleFormChange("isFeatured", checked)}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setShowModal(false);
                setOptionsPanelOpen(false);
              }}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={guardarProducto}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={productToDelete !== null}
        title="Eliminar producto"
        message={
          <>
            ¿Seguro que deseas eliminar{" "}
            <strong>{productToDelete?.product_name}</strong> del menú?
          </>
        }
        note="Se quita del menú de la app. Esta accion no se puede deshacer."
        confirmLabel="Si, eliminar"
        loading={deleting}
        onConfirm={eliminarProducto}
        onCancel={() => setProductToDelete(null)}
      />

      <SidePanel
        open={optionsPanelOpen}
        onClose={() => setOptionsPanelOpen(false)}
        title={
          editingProduct
            ? `Opciones de ${editingProduct.product_name}`
            : "Opciones"
        }
        width="420px"
      >
        {editingProduct && (
          <ProductOptionsEditor
            productId={editingProduct.id}
            onError={(mensaje) => setToast({ message: mensaje, type: "danger" })}
          />
        )}
      </SidePanel>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

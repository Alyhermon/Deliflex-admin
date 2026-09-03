"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminLayout from "../../components/layout/adminLayout";
import Breadcrumb from "../../components/components-items/breadcrumb/breadcrumb";
import DFInput from "../../components/components-items/input";
import DFDropdown from "../../components/components-items/dropdown";
import Modal from "../../components/components/modal/modal";
import ConfirmDialog from "../../components/components/modal/confirm-dialog";
import Toast from "../../components/components-items/toast/toast";
import styles from "./inventory.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faBoxOpen,
  faTriangleExclamation,
  faCubesStacked,
  faSackDollar,
  faBreadSlice,
  faCheese,
  faDrumstickBite,
  faLeaf,
  faEye,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";

type Ingredient = {
  id: string;
  name: string;
  category: string;
  stock: string;
  unit: string;
  min_stock: string;
  unit_cost: string;
  computed_status: "DISPONIBLE" | "STOCK_BAJO" | "AGOTADO";
  last_movement_type: "IN" | "OUT" | null;
  last_movement_quantity: string | null;
  last_movement_at: string | null;
};

type Summary = {
  total: number;
  disponibles: number;
  stockBajo: number;
  agotados: number;
  valorTotal: number;
};

type Movement = {
  id: string;
  type: "IN" | "OUT";
  quantity: string;
  note: string | null;
  created_at: string;
  created_by_name: string | null;
};

type IngredientForm = {
  name: string;
  category: string;
  unit: string;
  stock: string;
  minStock: string;
  unitCost: string;
};

const CATEGORIAS = ["Ingredientes", "Lácteos", "Proteínas", "Verduras", "Otros"];

const ICONO_CATEGORIA: Record<string, typeof faBreadSlice> = {
  Ingredientes: faBreadSlice,
  Lácteos: faCheese,
  Proteínas: faDrumstickBite,
  Verduras: faLeaf,
  Otros: faBoxOpen,
};

const ESTADO_META: Record<
  Ingredient["computed_status"],
  { label: string; badge: string; fill: string }
> = {
  DISPONIBLE: { label: "Disponible", badge: "badgeDisponible", fill: "fillGreen" },
  STOCK_BAJO: { label: "Stock bajo", badge: "badgeStockBajo", fill: "fillAmber" },
  AGOTADO: { label: "Agotado", badge: "badgeAgotado", fill: "fillRed" },
};

const ESTADO_FILTROS = ["Disponible", "Stock bajo", "Agotado"];

const PAGE_SIZE = 7;

const FORM_VACIO: IngredientForm = {
  name: "",
  category: "Ingredientes",
  unit: "",
  stock: "0",
  minStock: "",
  unitCost: "0",
};

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function RowMenu({
  onEditar,
  onEliminar,
}: {
  onEditar: () => void;
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

export default function StoreInventoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  const [storeName, setStoreName] = useState("Negocio");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    disponibles: 0,
    stockBajo: 0,
    agotados: 0,
    valorTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<IngredientForm>(FORM_VACIO);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof IngredientForm, string>>>({});
  const [savingIngredient, setSavingIngredient] = useState(false);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementIngredientId, setMovementIngredientId] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [movementQty, setMovementQty] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [movementError, setMovementError] = useState("");
  const [savingMovement, setSavingMovement] = useState(false);

  const [detailIngredient, setDetailIngredient] = useState<Ingredient | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);
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
          `http://localhost:3001/register-business/edit/${storeId}`,
        );
        const data = await res.json();
        if (data?.store_name) setStoreName(data.store_name);
      } catch (error) {
        console.error(error);
      }
    };

    cargarNombre();
  }, [storeId]);

  const cargarDatos = useCallback(
    async (reintentar = true) => {
      setLoading(true);

      try {
        const [resLista, resResumen] = await Promise.all([
          fetch(`http://localhost:3001/inventory/store/${storeId}`),
          fetch(`http://localhost:3001/inventory/summary/${storeId}`),
        ]);

        if (!resLista.ok || !resResumen.ok) throw new Error("fetch fallido");

        const lista = await resLista.json();
        const resumen = await resResumen.json();

        setIngredients(Array.isArray(lista) ? lista : []);
        setSummary(resumen);
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
    [storeId],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const normalize = (t: string) => t.toLowerCase().trim();
  const normalizedSearch = normalize(search);

  const filtered = ingredients
    .filter((i) =>
      normalizedSearch ? normalize(i.name).includes(normalizedSearch) : true,
    )
    .filter((i) => (categoryFilter ? i.category === categoryFilter : true))
    .filter((i) =>
      statusFilter
        ? ESTADO_META[i.computed_status].label === statusFilter
        : true,
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginaSegura = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (paginaSegura - 1) * PAGE_SIZE,
    paginaSegura * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  // ---- Crear / editar ingrediente ----
  const abrirCrear = () => {
    setEditingIngredient(null);
    setForm(FORM_VACIO);
    setFormErrors({});
    setShowIngredientModal(true);
  };

  const abrirEditar = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setForm({
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      stock: ing.stock,
      minStock: ing.min_stock,
      unitCost: ing.unit_cost,
    });
    setFormErrors({});
    setShowIngredientModal(true);
  };

  const handleFormChange = <K extends keyof IngredientForm>(
    key: K,
    value: IngredientForm[K],
  ) => {
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const guardarIngrediente = async () => {
    const errors: Partial<Record<keyof IngredientForm, string>> = {};

    if (!form.name.trim()) errors.name = "El nombre es obligatorio";
    if (!form.unit.trim()) errors.unit = "La unidad es obligatoria (kg, L, und...)";
    if (!form.minStock.trim() || Number(form.minStock) < 0) {
      errors.minStock = "El stock minimo es obligatorio";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingIngredient(true);

    try {
      const esEdicion = editingIngredient !== null;
      const url = esEdicion
        ? `http://localhost:3001/inventory/${editingIngredient!.id}?storeId=${storeId}`
        : `http://localhost:3001/inventory/store/${storeId}`;

      const res = await fetch(url, {
        method: esEdicion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          unit: form.unit.trim(),
          stock: esEdicion ? undefined : Number(form.stock || 0),
          minStock: Number(form.minStock),
          unitCost: Number(form.unitCost || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : data.message,
        );
      }

      setShowIngredientModal(false);
      setToast({
        message: esEdicion ? "Ingrediente actualizado" : "Ingrediente agregado",
        type: esEdicion ? "info" : "success",
      });
      cargarDatos();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo guardar",
        type: "danger",
      });
    } finally {
      setSavingIngredient(false);
    }
  };

  const eliminarIngrediente = async () => {
    if (!ingredientToDelete) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `http://localhost:3001/inventory/${ingredientToDelete.id}?storeId=${storeId}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error("No se pudo eliminar");

      setToast({
        message: `${ingredientToDelete.name} fue eliminado`,
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
      setIngredientToDelete(null);
    }
  };

  // ---- Movimiento ----
  const abrirMovimiento = (ingredientId?: string) => {
    setMovementIngredientId(ingredientId ?? ingredients[0]?.id ?? "");
    setMovementType("IN");
    setMovementQty("");
    setMovementNote("");
    setMovementError("");
    setShowMovementModal(true);
  };

  const registrarMovimiento = async () => {
    const cantidad = Number(movementQty);

    if (!movementIngredientId) {
      setMovementError("Elige un ingrediente");
      return;
    }

    if (!movementQty || cantidad <= 0) {
      setMovementError("La cantidad debe ser mayor que 0");
      return;
    }

    setSavingMovement(true);
    setMovementError("");

    try {
      const res = await fetch(
        `http://localhost:3001/inventory/store/${storeId}/movement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredientId: movementIngredientId,
            type: movementType,
            quantity: cantidad,
            note: movementNote.trim() || undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : data.message,
        );
      }

      setShowMovementModal(false);
      setToast({
        message:
          movementType === "IN" ? "Entrada registrada" : "Salida registrada",
        type: "success",
      });
      cargarDatos();
    } catch (error) {
      setMovementError(
        error instanceof Error ? error.message : "No se pudo registrar",
      );
    } finally {
      setSavingMovement(false);
    }
  };

  // ---- Detalle / historial ----
  const abrirDetalle = async (ing: Ingredient) => {
    setDetailIngredient(ing);
    setLoadingMovements(true);

    try {
      const res = await fetch(
        `http://localhost:3001/inventory/${ing.id}/movements?storeId=${storeId}`,
      );
      const data = await res.json();
      setMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Inventario", href: "/inventory" },
            { label: storeName },
          ]}
        />

        <div className={styles.header}>
          <h1>Inventario</h1>
          <p>Administra y controla el inventario de {storeName} en tiempo real.</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>Disponibles</div>
              <div className={styles.statValue}>{summary.disponibles}</div>
              <div className={styles.statSub}>de {summary.total} productos</div>
            </div>
            <span className={`${styles.statIcon} ${styles.iconGreen}`}>
              <FontAwesomeIcon icon={faCubesStacked} />
            </span>
          </div>

          <div className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>Stock bajo</div>
              <div className={styles.statValue}>{summary.stockBajo}</div>
              <div className={styles.statSub}>productos</div>
            </div>
            <span className={`${styles.statIcon} ${styles.iconAmber}`}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </span>
          </div>

          <div className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>Agotados</div>
              <div className={styles.statValue}>{summary.agotados}</div>
              <div className={styles.statSub}>productos</div>
            </div>
            <span className={`${styles.statIcon} ${styles.iconRed}`}>
              <FontAwesomeIcon icon={faBoxOpen} />
            </span>
          </div>

          <div className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>Valor total inventario</div>
              <div className={styles.statValue}>
                ${summary.valorTotal.toLocaleString("es-DO")}
              </div>
              <div className={styles.statSub}>valor estimado</div>
            </div>
            <span className={`${styles.statIcon} ${styles.iconPurple}`}>
              <FontAwesomeIcon icon={faSackDollar} />
            </span>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchField}>
            <DFInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar"
              icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
            />
          </div>
          <DFDropdown
            options={CATEGORIAS}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Todas las categorías"
          />
          <DFDropdown
            options={ESTADO_FILTROS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Todos los estados"
          />
          <span className={styles.spacer} />
          <button className={styles.secondaryBtn} onClick={abrirCrear}>
            + Ingrediente
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => abrirMovimiento()}
            disabled={ingredients.length === 0}
          >
            + Nuevo movimiento
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto / Ingrediente</th>
                <th>Categoría</th>
                <th>Stock disponible</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
                <th>Último movimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    Cargando...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    No se pudo cargar el inventario.{" "}
                    <button
                      type="button"
                      onClick={() => cargarDatos()}
                      style={{
                        color: "#ff7a00",
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    Todavía no hay ingredientes registrados.
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    Nadie coincide con ese filtro
                  </td>
                </tr>
              ) : (
                paginated.map((ing) => {
                  const estado = ESTADO_META[ing.computed_status];
                  const pct = Math.min(
                    100,
                    Math.round(
                      (Number(ing.stock) / Math.max(1, Number(ing.min_stock))) * 100,
                    ),
                  );

                  return (
                    <tr key={ing.id}>
                      <td>
                        <div className={styles.productCell}>
                          <span className={styles.productIcon}>
                            <FontAwesomeIcon
                              icon={ICONO_CATEGORIA[ing.category] || faBoxOpen}
                            />
                          </span>
                          <span className={styles.productName}>{ing.name}</span>
                        </div>
                      </td>
                      <td>{ing.category}</td>
                      <td className={styles.stockCell}>
                        <div className={styles.stockTop}>
                          <span className={styles.stockValue}>
                            {Number(ing.stock)} {ing.unit}
                          </span>
                          <span className={styles.stockPct}>{pct}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div
                            className={`${styles.progressFill} ${styles[estado.fill]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        {Number(ing.min_stock)} {ing.unit}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[estado.badge]}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td>
                        {ing.last_movement_at ? (
                          <>
                            <div className={styles.movementDate}>
                              {fechaHora(ing.last_movement_at)}
                            </div>
                            <div
                              className={`${styles.movementDetail} ${
                                ing.last_movement_type === "IN"
                                  ? styles.movementIn
                                  : styles.movementOut
                              }`}
                            >
                              {ing.last_movement_type === "IN" ? "Entrada" : "Salida"}
                              : {ing.last_movement_type === "IN" ? "+" : "-"}
                              {Number(ing.last_movement_quantity)} {ing.unit}
                            </div>
                          </>
                        ) : (
                          <span className={styles.noMovement}>Sin movimientos</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => abrirDetalle(ing)}
                            aria-label="Ver detalle"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <RowMenu
                            onEditar={() => abrirEditar(ing)}
                            onEliminar={() => setIngredientToDelete(ing)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && !loadError && filtered.length > 0 && (
            <div className={styles.pagination}>
              <span>
                Mostrando {(paginaSegura - 1) * PAGE_SIZE + 1} a{" "}
                {Math.min(paginaSegura * PAGE_SIZE, filtered.length)} de{" "}
                {filtered.length} resultados
              </span>

              <div className={styles.pageBtns}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(0, 6)
                  .map((n) => (
                    <button
                      key={n}
                      className={`${styles.pageBtn} ${
                        n === paginaSegura ? styles.pageBtnActive : ""
                      }`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}

                <button
                  className={styles.pageBtn}
                  disabled={paginaSegura >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crear / editar ingrediente */}
      <Modal
        isOpen={showIngredientModal}
        onClose={() => setShowIngredientModal(false)}
        title={editingIngredient ? "Editar ingrediente" : "Nuevo ingrediente"}
        width="480px"
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <input
              value={form.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
            {formErrors.name && (
              <span className={styles.errorText}>{formErrors.name}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Categoría</label>
              <DFDropdown
                fullWidth
                options={CATEGORIAS}
                value={form.category}
                onChange={(v) => handleFormChange("category", v)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Unidad</label>
              <input
                value={form.unit}
                placeholder="kg, L, und..."
                onChange={(e) =>
                  handleFormChange("unit", e.target.value.replace(/[0-9]/g, ""))
                }
              />
              {formErrors.unit && (
                <span className={styles.errorText}>{formErrors.unit}</span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            {!editingIngredient && (
              <div className={styles.field}>
                <label className={styles.label}>Stock inicial</label>
                <div className={styles.inputWithUnit}>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => handleFormChange("stock", e.target.value)}
                  />
                  <span className={styles.inputUnitTag}>
                    {form.unit || "unidad"}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Stock mínimo</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => handleFormChange("minStock", e.target.value)}
                />
                <span className={styles.inputUnitTag}>
                  {form.unit || "unidad"}
                </span>
              </div>
              {formErrors.minStock && (
                <span className={styles.errorText}>{formErrors.minStock}</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Costo por unidad</label>
              <input
                type="number"
                min={0}
                value={form.unitCost}
                onChange={(e) => handleFormChange("unitCost", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowIngredientModal(false)}
              disabled={savingIngredient}
            >
              Cancelar
            </button>
            <button
              className={styles.submitBtn}
              onClick={guardarIngrediente}
              disabled={savingIngredient}
            >
              {savingIngredient ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Nuevo movimiento */}
      <Modal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title="Nuevo movimiento"
        width="440px"
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Ingrediente</label>
            <DFDropdown
              fullWidth
              options={ingredients.map((i) => i.name)}
              value={
                ingredients.find((i) => i.id === movementIngredientId)?.name ?? ""
              }
              onChange={(nombre) => {
                const ing = ingredients.find((i) => i.name === nombre);
                if (ing) setMovementIngredientId(ing.id);
              }}
            />
          </div>

          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${
                movementType === "IN" ? styles.typeBtnInActive : ""
              }`}
              onClick={() => setMovementType("IN")}
            >
              Entrada
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${
                movementType === "OUT" ? styles.typeBtnOutActive : ""
              }`}
              onClick={() => setMovementType("OUT")}
            >
              Salida
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cantidad</label>
            <input
              type="number"
              min={0}
              value={movementQty}
              onChange={(e) => {
                setMovementError("");
                setMovementQty(e.target.value);
              }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nota (opcional)</label>
            <input
              value={movementNote}
              placeholder="Ej. compra a proveedor, merma..."
              onChange={(e) => setMovementNote(e.target.value)}
            />
          </div>

          {movementError && (
            <span className={styles.errorText}>{movementError}</span>
          )}

          <div className={styles.modalActions}>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowMovementModal(false)}
              disabled={savingMovement}
            >
              Cancelar
            </button>
            <button
              className={styles.submitBtn}
              onClick={registrarMovimiento}
              disabled={savingMovement}
            >
              {savingMovement ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detalle / historial */}
      <Modal
        isOpen={detailIngredient !== null}
        onClose={() => setDetailIngredient(null)}
        title={detailIngredient?.name || "Detalle"}
        width="440px"
      >
        {detailIngredient && (
          <div>
            <p style={{ margin: "0 0 14px", color: "#6b7280", fontSize: 13.5 }}>
              {detailIngredient.category} · Stock actual:{" "}
              <strong>
                {Number(detailIngredient.stock)} {detailIngredient.unit}
              </strong>
            </p>

            {loadingMovements ? (
              <p className={styles.cargando}>Cargando historial...</p>
            ) : movements.length === 0 ? (
              <p className={styles.noMovement}>
                Todavía no hay movimientos para este ingrediente.
              </p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className={styles.historyItem}>
                  <div>
                    <div
                      className={
                        m.type === "IN" ? styles.movementIn : styles.movementOut
                      }
                    >
                      {m.type === "IN" ? "+" : "-"}
                      {Number(m.quantity)} {detailIngredient.unit}
                      {m.note ? ` · ${m.note}` : ""}
                    </div>
                    <div className={styles.historyMeta}>
                      {fechaHora(m.created_at)}
                      {m.created_by_name ? ` · ${m.created_by_name}` : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={ingredientToDelete !== null}
        title="Eliminar ingrediente"
        message={
          <>
            ¿Seguro que deseas eliminar{" "}
            <strong>{ingredientToDelete?.name}</strong>?
          </>
        }
        note="Se borra tambien su historial de movimientos."
        confirmLabel="Si, eliminar"
        loading={deleting}
        onConfirm={eliminarIngrediente}
        onCancel={() => setIngredientToDelete(null)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}

"use client";

import styles from "./promotion.module.css";
import { use, useCallback, useEffect, useState } from "react";
import Breadcrumb from "../../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../../components/layout/adminLayout";
import Dropdown from "../../../components/components-items/dropdown";
import DatePicker from "@/app/components/components-items/datepicker";
import TimePicker from "@/app/components/components-items/timepicker";
import DFCheckbox from "@/app/components/components-items/checkbox/checkbox";
import Toast from "@/app/components/components-items/toast/toast";
import ConfirmDialog from "@/app/components/components/modal/confirm-dialog";
import { useRouter } from "next/navigation";
import { mapProductFromApi } from "../maps/product.mapper";
import { Product } from "@/app/types/products";

type Category = {
  id: string;
  name: string;
};

type Promotion = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  value: string | null;
  category_name: string | null;
  product_name: string | null;
  product_image_url: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_running: boolean;
};

// Sobre que aplica la promocion.
type Alcance = "categoria" | "producto" | "nuevo";

type PromotionForm = {
  type: string;
  alcance: Alcance;
  name: string;
  description: string;
  value: string;
  categoryName: string;
  productName: string;
  imageUrl: string;
  minOrder: string;
  maxAmount: string;
  startsAt: string;
  startsTime: string;
  endsAt: string;
  endsTime: string;
  conHoras: boolean;
  showOnHome: boolean;
  showOnMenu: boolean;
  notifyCustomers: boolean;
};

type FormErrors = {
  name?: string;
  value?: string;
  fechas?: string;
  alcance?: string;
};

const TIPOS = [
  { id: "discount", title: "Descuento", desc: "Porcentaje sobre el precio" },
  { id: "2x1", title: "2x1", desc: "Lleva 2 y paga 1" },
  { id: "delivery", title: "Envío gratis", desc: "Sin costo de delivery" },
  { id: "combo", title: "Combo especial", desc: "Precio especial" },
  { id: "custom", title: "Personalizado", desc: "Reglas propias" },
];

const ALCANCES: { id: Alcance; title: string; desc: string }[] = [
  {
    id: "categoria",
    title: "Todo el menú o una categoría",
    desc: "Aplica a varios productos a la vez",
  },
  {
    id: "producto",
    title: "Un producto existente",
    desc: "Usa la foto y el nombre del producto",
  },
  {
    id: "nuevo",
    title: "Un producto nuevo",
    desc: "Todavía no está en el menú: sube su imagen",
  },
];

const TODO_EL_MENU = "Todo el menú";

const FORM_VACIO: PromotionForm = {
  type: "discount",
  alcance: "categoria",
  name: "",
  description: "",
  value: "",
  categoryName: TODO_EL_MENU,
  productName: "",
  imageUrl: "",
  minOrder: "",
  maxAmount: "",
  startsAt: "",
  startsTime: "8:00 AM",
  endsAt: "",
  endsTime: "11:00 PM",
  conHoras: false,
  showOnHome: false,
  showOnMenu: false,
  notifyCustomers: false,
};

export default function PromotionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [storeName, setStoreName] = useState("Negocio");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [form, setForm] = useState<PromotionForm>(FORM_VACIO);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const handleChange = <K extends keyof PromotionForm>(
    name: K,
    value: PromotionForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!id) return;

    const loadStore = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/register-business/${id}`,
        );

        const data = await res.json();
        const stores = Array.isArray(data) ? data : data.data || [];

        const foundStore = stores.find(
          (store: { id: string }) => store.id === id,
        );

        if (foundStore) setStoreName(foundStore.name);
      } catch (error) {
        console.error(error);
      }
    };

    const loadCategories = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/products/categories/${id}`,
        );

        const data = await res.json();

        setCategories(data.result ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    const loadProducts = async () => {
      try {
        const res = await fetch(`http://localhost:3001/products/store/${id}`);
        const data = await res.json();
        const lista = Array.isArray(data) ? data : data.data || [];

        setProducts(lista.map(mapProductFromApi));
      } catch (error) {
        console.error(error);
      }
    };

    loadStore();
    loadCategories();
    loadProducts();
  }, [id]);

  const [promotionsError, setPromotionsError] = useState(false);

  // Si falla (el backend recompilando con nest --watch tarda un instante en
  // volver a aceptar conexiones), se reintenta una vez solo antes de rendirse.
  // Al fallar NO se vacia la lista: "no se pudo cargar" no es lo mismo que
  // "no hay promociones", y mostrarlas igual confundia una cosa con la otra.
  const loadPromotions = useCallback(
    async (reintentar = true) => {
      try {
        const res = await fetch(`http://localhost:3001/promotions/store/${id}`);
        const data = await res.json();

        setPromotions(Array.isArray(data) ? data : []);
        setPromotionsError(false);
      } catch (error) {
        console.error(error);

        if (reintentar) {
          setTimeout(() => loadPromotions(false), 1200);
          return;
        }

        setPromotionsError(true);
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) loadPromotions();
  }, [id, loadPromotions]);

  // El descuento es el unico tipo que necesita un porcentaje.
  const necesitaValor = form.type === "discount";

  const productoElegido = products.find((p) => p.name === form.productName);

  // Que imagen se ve: la del producto elegido o la que subio el negocio.
  const imagenPrevia =
    form.alcance === "producto"
      ? productoElegido?.imageUrl || ""
      : form.imageUrl;

  const subirImagen = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "promociones");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      handleChange("imageUrl", data.url);
      setErrors((prev) => ({ ...prev, alcance: undefined }));
      setToast({ message: "Imagen subida correctamente", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error ? error.message : "No se pudo subir la imagen",
        type: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  // Junta la fecha (YYYY-MM-DD) con la hora ("8:00 AM") en un instante real.
  // Sin horas, el dia arranca a las 00:00.
  const combinar = (fecha: string, hora: string) => {
    if (!fecha) return undefined;

    const [year, month, day] = fecha.split("-").map(Number);
    const leida = form.conHoras
      ? hora.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      : null;

    let horas = 0;
    let minutos = 0;

    if (leida) {
      horas = Number(leida[1]) % 12;
      minutos = Number(leida[2]);

      if (leida[3].toUpperCase() === "PM") horas += 12;
    }

    return new Date(year, month - 1, day, horas, minutos).toISOString();
  };

  const handleSubmit = async () => {
    const nextErrors: FormErrors = {};

    // Con un producto existente el nombre se puede heredar del producto.
    const nombreFinal = form.name.trim() || productoElegido?.name || "";

    if (!nombreFinal) {
      nextErrors.name = "El nombre es obligatorio";
    }

    if (necesitaValor) {
      const valor = Number(form.value);

      if (!form.value.trim()) {
        nextErrors.value = "El descuento es obligatorio";
      } else if (Number.isNaN(valor) || valor <= 0 || valor > 100) {
        nextErrors.value = "Debe ser un porcentaje entre 1 y 100";
      }
    }

    if (form.alcance === "producto" && !productoElegido) {
      nextErrors.alcance = "Elige el producto al que aplica";
    }

    if (form.alcance === "nuevo" && !form.imageUrl) {
      nextErrors.alcance = "Sube la imagen del producto nuevo";
    }

    const inicio = combinar(form.startsAt, form.startsTime);
    const fin = combinar(form.endsAt, form.endsTime);

    if (inicio && fin && fin <= inicio) {
      nextErrors.fechas = form.conHoras
        ? "El fin debe ser posterior al inicio"
        : "La fecha de fin debe ser posterior a la de inicio";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      const categoria = categories.find((c) => c.name === form.categoryName);

      const res = await fetch(`http://localhost:3001/promotions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: nombreFinal,
          description: form.description.trim() || undefined,
          value: necesitaValor ? Number(form.value) : undefined,
          categoryId:
            form.alcance === "categoria" ? categoria?.id : undefined,
          productId:
            form.alcance === "producto" ? productoElegido?.id : undefined,
          imageUrl: form.alcance === "nuevo" ? form.imageUrl : undefined,
          minOrder: form.minOrder ? Number(form.minOrder) : undefined,
          maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
          startsAt: inicio,
          endsAt: fin,
          showOnHome: form.showOnHome,
          showOnMenu: form.showOnMenu,
          notifyCustomers: form.notifyCustomers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : data.message,
        );
      }

      setForm(FORM_VACIO);
      setToast({ message: "Promoción creada correctamente", type: "success" });
      loadPromotions();
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "No se pudo crear la promoción",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePromotion = async () => {
    if (!promotionToDelete) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `http://localhost:3001/promotions/${promotionToDelete.id}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error("No se pudo eliminar");

      setPromotionToDelete(null);
      setToast({
        message: "Promoción eliminada correctamente",
        type: "danger",
      });
      loadPromotions();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const estadoDe = (promotion: Promotion) => {
    if (!promotion.is_active) return { texto: "Pausada", clase: styles.pill };

    if (promotion.ends_at && new Date(promotion.ends_at) < new Date()) {
      return { texto: "Vencida", clase: styles.pill };
    }

    if (promotion.starts_at && new Date(promotion.starts_at) > new Date()) {
      return { texto: "Programada", clase: styles.pillSoon };
    }

    return { texto: "Activa", clase: styles.pillActive };
  };

  const etiquetaTipo = (tipo: string) =>
    TIPOS.find((t) => t.id === tipo)?.title ?? tipo;

  const alcanceDe = (promotion: Promotion) =>
    promotion.product_name ||
    promotion.category_name ||
    (promotion.image_url ? "Producto nuevo" : "Todo el menú");

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Tiendas", href: "/stores" },
            { label: storeName, href: `/stores/${id}` },
            { label: "Promociones" },
          ]}
        />

        <div className={styles.header}>
          <h1>Crear promoción</h1>
          <p>
            Impulsa más ventas creando promociones atractivas para tus clientes.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.form}>
            <section className={styles.section}>
              <h3>
                <span className={styles.step}>1</span> Tipo de promoción
              </h3>

              <div className={styles.grid}>
                {TIPOS.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.card} ${
                      form.type === item.id ? styles.active : ""
                    }`}
                    onClick={() => handleChange("type", item.id)}
                  >
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h3>
                <span className={styles.step}>2</span> ¿Sobre qué aplica?
              </h3>

              <div className={styles.grid}>
                {ALCANCES.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.card} ${
                      form.alcance === item.id ? styles.active : ""
                    }`}
                    onClick={() => {
                      setErrors((prev) => ({ ...prev, alcance: undefined }));
                      handleChange("alcance", item.id);
                    }}
                  >
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className={styles.alcanceBox}>
                {form.alcance === "categoria" && (
                  <Dropdown
                    fullWidth
                    options={[TODO_EL_MENU, ...categories.map((c) => c.name)]}
                    value={form.categoryName}
                    onChange={(value) => handleChange("categoryName", value)}
                    placeholder="Aplica a"
                  />
                )}

                {form.alcance === "producto" && (
                  <Dropdown
                    fullWidth
                    error={errors.alcance}
                    options={products.map((p) => p.name)}
                    value={form.productName}
                    onChange={(value) => {
                      setErrors((prev) => ({ ...prev, alcance: undefined }));
                      handleChange("productName", value);
                    }}
                    placeholder="Elige el producto"
                  />
                )}

                {form.alcance === "nuevo" && (
                  <div>
                    <label className={styles.upload}>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) subirImagen(file);
                        }}
                      />
                      {uploading
                        ? "Subiendo imagen..."
                        : form.imageUrl
                          ? "Cambiar imagen"
                          : "Subir imagen del producto"}
                    </label>

                    {errors.alcance && (
                      <span className={styles.errorText}>{errors.alcance}</span>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={styles.section}>
              <h3>
                <span className={styles.step}>3</span> Detalles de la promoción
              </h3>

              <div className={styles.row}>
                <div className={styles.field}>
                  <input
                    className={errors.name ? styles.inputError : ""}
                    placeholder={
                      productoElegido
                        ? `Opcional: se usará "${productoElegido.name}"`
                        : "Nombre de la promoción"
                    }
                    value={form.name}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                      handleChange("name", e.target.value);
                    }}
                  />
                  {errors.name && (
                    <span className={styles.errorText}>{errors.name}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <input
                    placeholder="Descripción (opcional)"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className={errors.value ? styles.inputError : ""}
                    placeholder={
                      necesitaValor ? "Descuento (%)" : "No aplica a este tipo"
                    }
                    disabled={!necesitaValor}
                    value={form.value}
                    // El teclado tambien puede meter el signo: se filtra aqui.
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, value: undefined }));
                      handleChange(
                        "value",
                        e.target.value.replace(/[^0-9.]/g, ""),
                      );
                    }}
                  />
                  {errors.value && (
                    <span className={styles.errorText}>{errors.value}</span>
                  )}
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3>
                <span className={styles.step}>4</span> Condiciones
              </h3>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Pedido mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.minOrder}
                    onChange={(e) => handleChange("minOrder", e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Monto máximo</label>
                  <input
                    type="number"
                    placeholder="Sin límite"
                    value={form.maxAmount}
                    onChange={(e) => handleChange("maxAmount", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Válido desde</label>

                  <div className={styles.fechaHora}>
                    <DatePicker
                      value={form.startsAt}
                      placeholder="Desde siempre"
                      onChange={(value) => {
                        setErrors((prev) => ({ ...prev, fechas: undefined }));
                        handleChange("startsAt", value);
                      }}
                    />

                    {form.conHoras && (
                      <TimePicker
                        value={form.startsTime}
                        onChange={(value) => {
                          setErrors((prev) => ({ ...prev, fechas: undefined }));
                          handleChange("startsTime", value);
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Válido hasta</label>

                  <div className={styles.fechaHora}>
                    <DatePicker
                      value={form.endsAt}
                      placeholder="Sin vencimiento"
                      error={errors.fechas}
                      onChange={(value) => {
                        setErrors((prev) => ({ ...prev, fechas: undefined }));
                        handleChange("endsAt", value);
                      }}
                    />

                    {form.conHoras && (
                      <TimePicker
                        value={form.endsTime}
                        onChange={(value) => {
                          setErrors((prev) => ({ ...prev, fechas: undefined }));
                          handleChange("endsTime", value);
                        }}
                      />
                    )}
                  </div>

                  {errors.fechas && (
                    <span className={styles.errorText}>{errors.fechas}</span>
                  )}
                </div>
              </div>

              <div className={styles.switchHoras}>
                <DFCheckbox
                  label="Agregar horas"
                  checked={form.conHoras}
                  onChange={(checked) => {
                    setErrors((prev) => ({ ...prev, fechas: undefined }));
                    handleChange("conHoras", checked);
                  }}
                />
              </div>

              <p className={styles.hint}>
                {form.conHoras
                  ? "La promoción arranca y termina a la hora exacta que indiques."
                  : "Sin horas la promoción cubre los días completos. Si dejas las fechas vacías, corre desde ya y no vence."}
              </p>
            </section>

            <section className={styles.section}>
              <h3>
                <span className={styles.step}>5</span> Visibilidad
              </h3>

              <div className={styles.checks}>
                <DFCheckbox
                  label="Página principal"
                  checked={form.showOnHome}
                  onChange={(checked) => handleChange("showOnHome", checked)}
                />
                <DFCheckbox
                  label="Menú"
                  checked={form.showOnMenu}
                  onChange={(checked) => handleChange("showOnMenu", checked)}
                />
                <DFCheckbox
                  label="Notificar clientes"
                  checked={form.notifyCustomers}
                  onChange={(checked) =>
                    handleChange("notifyCustomers", checked)
                  }
                />
              </div>
            </section>

            <div className={styles.actions}>
              <button
                className={styles.cancel}
                onClick={() => router.push(`/stores/${id}`)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className={styles.submit}
                onClick={handleSubmit}
                disabled={saving || uploading}
              >
                {saving ? "Guardando..." : "Crear promoción"}
              </button>
            </div>
          </div>

          <div className={styles.preview}>
            <h4>Vista previa</h4>

            <div className={styles.cardPreview}>
              <div className={styles.badge}>
                {form.type === "discount" && form.value
                  ? `${form.value}%`
                  : etiquetaTipo(form.type)}
              </div>

              {imagenPrevia ? (
                <img
                  src={imagenPrevia}
                  alt={form.name || "Promoción"}
                  className={styles.promoImg}
                />
              ) : (
                <div className={styles.previewImage}>Sin imagen</div>
              )}

              <div className={styles.info}>
                <h5>
                  {form.name ||
                    productoElegido?.name ||
                    "Nombre de la promoción"}
                </h5>
                <p>
                  {form.description ||
                    (form.alcance === "producto" && productoElegido
                      ? productoElegido.categoryName
                      : form.alcance === "nuevo"
                        ? "Producto nuevo"
                        : `Aplica a ${form.categoryName.toLowerCase()}`)}
                </p>
                <button type="button">Ver productos</button>
              </div>
            </div>

            <div className={styles.list}>
              <h4>Promociones del negocio</h4>

              {promotionsError ? (
                <div className={styles.empty}>
                  No se pudieron cargar las promociones.{" "}
                  <button
                    type="button"
                    className={styles.retryLink}
                    onClick={() => loadPromotions()}
                  >
                    Reintentar
                  </button>
                </div>
              ) : promotions.length === 0 ? (
                <p className={styles.empty}>Todavía no hay promociones.</p>
              ) : (
                promotions.map((promotion) => {
                  const estado = estadoDe(promotion);
                  const imagen =
                    promotion.product_image_url || promotion.image_url;

                  return (
                    <div key={promotion.id} className={styles.listItem}>
                      <div className={styles.listLeft}>
                        {imagen && (
                          <img
                            src={imagen}
                            alt={promotion.name}
                            className={styles.listImg}
                          />
                        )}

                        <div>
                          <span className={styles.listName}>
                            {promotion.name}
                          </span>
                          <span className={styles.listMeta}>
                            {etiquetaTipo(promotion.type)}
                            {promotion.value ? ` · ${promotion.value}%` : ""}
                            {` · ${alcanceDe(promotion)}`}
                          </span>
                        </div>
                      </div>

                      <div className={styles.listRight}>
                        <span className={estado.clase}>{estado.texto}</span>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setPromotionToDelete(promotion)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <ConfirmDialog
          isOpen={promotionToDelete !== null}
          title="Eliminar promoción"
          message={
            <>
              ¿Seguro que deseas eliminar{" "}
              <strong>{promotionToDelete?.name}</strong>?
            </>
          }
          note="Dejará de aplicarse en la tienda y en la app."
          confirmLabel="Si, eliminar"
          loading={deleting}
          onConfirm={deletePromotion}
          onCancel={() => setPromotionToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
}

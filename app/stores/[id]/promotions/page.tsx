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

type LoyaltyCard = {
  id: string;
  store_id: string;
  name: string;
  stamps_required: number;
  reward_description: string;
  is_active: boolean;
  background_image_url: string | null;
};

type LoyaltyForm = {
  name: string;
  stampsRequired: string;
  rewardDescription: string;
  backgroundImageUrl: string;
};

const LOYALTY_FORM_VACIO: LoyaltyForm = {
  name: "",
  stampsRequired: "10",
  rewardDescription: "",
  backgroundImageUrl: "",
};

type RedeemableProduct = {
  id: string;
  store_id: string;
  product_id: string;
  points_cost: number;
  is_active: boolean;
  product_name: string;
  product_image_url: string | null;
  created_at: string;
};

type LoyaltyCustomer = {
  customerId: string;
  fullName: string;
  phone: string | null;
  totalStamps: number;
  redeemedCount: number;
  pendingStamps: number;
  rewardsReady: number;
  lastStampAt: string | null;
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
  // Opcionales: el backend todavia puede no devolver estos campos.
  show_on_home?: boolean;
  show_on_menu?: boolean;
  show_on_offers?: boolean;
  show_on_coupons?: boolean;
  show_on_gifts?: boolean;
  show_on_games?: boolean;
  code?: string | null;
  max_uses?: number | null;
  one_use_per_customer?: boolean;
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
  showOnOffers: boolean;
  showOnCoupons: boolean;
  showOnGifts: boolean;
  showOnGames: boolean;
  code: string;
  maxUses: string;
  oneUsePerCustomer: boolean;
  notifyCustomers: boolean;
};

type FormErrors = {
  name?: string;
  value?: string;
  fechas?: string;
  alcance?: string;
  code?: string;
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

// Donde se muestra la promocion dentro de la app del cliente.
type Ubicacion =
  | "showOnHome"
  | "showOnMenu"
  | "showOnOffers"
  | "showOnCoupons"
  | "showOnGifts"
  | "showOnGames";

type UbicacionCampo =
  | "show_on_home"
  | "show_on_menu"
  | "show_on_offers"
  | "show_on_coupons"
  | "show_on_gifts"
  | "show_on_games";

// `id` es la llave del formulario (lo que mandamos al backend) y `campo`
// la que devuelve la API al leer, que viene en snake_case.
const UBICACIONES: {
  id: Ubicacion;
  campo: UbicacionCampo;
  title: string;
  desc: string;
}[] = [
  {
    id: "showOnHome",
    campo: "show_on_home",
    title: "Página principal",
    desc: "Banner destacado al abrir la app",
  },
  {
    id: "showOnMenu",
    campo: "show_on_menu",
    title: "Menú",
    desc: "Junto a los productos del negocio",
  },
  {
    id: "showOnOffers",
    campo: "show_on_offers",
    title: "Ofertas",
    desc: "Sección de descuentos y rebajas",
  },
  {
    id: "showOnCoupons",
    campo: "show_on_coupons",
    title: "Cupones",
    desc: "Sección de códigos para canjear",
  },
  {
    id: "showOnGifts",
    campo: "show_on_gifts",
    title: "Regalos",
    desc: "Sección de premios y cortesías",
  },
  {
    id: "showOnGames",
    campo: "show_on_games",
    title: "Juegos",
    desc: "Sección de dinámicas y sorteos",
  },
];

// En que secciones quedo publicada una promocion ya guardada. Si el
// backend todavia no manda los campos la lista sale vacia y no
// mostramos nada, en vez de decir que no se ve en ningun lado.
const ubicacionesDe = (promotion: Promotion) =>
  UBICACIONES.filter((ubicacion) => promotion[ubicacion.campo]).map(
    (ubicacion) => ubicacion.title,
  );

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
  showOnOffers: false,
  showOnCoupons: false,
  showOnGifts: false,
  showOnGames: false,
  code: "",
  maxUses: "",
  oneUsePerCustomer: false,
  notifyCustomers: false,
};

export default function PromotionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "promocion" | "fidelidad" | "delipuntos"
  >("promocion");
  const [storeName, setStoreName] = useState("Negocio");
  const [storeBannerUrl, setStoreBannerUrl] = useState("");
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
          `${process.env.NEXT_PUBLIC_API_URL}/register-business/${id}`,
          { credentials: "include" },
        );

        const data = await res.json();
        const stores = Array.isArray(data) ? data : data.data || [];

        const foundStore = stores.find(
          (store: { id: string }) => store.id === id,
        );

        if (foundStore) {
          setStoreName(foundStore.name);
          setStoreBannerUrl(foundStore.banner_url || "");
        }
      } catch (error) {
        console.error(error);
      }
    };

    const loadCategories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/categories/${id}`,
          { credentials: "include" },
        );

        const data = await res.json();

        setCategories(data.result ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    const loadProducts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/store/${id}`, { credentials: "include" });
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
    // Nombrada para que el reintento se llame a si misma por su propio
    // nombre, no a `loadPromotions`: el compilador de React no permite que
    // un valor memoizado por useCallback se referencie desde su propio cuerpo.
    async function intentar(reintentar = true) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promotions/store/${id}`, { credentials: "include" });
        const data = await res.json();

        setPromotions(Array.isArray(data) ? data : []);
        setPromotionsError(false);
      } catch (error) {
        console.error(error);

        if (reintentar) {
          setTimeout(() => intentar(false), 1200);
          return;
        }

        setPromotionsError(true);
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---------- Tarjeta de cliente frecuente (sellos por visita) ----------

  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [loyaltyForm, setLoyaltyForm] = useState<LoyaltyForm>(LOYALTY_FORM_VACIO);
  const [loyaltyErrors, setLoyaltyErrors] = useState<{
    stampsRequired?: string;
    rewardDescription?: string;
  }>({});
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [loyaltyDeleting, setLoyaltyDeleting] = useState(false);
  const [loyaltyUploading, setLoyaltyUploading] = useState(false);
  const [confirmDeleteLoyalty, setConfirmDeleteLoyalty] = useState(false);

  const loadLoyalty = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/store/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      const card: LoyaltyCard | null = data?.id ? data : null;

      setLoyaltyCard(card);
      setLoyaltyForm(
        card
          ? {
              name: card.name,
              stampsRequired: String(card.stamps_required),
              rewardDescription: card.reward_description,
              backgroundImageUrl: card.background_image_url || "",
            }
          : LOYALTY_FORM_VACIO,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoyaltyLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadLoyalty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---------- Clientes con sellos (progreso real, de pedidos entregados) ----------

  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [loyaltyCustomersLoading, setLoyaltyCustomersLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const loadLoyaltyCustomers = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/loyalty/store/${id}/customers`,
        { credentials: "include" },
      );
      const data = await res.json();

      setLoyaltyCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoyaltyCustomersLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && loyaltyCard) loadLoyaltyCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loyaltyCard]);

  const canjearRecompensa = async (customerId: string) => {
    setRedeemingId(customerId);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/loyalty/store/${id}/customers/${customerId}/redeem`,
        { credentials: "include", method: "POST" },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "No se pudo canjear");

      setToast({ message: "Recompensa canjeada", type: "success" });
      await loadLoyaltyCustomers();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo canjear",
        type: "danger",
      });
    } finally {
      setRedeemingId(null);
    }
  };

  const formatUltimaVisita = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("es-DO") : "—";

  // ---------- DeliPuntos: productos propios canjeables por puntos ----------

  const [redeemables, setRedeemables] = useState<RedeemableProduct[]>([]);
  const [redeemablesLoading, setRedeemablesLoading] = useState(true);
  const [nuevoProductoId, setNuevoProductoId] = useState("");
  const [nuevoPuntos, setNuevoPuntos] = useState("");
  const [agregandoRedeemable, setAgregandoRedeemable] = useState(false);
  const [redeemableError, setRedeemableError] = useState("");
  const [editedPoints, setEditedPoints] = useState<Record<string, string>>({});
  const [redeemableToDelete, setRedeemableToDelete] =
    useState<RedeemableProduct | null>(null);
  const [eliminandoRedeemable, setEliminandoRedeemable] = useState(false);

  const loadRedeemables = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delipuntos/store/${id}/products`,
        { credentials: "include" },
      );
      const data = await res.json();

      setRedeemables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setRedeemablesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadRedeemables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const productosDisponibles = products.filter(
    (p) => !redeemables.some((r) => r.product_id === p.id),
  );

  const agregarRedeemable = async () => {
    setRedeemableError("");

    const puntos = Number(nuevoPuntos);
    if (!nuevoProductoId) {
      setRedeemableError("Elige un producto");
      return;
    }
    if (!nuevoPuntos.trim() || !Number.isInteger(puntos) || puntos <= 0) {
      setRedeemableError("El costo en puntos debe ser un numero entero mayor a 0");
      return;
    }

    setAgregandoRedeemable(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delipuntos/store/${id}/products`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: nuevoProductoId, pointsCost: puntos }),
        },
      );

      if (!res.ok) throw new Error("No se pudo agregar el producto");

      setNuevoProductoId("");
      setNuevoPuntos("");
      setToast({ message: "Producto agregado a DeliPuntos", type: "success" });
      await loadRedeemables();
    } catch (error) {
      setRedeemableError(
        error instanceof Error ? error.message : "No se pudo agregar el producto",
      );
    } finally {
      setAgregandoRedeemable(false);
    }
  };

  const guardarPuntosRedeemable = async (item: RedeemableProduct) => {
    const valor = editedPoints[item.id];
    if (valor === undefined) return;

    const puntos = Number(valor);
    if (!valor.trim() || !Number.isInteger(puntos) || puntos <= 0 || puntos === item.points_cost) {
      setEditedPoints((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delipuntos/store/${id}/products/${item.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pointsCost: puntos }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar");

      setEditedPoints((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await loadRedeemables();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  const toggleActivoRedeemable = async (item: RedeemableProduct) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delipuntos/store/${id}/products/${item.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !item.is_active }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar");

      await loadRedeemables();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  const eliminarRedeemable = async () => {
    if (!redeemableToDelete) return;

    setEliminandoRedeemable(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delipuntos/store/${id}/products/${redeemableToDelete.id}`,
        { method: "DELETE", credentials: "include" },
      );

      if (!res.ok) throw new Error("No se pudo eliminar");

      setRedeemableToDelete(null);
      setToast({ message: "Producto quitado de DeliPuntos", type: "danger" });
      await loadRedeemables();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar",
        type: "danger",
      });
    } finally {
      setEliminandoRedeemable(false);
    }
  };

  const guardarLoyalty = async () => {
    const nextErrors: typeof loyaltyErrors = {};
    const sellos = Number(loyaltyForm.stampsRequired);

    if (!Number.isInteger(sellos) || sellos < 2 || sellos > 100) {
      nextErrors.stampsRequired = "Debe ser un número entero entre 2 y 100";
    }

    if (!loyaltyForm.rewardDescription.trim()) {
      nextErrors.rewardDescription = "Describe la recompensa";
    }

    setLoyaltyErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoyaltySaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/store/${id}`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: loyaltyForm.name.trim() || undefined,
          stampsRequired: sellos,
          rewardDescription: loyaltyForm.rewardDescription.trim(),
          backgroundImageUrl: loyaltyForm.backgroundImageUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar la tarjeta");

      setLoyaltyCard(data);
      setToast({ message: "Tarjeta de fidelidad guardada", type: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "No se pudo guardar la tarjeta",
        type: "danger",
      });
    } finally {
      setLoyaltySaving(false);
    }
  };

  const alternarLoyaltyActiva = async () => {
    if (!loyaltyCard) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/loyalty/store/${id}/status`,
        {
          credentials: "include",
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !loyaltyCard.is_active }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar la tarjeta");

      const data = await res.json();
      setLoyaltyCard(data);
      setToast({
        message: data.is_active ? "Tarjeta activada" : "Tarjeta desactivada",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  const eliminarLoyalty = async () => {
    setLoyaltyDeleting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/store/${id}`, {
        credentials: "include",
        method: "DELETE",
      });

      if (!res.ok) throw new Error("No se pudo eliminar la tarjeta");

      setLoyaltyCard(null);
      setLoyaltyForm(LOYALTY_FORM_VACIO);
      setConfirmDeleteLoyalty(false);
      setToast({ message: "Tarjeta de fidelidad eliminada", type: "danger" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar",
        type: "danger",
      });
    } finally {
      setLoyaltyDeleting(false);
    }
  };

  const subirImagenLoyalty = async (file: File) => {
    setLoyaltyUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "tarjetas-fidelidad");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setLoyaltyForm((prev) => ({ ...prev, backgroundImageUrl: data.url }));
      setToast({ message: "Imagen subida correctamente", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error ? error.message : "No se pudo subir la imagen",
        type: "danger",
      });
    } finally {
      setLoyaltyUploading(false);
    }
  };

  // El descuento es el unico tipo que necesita un porcentaje.
  const necesitaValor = form.type === "discount";

  const productoElegido = products.find((p) => p.name === form.productName);

  // Que imagen se ve: la del producto elegido o la que subio el negocio.
  const imagenPrevia =
    form.alcance === "producto"
      ? productoElegido?.imageUrl || ""
      : form.imageUrl;

  // Secciones de la app donde el negocio marco que se vea la promocion.
  const ubicacionesElegidas = UBICACIONES.filter(
    (ubicacion) => form[ubicacion.id],
  ).map((ubicacion) => ubicacion.title);

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

    if (form.showOnCoupons && !form.code.trim()) {
      nextErrors.code = "El código es obligatorio para un cupón";
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promotions/${id}`, {
        credentials: "include",
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
          showOnOffers: form.showOnOffers,
          showOnCoupons: form.showOnCoupons,
          showOnGifts: form.showOnGifts,
          showOnGames: form.showOnGames,
          code: form.showOnCoupons ? form.code.trim().toUpperCase() : undefined,
          maxUses:
            form.showOnCoupons && form.maxUses ? Number(form.maxUses) : undefined,
          oneUsePerCustomer: form.showOnCoupons
            ? form.oneUsePerCustomer
            : undefined,
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
        `${process.env.NEXT_PUBLIC_API_URL}/promotions/${promotionToDelete.id}`,
        { credentials: "include", method: "DELETE" },
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
            { label: "Negocios", href: "/stores" },
            { label: storeName, href: `/stores/${id}` },
            { label: "Promociones" },
          ]}
        />

        <div className={styles.header}>
          <h1>Promociones</h1>
          <p>
            Impulsa más ventas creando promociones y fideliza a tus clientes
            con una tarjeta de sellos.
          </p>
        </div>

        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "promocion" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("promocion")}
          >
            Crear promoción
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "fidelidad" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("fidelidad")}
          >
            Tarjeta de fidelidad
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "delipuntos" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("delipuntos")}
          >
            DeliPuntos
          </button>
        </div>

        {activeTab === "promocion" && (
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
                <span className={styles.step}>5</span> ¿Dónde quieres que se
                vea la promoción?
              </h3>

              <p className={styles.hint}>
                Marca las secciones de la app donde quieres que aparezca. Puedes
                elegir más de una.
              </p>

              <div className={styles.checksGrid}>
                {UBICACIONES.map((ubicacion) => (
                  <div key={ubicacion.id} className={styles.checkItem}>
                    <DFCheckbox
                      label={ubicacion.title}
                      checked={form[ubicacion.id]}
                      onChange={(checked) =>
                        handleChange(ubicacion.id, checked)
                      }
                    />
                    <span className={styles.checkDesc}>{ubicacion.desc}</span>
                  </div>
                ))}
              </div>

              <p className={styles.hint}>
                {ubicacionesElegidas.length > 0
                  ? `Se verá en: ${ubicacionesElegidas.join(", ")}.`
                  : "Sin ubicaciones marcadas la promoción queda guardada pero no se muestra a los clientes."}
              </p>

              {form.showOnCoupons && (
                <div className={styles.couponBox}>
                  <h4>Código del cupón</h4>
                  <p className={styles.hint}>
                    El cliente lo escribe al pagar para canjear esta
                    promoción. Se guarda en mayúsculas.
                  </p>

                  <div className={styles.field}>
                    <input
                      className={`${styles.couponCodeInput} ${
                        errors.code ? styles.inputError : ""
                      }`}
                      placeholder="Ej. BIENVENIDO10"
                      value={form.code}
                      maxLength={30}
                      onChange={(e) => {
                        setErrors((prev) => ({ ...prev, code: undefined }));
                        handleChange(
                          "code",
                          e.target.value.toUpperCase().replace(/\s+/g, ""),
                        );
                      }}
                    />
                    {errors.code && (
                      <span className={styles.errorText}>{errors.code}</span>
                    )}
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        Límite de usos totales
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Sin límite"
                        value={form.maxUses}
                        onChange={(e) =>
                          handleChange(
                            "maxUses",
                            e.target.value.replace(/[^0-9]/g, ""),
                          )
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>&nbsp;</label>
                      <label className={styles.couponCheckboxRow}>
                        <input
                          type="checkbox"
                          checked={form.oneUsePerCustomer}
                          onChange={(e) =>
                            handleChange("oneUsePerCustomer", e.target.checked)
                          }
                        />
                        Un solo uso por cliente
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.checksFooter}>
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
                  const secciones = ubicacionesDe(promotion);

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

                        <div className={styles.listInfo}>
                          <span className={styles.listName}>
                            {promotion.name}
                          </span>
                          <span className={styles.listMeta}>
                            {etiquetaTipo(promotion.type)}
                            {promotion.value ? ` · ${promotion.value}%` : ""}
                            {` · ${alcanceDe(promotion)}`}
                          </span>

                          {promotion.code && (
                            <span className={styles.couponCode}>
                              Código: {promotion.code}
                              {promotion.max_uses
                                ? ` · máx. ${promotion.max_uses} usos`
                                : ""}
                              {promotion.one_use_per_customer
                                ? " · 1 por cliente"
                                : ""}
                            </span>
                          )}

                          {secciones.length > 0 && (
                            <div className={styles.listTags}>
                              {secciones.map((seccion) => (
                                <span key={seccion} className={styles.listTag}>
                                  {seccion}
                                </span>
                              ))}
                            </div>
                          )}
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
        )}

        {activeTab === "fidelidad" && (
        <section className={styles.section}>
          <h3>Tarjeta de cliente frecuente</h3>
          <p className={styles.hint}>
            Sellos por visita: el cliente junta uno en cada compra y al
            completar la tarjeta gana la recompensa que definas.
          </p>

          {!loyaltyLoading && (
            <>
            <div className={styles.loyaltyLayout}>
              <div className={styles.loyaltyForm}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Nombre de la tarjeta</label>
                    <input
                      placeholder="Tarjeta de fidelidad"
                      value={loyaltyForm.name}
                      onChange={(e) =>
                        setLoyaltyForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Sellos necesarios</label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      className={loyaltyErrors.stampsRequired ? styles.inputError : ""}
                      value={loyaltyForm.stampsRequired}
                      onChange={(e) => {
                        setLoyaltyErrors((prev) => ({
                          ...prev,
                          stampsRequired: undefined,
                        }));
                        setLoyaltyForm((prev) => ({
                          ...prev,
                          stampsRequired: e.target.value.replace(/[^0-9]/g, ""),
                        }));
                      }}
                    />
                    {loyaltyErrors.stampsRequired && (
                      <span className={styles.errorText}>
                        {loyaltyErrors.stampsRequired}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Recompensa</label>
                  <input
                    placeholder="Ej. 1 café gratis"
                    className={loyaltyErrors.rewardDescription ? styles.inputError : ""}
                    value={loyaltyForm.rewardDescription}
                    onChange={(e) => {
                      setLoyaltyErrors((prev) => ({
                        ...prev,
                        rewardDescription: undefined,
                      }));
                      setLoyaltyForm((prev) => ({
                        ...prev,
                        rewardDescription: e.target.value,
                      }));
                    }}
                  />
                  {loyaltyErrors.rewardDescription && (
                    <span className={styles.errorText}>
                      {loyaltyErrors.rewardDescription}
                    </span>
                  )}
                </div>

                <div className={`${styles.field} ${styles.loyaltyImageField}`}>
                  <label className={styles.label}>
                    Imagen de fondo (opcional)
                  </label>
                  <p className={styles.hint} style={{ marginTop: 0 }}>
                    {storeBannerUrl
                      ? "Si no subes una, se usa la foto de portada de tu negocio."
                      : "Si no subes una, se usa un color naranja por defecto."}
                  </p>
                  <label className={styles.loyaltyUpload}>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subirImagenLoyalty(file);
                      }}
                    />
                    {loyaltyUploading
                      ? "Subiendo imagen..."
                      : loyaltyForm.backgroundImageUrl
                        ? "Cambiar imagen de fondo"
                        : "Subir imagen de fondo"}
                  </label>

                  {loyaltyForm.backgroundImageUrl && (
                    <button
                      type="button"
                      className={styles.loyaltyRemoveImg}
                      onClick={() =>
                        setLoyaltyForm((prev) => ({
                          ...prev,
                          backgroundImageUrl: "",
                        }))
                      }
                    >
                      {storeBannerUrl
                        ? "Quitar imagen (usar la foto del negocio)"
                        : "Quitar imagen (usar color por defecto)"}
                    </button>
                  )}
                </div>

                <div className={styles.loyaltyActions}>
                  <button
                    className={styles.submit}
                    onClick={guardarLoyalty}
                    disabled={loyaltySaving}
                  >
                    {loyaltySaving
                      ? "Guardando..."
                      : loyaltyCard
                        ? "Guardar cambios"
                        : "Crear tarjeta"}
                  </button>

                  {loyaltyCard && (
                    <>
                      <button
                        type="button"
                        className={styles.loyaltyToggle}
                        onClick={alternarLoyaltyActiva}
                      >
                        {loyaltyCard.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => setConfirmDeleteLoyalty(true)}
                      >
                        Eliminar tarjeta
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.loyaltyPreview}>
                <span className={styles.loyaltyPreviewLabel}>
                  Así la ve el cliente
                </span>

                <div
                  className={`${styles.loyaltyCard} ${
                    !loyaltyForm.backgroundImageUrl && !storeBannerUrl
                      ? styles.loyaltyCardNoImage
                      : ""
                  }`}
                  style={
                    loyaltyForm.backgroundImageUrl || storeBannerUrl
                      ? {
                          backgroundImage: `url(${
                            loyaltyForm.backgroundImageUrl || storeBannerUrl
                          })`,
                        }
                      : undefined
                  }
                >
                  <div className={styles.loyaltyCardOverlay}>
                    <span className={styles.loyaltyCardName}>
                      {loyaltyForm.name || "Tarjeta de fidelidad"}
                    </span>

                    <div className={styles.cardStampsRow}>
                      {Array.from({
                        length: Math.max(Number(loyaltyForm.stampsRequired) || 0, 0),
                      }).map((_, i) => (
                        <span
                          key={i}
                          className={`${styles.cardStamp} ${
                            i === 0 ? styles.cardStampFilled : ""
                          }`}
                        />
                      ))}
                    </div>

                    <p className={styles.loyaltyCardReward}>
                      Cada {loyaltyForm.stampsRequired || "…"} compras:{" "}
                      <strong>
                        {loyaltyForm.rewardDescription || "elige una recompensa"}
                      </strong>
                    </p>
                  </div>
                </div>

                {loyaltyCard && (
                  <span
                    className={
                      loyaltyCard.is_active ? styles.pillActive : styles.pill
                    }
                  >
                    {loyaltyCard.is_active ? "Activa" : "Desactivada"}
                  </span>
                )}
              </div>
            </div>

            {loyaltyCard && (
              <div className={styles.loyaltyCustomers}>
                <h4>Clientes con sellos</h4>

                {loyaltyCustomersLoading ? (
                  <p className={styles.hint}>Cargando...</p>
                ) : loyaltyCustomers.length === 0 ? (
                  <p className={styles.empty}>
                    Todavía ningún cliente ha ganado un sello aquí. Se suman
                    solos cuando un pedido se marca &quot;Entregado&quot;.
                  </p>
                ) : (
                  <div className={styles.loyaltyTableWrap}>
                    <table className={styles.loyaltyTable}>
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Sellos</th>
                          <th>Recompensas listas</th>
                          <th>Canjeadas</th>
                          <th>Última visita</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loyaltyCustomers.map((customer) => (
                          <tr key={customer.customerId}>
                            <td>
                              <span className={styles.listName}>
                                {customer.fullName}
                              </span>
                              {customer.phone && (
                                <span className={styles.listMeta}>
                                  {customer.phone}
                                </span>
                              )}
                            </td>
                            <td>{customer.totalStamps}</td>
                            <td>
                              {customer.rewardsReady > 0 ? (
                                <span className={styles.pillActive}>
                                  {customer.rewardsReady}
                                </span>
                              ) : (
                                <span className={styles.pill}>0</span>
                              )}
                            </td>
                            <td>{customer.redeemedCount}</td>
                            <td>{formatUltimaVisita(customer.lastStampAt)}</td>
                            <td>
                              <button
                                type="button"
                                className={styles.loyaltyRedeemBtn}
                                disabled={
                                  customer.rewardsReady <= 0 ||
                                  redeemingId === customer.customerId
                                }
                                onClick={() =>
                                  canjearRecompensa(customer.customerId)
                                }
                              >
                                Canjear recompensa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            </>
          )}
        </section>
        )}

        {activeTab === "delipuntos" && (
        <div className={styles.content}>
          <section className={styles.section}>
            <h3>Productos canjeables con DeliPuntos</h3>
            <p className={styles.hint}>
              Elige cuáles de tus propios productos se pueden canjear con
              DeliPuntos en esta tienda, y a qué costo en puntos cada uno.
            </p>

            <div className={styles.loyaltyForm}>
              <div className={styles.field}>
                <label>Producto</label>
                <Dropdown
                  fullWidth
                  options={productosDisponibles.map((p) => p.name)}
                  value={
                    productosDisponibles.find((p) => p.id === nuevoProductoId)
                      ?.name ?? ""
                  }
                  onChange={(nombre) => {
                    const encontrado = productosDisponibles.find(
                      (p) => p.name === nombre,
                    );
                    setNuevoProductoId(encontrado?.id ?? "");
                  }}
                  placeholder="Selecciona un producto"
                />
              </div>

              <div className={styles.field}>
                <label>Costo en puntos</label>
                <input
                  type="number"
                  min="1"
                  value={nuevoPuntos}
                  placeholder="Ej. 300"
                  onChange={(e) => setNuevoPuntos(e.target.value)}
                />
              </div>

              {redeemableError && (
                <span className={styles.errorText}>{redeemableError}</span>
              )}

              <button
                type="button"
                className={styles.submit}
                onClick={agregarRedeemable}
                disabled={agregandoRedeemable || productosDisponibles.length === 0}
              >
                {agregandoRedeemable ? "Agregando..." : "Agregar"}
              </button>

              {productosDisponibles.length === 0 && products.length > 0 && (
                <p className={styles.hint}>
                  Ya todos tus productos están en el catálogo de DeliPuntos.
                </p>
              )}
            </div>

            {redeemablesLoading ? (
              <p className={styles.hint}>Cargando...</p>
            ) : redeemables.length === 0 ? (
              <p className={styles.empty}>
                Todavía ningún producto tuyo es canjeable con DeliPuntos.
              </p>
            ) : (
              <div className={styles.loyaltyTableWrap}>
                <table className={styles.loyaltyTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Costo en puntos</th>
                      <th>Activo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {redeemables.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={styles.listName}>
                            {item.product_name}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className={styles.inlinePointsInput}
                            value={
                              editedPoints[item.id] ?? String(item.points_cost)
                            }
                            onChange={(e) =>
                              setEditedPoints((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            onBlur={() => guardarPuntosRedeemable(item)}
                          />
                        </td>
                        <td>
                          <DFCheckbox
                            checked={item.is_active}
                            onChange={() => toggleActivoRedeemable(item)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.loyaltyRedeemBtn}
                            onClick={() => setRedeemableToDelete(item)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        )}

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

        <ConfirmDialog
          isOpen={confirmDeleteLoyalty}
          title="Eliminar tarjeta de fidelidad"
          message="¿Seguro que deseas eliminar la tarjeta de cliente frecuente de este negocio?"
          note="Los clientes dejarán de ver esta tarjeta en la app."
          confirmLabel="Si, eliminar"
          loading={loyaltyDeleting}
          onConfirm={eliminarLoyalty}
          onCancel={() => setConfirmDeleteLoyalty(false)}
        />

        <ConfirmDialog
          isOpen={redeemableToDelete !== null}
          title="Quitar producto de DeliPuntos"
          message={
            <>
              ¿Seguro que deseas quitar{" "}
              <strong>{redeemableToDelete?.product_name}</strong> del catálogo
              de DeliPuntos de esta tienda?
            </>
          }
          confirmLabel="Si, quitar"
          loading={eliminandoRedeemable}
          onConfirm={eliminarRedeemable}
          onCancel={() => setRedeemableToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/components/modal/modal";
import ConfirmDialog from "../components/components/modal/confirm-dialog";
import Toast from "../components/components-items/toast/toast";
import DFCheckbox from "../components/components-items/checkbox/checkbox";
import DFRadio from "../components/components-items/radio/radio";
import DFInput from "../components/components-items/input";
import Dropdown from "../components/components-items/dropdown";
import DatePicker from "../components/components-items/datepicker";
import LoadingDots from "../components/components-items/loading-dots/loading-dots";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPen,
  faTrash,
  faGift,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./delipuntos.module.css";

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const API = process.env.NEXT_PUBLIC_API_URL;

type TabKey = "marketplace" | "manual" | "app";

const TABS: { key: TabKey; label: string }[] = [
  { key: "marketplace", label: "Marketplace Deliflex y tiendas" },
  { key: "manual", label: "Canjes registrados a mano" },
  { key: "app", label: "Canjes desde la app" },
];

type Reward = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number | null;
  is_active: boolean;
  business_id: string | null;
  business_name: string | null;
  external_business_name: string | null;
  created_at: string;
};

type Business = { id: string; name: string };

type CustomerResult = { id: string; full_name: string; email: string | null };

type AppRedemption = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  item_name: string;
  points_spent: number;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  redemption_code: string;
  created_at: string;
  fulfilled_at: string | null;
};

type Redemption = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  reward_id: string;
  reward_name: string;
  points_spent: number;
  status: "PENDING_PICKUP" | "DELIVERED";
  delivery_method: "LOCAL" | "DELIVERY";
  delivery_address: string | null;
  delivery_fee: string | null;
  redemption_code: string;
  created_at: string;
  delivered_at: string | null;
};

const OTRA_EMPRESA_OPCION = "+ Otra empresa (no está en Deliflex)";

type RewardForm = {
  name: string;
  description: string;
  imageUrl: string;
  pointsCost: string;
  stock: string;
  isActive: boolean;
  esEmpresa: boolean;
  businessId: string;
  usandoOtraEmpresa: boolean;
  customBusinessName: string;
};

const FORM_VACIO: RewardForm = {
  name: "",
  description: "",
  imageUrl: "",
  pointsCost: "",
  stock: "",
  isActive: true,
  esEmpresa: false,
  businessId: "",
  usandoOtraEmpresa: false,
  customBusinessName: "",
};

const numero = (valor: number) => valor.toLocaleString("es-DO");

const dinero = (valor: number) =>
  `RD$${valor.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;

const normalizar = (texto: string) => texto.toLowerCase().trim();

// Filtros de canjes: mismos en "a mano" y "desde la app".
const TODOS_ESTADOS = "Todos los estados";

const coincideRangoFecha = (iso: string, desde: string, hasta: string) => {
  const fecha = iso.slice(0, 10);
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
};

export default function DeliPuntosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const [activeTab, setActiveTab] = useState<TabKey>("marketplace");

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [form, setForm] = useState<RewardForm>(FORM_VACIO);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [imagenCargada, setImagenCargada] = useState(false);

  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const cargarRewards = useCallback(async () => {
    try {
      const res = await fetch(`${API}/delipuntos/rewards`, {
        credentials: "include",
      });
      const data = await res.json();
      setRewards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/core/login");
      return;
    }

    if (!esSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, esSuperAdmin, router]);

  useEffect(() => {
    if (authLoading || !user || !esSuperAdmin) return;

    let cancelado = false;

    fetch(`${API}/delipuntos/rewards`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setRewards(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [authLoading, user, esSuperAdmin]);

  useEffect(() => {
    if (authLoading || !user || !esSuperAdmin) return;

    let cancelado = false;

    fetch(`${API}/delipuntos/businesses`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setBusinesses(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelado = true;
    };
  }, [authLoading, user, esSuperAdmin]);

  // ---------- Canjes (registrados a mano por el admin) ----------

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(true);

  const [manualBusqueda, setManualBusqueda] = useState("");
  const [manualEstado, setManualEstado] = useState(TODOS_ESTADOS);
  const [manualFechaDesde, setManualFechaDesde] = useState("");
  const [manualFechaHasta, setManualFechaHasta] = useState("");

  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<CustomerResult[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteElegido, setClienteElegido] = useState<CustomerResult | null>(null);
  const [rewardIdElegido, setRewardIdElegido] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState<"LOCAL" | "DELIVERY">("LOCAL");
  const [direccionDelivery, setDireccionDelivery] = useState("");
  const [montoDelivery, setMontoDelivery] = useState("");
  const [savingRedemption, setSavingRedemption] = useState(false);
  const [redemptionError, setRedemptionError] = useState("");
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  const cargarRedemptions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/delipuntos/redemptions`, {
        credentials: "include",
      });
      const data = await res.json();
      setRedemptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setRedemptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || !esSuperAdmin) return;

    let cancelado = false;

    fetch(`${API}/delipuntos/redemptions`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setRedemptions(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (!cancelado) setRedemptionsLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [authLoading, user, esSuperAdmin]);

  useEffect(() => {
    if (!redemptionModalOpen || busquedaCliente.trim().length < 2) return;

    let cancelado = false;
    const timeout = setTimeout(async () => {
      setBuscandoCliente(true);
      try {
        const res = await fetch(
          `${API}/support/tickets/customers/search?q=${encodeURIComponent(busquedaCliente.trim())}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (!cancelado) setResultadosCliente(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelado) setBuscandoCliente(false);
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [busquedaCliente, redemptionModalOpen]);

  // Un producto con stock 0 no puede volver a canjearse: se saca de las
  // opciones para que ni el admin lo pueda registrar a mano.
  const rewardsDisponibles = rewards.filter(
    (r) => r.stock === null || r.stock > 0,
  );

  const rewardElegida = rewards.find((r) => r.id === rewardIdElegido) ?? null;
  // Solo una recompensa de una tienda de Deliflex se puede mandar por
  // delivery (Deliflex mismo y las empresas externas no tienen quien reparta).
  const permiteDelivery = rewardElegida?.business_id != null;

  const abrirNuevoRedemption = () => {
    setClienteElegido(null);
    setBusquedaCliente("");
    setResultadosCliente([]);
    setRewardIdElegido("");
    setMetodoEntrega("LOCAL");
    setDireccionDelivery("");
    setMontoDelivery("");
    setRedemptionError("");
    setRedemptionModalOpen(true);
  };

  const registrarCanje = async () => {
    if (!clienteElegido) {
      setRedemptionError("Elige un cliente");
      return;
    }
    if (!rewardIdElegido) {
      setRedemptionError("Elige una recompensa");
      return;
    }

    const esDelivery = permiteDelivery && metodoEntrega === "DELIVERY";

    if (esDelivery && !direccionDelivery.trim()) {
      setRedemptionError("Escribe la dirección de entrega");
      return;
    }

    const monto = Number(montoDelivery);
    if (esDelivery && (!montoDelivery.trim() || !Number.isFinite(monto) || monto <= 0)) {
      setRedemptionError("Escribe el monto del delivery");
      return;
    }

    setSavingRedemption(true);
    setRedemptionError("");

    try {
      const res = await fetch(`${API}/delipuntos/redemptions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: clienteElegido.id,
          rewardId: rewardIdElegido,
          deliveryMethod: esDelivery ? "DELIVERY" : "LOCAL",
          deliveryAddress: esDelivery ? direccionDelivery.trim() : undefined,
          deliveryFee: esDelivery ? monto : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "No se pudo registrar el canje");
      }

      setRedemptionModalOpen(false);
      setToast({ message: "Canje registrado", type: "success" });
      await Promise.all([cargarRedemptions(), cargarRewards()]);
    } catch (error) {
      setRedemptionError(
        error instanceof Error ? error.message : "No se pudo registrar el canje",
      );
    } finally {
      setSavingRedemption(false);
    }
  };

  const marcarEntregado = async (redemption: Redemption) => {
    setDeliveringId(redemption.id);

    try {
      const res = await fetch(
        `${API}/delipuntos/redemptions/${redemption.id}/deliver`,
        { method: "PATCH", credentials: "include" },
      );

      if (!res.ok) throw new Error("No se pudo marcar como entregado");

      setToast({ message: "Canje marcado como entregado", type: "success" });
      await cargarRedemptions();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setDeliveringId(null);
    }
  };

  // ---------- Canjes hechos por el cliente desde la app ----------

  const [appRedemptions, setAppRedemptions] = useState<AppRedemption[]>([]);
  const [appRedemptionsLoading, setAppRedemptionsLoading] = useState(true);
  const [markingAppId, setMarkingAppId] = useState<string | null>(null);

  const [appBusqueda, setAppBusqueda] = useState("");
  const [appEstado, setAppEstado] = useState(TODOS_ESTADOS);
  const [appFechaDesde, setAppFechaDesde] = useState("");
  const [appFechaHasta, setAppFechaHasta] = useState("");

  const cargarAppRedemptions = useCallback(async () => {
    try {
      const res = await fetch("/api/delipuntos/app-redemptions");
      const data = await res.json();
      setAppRedemptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setAppRedemptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || !esSuperAdmin) return;

    let cancelado = false;

    fetch("/api/delipuntos/app-redemptions")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setAppRedemptions(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (!cancelado) setAppRedemptionsLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [authLoading, user, esSuperAdmin]);

  const marcarAppEntregado = async (redemption: AppRedemption) => {
    setMarkingAppId(redemption.id);

    try {
      const res = await fetch("/api/delipuntos/app-redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId: redemption.id, status: "FULFILLED" }),
      });

      if (!res.ok) throw new Error("No se pudo marcar como entregado");

      setToast({ message: "Canje marcado como entregado", type: "success" });
      await cargarAppRedemptions();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setMarkingAppId(null);
    }
  };

  const abrirNuevo = () => {
    setEditingReward(null);
    setForm(FORM_VACIO);
    setFormError("");
    setImagenCargada(false);
    setModalOpen(true);
  };

  const abrirEditar = (reward: Reward) => {
    setEditingReward(reward);
    setForm({
      name: reward.name,
      description: reward.description ?? "",
      imageUrl: reward.image_url ?? "",
      pointsCost: String(reward.points_cost),
      stock: reward.stock !== null ? String(reward.stock) : "",
      isActive: reward.is_active,
      esEmpresa: reward.business_id !== null || reward.external_business_name !== null,
      businessId: reward.business_id ?? "",
      usandoOtraEmpresa: reward.external_business_name !== null,
      customBusinessName: reward.external_business_name ?? "",
    });
    setFormError("");
    setImagenCargada(!!reward.image_url);
    setModalOpen(true);
  };

  const subirImagen = async (file: File) => {
    setSubiendoImagen(true);
    setImagenCargada(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "delipuntos");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo subir la imagen",
      );
    } finally {
      setSubiendoImagen(false);
    }
  };

  const guardar = async () => {
    if (!form.name.trim()) {
      setFormError("Escribe un nombre");
      return;
    }

    const puntos = Number(form.pointsCost);
    if (!form.pointsCost.trim() || !Number.isInteger(puntos) || puntos <= 0) {
      setFormError("El costo en puntos debe ser un numero entero mayor a 0");
      return;
    }

    const stockTrim = form.stock.trim();
    const stock = stockTrim ? Number(stockTrim) : null;
    if (stockTrim && (!Number.isInteger(stock) || (stock as number) < 0)) {
      setFormError("La cantidad disponible debe ser un numero entero de 0 o mas");
      return;
    }

    if (form.esEmpresa && !form.usandoOtraEmpresa && !form.businessId) {
      setFormError("Elige de que empresa es la recompensa");
      return;
    }

    if (form.esEmpresa && form.usandoOtraEmpresa && !form.customBusinessName.trim()) {
      setFormError("Escribe el nombre de la empresa");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await fetch(
        editingReward
          ? `${API}/delipuntos/rewards/${editingReward.id}`
          : `${API}/delipuntos/rewards`,
        {
          method: editingReward ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            imageUrl: form.imageUrl || undefined,
            pointsCost: puntos,
            stock,
            isActive: form.isActive,
            businessId: form.esEmpresa && !form.usandoOtraEmpresa ? form.businessId : null,
            externalBusinessName:
              form.esEmpresa && form.usandoOtraEmpresa
                ? form.customBusinessName.trim()
                : null,
          }),
        },
      );

      if (!res.ok) throw new Error("No se pudo guardar");

      setModalOpen(false);
      setToast({
        message: editingReward ? "Recompensa actualizada" : "Recompensa agregada",
        type: "success",
      });
      await cargarRewards();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo guardar",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!rewardToDelete) return;

    setDeleting(true);

    try {
      const res = await fetch(`${API}/delipuntos/rewards/${rewardToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("No se pudo eliminar");

      setRewardToDelete(null);
      setToast({ message: "Recompensa eliminada", type: "danger" });
      await cargarRewards();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar",
        type: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  const MANUAL_ESTADO_LABELS: Record<Redemption["status"], string> = {
    PENDING_PICKUP: "Por recoger",
    DELIVERED: "Entregado",
  };
  const MANUAL_ESTADOS_FILTRO = [
    TODOS_ESTADOS,
    ...Object.values(MANUAL_ESTADO_LABELS),
  ];

  const redemptionsFiltradas = redemptions.filter((r) => {
    const busqueda = normalizar(manualBusqueda);
    if (
      busqueda &&
      !normalizar(r.customer_name).includes(busqueda) &&
      !normalizar(r.redemption_code).includes(busqueda)
    ) {
      return false;
    }

    if (manualEstado !== TODOS_ESTADOS && MANUAL_ESTADO_LABELS[r.status] !== manualEstado) {
      return false;
    }

    return coincideRangoFecha(r.created_at, manualFechaDesde, manualFechaHasta);
  });

  const APP_ESTADO_LABELS: Record<AppRedemption["status"], string> = {
    PENDING: "Por recoger",
    FULFILLED: "Entregado",
    CANCELLED: "Cancelado",
  };
  const APP_ESTADOS_FILTRO = [TODOS_ESTADOS, ...Object.values(APP_ESTADO_LABELS)];

  const appRedemptionsFiltradas = appRedemptions.filter((r) => {
    const busqueda = normalizar(appBusqueda);
    if (
      busqueda &&
      !normalizar(r.customer_name).includes(busqueda) &&
      !normalizar(r.redemption_code).includes(busqueda)
    ) {
      return false;
    }

    if (appEstado !== TODOS_ESTADOS && APP_ESTADO_LABELS[r.status] !== appEstado) {
      return false;
    }

    return coincideRangoFecha(r.created_at, appFechaDesde, appFechaHasta);
  });

  if (authLoading || loading || !esSuperAdmin) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <Skeleton width={200} height={22} style={{ marginBottom: 8 }} />
              <Skeleton width={320} height={13} />
            </div>
          </div>
          <SkeletonStatCards count={3} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>DeliPuntos</h1>
            <p>
              Catálogo de recompensas y canjes que los clientes hacen con sus
              DeliPuntos.
            </p>
          </div>
        </div>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.tab} ${
                activeTab === tab.key ? styles.active : ""
              }`}
            >
              {tab.label}
              <span className={styles.indicator} />
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
        {activeTab === "marketplace" && (
          <>
        <div className={styles.header}>
          <div>
            <h2 className={styles.subHeading}>Marketplace Deliflex y tiendas</h2>
            <p>
              Catálogo de recompensas que los clientes pueden canjear con sus
              DeliPuntos, sin importar en qué negocio pidan.
            </p>
          </div>
          <button className={styles.btnSolid} onClick={abrirNuevo}>
            <FontAwesomeIcon icon={faPlus} /> Nueva recompensa
          </button>
        </div>

        {rewards.length === 0 ? (
          <div className={styles.emptyState}>
            Todavía no hay recompensas en el catálogo. Agrega la primera.
          </div>
        ) : (
          <div className={styles.grid}>
            {rewards.map((reward) => (
              <div key={reward.id} className={styles.card}>
                <div className={styles.cardImage}>
                  {reward.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={reward.image_url} alt={reward.name} />
                  ) : (
                    <FontAwesomeIcon icon={faGift} />
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardTitle}>{reward.name}</h3>
                    <span
                      className={`${styles.statusPill} ${
                        reward.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {reward.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <span className={styles.sourceBadge}>
                    {reward.business_id
                      ? reward.business_name
                      : reward.external_business_name
                        ? reward.external_business_name
                        : "Deliflex"}
                  </span>

                  {reward.description && (
                    <p className={styles.cardDescription}>{reward.description}</p>
                  )}

                  <div className={styles.cardFoot}>
                    <span className={styles.pointsCost}>
                      <FontAwesomeIcon icon={faGift} /> {numero(reward.points_cost)} pts
                    </span>

                    <span className={styles.stockInfo}>
                      {reward.stock === null
                        ? "Ilimitado"
                        : reward.stock > 0
                          ? `${numero(reward.stock)} disponibles`
                          : "Agotado"}
                    </span>

                    <div className={styles.cardIconBtns}>
                      <button
                        className={styles.iconBtn}
                        title="Editar"
                        onClick={() => abrirEditar(reward)}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        title="Eliminar"
                        onClick={() => setRewardToDelete(reward)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === "manual" && (
          <>
        <div className={styles.header}>
          <div>
            <h2 className={styles.subHeading}>Canjes registrados a mano</h2>
            <p>
              Registra cuando un cliente canjea una recompensa en persona, y
              marca cuando ya pasó a recogerla.
            </p>
          </div>
          <button className={styles.btnSolid} onClick={abrirNuevoRedemption}>
            <FontAwesomeIcon icon={faPlus} /> Registrar canje
          </button>
        </div>

        {redemptions.length > 0 && (
          <div className={styles.filters}>
            <div className={styles.searchWrap}>
              <DFInput
                value={manualBusqueda}
                onChange={(e) => setManualBusqueda(e.target.value)}
                placeholder="Buscar por cliente o código..."
                icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
              />
            </div>

            <Dropdown
              options={MANUAL_ESTADOS_FILTRO}
              value={manualEstado}
              onChange={setManualEstado}
              placeholder="Estado"
            />

            <div className={styles.rangePicker}>
              <div className={styles.rangeDateWrap}>
                <DatePicker
                  value={manualFechaDesde}
                  onChange={setManualFechaDesde}
                  placeholder="Desde"
                />
              </div>
              <span className={styles.rangeSeparator}>–</span>
              <div className={styles.rangeDateWrap}>
                <DatePicker
                  value={manualFechaHasta}
                  onChange={setManualFechaHasta}
                  placeholder="Hasta"
                />
              </div>

              {(manualFechaDesde || manualFechaHasta) && (
                <button
                  type="button"
                  className={styles.rangeClearBtn}
                  onClick={() => {
                    setManualFechaDesde("");
                    setManualFechaHasta("");
                  }}
                  aria-label="Quitar filtro de fechas"
                  title="Quitar filtro de fechas"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
          </div>
        )}

        {redemptionsLoading ? (
          <p className={styles.hint}>Cargando...</p>
        ) : redemptions.length === 0 ? (
          <div className={styles.emptyState}>Todavía no hay canjes registrados.</div>
        ) : redemptionsFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            Ningún canje coincide con el filtro.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Recompensa</th>
                  <th>Puntos</th>
                  <th>Entrega</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {redemptionsFiltradas.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={styles.listName}>{r.redemption_code}</span>
                    </td>
                    <td>
                      <span className={styles.listName}>{r.customer_name}</span>
                      {r.customer_phone && (
                        <span className={styles.listMeta}>{r.customer_phone}</span>
                      )}
                    </td>
                    <td>{r.reward_name}</td>
                    <td>{numero(r.points_spent)}</td>
                    <td>
                      {r.delivery_method === "DELIVERY" ? (
                        <>
                          <span className={styles.listName}>
                            Delivery · {dinero(Number(r.delivery_fee ?? 0))}
                          </span>
                          {r.delivery_address && (
                            <span className={styles.listMeta}>{r.delivery_address}</span>
                          )}
                        </>
                      ) : (
                        <span className={styles.listMeta}>Recoger en el local</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          r.status === "DELIVERED"
                            ? styles.statusActive
                            : styles.statusPending
                        }`}
                      >
                        {r.status === "DELIVERED" ? "Entregado" : "Por recoger"}
                      </span>
                    </td>
                    <td>
                      {r.status === "DELIVERED" && r.delivered_at
                        ? fechaHora(r.delivered_at)
                        : fechaHora(r.created_at)}
                    </td>
                    <td>
                      {r.status === "PENDING_PICKUP" && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Marcar como entregado"
                          disabled={deliveringId === r.id}
                          onClick={() => marcarEntregado(r)}
                        >
                          {deliveringId === r.id ? "..." : "Marcar entregado"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {activeTab === "app" && (
          <>
        <div className={styles.header}>
          <div>
            <h2 className={styles.subHeading}>Canjes desde la app</h2>
            <p>
              Estos los hace el cliente solo, tocando &quot;Enviar canje&quot; en Mis
              DeliPuntos. Marca cuando ya se lo entregaste.
            </p>
          </div>
        </div>

        {appRedemptions.length > 0 && (
          <div className={styles.filters}>
            <div className={styles.searchWrap}>
              <DFInput
                value={appBusqueda}
                onChange={(e) => setAppBusqueda(e.target.value)}
                placeholder="Buscar por cliente o código..."
                icon={<FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />}
              />
            </div>

            <Dropdown
              options={APP_ESTADOS_FILTRO}
              value={appEstado}
              onChange={setAppEstado}
              placeholder="Estado"
            />

            <div className={styles.rangePicker}>
              <div className={styles.rangeDateWrap}>
                <DatePicker
                  value={appFechaDesde}
                  onChange={setAppFechaDesde}
                  placeholder="Desde"
                />
              </div>
              <span className={styles.rangeSeparator}>–</span>
              <div className={styles.rangeDateWrap}>
                <DatePicker
                  value={appFechaHasta}
                  onChange={setAppFechaHasta}
                  placeholder="Hasta"
                />
              </div>

              {(appFechaDesde || appFechaHasta) && (
                <button
                  type="button"
                  className={styles.rangeClearBtn}
                  onClick={() => {
                    setAppFechaDesde("");
                    setAppFechaHasta("");
                  }}
                  aria-label="Quitar filtro de fechas"
                  title="Quitar filtro de fechas"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
          </div>
        )}

        {appRedemptionsLoading ? (
          <p className={styles.hint}>Cargando...</p>
        ) : appRedemptions.length === 0 ? (
          <div className={styles.emptyState}>Todavía no hay canjes desde la app.</div>
        ) : appRedemptionsFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            Ningún canje coincide con el filtro.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Premio</th>
                  <th>Código</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appRedemptionsFiltradas.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={styles.listName}>{r.customer_name}</span>
                      {r.customer_phone && (
                        <span className={styles.listMeta}>{r.customer_phone}</span>
                      )}
                    </td>
                    <td>{r.item_name}</td>
                    <td>{r.redemption_code}</td>
                    <td>{numero(r.points_spent)}</td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          r.status === "FULFILLED"
                            ? styles.statusActive
                            : r.status === "CANCELLED"
                              ? styles.statusInactive
                              : styles.statusPending
                        }`}
                      >
                        {r.status === "FULFILLED"
                          ? "Entregado"
                          : r.status === "CANCELLED"
                            ? "Cancelado"
                            : "Por recoger"}
                      </span>
                    </td>
                    <td>
                      {r.status === "FULFILLED" && r.fulfilled_at
                        ? fechaHora(r.fulfilled_at)
                        : fechaHora(r.created_at)}
                    </td>
                    <td>
                      {r.status === "PENDING" && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Marcar como entregado"
                          disabled={markingAppId === r.id}
                          onClick={() => marcarAppEntregado(r)}
                        >
                          {markingAppId === r.id ? "..." : "Marcar entregado"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReward ? "Editar recompensa" : "Nueva recompensa"}
        width="480px"
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <input
              value={form.name}
              placeholder="Ej. Envío gratis"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción (opcional)</label>
            <textarea
              value={form.description}
              placeholder="Detalles de la recompensa..."
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Costo en puntos</label>
              <input
                type="number"
                min="1"
                value={form.pointsCost}
                placeholder="Ej. 500"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pointsCost: e.target.value }))
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cantidad disponible (opcional)</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                placeholder="Vacío = ilimitado"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stock: e.target.value }))
                }
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Recompensa de</label>
            <div className={styles.radioRow}>
              <DFRadio
                label="Deliflex"
                name="rewardSource"
                checked={!form.esEmpresa}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    esEmpresa: false,
                    businessId: "",
                    usandoOtraEmpresa: false,
                    customBusinessName: "",
                  }))
                }
              />
              <DFRadio
                label="Empresa externa"
                name="rewardSource"
                checked={form.esEmpresa}
                onChange={() => setForm((prev) => ({ ...prev, esEmpresa: true }))}
              />
            </div>

            {form.esEmpresa && (
              <div className={styles.businessPicker}>
                <Dropdown
                  fullWidth
                  options={[...businesses.map((b) => b.name), OTRA_EMPRESA_OPCION]}
                  value={
                    form.usandoOtraEmpresa
                      ? OTRA_EMPRESA_OPCION
                      : (businesses.find((b) => b.id === form.businessId)?.name ?? "")
                  }
                  placeholder="Selecciona una empresa"
                  onChange={(label) => {
                    if (label === OTRA_EMPRESA_OPCION) {
                      setForm((prev) => ({
                        ...prev,
                        businessId: "",
                        usandoOtraEmpresa: true,
                      }));
                      return;
                    }

                    const encontrada = businesses.find((b) => b.name === label);
                    setForm((prev) => ({
                      ...prev,
                      businessId: encontrada?.id ?? "",
                      usandoOtraEmpresa: false,
                      customBusinessName: "",
                    }));
                  }}
                />

                {form.usandoOtraEmpresa && (
                  <input
                    className={styles.customBusinessInput}
                    value={form.customBusinessName}
                    placeholder="Nombre de la empresa"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customBusinessName: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            )}
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
                    alt="Imagen de la recompensa"
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
                  <FontAwesomeIcon icon={faGift} />
                )}
              </div>

              <div className={styles.imageUploadActions}>
                <label className={styles.uploadImageBtn}>
                  {subiendoImagen ? (
                    <LoadingDots size="sm" />
                  ) : (
                    <FontAwesomeIcon icon={faPlus} />
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
                      if (file) subirImagen(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {form.imageUrl && (
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          <DFCheckbox
            label="Activa"
            checked={form.isActive}
            onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
          />

          {formError && <span className={styles.errorText}>{formError}</span>}

          <button className={styles.btnSolid} onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : editingReward ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={rewardToDelete !== null}
        title="Eliminar recompensa"
        message={
          <>
            ¿Seguro que deseas eliminar <strong>{rewardToDelete?.name}</strong>?
          </>
        }
        confirmLabel="Sí, eliminar"
        loading={deleting}
        onConfirm={eliminar}
        onCancel={() => setRewardToDelete(null)}
      />

      <Modal
        isOpen={redemptionModalOpen}
        onClose={() => setRedemptionModalOpen(false)}
        title="Registrar canje"
        width="480px"
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Cliente</label>
            {clienteElegido ? (
              <div className={styles.clienteElegido}>
                <span>
                  {clienteElegido.full_name}
                  {clienteElegido.email ? ` · ${clienteElegido.email}` : ""}
                </span>
                <button
                  type="button"
                  className={styles.clienteQuitar}
                  onClick={() => setClienteElegido(null)}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <input
                  value={busquedaCliente}
                  placeholder="Busca por nombre o email..."
                  onChange={(e) => {
                    setRedemptionError("");
                    setBusquedaCliente(e.target.value);
                  }}
                />
                {buscandoCliente && <span className={styles.hint}>Buscando...</span>}
                {busquedaCliente.trim().length >= 2 && resultadosCliente.length > 0 && (
                  <div className={styles.resultados}>
                    {resultadosCliente.map((c) => (
                      <div
                        key={c.id}
                        className={styles.resultado}
                        onClick={() => {
                          setClienteElegido(c);
                          setResultadosCliente([]);
                        }}
                      >
                        {c.full_name}
                        {c.email ? ` · ${c.email}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Recompensa</label>
            <Dropdown
              fullWidth
              options={rewardsDisponibles.map((r) => r.name)}
              value={
                rewardsDisponibles.find((r) => r.id === rewardIdElegido)?.name ?? ""
              }
              placeholder="Selecciona una recompensa"
              onChange={(nombre) => {
                const encontrada = rewardsDisponibles.find((r) => r.name === nombre);
                setRewardIdElegido(encontrada?.id ?? "");
                setMetodoEntrega("LOCAL");
                setDireccionDelivery("");
                setMontoDelivery("");
              }}
            />
            {rewardIdElegido && (
              <span className={styles.hint}>
                Costo:{" "}
                {numero(rewards.find((r) => r.id === rewardIdElegido)?.points_cost ?? 0)}{" "}
                pts
              </span>
            )}
          </div>

          {permiteDelivery && (
            <div className={styles.field}>
              <label className={styles.label}>Entrega</label>
              <div className={styles.radioRow}>
                <DFRadio
                  label="Recoger en el local"
                  name="metodoEntrega"
                  checked={metodoEntrega === "LOCAL"}
                  onChange={() => setMetodoEntrega("LOCAL")}
                />
                <DFRadio
                  label="Delivery"
                  name="metodoEntrega"
                  checked={metodoEntrega === "DELIVERY"}
                  onChange={() => setMetodoEntrega("DELIVERY")}
                />
              </div>

              {metodoEntrega === "DELIVERY" && (
                <div className={styles.formRow} style={{ marginTop: 8 }}>
                  <div className={styles.field}>
                    <label className={styles.label}>Dirección de entrega</label>
                    <input
                      value={direccionDelivery}
                      placeholder="Calle, sector, referencia..."
                      onChange={(e) => setDireccionDelivery(e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Monto del delivery</label>
                    <input
                      type="number"
                      min="0"
                      value={montoDelivery}
                      placeholder="Ej. 150"
                      onChange={(e) => setMontoDelivery(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <span className={styles.hint}>
                El delivery se cobra aparte, en efectivo o tarjeta al entregar
                (el canje ya se pagó con DeliPuntos).
              </span>
            </div>
          )}

          {redemptionError && (
            <span className={styles.errorText}>{redemptionError}</span>
          )}

          <button
            className={styles.btnSolid}
            onClick={registrarCanje}
            disabled={savingRedemption}
          >
            {savingRedemption ? "Registrando..." : "Registrar canje"}
          </button>
        </div>
      </Modal>

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

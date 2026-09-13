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
import Dropdown from "../components/components-items/dropdown";
import LoadingDots from "../components/components-items/loading-dots/loading-dots";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash, faGift } from "@fortawesome/free-solid-svg-icons";
import styles from "./delipuntos.module.css";

const API = process.env.NEXT_PUBLIC_API_URL;

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

export default function DeliPuntosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

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

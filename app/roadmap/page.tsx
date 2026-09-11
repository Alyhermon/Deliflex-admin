"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/components/modal/modal";
import ConfirmDialog from "../components/components/modal/confirm-dialog";
import Toast from "../components/components-items/toast/toast";
import Dropdown from "../components/components-items/dropdown";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import styles from "./roadmap.module.css";

const API = process.env.NEXT_PUBLIC_API_URL;

type Status = "PENDING" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH";

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  created_at: string;
};

type ItemForm = {
  title: string;
  description: string;
  priority: Priority;
};

const FORM_VACIO: ItemForm = { title: "", description: "", priority: "MEDIUM" };

const ESTADO_LABEL: Record<Status, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  DONE: "Hecha",
};

const PRIORIDAD_LABEL: Record<Priority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

const PRIORIDAD_OPCIONES = ["Baja", "Media", "Alta"];
const PRIORIDAD_DESDE_TEXTO: Record<string, Priority> = {
  Baja: "LOW",
  Media: "MEDIUM",
  Alta: "HIGH",
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short" });

export default function RoadmapPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"TODAS" | Status>("TODAS");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [form, setForm] = useState<ItemForm>(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const cargarItems = useCallback(async () => {
    try {
      const res = await fetch(`${API}/roadmap`, { credentials: "include" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
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
      return;
    }

    cargarItems();
  }, [authLoading, user, esSuperAdmin, router, cargarItems]);

  const abrirNuevo = () => {
    setEditingItem(null);
    setForm(FORM_VACIO);
    setFormError("");
    setModalOpen(true);
  };

  const abrirEditar = (item: RoadmapItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      priority: item.priority,
    });
    setFormError("");
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.title.trim()) {
      setFormError("Escribe un título");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await fetch(
        editingItem ? `${API}/roadmap/${editingItem.id}` : `${API}/roadmap`,
        {
          method: editingItem ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            priority: form.priority,
          }),
        },
      );

      if (!res.ok) throw new Error("No se pudo guardar");

      setModalOpen(false);
      setToast({
        message: editingItem ? "Idea actualizada" : "Idea agregada",
        type: "success",
      });
      await cargarItems();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo guardar",
      );
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (item: RoadmapItem, status: Status) => {
    try {
      const res = await fetch(`${API}/roadmap/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar");

      await cargarItems();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    }
  };

  const eliminar = async () => {
    if (!itemToDelete) return;

    setDeleting(true);

    try {
      const res = await fetch(`${API}/roadmap/${itemToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("No se pudo eliminar");

      setItemToDelete(null);
      setToast({ message: "Idea eliminada", type: "danger" });
      await cargarItems();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar",
        type: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  const itemsFiltrados =
    filtro === "TODAS" ? items : items.filter((i) => i.status === filtro);

  const conteos = {
    TODAS: items.length,
    PENDING: items.filter((i) => i.status === "PENDING").length,
    IN_PROGRESS: items.filter((i) => i.status === "IN_PROGRESS").length,
    DONE: items.filter((i) => i.status === "DONE").length,
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
            <h1>Mi Roadmap</h1>
            <p>
              Ideas y pendientes tuyos para la app de Deliflex. Solo tú puedes
              verlos.
            </p>
          </div>
          <button className={styles.btnSolid} onClick={abrirNuevo}>
            <FontAwesomeIcon icon={faPlus} /> Nueva idea
          </button>
        </div>

        <div className={styles.filters}>
          {(
            [
              ["TODAS", "Todas"],
              ["PENDING", "Pendientes"],
              ["IN_PROGRESS", "En progreso"],
              ["DONE", "Hechas"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.chip} ${
                filtro === key ? styles.chipActive : ""
              }`}
              onClick={() => setFiltro(key)}
            >
              {label}
              <span className={styles.chipCount}>{conteos[key]}</span>
            </button>
          ))}
        </div>

        {itemsFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            {items.length === 0
              ? "Todavía no has anotado ninguna idea. Empieza con la primera."
              : "Nada con este estado todavía."}
          </div>
        ) : (
          <div className={styles.grid}>
            {itemsFiltrados.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span
                    className={`${styles.priorityDot} ${
                      styles[`priority${item.priority}`]
                    }`}
                  />
                  <span className={styles.cardDate}>
                    {formatFecha(item.created_at)}
                  </span>
                  <div className={styles.cardIconBtns}>
                    <button
                      className={styles.iconBtn}
                      title="Editar"
                      onClick={() => abrirEditar(item)}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      title="Eliminar"
                      onClick={() => setItemToDelete(item)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{item.title}</h3>

                {item.description && (
                  <p className={styles.cardDescription}>{item.description}</p>
                )}

                <div className={styles.cardFoot}>
                  <span
                    className={`${styles.statusPill} ${
                      styles[`status${item.status}`]
                    }`}
                  >
                    {ESTADO_LABEL[item.status]}
                  </span>

                  <div className={styles.cardActions}>
                    {item.status !== "PENDING" && (
                      <button
                        className={styles.smallBtn}
                        onClick={() => cambiarEstado(item, "PENDING")}
                      >
                        Pendiente
                      </button>
                    )}
                    {item.status !== "IN_PROGRESS" && (
                      <button
                        className={styles.smallBtn}
                        onClick={() => cambiarEstado(item, "IN_PROGRESS")}
                      >
                        En progreso
                      </button>
                    )}
                    {item.status !== "DONE" && (
                      <button
                        className={`${styles.smallBtn} ${styles.smallBtnSuccess}`}
                        onClick={() => cambiarEstado(item, "DONE")}
                      >
                        Marcar hecha
                      </button>
                    )}
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
        title={editingItem ? "Editar idea" : "Nueva idea"}
        width="480px"
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Título</label>
            <input
              value={form.title}
              placeholder="Ej. Agregar reportes de ventas por categoría"
              onChange={(e) => {
                setFormError("");
                setForm((prev) => ({ ...prev, title: e.target.value }));
              }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción (opcional)</label>
            <textarea
              value={form.description}
              placeholder="Detalles, por qué lo quieres, cómo debería funcionar..."
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Prioridad</label>
            <Dropdown
              options={PRIORIDAD_OPCIONES}
              value={PRIORIDAD_LABEL[form.priority]}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  priority: PRIORIDAD_DESDE_TEXTO[value],
                }))
              }
              fullWidth
            />
          </div>

          {formError && <span className={styles.errorText}>{formError}</span>}

          <button className={styles.btnSolid} onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : editingItem ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={itemToDelete !== null}
        title="Eliminar idea"
        message={
          <>
            ¿Seguro que deseas eliminar <strong>{itemToDelete?.title}</strong>?
          </>
        }
        confirmLabel="Sí, eliminar"
        loading={deleting}
        onConfirm={eliminar}
        onCancel={() => setItemToDelete(null)}
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

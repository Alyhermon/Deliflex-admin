"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import DFInput from "../components/components-items/input";
import Toast from "../components/components-items/toast/toast";
import Skeleton from "../components/components-items/skeleton/skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faLock,
  faEye,
  faEyeSlash,
  faCopy,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import styles from "./configuracion.module.css";

// Rol de PLATAFORMA (global_role_id), no el rol que se tenga en un negocio
// puntual (ese sale de staff_businesses/owned_stores, listado aparte).
const ROL_PLATAFORMA: Record<number, string> = {
  100: "Super Administrador",
  90: "Administrador",
};

const ROL_NEGOCIO: Record<number, string> = {
  90: "Propietario",
  80: "Gerente General",
  70: "Supervisor",
  60: "Cajero",
  50: "Staff",
};

const iniciales = (nombre: string) => {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [idsRevelados, setIdsRevelados] = useState<Set<string>>(new Set());
  const [idCopiado, setIdCopiado] = useState<string | null>(null);

  const alternarRevelado = (storeId: string) => {
    setIdsRevelados((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const copiarId = async (storeId: string) => {
    try {
      await navigator.clipboard.writeText(storeId);
      setIdCopiado(storeId);
      setTimeout(() => setIdCopiado(null), 1500);
    } catch {
      // Sin acceso al portapapeles: no hay mucho mas que hacer aqui.
    }
  };

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const guardarContrasena = async () => {
    const errors: typeof formErrors = {};

    if (!currentPassword) errors.currentPassword = "Requerida";
    if (newPassword.length < 6) {
      errors.newPassword = "Debe tener al menos 6 caracteres";
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo actualizar la contraseña");
      }

      setToast({ message: "Contraseña actualizada", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <Skeleton width={180} height={22} style={{ marginBottom: 8 }} />
            <Skeleton width={280} height={13} />
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <Skeleton height={52} radius={999} style={{ marginBottom: 20 }} />
              <Skeleton height={14} style={{ marginBottom: 10 }} />
              <Skeleton height={14} />
            </div>
            <div className={styles.card}>
              <Skeleton height={14} style={{ marginBottom: 20 }} />
              <Skeleton height={44} radius={10} style={{ marginBottom: 10 }} />
              <Skeleton height={44} radius={10} />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    router.replace("/core/login");
    return null;
  }

  const rolPlataforma = ROL_PLATAFORMA[Number(user.global_role_id ?? 0)];
  const negocios = [
    ...(user.owned_stores ?? []).map((s) => ({
      id: s.store_id,
      nombre: s.store_name,
      rol: ROL_NEGOCIO[90],
    })),
    ...(user.staff_businesses ?? [])
      .filter((sb) => sb.store_name)
      .map((sb) => ({
        id: sb.store_id as string,
        nombre: sb.store_name as string,
        rol: ROL_NEGOCIO[sb.role_id] ?? sb.role_name,
      })),
  ];

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Configuración</h1>
          <p>Tu cuenta y seguridad.</p>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Mi perfil</h2>
            <p className={styles.cardHint}>Información de tu cuenta en Deliflex.</p>

            <div className={styles.profileHead}>
              <span className={styles.avatar}>{iniciales(user.username)}</span>
              <div>
                <div className={styles.name}>{user.username}</div>
                <span className={styles.roleTag}>
                  {rolPlataforma ?? "Usuario"}
                </span>
              </div>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Correo</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Teléfono</span>
              <span className={styles.infoValue}>{user.phone || "—"}</span>
            </div>

            {negocios.length > 0 && (
              <>
                <div className={styles.businessesTitle}>Tus negocios</div>
                {negocios.map((n, i) => {
                  const revelado = idsRevelados.has(n.id);

                  return (
                    <div key={i} className={styles.businessRow}>
                      <div className={styles.businessMain}>
                        <span className={styles.businessName}>{n.nombre}</span>
                        <span className={styles.businessRole}>{n.rol}</span>
                      </div>

                      <div className={styles.businessIdRow}>
                        <span className={styles.businessIdLabel}>ID</span>
                        <span className={styles.businessIdValue}>
                          {revelado ? n.id : "........"}
                        </span>

                        <button
                          type="button"
                          className={styles.idIconBtn}
                          title={revelado ? "Ocultar ID" : "Mostrar ID"}
                          onClick={() => alternarRevelado(n.id)}
                        >
                          <FontAwesomeIcon icon={revelado ? faEyeSlash : faEye} />
                        </button>

                        <button
                          type="button"
                          className={styles.idIconBtn}
                          title="Copiar ID"
                          onClick={() => copiarId(n.id)}
                        >
                          <FontAwesomeIcon
                            icon={idCopiado === n.id ? faCheck : faCopy}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Seguridad</h2>
            <p className={styles.cardHint}>
              Cambia la contraseña con la que inicias sesión.
            </p>

            <div className={styles.form}>
              <DFInput
                label="Contraseña actual"
                type="password"
                placeholder="Ingresa tu contraseña actual"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setFormErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                error={formErrors.currentPassword}
                icon={<FontAwesomeIcon color="#ed7b17" icon={faLock} />}
              />

              <DFInput
                label="Nueva contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFormErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                error={formErrors.newPassword}
                icon={<FontAwesomeIcon color="#ed7b17" icon={faKey} />}
              />

              <DFInput
                label="Confirmar nueva contraseña"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={formErrors.confirmPassword}
                icon={<FontAwesomeIcon color="#ed7b17" icon={faKey} />}
              />

              <button
                type="button"
                className={styles.submitBtn}
                onClick={guardarContrasena}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </div>
          </section>
        </div>
      </div>

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

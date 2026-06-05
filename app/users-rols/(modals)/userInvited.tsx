"use client";
import { useState } from "react";
import styles from "./userInvite.module.css";
import DFInput from "../../components/components-items/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faEnvelope,
  faShield,
  faStore,
  faUser,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Toast from "../../components/components-items/toast/toast";

type FoundUser = {
  id: string;
  username: string;
  email: string;
};

type Props = {
  onClose: () => void;
};

const ROLES = [
  {
    label: "Gerente General",
    value: 80,
    icon: faShield,
    description: "Gestiona una sucursal completa",
  },
  {
    label: "Supervisor",
    value: 70,
    icon: faStore,
    description: "Supervisa turnos y caja",
  },
  {
    label: "Cajero",
    value: 60,
    icon: faStore,
    description: "Maneja caja y pedidos",
  },
  {
    label: "Staff",
    value: 50,
    icon: faUser,
    description: "Operaciones básicas",
  },
];

export default function InviteUserModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "warning";
  } | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1 = buscar, 2 = asignar rol

  const searchUser = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setFoundUser(null);
    try {
      const res = await fetch(
        `/api/users/search?email=${encodeURIComponent(email)}`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) {
        setToast({
          message: "Usuario no encontrado en Deliflex",
          type: "error",
        });
        return;
      }
      const user = await res.json();
      setFoundUser(user);
      setStep(2);
    } catch {
      setToast({ message: "Error de conexión", type: "error" });
    } finally {
      setSearching(false);
    }
  };

  const assignRole = async () => {
    if (!foundUser || !selectedRole) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users/assign-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: foundUser.id,
          roleId: selectedRole,
        }),
      });

      console.log("ASSIGN STATUS:", res.status);
      const data = await res.json();
      console.log("ASSIGN DATA:", data);

      if (!res.ok) {
        setToast({ message: "Error al asignar el rol", type: "error" });
        return;
      }

      setToast({
        message: `${foundUser.username} agregado exitosamente`,
        type: "success",
      });
      setTimeout(onClose, 1500);
    } catch {
      setToast({ message: "Error de conexión", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.title}>Agregar miembro</span>
            <p>Busca un usuario de Deliflex y asígnale un rol</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className={styles.steps}>
          <div
            className={`${styles.step} ${step >= 1 ? styles.stepActive : ""}`}
          >
            <span>1</span> Buscar usuario
          </div>
          <div className={styles.stepLine} />
          <div
            className={`${styles.step} ${step >= 2 ? styles.stepActive : ""}`}
          >
            <span>2</span> Asignar rol
          </div>
        </div>

        {step === 1 && (
          <div className={styles.body}>
            <p className={styles.label}>Email del usuario en Deliflex</p>
            <div className={styles.searchRow}>
              <DFInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@email.com"
                icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
              />
              <button
                className={styles.searchBtn}
                onClick={searchUser}
                disabled={searching}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                {searching ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Asignar rol */}
        {step === 2 && foundUser && (
          <div className={styles.body}>
            {/* Usuario encontrado */}
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                {foundUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className={styles.userName}>{foundUser.username}</span>
                <p>{foundUser.email}</p>
              </div>
              <button
                className={styles.changeUser}
                onClick={() => {
                  setStep(1);
                  setFoundUser(null);
                  setSelectedRole(null);
                }}
              >
                Cambiar
              </button>
            </div>

            {/* Roles */}
            <p className={styles.label}>Selecciona el rol</p>
            <div className={styles.roles}>
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  className={`${styles.roleCard} ${selectedRole === role.value ? styles.roleCardActive : ""}`}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <FontAwesomeIcon
                    icon={role.icon}
                    className={styles.roleIcon}
                  />
                  <div>
                    <span>{role.label}</span>
                    <p>{role.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              className={styles.assignBtn}
              onClick={assignRole}
              disabled={!selectedRole || loading}
            >
              {loading ? "Agregando..." : "Agregar al equipo"}
            </button>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

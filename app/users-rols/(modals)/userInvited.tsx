"use client";
import { useState } from "react";
import styles from "./userInvite.module.css";
import DFInput from "../../components/components-items/input";
import DFDropdown from "../../components/components-items/dropdown";
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

type StoreChoice = {
  id: string;
  business_id: string;
  label: string;
  // Rol con el que quien invita opera en ESE negocio (dueño=90,
  // super admin=100, o su rol de business_staff ahi). Determina que
  // roles puede ofrecer: solo los que quedan estrictamente por debajo.
  effectiveRoleId: number;
};

type Props = {
  stores: StoreChoice[];
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

export default function InviteUserModal({ stores, onClose }: Props) {
  // A que sucursal se agrega: se elige aqui dentro, no depende de ningun
  // filtro de la pantalla de atras.
  const [storeLabel, setStoreLabel] = useState(
    stores.length === 1 ? stores[0].label : "",
  );
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

  const storeElegida = stores.find((s) => s.label === storeLabel);

  const searchUser = async () => {
    if (!storeElegida) {
      setToast({ message: "Elige primero la sucursal", type: "error" });
      return;
    }

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
    if (!foundUser || !selectedRole || !storeElegida) return;

    setLoading(true);

    try {
      const res = await fetch("/api/users/assign-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: foundUser.id,
          roleId: selectedRole,
          businessId: storeElegida.business_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const mensaje = Array.isArray(data?.message)
          ? data.message[0]
          : data?.message;

        setToast({
          message: mensaje || "Error al asignar el rol",
          type: "error",
        });
        return;
      }

      setToast({
        message: `${foundUser.username} agregado a ${storeElegida.label}`,
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
            <p>Elige la sucursal, busca al usuario y asígnale un rol</p>
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
            <p className={styles.label}>Sucursal a la que se agrega</p>
            <DFDropdown
              fullWidth
              options={stores.map((s) => s.label)}
              value={storeLabel}
              onChange={setStoreLabel}
              placeholder="Selecciona la sucursal"
            />

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
                disabled={searching || !storeElegida}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                {searching ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Asignar rol */}
        {step === 2 && foundUser && storeElegida && (
          <div className={styles.body}>
            {/* Sucursal elegida */}
            <p className={styles.label}>Se agrega a</p>
            <div className={styles.userCard}>
              <FontAwesomeIcon
                icon={faStore}
                color="#ed7b17"
                style={{ marginRight: 4 }}
              />
              <div>
                <span className={styles.userName}>{storeElegida.label}</span>
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

            {/* Roles: solo los que quedan estrictamente por debajo del
                rol con el que quien invita opera en esta sucursal (un
                Supervisor no puede ofrecer Gerente General ni Supervisor). */}
            <p className={styles.label}>Selecciona el rol</p>
            <div className={styles.roles}>
              {ROLES.filter((role) => role.value < storeElegida.effectiveRoleId).map((role) => (
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

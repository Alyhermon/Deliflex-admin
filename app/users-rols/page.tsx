"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/layout/adminLayout";
import styles from "./users.module.css";
import DFInput from "../components/components-items/input";
import DFDropdown from "../components/components-items/dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faShield,
  faStore,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import InviteUserModal from "./(modals)/userInvited";

type StaffMember = {
  id: string;
  username: string;
  email: string;
  role_name: string;
  role_id: number;
  status: string;
};

export default function UsersRolesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const options = ["Todos los negocios", "Cocorao", "Cafetería Soñada"];
  const storeOptions = ["Todas las sucursales", "Naco", "Bella Vista"];
  const usersOptions = ["Todos los roles", "Administrador", "Manager", "Staff"];

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/users/staff", {
        credentials: "include",
      });
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.statsTitle}>Roles</span>
            <p>Administra accesos y permisos</p>
          </div>
          <button
            className={styles.inviteBtn}
            onClick={() => setShowInvite(true)}
          >
            + Invitar usuario
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.card}>
            <div className={styles.circleUsers}>
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Usuarios Totales</p>
              <span>{staff.length}</span>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.circleManager}>
              <FontAwesomeIcon icon={faStore} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Gerentes</p>
              <span>{staff.filter((u) => u.role_id === 80).length}</span>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.circleShield}>
              <FontAwesomeIcon icon={faShield} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Supervisores</p>
              <span>{staff.filter((u) => u.role_id === 70).length}</span>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.circleStaff}>
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Staff</p>
              <span>{staff.filter((u) => u.role_id <= 60).length}</span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.tableContainer}>
            <div className={styles.filters}>
              <DFInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar Usuario"
                icon={
                  <FontAwesomeIcon color="#ed7b17" icon={faMagnifyingGlass} />
                }
              />
              <DFDropdown
                options={options}
                value={category}
                onChange={setCategory}
                placeholder="Selecciona negocios"
              />
              <DFDropdown
                options={storeOptions}
                value={category}
                onChange={setCategory}
                placeholder="Selecciona sucursal"
              />
              <DFDropdown
                options={usersOptions}
                value={category}
                onChange={setCategory}
                placeholder="Selecciona rol"
              />
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#9ca3af",
                      }}
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#9ca3af",
                      }}
                    >
                      No hay usuarios en el equipo todavia
                    </td>
                  </tr>
                ) : (
                  staff
                    .filter(
                      (u) =>
                        u.username
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div>
                            <span className={styles.tableName}>
                              {u.username}
                            </span>
                            <p>{u.email}</p>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${styles[u.role_name]}`}
                          >
                            {/* hola */}
                            {u.role_name}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              u.status === "active"
                                ? styles.active
                                : styles.inactive
                            }
                          >
                            {u.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>⋮</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.roles}>
            <span className={styles.statsTitle}>Roles</span>
            <span className={styles.description}>
              Gestiona los roles del sistema y los permisos que tienen asignados
            </span>
            <div className={styles.roleCards}>
              <div className={styles.roleCard}>
                <span className={styles.statsTitle}>Administrador</span>
                <p>Acceso completo</p>
              </div>
              <div className={styles.roleCard}>
                <span className={styles.statsTitle}>Manager</span>
                <p>Gestiona sucursales</p>
              </div>
              <div className={styles.roleCard}>
                <span className={styles.statsTitle}>Staff</span>
                <p>Acceso limitado</p>
              </div>
            </div>
            <button className={styles.createRole}>+ Crear rol</button>
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteUserModal
          onClose={() => {
            setShowInvite(false);
            loadStaff();
          }}
        />
      )}
    </AdminLayout>
  );
}

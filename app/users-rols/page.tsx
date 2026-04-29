"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/layout/adminLayout";
import styles from "./users.module.css";
import DFInput from "../components/components-items/input";
import DFDropdown from "../components/components-items/dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const users = [
  {
    name: "Juan Pérez",
    email: "juan.perez@mail.com",
    business: "Cocorao",
    store: "Todas",
    role: "Administrador",
    status: "Activo",
  },
  {
    name: "María Gómez",
    email: "maria@mail.com",
    business: "Cocorao",
    store: "Naco",
    role: "Manager",
    status: "Activo",
  },
  {
    name: "Pedro Martínez",
    email: "pedro@mail.com",
    business: "Cafetería Soñada",
    store: "Bella Vista",
    role: "Staff",
    status: "Inactivo",
  },
];

export default function UsersRolesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const options = ["Todos los negocios", "Cocorao", "Cafetería Soñada"];
  const storeOptions = ["Todas las sucursales", "Naco", "Bella Vista"];
  const usersOptions = ["Todos los roles", "Administrador", "Manager", "Staff"];
  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.statsTitle}>Roles</span>
            <p>Administra accesos y permisos</p>
          </div>

          <button className={styles.inviteBtn}>+ Invitar usuario</button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.card}>
            <p className={styles.statsTitle}>Usuarios Totales</p>
            <h2>28</h2>
          </div>
          <div className={styles.card}>
            <p className={styles.statsTitle}>Admins</p>
            <h2>6</h2>
          </div>
          <div className={styles.card}>
            <p className={styles.statsTitle}>Managers</p>
            <h2>15</h2>
          </div>
          <div className={styles.card}>
            <p className={styles.statsTitle}>Staff</p>
            <h2>7</h2>
          </div>
        </div>

        {/* Main */}
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

            {/* Tabla */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Negocio</th>
                  <th>Sucursal</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {users.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div>
                        <strong>{u.name}</strong>
                        <p>{u.email}</p>
                      </div>
                    </td>
                    <td>{u.business}</td>
                    <td>{u.store}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          u.status === "Activo"
                            ? styles.active
                            : styles.inactive
                        }
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>⋮</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sidebar roles */}
          <div className={styles.roles}>
            <span className={styles.statsTitle}>Roles</span>

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
    </AdminLayout>
  );
}

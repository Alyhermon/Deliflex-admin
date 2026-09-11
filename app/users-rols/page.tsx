"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import Modal from "../components/components/modal/modal";
import ConfirmDialog from "../components/components/modal/confirm-dialog";
import Toast from "../components/components-items/toast/toast";
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
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
import InviteUserModal from "./(modals)/userInvited";
import { useAuth } from "../hooks/useAuth";
import { useActiveStore, ALL_STORES_ID } from "../hooks/useActiveStore";
import Skeleton, {
  SkeletonTableRows,
} from "../components/components-items/skeleton/skeleton";

type StoreOption = {
  id: string;
  business_id: string;
  name: string;
  status?: string;
};

type StaffMember = {
  id: string;
  user_id: string;
  username: string;
  email: string;
  phone: string | null;
  cedula: string;
  role_name: string;
  role_id: number;
  status: string;
  created_at: string;
  business_id: string;
  store_name: string | null;
};

// Mismos 5 roles que reparte el modal de invitar (+ Administrador, que solo
// un super admin puede asignar). role_id -> clase de color de la medalla.
const ROLE_BADGE: Record<number, string> = {
  90: "roleAdministrador",
  80: "roleGerente",
  70: "roleSupervisor",
  60: "roleCajero",
  50: "roleStaff",
};

const ROLE_FILTROS = ["Administrador", "Gerente General", "Supervisor", "Cajero", "Staff"];
const ESTADO_FILTROS = ["Activo", "Inactivo"];

// Sin foto de perfil todavia en el backend: las iniciales del nombre
// hacen de avatar mientras tanto (2 letras si hay nombre y apellido).
const iniciales = (nombre: string) => {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// "8099948248" -> "(809) 994-8248". Si no tiene la forma esperada
// (10 digitos dominicanos), se deja tal cual en vez de deformarlo.
const formatTelefono = (valor: string | null) => {
  if (!valor) return "—";

  const digitos = valor.replace(/\D/g, "");

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6)}`;
  }

  if (digitos.length === 11 && digitos.startsWith("1")) {
    return `+1 (${digitos.slice(1, 4)}) ${digitos.slice(4, 7)}-${digitos.slice(7)}`;
  }

  return valor;
};

// "00112345678" -> "001-1234567-8". Formato visual de cedula dominicana.
// "0" (sin definir) se muestra tal cual, no como "000-0000000-0".
const formatCedula = (valor: string) => {
  if (!valor || valor === "0") return "0";

  const digitos = valor.replace(/\D/g, "");

  if (digitos.length === 11) {
    return `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`;
  }

  return valor;
};

function RowMenu({
  onVerDetalle,
  onToggleStatus,
  onQuitar,
  activo,
  puedeGestionar,
}: {
  onVerDetalle: () => void;
  onToggleStatus: () => void;
  onQuitar: () => void;
  activo: boolean;
  // false cuando la fila es de alguien en tu mismo nivel o por encima
  // (ej. un Supervisor viendo a un Gerente General): solo puede ver el
  // detalle, ninguna accion de gestion.
  puedeGestionar: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={styles.rowMenu} ref={ref}>
      <button
        type="button"
        className={styles.rowMenuBtn}
        onClick={() => setOpen((o) => !o)}
        aria-label="Mas acciones"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>

      {open && (
        <div className={styles.rowMenuDropdown}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onVerDetalle();
            }}
          >
            Ver detalle
          </button>

          {puedeGestionar && (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onToggleStatus();
                }}
              >
                {activo ? "Desactivar" : "Reactivar"}
              </button>

              <button
                type="button"
                className={styles.rowMenuDanger}
                onClick={() => {
                  setOpen(false);
                  onQuitar();
                }}
              >
                Quitar del equipo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function UsersRolesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  // El negocio activo es el mismo que elige el selector del sidebar para
  // toda la app: aqui no hay un filtro de negocio aparte, para no repetir
  // la misma eleccion dos veces en dos lugares distintos.
  const { activeStoreId } = useActiveStore();
  const realStoreId = activeStoreId === ALL_STORES_ID ? null : activeStoreId;

  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const [detailMember, setDetailMember] = useState<StaffMember | null>(null);
  const [cedulaInput, setCedulaInput] = useState("");
  const [savingCedula, setSavingCedula] = useState(false);

  const [memberToToggle, setMemberToToggle] = useState<StaffMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<StaffMember | null>(null);
  const [acting, setActing] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  // El Dropdown solo habla en texto: si dos negocios se llaman igual
  // (pasa varias veces en la BD, ej. "Cocorao Zona Colonial" x3), hay que
  // desambiguar la etiqueta o el segundo quedaria inalcanzable.
  const nombresRepetidos = stores.reduce<Record<string, number>>((acc, s) => {
    acc[s.name] = (acc[s.name] ?? 0) + 1;
    return acc;
  }, {});

  const etiquetaTienda = (store: StoreOption) =>
    nombresRepetidos[store.name] > 1
      ? `${store.name} (${store.id.slice(0, 8)})`
      : store.name;

  const storeSeleccionada = stores.find((s) => s.id === realStoreId);

  // El rol con el que el usuario actual opera EN ESE negocio puntual:
  // super admin y dueño (implicito, si el negocio esta en su lista de
  // "accessible" y no aparece como staff) valen 100/90; si no, el que
  // tenga en staff_businesses. null si no tiene ningun vinculo real.
  // Es un espejo del calculo que hace el backend, solo para decidir que
  // mostrar - el backend vuelve a validar todo antes de ejecutar nada.
  const effectiveRoleFor = useCallback(
    (businessId: string): number | null => {
      if (esSuperAdmin) return 100;

      const comoStaff = user?.staff_businesses?.find(
        (sb) => sb.business_id === businessId,
      );
      if (comoStaff) return comoStaff.role_id;

      const esConocido = stores.some((s) => s.business_id === businessId);
      return esConocido ? 90 : null;
    },
    [esSuperAdmin, user, stores],
  );

  // Solo se puede invitar/asignar en negocios donde de verdad se puede
  // gestionar equipo (Supervisor para arriba); mostrar los demas en el
  // selector solo llevaria a un error del backend al intentar guardar.
  const storesParaInvitar = stores.filter(
    (s) => (effectiveRoleFor(s.business_id) ?? 0) >= 70,
  );

  // Carga las tiendas: todas las de la plataforma si eres super admin,
  // solo las tuyas si eres un admin normal. Sirven para el filtro de arriba
  // y para elegir a cual sucursal se agrega alguien nuevo.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoadingStores(false);
      router.replace("/core/login");
      return;
    }

    const url = esSuperAdmin
      ? `${process.env.NEXT_PUBLIC_API_URL}/register-business/all`
      : `${process.env.NEXT_PUBLIC_API_URL}/register-business/accessible/${user.id}`;

    const cargarTiendas = async () => {
      try {
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();

        setStores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStores(false);
      }
    };

    cargarTiendas();
  }, [authLoading, user, esSuperAdmin, router]);

  // El equipo combinado de todas las sucursales en una sola carga: el
  // selector de arriba es puro filtro sobre esto, no dispara otra peticion.
  const loadStaff = useCallback(
    async (reintentar = true) => {
      setLoadingStaff(true);

      try {
        const res = await fetch("/api/users/staff/all", {
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "No se pudo cargar el equipo");
        }

        const data = await res.json();

        setStaff(Array.isArray(data) ? data : []);
        setStaffError(false);
      } catch (error) {
        console.error(error);

        if (reintentar) {
          setTimeout(() => loadStaff(false), 1200);
          return;
        }

        setStaffError(true);
        setStaff([]);
      } finally {
        setLoadingStaff(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadStaff();
  }, [authLoading, user, loadStaff]);

  const normalize = (text: string) => text.toLowerCase().trim();
  const normalizedSearch = normalize(search);

  // El filtro de negocio se separa del resto: los stat cards lo respetan,
  // pero no la busqueda por texto ni el rol (esos solo acotan la tabla).
  const staffDelNegocio = staff.filter((u) =>
    storeSeleccionada ? u.business_id === storeSeleccionada.business_id : true,
  );

  const filteredStaff = staffDelNegocio
    .filter((u) =>
      normalizedSearch
        ? normalize(u.username).includes(normalizedSearch) ||
          normalize(u.email).includes(normalizedSearch)
        : true,
    )
    .filter((u) => (roleFilter ? u.role_name === roleFilter : true))
    .filter((u) =>
      statusFilter
        ? u.status === (statusFilter === "Activo" ? "active" : "inactive")
        : true,
    );

  const mostrarColumnaNegocio = !storeSeleccionada;

  const toggleStatus = async () => {
    if (!memberToToggle) return;

    const nextStatus = memberToToggle.status === "active" ? "inactive" : "active";

    setActing(true);

    try {
      const res = await fetch(`/api/users/staff/${memberToToggle.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessId: memberToToggle.business_id,
          status: nextStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "No se pudo actualizar");

      setStaff((prev) =>
        prev.map((u) => (u.id === memberToToggle.id ? { ...u, status: nextStatus } : u)),
      );

      setToast({
        message:
          nextStatus === "active"
            ? `${memberToToggle.username} fue reactivado`
            : `${memberToToggle.username} fue desactivado`,
        type: nextStatus === "active" ? "success" : "danger",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setActing(false);
      setMemberToToggle(null);
    }
  };

  const removeMember = async () => {
    if (!memberToRemove) return;

    setActing(true);

    try {
      const res = await fetch(
        `/api/users/staff/${memberToRemove.id}?businessId=${memberToRemove.business_id}`,
        { method: "DELETE", credentials: "include" },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "No se pudo eliminar");

      setStaff((prev) => prev.filter((u) => u.id !== memberToRemove.id));
      setToast({
        message: `${memberToRemove.username} fue eliminado del equipo`,
        type: "danger",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo eliminar",
        type: "danger",
      });
    } finally {
      setActing(false);
      setMemberToRemove(null);
    }
  };

  const abrirDetalle = (member: StaffMember) => {
    setDetailMember(member);
    setCedulaInput(member.cedula === "0" ? "" : member.cedula);
  };

  const guardarCedula = async () => {
    if (!detailMember) return;

    const cedula = cedulaInput.trim() || "0";

    if (cedula !== "0" && !/^\d{11}$/.test(cedula)) {
      setToast({
        message: "La cedula debe tener 11 digitos, o dejarse vacia",
        type: "danger",
      });
      return;
    }

    setSavingCedula(true);

    try {
      const res = await fetch(`/api/users/staff/${detailMember.id}/cedula`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId: detailMember.business_id, cedula }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "No se pudo actualizar");

      setStaff((prev) =>
        prev.map((u) => (u.id === detailMember.id ? { ...u, cedula } : u)),
      );
      setDetailMember((prev) => (prev ? { ...prev, cedula } : prev));
      setToast({ message: "Cedula actualizada", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo actualizar",
        type: "danger",
      });
    } finally {
      setSavingCedula(false);
    }
  };

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
            disabled={storesParaInvitar.length === 0}
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
              {loadingStaff ? (
                <Skeleton width={28} height={20} />
              ) : (
                <span>{staffDelNegocio.length}</span>
              )}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.circleManager}>
              <FontAwesomeIcon icon={faStore} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Gerentes</p>
              {loadingStaff ? (
                <Skeleton width={28} height={20} />
              ) : (
                <span>{staffDelNegocio.filter((u) => u.role_id === 80).length}</span>
              )}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.circleShield}>
              <FontAwesomeIcon icon={faShield} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Supervisores</p>
              {loadingStaff ? (
                <Skeleton width={28} height={20} />
              ) : (
                <span>{staffDelNegocio.filter((u) => u.role_id === 70).length}</span>
              )}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.circleStaff}>
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className={styles.statsInfo}>
              <p className={styles.statsTitle}>Staff</p>
              {loadingStaff ? (
                <Skeleton width={28} height={20} />
              ) : (
                <span>{staffDelNegocio.filter((u) => u.role_id <= 60).length}</span>
              )}
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
                options={ROLE_FILTROS}
                value={roleFilter}
                onChange={setRoleFilter}
                placeholder="Selecciona rol"
              />
              <DFDropdown
                options={ESTADO_FILTROS}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Selecciona estado"
              />
            </div>

            {!loadingStores && stores.length === 0 ? (
              <div className={styles.emptyTable}>
                {esSuperAdmin
                  ? "Todavia no hay negocios en la plataforma."
                  : "Todavia no tienes negocios registrados."}
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    {mostrarColumnaNegocio && <th>Negocio</th>}
                    <th>Rol</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStaff ? (
                    <SkeletonTableRows
                      rows={4}
                      columns={mostrarColumnaNegocio ? 5 : 4}
                    />
                  ) : staffError ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyTable}>
                        No se pudo cargar el equipo.{" "}
                        <button
                          type="button"
                          className={styles.retryLink}
                          onClick={() => loadStaff()}
                        >
                          Reintentar
                        </button>
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyTable}>
                        No hay usuarios en el equipo todavia
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyTable}>
                        Nadie coincide con ese filtro
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.avatar}>
                              {iniciales(u.username)}
                            </span>
                            <div>
                              <span className={styles.tableName}>
                                {u.username}
                              </span>
                              <p>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {mostrarColumnaNegocio && (
                          <td className={styles.storeCell}>
                            {u.store_name || "—"}
                          </td>
                        )}
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[ROLE_BADGE[u.role_id]] ?? ""
                            }`}
                          >
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
                        <td>
                          <RowMenu
                            activo={u.status === "active"}
                            puedeGestionar={
                              (effectiveRoleFor(u.business_id) ?? 0) > u.role_id
                            }
                            onVerDetalle={() => abrirDetalle(u)}
                            onToggleStatus={() => setMemberToToggle(u)}
                            onQuitar={() => setMemberToRemove(u)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteUserModal
          stores={storesParaInvitar.map((s) => ({
            id: s.id,
            business_id: s.business_id,
            label: etiquetaTienda(s),
            effectiveRoleId: effectiveRoleFor(s.business_id) ?? 0,
          }))}
          onClose={() => {
            setShowInvite(false);
            loadStaff();
          }}
        />
      )}

      <Modal
        isOpen={detailMember !== null}
        onClose={() => setDetailMember(null)}
        title="Detalle del usuario"
        width="420px"
      >
        {detailMember && (
          <div className={styles.detailBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Nombre</span>
              <span>{detailMember.username}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Correo</span>
              <span>{detailMember.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Telefono</span>
              <span>{formatTelefono(detailMember.phone)}</span>
            </div>

            <div className={styles.detailRowEdit}>
              <span className={styles.detailLabel}>Cedula</span>
              <div className={styles.cedulaEdit}>
                <input
                  className={styles.cedulaInput}
                  value={cedulaInput}
                  placeholder="000-0000000-0"
                  maxLength={11}
                  onChange={(e) =>
                    setCedulaInput(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                />
                <button
                  type="button"
                  className={styles.cedulaSaveBtn}
                  onClick={guardarCedula}
                  disabled={
                    savingCedula ||
                    (cedulaInput || "0") === detailMember.cedula
                  }
                >
                  {savingCedula ? "..." : "Guardar"}
                </button>
              </div>
            </div>
            <p className={styles.cedulaHint}>
              Actual: {formatCedula(detailMember.cedula)}. Solo un administrador
              puede editarla.
            </p>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Negocio</span>
              <span>{detailMember.store_name || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Rol</span>
              <span>{detailMember.role_name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Estado</span>
              <span>
                {detailMember.status === "active" ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>En el equipo desde</span>
              <span>{fechaCorta(detailMember.created_at)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={memberToToggle !== null}
        title={memberToToggle?.status === "active" ? "Desactivar acceso" : "Reactivar acceso"}
        message={
          <>
            ¿Seguro que deseas{" "}
            {memberToToggle?.status === "active" ? "desactivar" : "reactivar"} a{" "}
            <strong>{memberToToggle?.username}</strong>?
          </>
        }
        note={
          memberToToggle?.status === "active"
            ? "No podra acceder a este negocio hasta que lo reactives."
            : "Recupera su acceso a este negocio."
        }
        confirmLabel={memberToToggle?.status === "active" ? "Si, desactivar" : "Si, reactivar"}
        loading={acting}
        onConfirm={toggleStatus}
        onCancel={() => setMemberToToggle(null)}
      />

      <ConfirmDialog
        isOpen={memberToRemove !== null}
        title="Quitar del equipo"
        message={
          <>
            ¿Seguro que deseas quitar a{" "}
            <strong>{memberToRemove?.username}</strong> del equipo?
          </>
        }
        note="Pierde el acceso a este negocio. Su cuenta de Deliflex no se borra."
        confirmLabel="Si, quitar"
        loading={acting}
        onConfirm={removeMember}
        onCancel={() => setMemberToRemove(null)}
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

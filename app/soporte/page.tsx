"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layout/adminLayout";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/components/modal/modal";
import Toast from "../components/components-items/toast/toast";
import Skeleton, {
  SkeletonStatCards,
} from "../components/components-items/skeleton/skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import styles from "./soporte.module.css";

const API = "http://localhost:3001";

type Status = "NUEVO" | "EN_PROGRESO" | "FINALIZADO";

type Ticket = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  subject: string;
  message: string;
  status: Status;
  created_at: string;
};

type CustomerResult = {
  id: string;
  full_name: string;
  email: string | null;
};

const COLUMNAS: { key: Status; label: string }[] = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "EN_PROGRESO", label: "En progreso" },
  { key: "FINALIZADO", label: "Finalizado" },
];

const SIGUIENTE_ESTADO: Record<Status, Status | null> = {
  NUEVO: "EN_PROGRESO",
  EN_PROGRESO: "FINALIZADO",
  FINALIZADO: null,
};

const ANTERIOR_ESTADO: Record<Status, Status | null> = {
  NUEVO: null,
  EN_PROGRESO: "NUEVO",
  FINALIZADO: "EN_PROGRESO",
};

const ETIQUETA_ESTADO: Record<Status, string> = {
  NUEVO: "Nuevo",
  EN_PROGRESO: "En progreso",
  FINALIZADO: "Finalizado",
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SoportePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const esSuperAdmin = Number(user?.global_role_id) >= 100;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<CustomerResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [clienteElegido, setClienteElegido] = useState<CustomerResult | null>(
    null,
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const cargarTickets = useCallback(async () => {
    try {
      const res = await fetch(`${API}/support/tickets`, {
        credentials: "include",
      });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
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

    cargarTickets();
  }, [authLoading, user, esSuperAdmin, router, cargarTickets]);

  useEffect(() => {
    if (!modalOpen) return;
    if (busqueda.trim().length < 2) {
      setResultados([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(
          `${API}/support/tickets/customers/search?q=${encodeURIComponent(busqueda.trim())}`,
          { credentials: "include" },
        );
        const data = await res.json();
        setResultados(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [busqueda, modalOpen]);

  const abrirNuevo = () => {
    setClienteElegido(null);
    setBusqueda("");
    setResultados([]);
    setSubject("");
    setMessage("");
    setFormError("");
    setModalOpen(true);
  };

  const crearTicket = async () => {
    if (!clienteElegido) {
      setFormError("Elige un cliente");
      return;
    }
    if (!subject.trim()) {
      setFormError("Escribe un asunto");
      return;
    }
    if (!message.trim()) {
      setFormError("Escribe el mensaje del reporte");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await fetch(`${API}/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: clienteElegido.id,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) throw new Error("No se pudo crear el ticket");

      setModalOpen(false);
      setToast({ message: "Ticket creado", type: "success" });
      await cargarTickets();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo crear el ticket",
      );
    } finally {
      setSaving(false);
    }
  };

  const moverTicket = async (ticket: Ticket, nuevoEstado: Status) => {
    setMovingId(ticket.id);
    try {
      const res = await fetch(`${API}/support/tickets/${ticket.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevoEstado }),
      });

      if (!res.ok) throw new Error("No se pudo mover el ticket");

      if (nuevoEstado === "FINALIZADO") {
        setToast({
          message: `Se notificó a ${ticket.customer_name} que su ticket fue resuelto`,
          type: "success",
        });
      }

      await cargarTickets();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo mover el ticket",
        type: "danger",
      });
    } finally {
      setMovingId(null);
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
            <h1>Soporte</h1>
            <p>
              Reportes que mandan los clientes desde la app. Al marcar un
              ticket como Finalizado, el cliente recibe un aviso automático.
            </p>
          </div>
          <button className={styles.btnSolid} onClick={abrirNuevo}>
            <FontAwesomeIcon icon={faPlus} /> Nuevo ticket
          </button>
        </div>

        <div className={styles.board}>
          {COLUMNAS.map((col) => {
            const ticketsCol = tickets.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className={styles.column}>
                <div className={styles.columnHeader}>
                  <span>{col.label}</span>
                  <span className={styles.columnCount}>{ticketsCol.length}</span>
                </div>

                <div className={styles.columnBody}>
                  {ticketsCol.length === 0 ? (
                    <div className={styles.emptyColumn}>Sin tickets</div>
                  ) : (
                    ticketsCol.map((ticket) => {
                      const anterior = ANTERIOR_ESTADO[ticket.status];
                      const siguiente = SIGUIENTE_ESTADO[ticket.status];
                      return (
                        <div key={ticket.id} className={styles.card}>
                          <div className={styles.cardTop}>
                            <span className={styles.cardCustomer}>
                              {ticket.customer_name}
                            </span>
                            <span className={styles.cardDate}>
                              {formatFecha(ticket.created_at)}
                            </span>
                          </div>

                          <h3 className={styles.cardSubject}>{ticket.subject}</h3>
                          <p className={styles.cardMessage}>{ticket.message}</p>

                          {ticket.customer_email && (
                            <span className={styles.cardEmail}>
                              <FontAwesomeIcon icon={faEnvelope} />{" "}
                              {ticket.customer_email}
                            </span>
                          )}

                          <div className={styles.cardActions}>
                            {anterior && (
                              <button
                                className={styles.smallBtn}
                                disabled={movingId === ticket.id}
                                onClick={() => moverTicket(ticket, anterior)}
                              >
                                ← {ETIQUETA_ESTADO[anterior]}
                              </button>
                            )}
                            {siguiente && (
                              <button
                                className={`${styles.smallBtn} ${
                                  siguiente === "FINALIZADO"
                                    ? styles.smallBtnSuccess
                                    : ""
                                }`}
                                disabled={movingId === ticket.id}
                                onClick={() => moverTicket(ticket, siguiente)}
                              >
                                {ETIQUETA_ESTADO[siguiente]} →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo ticket de soporte"
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
                  value={busqueda}
                  placeholder="Busca por nombre o email..."
                  onChange={(e) => {
                    setFormError("");
                    setBusqueda(e.target.value);
                  }}
                />
                {buscando && (
                  <span className={styles.hint}>Buscando...</span>
                )}
                {resultados.length > 0 && (
                  <div className={styles.resultados}>
                    {resultados.map((c) => (
                      <div
                        key={c.id}
                        className={styles.resultado}
                        onClick={() => {
                          setClienteElegido(c);
                          setResultados([]);
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
            <label className={styles.label}>Asunto</label>
            <input
              value={subject}
              placeholder="Ej. No me llegó mi pedido"
              onChange={(e) => {
                setFormError("");
                setSubject(e.target.value);
              }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Mensaje</label>
            <textarea
              value={message}
              placeholder="Detalle del reporte..."
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {formError && <span className={styles.errorText}>{formError}</span>}

          <button
            className={styles.btnSolid}
            onClick={crearTicket}
            disabled={saving}
          >
            {saving ? "Creando..." : "Crear ticket"}
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

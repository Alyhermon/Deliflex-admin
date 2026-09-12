"use client";

import styles from "./edit.module.css";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faLocationDot,
  faClock,
  faLock,
  faCamera,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import AdminLayout from "../../../components/layout/adminLayout";
import Breadcrumb from "../../../components/components-items/breadcrumb/breadcrumb";
import TimePicker from "@/app/components/components-items/timepicker";
import DFCheckbox from "@/app/components/components-items/checkbox/checkbox";
import Toast from "@/app/components/components-items/toast/toast";

type StoreCategory = {
  id: string;
  category_name: string;
};

type Horario = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

type EditForm = {
  nameBusisness: string;
  email: string;
  phoneBusiness: string;
  taxId: string;
  storeName: string;
  description: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  categoryName: string;
  isStreetLocation: boolean;
  bannerUrl: string;
};

type FormErrors = Partial<Record<keyof EditForm, string>> & {
  horarios?: string;
};

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// La BD guarda "HH:mm"; el TimePicker habla "h:mm AM/PM".
const a12Horas = (valor: string) => {
  if (!valor) return "8:00 AM";

  const [h, m] = valor.split(":").map(Number);
  const periodo = h >= 12 ? "PM" : "AM";
  const hora = h % 12 === 0 ? 12 : h % 12;

  return `${hora}:${String(m).padStart(2, "0")} ${periodo}`;
};

const a24Horas = (valor: string) => {
  const match = valor.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return "08:00";

  let hora = Number(match[1]) % 12;

  if (match[3].toUpperCase() === "PM") hora += 12;

  return `${String(hora).padStart(2, "0")}:${match[2]}`;
};

const horariosPorDefecto = (): Horario[] =>
  DIAS.map((_, dayOfWeek) => ({
    dayOfWeek,
    openTime: "08:00",
    closeTime: "22:00",
    isClosed: false,
  }));

export default function EditStorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>(horariosPorDefecto());
  const [errors, setErrors] = useState<FormErrors>({});
  const [subiendoBanner, setSubiendoBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "danger";
  } | null>(null);

  const [form, setForm] = useState<EditForm>({
    nameBusisness: "",
    email: "",
    phoneBusiness: "",
    taxId: "",
    storeName: "",
    description: "",
    storeAddress: "",
    storePhone: "",
    storeEmail: "",
    categoryName: "",
    isStreetLocation: false,
    bannerUrl: "",
  });

  const handleChange = <K extends keyof EditForm>(
    name: K,
    value: EditForm[K],
  ) => {
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        const [resDatos, resCategorias] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/register-business/edit/${id}`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/register-business/categories`, { credentials: "include" }),
        ]);

        if (!resDatos.ok) {
          setNoEncontrado(true);
          return;
        }

        const datos = await resDatos.json();
        const categorias = await resCategorias.json();

        setCategories(Array.isArray(categorias) ? categorias : []);

        setForm({
          nameBusisness: datos.name_busisness ?? "",
          email: datos.business_email ?? "",
          phoneBusiness: datos.contact_phone ?? "",
          taxId: datos.tax_id ?? "",
          storeName: datos.store_name ?? "",
          description: datos.description ?? "",
          storeAddress: datos.address ?? "",
          storePhone: datos.store_phone ?? "",
          storeEmail: datos.store_email ?? "",
          categoryName: datos.category_name ?? "",
          isStreetLocation: Boolean(datos.is_street_location),
          bannerUrl: datos.banner_url ?? "",
        });

        // Los dias que no estan guardados se muestran como cerrados.
        if (Array.isArray(datos.schedules) && datos.schedules.length) {
          const guardados: Horario[] = DIAS.map((_, dayOfWeek) => {
            const fila = datos.schedules.find(
              (s: { day_of_week: number }) => s.day_of_week === dayOfWeek,
            );

            if (!fila) {
              return {
                dayOfWeek,
                openTime: "08:00",
                closeTime: "22:00",
                isClosed: true,
              };
            }

            return {
              dayOfWeek,
              openTime: (fila.open_time ?? "08:00").slice(0, 5),
              closeTime: (fila.close_time ?? "22:00").slice(0, 5),
              isClosed: Boolean(fila.is_closed),
            };
          });

          setHorarios(guardados);
        }
      } catch (error) {
        console.error(error);
        setNoEncontrado(true);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [id]);

  const subirBanner = async (file: File) => {
    setSubiendoBanner(true);
    setBannerError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "Banner-business");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      handleChange("bannerUrl", data.url);
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : "No se pudo subir la imagen",
      );
    } finally {
      setSubiendoBanner(false);
    }
  };

  const cambiarHorario = (
    dayOfWeek: number,
    campo: keyof Horario,
    valor: string | boolean,
  ) => {
    setErrors((prev) => ({ ...prev, horarios: undefined }));
    setHorarios((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [campo]: valor } : h)),
    );
  };

  const handleSubmit = async () => {
    const nextErrors: FormErrors = {};

    const invalido = horarios.find(
      (h) => !h.isClosed && h.openTime >= h.closeTime,
    );

    if (invalido) {
      nextErrors.horarios = `En ${DIAS[invalido.dayOfWeek]} la apertura debe ser antes del cierre`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register-business/store/${id}`,
        {
          credentials: "include",
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // El resto de los campos es de solo lectura salvo el banner: el
          // backend usa COALESCE, asi que lo que no se manda se queda como esta.
          body: JSON.stringify({
            bannerUrl: form.bannerUrl || undefined,
            schedules: horarios.map((h) => ({
              dayOfWeek: h.dayOfWeek,
              openTime: h.isClosed ? undefined : h.openTime,
              closeTime: h.isClosed ? undefined : h.closeTime,
              isClosed: h.isClosed,
            })),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : data.message,
        );
      }

      setToast({
        message: "Negocio actualizado correctamente",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el negocio",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className={styles.cargando}>Cargando negocio...</p>
      </AdminLayout>
    );
  }

  if (noEncontrado) {
    return (
      <AdminLayout>
        <p className={styles.cargando}>No se encontró el negocio.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Tiendas", href: "/stores" },
            { label: form.storeName || "Negocio", href: `/stores/${id}` },
            { label: "Editar" },
          ]}
        />

        <div className={styles.header}>
          <h1>Editar negocio</h1>
          <p>
            Ajusta la foto y los horarios de {form.storeName || "tu negocio"}.
            El resto de los datos llega desde la plantilla del cliente.
          </p>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <FontAwesomeIcon icon={faImage} />
            </span>
            <h3>Foto del negocio</h3>
          </div>
          <p className={styles.sectionDesc}>
            La imagen que representa el negocio en la lista de negocios.
          </p>

          <div className={styles.bannerRow}>
            <div
              className={
                form.bannerUrl ? styles.bannerPreview : styles.bannerPlaceholder
              }
            >
              {form.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.bannerUrl} alt="Banner del negocio" />
              ) : (
                <FontAwesomeIcon icon={faCamera} />
              )}
            </div>

            <label className={styles.uploadBtn}>
              <FontAwesomeIcon icon={faCamera} />
              {subiendoBanner
                ? "Subiendo..."
                : form.bannerUrl
                  ? "Cambiar foto"
                  : "Subir foto del negocio"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={subiendoBanner}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) subirBanner(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {bannerError && (
            <span className={styles.errorText}>{bannerError}</span>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <FontAwesomeIcon icon={faStore} />
            </span>
            <h3>Datos del negocio</h3>
            <span className={styles.lockPill}>
              <FontAwesomeIcon icon={faLock} /> Solo lectura
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Vienen de la plantilla que envia el cliente. Para cambiarlos hay que
            corregirlos en el registro del negocio.
          </p>

          <div className={styles.datos}>
            <div className={styles.dato}>
              <span className={styles.label}>Nombre del negocio</span>
              <strong>{form.nameBusisness || "—"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>RNC o cedula</span>
              <strong>{form.taxId || "—"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Correo de contacto</span>
              <strong>{form.email || "—"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Telefono de contacto</span>
              <strong>{form.phoneBusiness || "—"}</strong>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <FontAwesomeIcon icon={faLocationDot} />
            </span>
            <h3>Datos de la sucursal</h3>
            <span className={styles.lockPill}>
              <FontAwesomeIcon icon={faLock} /> Solo lectura
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Lo que ven tus clientes en la app.
          </p>

          <div className={styles.datos}>
            <div className={styles.dato}>
              <span className={styles.label}>Nombre de la sucursal</span>
              <strong>{form.storeName || "—"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Categoria</span>
              <strong>{form.categoryName || "Sin categoria"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Direccion</span>
              <strong>{form.storeAddress || "—"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Local a la calle</span>
              <strong>{form.isStreetLocation ? "Si" : "No"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Telefono de la sucursal</span>
              <strong>{form.storePhone || "—"}</strong>
            </div>

            <div className={styles.dato}>
              <span className={styles.label}>Correo de la sucursal</span>
              <strong>{form.storeEmail || "—"}</strong>
            </div>

            <div className={styles.datoAncho}>
              <span className={styles.label}>Descripcion</span>
              <strong>{form.description || "—"}</strong>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <h3>Horarios</h3>
          </div>
          <p className={styles.sectionDesc}>
            Apaga el día para marcarlo como cerrado.
          </p>

          <div className={styles.horarios}>
            {horarios.map((horario) => (
              <div key={horario.dayOfWeek} className={styles.horarioRow}>
                <span className={styles.dia}>{DIAS[horario.dayOfWeek]}</span>

                <DFCheckbox
                  label={horario.isClosed ? "Cerrado" : "Abierto"}
                  checked={!horario.isClosed}
                  onChange={(checked) =>
                    cambiarHorario(horario.dayOfWeek, "isClosed", !checked)
                  }
                />

                {horario.isClosed ? (
                  <span className={styles.cerrado}>
                    No abre este día
                  </span>
                ) : (
                  <>
                    <TimePicker
                      value={a12Horas(horario.openTime)}
                      onChange={(value) =>
                        cambiarHorario(
                          horario.dayOfWeek,
                          "openTime",
                          a24Horas(value),
                        )
                      }
                    />
                    <TimePicker
                      value={a12Horas(horario.closeTime)}
                      onChange={(value) =>
                        cambiarHorario(
                          horario.dayOfWeek,
                          "closeTime",
                          a24Horas(value),
                        )
                      }
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          {errors.horarios && (
            <span className={styles.errorText}>{errors.horarios}</span>
          )}
        </section>

        <div className={styles.actions}>
          <button
            className={styles.cancel}
            onClick={() => router.push(`/stores/${id}`)}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            className={styles.submit}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

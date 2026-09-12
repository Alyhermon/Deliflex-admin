"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./confirmation.module.css";
import Dropdown from "../../../components/components-items/dropdown";
import Toast from "../../../components/components-items/toast/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useRegisterBusiness } from "../RegisterBusinessContext";
import { to24Hour } from "../time-format";

const TIPOS_DOCUMENTO = [
  "Cédula o RNC",
  "Registro Mercantil",
  "Permiso Sanitario",
  "Otro",
];

const ACENTOS: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n", ü: "u",
};

const slugify = (texto: string) =>
  texto
    .toLowerCase()
    .replace(/[áéíóúñü]/g, (c) => ACENTOS[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function ConfirmationPage() {
  const router = useRouter();
  const { form, update } = useRegisterBusiness();

  const [tipoDocumento, setTipoDocumento] = useState(TIPOS_DOCUMENTO[0]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const subirDocumento = async (file: File) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "business-documents");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      update({
        documents: [
          ...form.documents,
          { documentType: tipoDocumento, documentUrl: data.url, fileName: file.name },
        ],
      });
      setToast({ message: "Documento subido", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "No se pudo subir el documento",
        type: "error",
      });
    } finally {
      setSubiendo(false);
    }
  };

  const quitarDocumento = (index: number) => {
    update({ documents: form.documents.filter((_, i) => i !== index) });
  };

  const diasActivosResumen = form.schedules
    .filter((d) => !d.isClosed)
    .map((d) => d.label)
    .join(", ") || "Ninguno";

  const finalizar = async () => {
    setError("");

    if (!form.nameBusisness.trim()) {
      setError("Falta el nombre del negocio (paso Información)");
      return;
    }
    if (!/^\d{9}$|^\d{11}$/.test(form.taxId)) {
      setError("La cédula/RNC debe tener 9 u 11 dígitos (paso Información)");
      return;
    }
    if (!form.categoryId) {
      setError("Falta seleccionar la categoría del negocio (paso Información)");
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      setError("Falta la ubicación del negocio (paso Información)");
      return;
    }
    if (!form.bannerUrl) {
      setError("Falta la foto del negocio (paso Información)");
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register-business/business`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nameBusisness: form.nameBusisness,
            email: form.email,
            phoneBusiness: form.phoneBusiness,
            taxId: form.taxId,
            categoryId: form.categoryId || undefined,
            storeName: form.nameBusisness,
            description: form.description || undefined,
            latitude: form.latitude,
            longitude: form.longitude,
            storePhone: form.storePhone,
            storeEmail: form.email,
            storeAddress: form.storeAddress,
            slug: slugify(form.nameBusisness) || `negocio-${Date.now()}`,
            isStreetLocation: form.isStreetLocation,
            bannerUrl: form.bannerUrl,
            documents: form.documents.map((d) => ({
              documentType: d.documentType,
              documentUrl: d.documentUrl,
            })),
            schedules: form.schedules.map((d) => ({
              dayOfWeek: d.dayOfWeek,
              isClosed: d.isClosed,
              ...(d.isClosed
                ? {}
                : {
                    openTime: to24Hour(d.openTime),
                    closeTime: to24Hour(d.closeTime),
                  }),
            })),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo registrar el negocio");
      }

      setToast({ message: "Negocio registrado, pendiente de aprobación", type: "success" });
      setTimeout(() => router.push("/stores"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el negocio");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Confirma los datos de tu negocio</h1>
        <p className={styles.subtitle}>
          Revisa todo antes de enviarlo a aprobación.
        </p>

        {form.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.bannerUrl} alt="Banner del negocio" className={styles.bannerPreview} />
        )}

        <div className={styles.summaryGrid}>
          <div className={styles.summaryBlock}>
            <h3>Información</h3>
            <p><strong>Negocio:</strong> {form.nameBusisness || "—"}</p>
            <p><strong>Categoría:</strong> {form.categoryLabel || "—"}</p>
            <p><strong>Cédula/RNC:</strong> {form.taxId || "—"}</p>
            <p><strong>Dirección:</strong> {form.storeAddress || "—"}</p>
            <p><strong>Email:</strong> {form.email || "—"}</p>
            <p><strong>Teléfono del negocio:</strong> {form.storePhone || "—"}</p>
          </div>

          <div className={styles.summaryBlock}>
            <h3>Horario</h3>
            <p><strong>Días abiertos:</strong> {diasActivosResumen}</p>
            <p>
              <strong>Horario:</strong>{" "}
              {form.sameHoursAllDays
                ? `${form.genericOpenTime} - ${form.genericCloseTime} (todos los días)`
                : "Varía por día"}
            </p>
          </div>

          <div className={styles.summaryBlock}>
            <h3>Servicios</h3>
            <p>
              <strong>Venta:</strong>{" "}
              {[
                form.sellOptions.delivery && "Delivery",
                form.sellOptions.pickup && "Pickup",
                form.sellOptions.dineIn && "Comer en el local",
              ]
                .filter(Boolean)
                .join(", ") || "Ninguno"}
            </p>
            <p>
              <strong>Pagos:</strong>{" "}
              {[
                form.payments.cash && "Efectivo",
                form.payments.card && "Tarjeta",
                form.payments.transfer && "Transferencia",
                form.payments.app && "App",
              ]
                .filter(Boolean)
                .join(", ") || "Ninguno"}
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Documentos del negocio</h2>
          <p className={styles.hint}>
            Sube la cédula/RNC u otros documentos que respalden el negocio (opcional).
          </p>

          <div className={styles.uploadRow}>
            <Dropdown
              options={TIPOS_DOCUMENTO}
              value={tipoDocumento}
              onChange={setTipoDocumento}
            />

            <label className={styles.uploadBtn}>
              <FontAwesomeIcon icon={faUpload} />
              {subiendo ? "Subiendo..." : "Subir archivo"}
              <input
                type="file"
                accept="image/*,application/pdf"
                hidden
                disabled={subiendo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) subirDocumento(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {form.documents.length > 0 && (
            <ul className={styles.documentList}>
              {form.documents.map((doc, i) => (
                <li key={i} className={styles.documentItem}>
                  <FontAwesomeIcon icon={faFileLines} />
                  <span className={styles.documentType}>{doc.documentType}</span>
                  <span className={styles.documentName}>{doc.fileName}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => quitarDocumento(i)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <span className={styles.errorText}>{error}</span>}

        <div className={styles.finalizeRow}>
          <button
            type="button"
            className={styles.finalizeBtn}
            onClick={finalizar}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Finalizar y enviar a aprobación"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type === "error" ? "danger" : "success"}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

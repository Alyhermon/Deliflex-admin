"use client";

import { useEffect, useState } from "react";
import styles from "./information.module.css";
import DFInput from "../../../components/components-items/input";
import Dropdown from "../../../components/components-items/dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faContactBook,
  faEnvelope,
  faIdCard,
  faLocationCrosshairs,
  faShop,
  faStore,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useRegisterBusiness } from "../RegisterBusinessContext";

type Category = { id: string; category_name: string };

export default function InformationPage() {
  const { form, update } = useRegisterBusiness();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ubicando, setUbicando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState("");
  const [subiendoBanner, setSubiendoBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/register-business/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const categoryOptions = categories.map((c) => c.category_name);

  const handleCategoryChange = (label: string) => {
    const found = categories.find((c) => c.category_name === label);
    update({ categoryLabel: label, categoryId: found?.id ?? "" });
  };

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

      update({ bannerUrl: data.url });
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : "No se pudo subir la imagen",
      );
    } finally {
      setSubiendoBanner(false);
    }
  };

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setUbicacionError("Tu navegador no soporta geolocalización");
      return;
    }

    setUbicando(true);
    setUbicacionError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setUbicando(false);
      },
      () => {
        setUbicacionError("No se pudo obtener tu ubicación. Ingrésala a mano.");
        setUbicando(false);
      },
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear Negocio</h1>

        <div className={styles.form}>
          {/* SECCIÓN 0: banner */}
          <div className={styles.section}>
            <h2>Foto del negocio</h2>
            <p className={styles.hint}>
              Esta es la imagen que representará tu negocio en la app (portada
              en la lista de negocios).
            </p>

            <div className={styles.bannerRow}>
              <div
                className={
                  form.bannerUrl
                    ? styles.bannerPreview
                    : styles.bannerPlaceholder
                }
              >
                {form.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.bannerUrl} alt="Banner del negocio" />
                ) : (
                  <FontAwesomeIcon icon={faCamera} />
                )}
              </div>

              <div className={styles.bannerActions}>
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

                {form.bannerUrl && (
                  <button
                    type="button"
                    className={styles.removeBannerBtn}
                    onClick={() => update({ bannerUrl: "" })}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Quitar
                  </button>
                )}
              </div>
            </div>
            {bannerError && (
              <span className={styles.errorText}>{bannerError}</span>
            )}
          </div>

          {/* SECCIÓN 1 */}
          <div className={styles.section}>
            <h2>Información básica</h2>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="Nombre del negocio"
                  value={form.nameBusisness}
                  onChange={(e) => update({ nameBusisness: e.target.value })}
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faShop} />}
                />
                <DFInput
                  placeholder="Nombre del propietario"
                  value={form.ownerFirstName}
                  onChange={(e) => update({ ownerFirstName: e.target.value })}
                  icon={
                    <FontAwesomeIcon color="#ed7b17" icon={faContactBook} />
                  }
                />
                <DFInput
                  placeholder="Cédula o RNC del negocio"
                  value={form.taxId}
                  onChange={(e) =>
                    update({ taxId: e.target.value.replace(/\D/g, "") })
                  }
                  maxLength={11}
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faIdCard} />}
                />
              </div>

              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="Apellido del propietario"
                  value={form.ownerLastName}
                  onChange={(e) => update({ ownerLastName: e.target.value })}
                  icon={
                    <FontAwesomeIcon color="#ed7b17" icon={faContactBook} />
                  }
                />

                <Dropdown
                  options={categoryOptions}
                  value={form.categoryLabel}
                  onChange={handleCategoryChange}
                  placeholder="Tipo de negocio"
                  fullWidth
                />

                <span className={styles.hint}>
                  La cédula (11 dígitos) o el RNC (9 dígitos) del negocio.
                </span>
              </div>
            </div>

            <textarea
              className={styles.textarea}
              placeholder="Describe brevemente tu negocio (opcional)"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>

          {/* SECCIÓN 2 */}
          <div className={styles.section}>
            <h2>Contacto</h2>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="ejemplo@email.com"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                />
              </div>

              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="Telefono de contacto"
                  value={form.phoneBusiness}
                  onChange={(e) => update({ phoneBusiness: e.target.value })}
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                />
              </div>
              <div className={styles.inputGroup}>
                <DFInput
                  placeholder="Telefono del negocio"
                  value={form.storePhone}
                  onChange={(e) => update({ storePhone: e.target.value })}
                  icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3 */}
          <div className={styles.section}>
            <h2>Ubicación</h2>

            <div className={styles.inputGroup}>
              <DFInput
                placeholder="Direccion del negocio"
                value={form.storeAddress}
                onChange={(e) => update({ storeAddress: e.target.value })}
                icon={<FontAwesomeIcon color="#ed7b17" icon={faStore} />}
              />
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.isStreetLocation}
                onChange={(e) => update({ isStreetLocation: e.target.checked })}
              />
              El negocio está ubicado en la calle (no en un local/plaza)
            </label>

            <div className={styles.coordsRow}>
              <DFInput
                placeholder="Latitud"
                type="number"
                value={form.latitude ?? ""}
                onChange={(e) =>
                  update({
                    latitude: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <DFInput
                placeholder="Longitud"
                type="number"
                value={form.longitude ?? ""}
                onChange={(e) =>
                  update({
                    longitude: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <button
                type="button"
                className={styles.locationBtn}
                onClick={usarUbicacionActual}
                disabled={ubicando}
              >
                <FontAwesomeIcon icon={faLocationCrosshairs} />
                {ubicando ? "Ubicando..." : "Usar mi ubicación actual"}
              </button>
            </div>
            {ubicacionError && (
              <span className={styles.errorText}>{ubicacionError}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

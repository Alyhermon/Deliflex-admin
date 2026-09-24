"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import styles from "./login.module.css";
import Toast from "@/app/components/components-items/toast/toast";
import DFCheckbox from "@/app/components/components-items/checkbox/checkbox";
import GoogleIcon from "@/app/components/components-items/google-icon";
import { ACTIVE_STORE_STORAGE_KEY } from "@/app/hooks/useActiveStore";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "warning";
  } | null>(null);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || "No se pudo iniciar sesión");
        return;
      }

      // 90 = ADMIN, 100 = SUPER_ADMIN a nivel de plataforma. Pero tambien
      // dejamos entrar a quien tenga un rol de equipo asignado en algun
      // negocio (Gerente, Supervisor, Cajero, Staff), aunque su rol de
      // plataforma sea el de un usuario normal - ese rol vive aparte, en
      // business_staff, no en global_role_id.
      const esAdminPlataforma = Number(data.user.global_role_id) >= 90;
      const esStaffDeAlgunNegocio =
        Array.isArray(data.user.staff_businesses) &&
        data.user.staff_businesses.length > 0;

      if (!esAdminPlataforma && !esStaffDeAlgunNegocio) {
        setToast({
          message:
            "No tienes acceso al panel administrador. Contacta a soporte.",
          type: "error",
        });
        return;
      }

      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.access_token,
          maxAge: data.max_age_seconds,
        }),
      });

      // El negocio activo elegido por la sesion anterior puede ni
      // siquiera ser de este usuario: sin esto, quedaria seleccionado
      // (o roto) hasta que alguien lo cambiara a mano.
      try {
        localStorage.removeItem(ACTIVE_STORE_STORAGE_KEY);
      } catch {
        // Sin localStorage disponible: no hay nada que limpiar.
      }

      // Navegacion dura, no router.push: el usuario y la lista de negocios
      // se guardan en un contexto montado en el layout raiz (no se
      // remonta al cambiar de ruta), asi que un push normal dejaria
      // viendo los negocios del usuario anterior hasta un refresh manual.
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setLoginError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.formPanel}>
        <form className={styles.formInner} onSubmit={login}>
          <h1 className={styles.heading}>Bienvenido</h1>

          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.field}
            type="email"
            placeholder="username@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLoginError("");
            }}
            required
          />

          <label className={styles.label} htmlFor="password">
            Contraseña
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="password"
              className={styles.field}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError("");
              }}
              required
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          {loginError && <p className={styles.errorText}>{loginError}</p>}

          <div className={styles.rememberRow}>
            <DFCheckbox
              label="Mantener sesión iniciada"
              checked={rememberMe}
              onChange={setRememberMe}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>

          <p className={styles.continueWith}>Continuar con</p>

          <div className={styles.socialRow}>
            <button type="button" className={styles.socialButton} aria-label="Continuar con Google">
              <GoogleIcon size={20} />
            </button>
            <button type="button" className={styles.socialButton} aria-label="Continuar con Apple">
              <FontAwesomeIcon icon={faApple} className={styles.appleIcon} />
            </button>
            <button type="button" className={styles.socialButton} aria-label="Continuar con Facebook">
              <FontAwesomeIcon icon={faFacebookF} className={styles.facebookIcon} />
            </button>
          </div>
        </form>
      </div>

      {/* El panel de la derecha se completa despues con la ilustracion. */}
      <div className={styles.illustrationPanel} />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

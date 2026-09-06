"use client";
import Image from "next/image";
import styles from "./login.module.css";
import DFInput from "../../components/components-items/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Toast from "@/app/components/components-items/toast/toast";
import { ACTIVE_STORE_STORAGE_KEY } from "@/app/hooks/useActiveStore";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "warning";
  } | null>(null);

  const login = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
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

      const cookieRes = await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.access_token }),
      });

      console.log("Cookie status:", cookieRes.status);
      console.log("Token que se envía:", data.access_token);

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
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Image src={"/assets/fondo.png"} alt="banner" fill />
      <div className={styles.content}>
        <div className={styles.img_logo}>
          <Image src={"/assets/logo.png"} alt="banner" fill />
        </div>

        <div className={styles.input}>
          <DFInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@email.com"
            icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
          />

          <DFInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            type="password"
            icon={<FontAwesomeIcon color="#ed7b17" icon={faKey} />}
          />

          <button
            className={styles.loginButton}
            onClick={login}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>
        </div>
      </div>
      <div className={styles.wrapper}>
        <Image src={"/assets/imagen-logo.png"} alt="banner" fill />
      </div>
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

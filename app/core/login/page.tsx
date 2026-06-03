"use client";
import Image from "next/image";
import styles from "./login.module.css";
import DFInput from "../../components/components-items/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      if (!data.user.global_role_id) {
        alert("No tienes acceso al panel administrador");
        return;
      }

      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.access_token }),
      });

      router.push("/dashboard");

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
    </div>
  );
}
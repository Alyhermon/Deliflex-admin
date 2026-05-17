"use client";
import Image from "next/image";
import styles from "./login.module.css";
import DFInput from "../../components/components-items/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");


  const login = async () => {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }
    //estoy cansada por hoy seguimos mañana 17/05/2026

    // validar admin
    if (data.user.global_role_id !== 90) {
      alert('No tienes acceso al panel administrador');
      return;
    }

    // guardar token
    localStorage.setItem('token', data.access_token);

    // guardar usuario
    localStorage.setItem('user', JSON.stringify(data.user));

    // redireccionar
    router.push('/dashboard');

  } catch (error) {
    console.error(error);
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
            placeholder="ejemplo@email.com"
            icon={<FontAwesomeIcon color="#ed7b17" icon={faEnvelope} />}
          />

          <DFInput
            placeholder="Contraseña"
            icon={<FontAwesomeIcon color="#ed7b17" icon={faKey} />}
          />

          <button className={styles.loginButton}>Iniciar sesión</button>
        </div>
      </div>
      <div className={styles.wrapper}>
        <Image src={"/assets/imagen-logo.png"} alt="banner" fill />
      </div>
    </div>
  );
}

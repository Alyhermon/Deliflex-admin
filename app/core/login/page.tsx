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

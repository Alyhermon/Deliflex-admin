"use client";

// import React, { useState } from "react";
import styles from "./confirmation.module.css";
// import DFInput from "../../../components/components-items/input";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function ConfirmationPage() {
//   const [form, setForm] = useState({
//     name: "",
//     category: "",
//     phone: "",
//     email: "",
//     address: "",
//     description: "",
//     openHour: "",
//     openMin: "",
//     closeHour: "",
//     closeMin: "",
//   });

  //TODO: implementar mejor el stepper

//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const target = e.target as HTMLInputElement;
//     const { name, type, value, checked } = target;

//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log("DATA:", form);
//   };

  return (
    <div className={styles.container}>
  <div className={styles.card}>
    <h1 className={styles.title}>Hello Mundo</h1>
  </div>
</div>
  );
}

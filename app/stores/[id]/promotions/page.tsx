"use client";

import styles from "./promotion.module.css";
import { useState } from "react";
import Breadcrumb from "../../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../../components/layout/adminLayout";

export default function StoreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [type, setType] = useState("discount");
  const { id } = params;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Tiendas", href: "/stores" },
            { label: "Cocorao", href: `/stores/${id}` },
            { label: "Promociones" },
          ]}
        />
        <div className={styles.container}>
          {/* HEADER */}
          <div className={styles.header}>
            <h1>Crear promoción</h1>
            <p>
              Impulsa más ventas creando promociones atractivas para tus
              clientes.
            </p>
          </div>

          <div className={styles.content}>
            {/* LEFT */}
            <div className={styles.form}>
              {/* 1. Tipo */}
              <section className={styles.section}>
                <h3>
                  <span>1</span> Tipo de promoción
                </h3>

                <div className={styles.grid}>
                  {[
                    {
                      id: "discount",
                      title: "Descuento",
                      desc: "Porcentaje o monto",
                    },
                    { id: "2x1", title: "2x1", desc: "Lleva 2 y paga 1" },
                    {
                      id: "delivery",
                      title: "Envío gratis",
                      desc: "Sin costo delivery",
                    },
                    {
                      id: "combo",
                      title: "Combo especial",
                      desc: "Precio especial",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.card} ${
                        type === item.id ? styles.active : ""
                      }`}
                      onClick={() => setType(item.id)}
                    >
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Detalles */}
              <section className={styles.section}>
                <h3>
                  <span>2</span> Detalles de la promoción
                </h3>

                <div className={styles.row}>
                  <input placeholder="Nombre de la promoción" />
                  <input placeholder="Descripción (opcional)" />
                </div>

                <div className={styles.row}>
                  <input placeholder="Valor (%)" />
                  <select>
                    <option>Todo el menú</option>
                  </select>
                </div>
              </section>

              {/* 3. Condiciones */}
              <section className={styles.section}>
                <h3>
                  <span>3</span> Condiciones
                </h3>

                <div className={styles.row}>
                  <input placeholder="Pedido mínimo" />
                  <input placeholder="Monto máximo" />
                </div>

                <div className={styles.row}>
                  <input type="date" />
                  <input type="date" />
                </div>
              </section>

              {/* 4. Visibilidad */}
              <section className={styles.section}>
                <h3>
                  <span>4</span> Visibilidad
                </h3>

                <div className={styles.checks}>
                  <label>
                    <input type="checkbox" /> Página principal
                  </label>
                  <label>
                    <input type="checkbox" /> Menú
                  </label>
                  <label>
                    <input type="checkbox" /> Notificar clientes
                  </label>
                </div>
              </section>

              {/* 5. Imagen */}
              <section className={styles.section}>
                <h3>
                  <span>5</span> Imagen
                </h3>

                <div className={styles.upload}>
                  <p>Subir imagen</p>
                </div>
              </section>

              {/* ACTIONS */}
              <div className={styles.actions}>
                <button className={styles.cancel}>Cancelar</button>
                <button className={styles.submit}>Crear promoción</button>
              </div>
            </div>

            {/* RIGHT - PREVIEW */}
            <div className={styles.preview}>
              <h4>Vista previa</h4>

              <div className={styles.cardPreview}>
                <div className={styles.badge}>20%</div>
                <img src="/pizza.jpg" alt="preview" />

                <div className={styles.info}>
                  <h5>20% de descuento en pizzas</h5>
                  <p>Disfruta nuestras pizzas favoritas</p>
                  <button>Ver productos</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

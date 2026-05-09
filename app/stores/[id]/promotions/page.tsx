"use client";

import styles from "./promotion.module.css";
import { useState } from "react";
import Breadcrumb from "../../../components/components-items/breadcrumb/breadcrumb";
import AdminLayout from "../../../components/layout/adminLayout";
import Dropdown from "../../../components/components-items/dropdown";
import Image from "next/image";
import TimePicker from "@/app/components/components-items/timepicker";

export default function StoreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [type, setType] = useState("discount");
  const [promotionType, setPromotionType] = useState("");
  // const [store, setStore] = useState(null);
  const { id } = params;

  const options = ["Todos los productos", "Pizzas", "Bebidas", "Postres"];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* //TODO: revisar el Breadcrumb here, el label: "Cocorao" */}
        <Breadcrumb
          items={[
            { label: "Tiendas", href: "/stores" },
            { label: "Cocorao", href: `/stores/${id}` },
            { label: "Promociones" },
          ]}
        />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Crear promoción</h1>
            <p>
              Impulsa más ventas creando promociones atractivas para tus
              clientes.
              TENGO QUE HACER ESTA PARTE, MUY IMPORTANTE
            </p>
          </div>

          <div className={styles.content}>
            <div className={styles.form}>
  
              <section className={styles.section}>
                <h3>
                  <span className={styles.step}>1</span> Tipo de promoción
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
                                        {
                      id: "custom",
                      title: "Personalizado",
                      desc: "Pendiente de definir reglas",
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


              <section className={styles.section}>
                <h3>
                  <span className={styles.step}>2</span> Detalles de la
                  promoción
                </h3>

                <div className={styles.row}>
                  <input placeholder="Nombre de la promoción" />
                  <input placeholder="Descripción (opcional)" />
                </div>

                <div className={styles.row}>
                  <input placeholder="Valor (%)" />
                  <Dropdown
                    options={options}
                    value={promotionType}
                    onChange={setPromotionType}
                    placeholder="Seleccionar Menu"
                  />
                </div>
              </section>

              <section className={styles.section}>
                <h3>
                  <span className={styles.step}>3</span> Condiciones
                </h3>

                <div className={styles.row}>
                  <input placeholder="Pedido mínimo" />
                  <input placeholder="Monto máximo" />
                </div>

                <div className={styles.row}>
                  <div className={styles.dateOpen}>
                    <label>Valido desde</label>
                    <TimePicker onChange={(time) => console.log(time)} />
                  </div>
                  <div className={styles.dateOpen}>
                    <label>Valido hasta</label>
                    <TimePicker onChange={(time) => console.log(time)} />
                  </div>
                </div>
              </section>

              {/* 4. Visibilidad */}
              <section className={styles.section}>
                <h3>
                  <span className={styles.step}>4</span> Visibilidad
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
                  <span className={styles.step}>5</span> Imagen
                </h3>

                <div className={styles.upload}>
                  <p>Subir imagen</p>
                </div>
              </section>

              <div className={styles.actions}>
                <button className={styles.cancel}>Cancelar</button>
                <button className={styles.submit}>Crear promoción</button>
              </div>
            </div>

            <div className={styles.preview}>
              <h4>Vista previa</h4>

              <div className={styles.cardPreview}>
                <div className={styles.badge}>20%</div>
                <Image
                  src="/assets/no-image.png"
                  alt="Promoción de pizza"
                  width={200}
                  height={120}
                  className={styles.promoImg}
                />

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

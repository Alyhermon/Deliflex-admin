"use client";

import styles from "./side-panel-product.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faGripVertical,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function ProductManagementPanel() {
  return (
    <div className={styles.container}>
      <div className={styles.productInfo}>
        <div className={styles.productIcon}>
          <FontAwesomeIcon icon={faBox} />
        </div>

        <div>
          <h3>El dulce mar</h3>
          <span>CART-AZUL-001</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={styles.activeTab}>Ingredientes</button>
        <button>Combo</button>
        <button>Variaciones</button>
        <button>Opciones</button>
        <button>Más</button>
      </div>

      {/* INGREDIENTES */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h4>Ingredientes</h4>
            <p>Agrega los ingredientes que componen este producto.</p>
          </div>

          <button className={styles.primaryButton}>
            + Agregar ingrediente
          </button>
        </div>

        <div className={styles.card}>
          {[
            "Harina de trigo",
            "Azúcar",
            "Manteca",
            "Huevos",
            "Esencia de vainilla",
          ].map((item) => (
            <div key={item} className={styles.row}>
              <div className={styles.rowLeft}>
                <FontAwesomeIcon icon={faGripVertical} />
                <span>{item}</span>
              </div>

              <div className={styles.rowActions}>
                <button>
                  <FontAwesomeIcon icon={faPen} />
                </button>

                <button>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OPCIONES */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h4>Opciones adicionales</h4>
            <p>
              Personaliza opciones extra que el cliente puede agregar.
            </p>
          </div>

          <button className={styles.primaryButton}>
            + Agregar opción
          </button>
        </div>

        <div className={styles.card}>
          {[
            {
              name: "Extra dulce",
              price: "+ $100",
            },
            {
              name: "Con relleno",
              price: "+ $250",
            },
            {
              name: "Sin azúcar",
              price: "+ $150",
            },
          ].map((item) => (
            <div key={item.name} className={styles.row}>
              <div className={styles.rowLeft}>
                <FontAwesomeIcon icon={faGripVertical} />

                <div className={styles.optionInfo}>
                  <span>{item.name}</span>
                </div>
              </div>

              <div className={styles.rowRight}>
                <span className={styles.price}>
                  {item.price}
                </span>

                <div className={styles.rowActions}>
                  <button>
                    <FontAwesomeIcon icon={faPen} />
                  </button>

                  <button>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONFIG */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderColumn}>
          <h4>Configuración</h4>
          <p>Ajustes generales del producto.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.switchRow}>
            <div>
              <h5>¿Disponible?</h5>
              <span>El producto estará visible en el menú</span>
            </div>

            <input type="checkbox" defaultChecked />
          </div>

          <div className={styles.switchRow}>
            <div>
              <h5>¿Permitir instrucciones especiales?</h5>
              <span>El cliente podrá agregar notas</span>
            </div>

            <input type="checkbox" defaultChecked />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className={styles.footer}>
        <button className={styles.cancelButton}>
          Cancelar
        </button>

        <button className={styles.saveButton}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
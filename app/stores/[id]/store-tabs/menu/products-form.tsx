import styles from "./productform.module.css";
import DFInput from "@/app/components/components-items/input";
// import DFTextArea from "@/app/components/components-items/textarea";
// import DFSelect from "@/app/components/components-items/select";
import DFDropdown from "@/app/components/components-items/dropdown";
import { useState} from "react";

export default function ProductForm() {
      const [category, setCategory] = useState("");
      const [active, setActive] = useState("");
      const options = [
        "Todas",
        "Hamburguesas",
        "Bebidas",
        "Postres",
      ];
      const optionsActive = ["Activo", "Inactivo"];
  return (
    <div className={styles.container}>
      
      <div className={styles.left}>
        <h3>Información básica</h3>

        <DFInput placeholder="Nombre del producto" />
        
        <DFInput placeholder="Descripción" />
        {/* <DFTextArea placeholder="Descripción..." /> */}

        <DFDropdown
          options={options}
          value={category}
          onChange={setCategory}
          placeholder="Selecciona categoría"
        />

        <div className={styles.row}>
          <DFInput placeholder="Marca" />
          <DFInput placeholder="SKU" />
        </div>

        <h3>Precios e inventario</h3>

        <div className={styles.row}>
          <DFInput placeholder="Precio venta" />
          <DFInput placeholder="Precio costo" />
        </div>

        <div className={styles.row}>
          <DFInput placeholder="Stock disponible" />
          <DFInput placeholder="Stock mínimo" />
        </div>

        <DFDropdown
          options={options}
          value={category}
          onChange={setCategory}
          placeholder="Unidad de medida"
        />
      </div>

      <div className={styles.right}>
        <h3>Imagen</h3>

        <div className={styles.uploadBox}>
          Subir imagen
        </div>

        <h3>Información adicional</h3>

        <DFDropdown
          options={optionsActive}
          value={active}
          onChange={setActive}
          placeholder="Activo"
        />

        <label className={styles.switch}>
          <input type="checkbox" />
          Producto destacado
        </label>

          <DFInput placeholder="Etiquetas" />
          {/* <DFTextArea placeholder="Información adicional..." /> */}
          <DFInput placeholder="Informacion nutricional" />
      </div>

    </div>
  );
}
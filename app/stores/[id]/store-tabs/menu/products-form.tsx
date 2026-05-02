import styles from "./productform.module.css";
import DFInput from "@/app/components/components-items/input";
import DFCheckbox from "@/app/components/components-items/checkbox/checkbox";
import DFDropdown from "@/app/components/components-items/dropdown";
import { useEffect, useState } from "react";

type ProductFormType = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  status: boolean;
  isAvailable: boolean;
  productCode: string;
  displayOrder: number;
  isFeatured: boolean;
};

type Category = {
  id: string;
  name: string;
};

export default function ProductForm({ onClose }: { onClose?: () => void }) {
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState("");
    const [open, setOpen] = useState(false);
  // const optionsActive = [true, false ];

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    status: true,
    isAvailable: true,
    productCode: "",
    displayOrder: 0,
    isFeatured: false,
  });

  const handleChange = (
    name: keyof ProductFormType,
    value: ProductFormType[keyof ProductFormType],
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const storeId = "92f9d5c3-0d69-446f-96a1-0b6c54b0adab";

        if (!storeId) {
          console.error("storeId no encontrado");
          return;
        }

        const res = await fetch(
          `http://localhost:3001/products/categories/${storeId}`,
        );

        const data = await res.json();

        console.log("DATA:", data);

        setCategories(data.result);
      } catch (error) {
        console.error("Error cargando categorías", error);
      }
    };

    fetchCategories();
  }, []);

  const storeId = "92f9d5c3-0d69-446f-96a1-0b6c54b0adab";

  const createProduct = async (data: ProductFormType) => {
    const response = await fetch(`http://localhost:3001/products/${storeId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al crear producto");
    }

    return await response.json();
  };

  const handleSubmit = async () => {
    try {
      if (!form.categoryId) {
        alert("Debes seleccionar una categoría");
        return;
      }

      const payload = {
        ...form,
        price: Number(form.price),
        displayOrder: Number(form.displayOrder || 0),
      };

      const result = await createProduct(payload);

      console.log("Producto creado:", result);

      setForm({
        categoryId: "",
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        status: true,
        isAvailable: true,
        productCode: "",
        displayOrder: 0,
        isFeatured: false,
      });
      setCategoryName("");
      setActive("");
      
      console.log("Producto creado exitosamente:", result);
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("Error al crear el producto");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h3>Información básica</h3>

        <DFInput
          placeholder="Nombre del producto"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        <DFInput
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        <DFDropdown
          options={categories?.map((c) => c.name)}
          value={categoryName}
          onChange={(value) => {
            const selected = categories?.find((c) => c.name === value);

            if (!selected) {
              console.error("Categoría no encontrada");
              return;
            }

            setCategoryName(value);
            handleChange("categoryId", selected.id);
          }}
          placeholder="Selecciona categoría"
        />

        <div className={styles.row}>
          <DFInput
            placeholder="SKU"
            value={form.productCode}
            onChange={(e) => handleChange("productCode", e.target.value)}
          />
        </div>

        <h3>Precios</h3>

        <div className={styles.row}>
          <DFInput
            placeholder="Precio venta"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.right}>
        <h3>Imagen</h3>

        <div className={styles.uploadBox}>Subir imagen</div>

        <h3>Información adicional</h3>

        <DFDropdown
          options={["Activo", "Inactivo"]}
          value={active}
          onChange={(value) => {
            const isActive = value === "Activo";

            setActive(value);

            handleChange("status", isActive);
            handleChange("isAvailable", isActive);
          }}
          placeholder="Activo"
        />

        <DFCheckbox
          size="lg"
          label="Producto destacado"
          checked={form.isFeatured}
          onChange={(checked) => handleChange("isFeatured", checked)}
        />

        <button
          onClick={handleSubmit}
          className={styles.saveBtn}
        >
          Guardar producto
        </button>
      </div>
    </div>
  );
}

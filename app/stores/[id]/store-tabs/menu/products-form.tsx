import styles from "./productform.module.css";
import DFInput from "@/app/components/components-items/input";
import DFCheckbox from "@/app/components/components-items/checkbox/checkbox";
import DFDropdown from "@/app/components/components-items/dropdown";
import { useEffect, useState } from "react";
import { Product, UpdateProduct, CreateProduct } from "@/app/types/products";

type ProductFormType = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  status: boolean;
  is_available: boolean;
  product_code: string;
  displayOrder: number;
  isFeatured: boolean;
};

type Category = {
  id: string;
  name: string;
};

type FormErrors = {
  category?: string;
  productCode?: string;
  price?: string;
};

export default function ProductForm({
  storeId,
  product,
  onClose,
  onSuccess,
}: {
  storeId?: string;
  product?: Product | null;
  onClose?: () => void;
  onSuccess?: (action: "created" | "updated") => void;
}) {
  const [categoryName, setCategoryName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState<boolean>(true);
  const [open, setOpen] = useState(false);
  const isEditMode = !!product;

  const [form, setForm] = useState<ProductFormType>({
    categoryId: product?.categoryId ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: Number(product?.price) ?? 0,
    imageUrl: product?.imageUrl ?? "",
    status: product?.status ?? true,
    is_available: product?.isAvailable ?? true,
    product_code: product?.productCode ?? "",
    displayOrder: product?.displayOrder ?? 0,
    isFeatured: product?.isFeatured ?? false,
  });

  const mapFormToApi = (form: ProductFormType) => ({
    name: form.name,
    description: form.description,
    price: Number(form.price),
    imageUrl: form.imageUrl,
    productCode: form.product_code,
    categoryId: form.categoryId,
    isAvailable: form.is_available,
    status: form.status,
    isFeatured: form.isFeatured,
    displayOrder: Number(form.displayOrder || 0),
  });

  const handleChange = <K extends keyof ProductFormType>(
    name: K,
    value: ProductFormType[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
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
  }, [storeId]);

  const createProduct = async (data: CreateProduct) => {
    if (!storeId) {
      throw new Error("storeId no disponible");
    }
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

  const updateProduct = async (id: string, data: UpdateProduct) => {
    const res = await fetch(`http://localhost:3001/products/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await res.json();
  };

  const handleSubmit = async () => {
    try {
      const nextErrors: FormErrors = {};

      if (!form.categoryId) {
        nextErrors.category = "La categoria es obligatoria";
      }

      if (!form.product_code.trim()) {
        nextErrors.productCode = "El SKU es obligatorio";
      }

      if (!form.price) {
        nextErrors.price = "El precio es obligatorio";
      } else if (Number(form.price) <= 0) {
        nextErrors.price = "El precio debe ser mayor que 0";
      }

      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        return;
      }

      const payload = mapFormToApi(form);

      let result;

      if (isEditMode && product) {
        result = await updateProduct(product.id, payload);
        console.log("Producto actualizado:", result);
        onSuccess?.("updated");
      } else {
        result = await createProduct(payload);
        console.log("Producto creado:", result);
        onSuccess?.("created");
      }

      if (!isEditMode) {
        setForm({
          categoryId: "",
          name: "",
          description: "",
          price: 0,
          imageUrl: "",
          status: true,
          is_available: true,
          product_code: "",
          displayOrder: 0,
          isFeatured: false,
        });

        setCategoryName("");
        setActive(true);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert(
        `Error al guardar el producto: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
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
          fullWidth
          error={errors.category}
          options={categories?.map((c) => c.name)}
          value={categoryName}
          onChange={(value) => {
            const selected = categories?.find((c) => c.name === value);

            if (!selected) {
              console.error("Categoría no encontrada");
              return;
            }

            setCategoryName(value);
            setErrors((prev) => ({ ...prev, category: undefined }));
            handleChange("categoryId", selected.id);
          }}
          placeholder="Selecciona categoría"
        />

        <div className={styles.row}>
          <DFInput
            placeholder="SKU"
            error={errors.productCode}
            value={form.product_code}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, productCode: undefined }));
              handleChange("product_code", e.target.value);
            }}
          />
        </div>

        <h3>Precios</h3>

        <div className={styles.row}>
          <DFInput
            type="number"
            placeholder="Precio venta"
            error={errors.price}
            value={form.price || ""}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, price: undefined }));
              handleChange("price", Number(e.target.value));
            }}
          />
        </div>
      </div>

      <div className={styles.right}>
        <h3>Imagen</h3>

        <div className={styles.uploadBox}>Subir imagen</div>

        <h3>Información adicional</h3>

        <DFDropdown
          fullWidth
          options={["Activo", "Inactivo"]}
          value={form.status ? "Activo" : "Inactivo"}
          onChange={(value) => {
            const isActive = value === "Activo";

            setForm((prev) => ({
              ...prev,
              status: isActive,
              is_available: isActive,
            }));
          }}
        />

        <DFCheckbox
          size="lg"
          label="Producto destacado"
          checked={form.isFeatured}
          onChange={(checked) => handleChange("isFeatured", checked)}
        />

        <button onClick={handleSubmit} className={styles.saveBtn}>
          Guardar producto
        </button>
      </div>
    </div>
  );
}

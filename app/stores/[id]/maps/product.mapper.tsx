import { Product } from "@/app/types/products";

type ProductApi = {
  id: string;
  store_id: string;
  category_id: string;
  product_name: string;
  description: string;
  price: number;
  image_url: string;
  category_icon: string;
  category_name: string;
  status: boolean;
  display_order: number;
  is_available: boolean;
  product_code: string;
  is_featured: boolean;
};

export const mapProductFromApi = (product: ProductApi): Product => ({
  id: product.id,
  storeId: product.store_id,
  categoryId: product.category_id,
  name: product.product_name,
  product_name: product.product_name,
  category_name: product.category_name,
  description: product.description,
  price: Number(product.price),
  displayOrder: Number(product.display_order),
  imageUrl: product.image_url,
  status: product.status,
  isAvailable: product.is_available,
  productCode: product.product_code,
  isFeatured: product.is_featured,

  categoryName:
    product.category_name,

  categoryIcon:
    product.category_icon,
});
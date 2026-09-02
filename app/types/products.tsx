
export type Product = {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  product_name?: string;
  category_name?: string;
  description: string;
  price: number;
  imageUrl: string;
  status: boolean;
  isAvailable: boolean;
  productCode: string;
  categoryIcon: string;
  categoryName: string;
  displayOrder: number;
  isFeatured: boolean;
  unitsSold: number;
  isBestSeller: boolean;
};

export type CreateProduct = {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  productCode?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
};

export type UpdateProduct = Partial<Product>;
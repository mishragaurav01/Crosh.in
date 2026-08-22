import { api } from "@/lib/api";
import type {
  Category,
  Collection,
  Product,
  Variant,
  ProductCollection,
  PaginatedList,
  CategoryCreateInput,
  CategoryUpdateInput,
  CollectionCreateInput,
  CollectionUpdateInput,
  ProductCreateInput,
  ProductUpdateInput,
  VariantCreateInput,
  VariantUpdateInput,
} from "./types";

const BASE = "/api/admin";

export async function listCategories(page = 1, limit = 20) {
  return api.get<PaginatedList<Category>>(`${BASE}/categories`, { page, limit });
}

export async function getCategory(id: string) {
  return api.get<Category>(`${BASE}/categories/${id}`);
}

export async function createCategory(data: CategoryCreateInput) {
  return api.post<Category>(`${BASE}/categories`, data);
}

export async function updateCategory(id: string, data: CategoryUpdateInput) {
  return api.patch<Category>(`${BASE}/categories/${id}`, data);
}

export async function deleteCategory(id: string) {
  return api.delete<{ message: string }>(`${BASE}/categories/${id}`);
}

export async function listCollections(page = 1, limit = 20) {
  return api.get<PaginatedList<Collection>>(`${BASE}/collections`, { page, limit });
}

export async function getCollection(id: string) {
  return api.get<Collection>(`${BASE}/collections/${id}`);
}

export async function createCollection(data: CollectionCreateInput) {
  return api.post<Collection>(`${BASE}/collections`, data);
}

export async function updateCollection(id: string, data: CollectionUpdateInput) {
  return api.patch<Collection>(`${BASE}/collections/${id}`, data);
}

export async function deleteCollection(id: string) {
  return api.delete<{ message: string }>(`${BASE}/collections/${id}`);
}

export async function listProducts(
  page = 1,
  limit = 20,
  categoryId?: string,
) {
  return api.get<PaginatedList<Product>>(`${BASE}/products`, {
    page,
    limit,
    categoryId,
  });
}

export async function getProduct(id: string) {
  return api.get<Product>(`${BASE}/products/${id}`);
}

export async function createProduct(data: ProductCreateInput) {
  return api.post<Product>(`${BASE}/products`, data);
}

export async function updateProduct(id: string, data: ProductUpdateInput) {
  return api.patch<Product>(`${BASE}/products/${id}`, data);
}

export async function deleteProduct(id: string) {
  return api.delete<{ message: string }>(`${BASE}/products/${id}`);
}

export async function listVariants(
  productId: string,
  page = 1,
  limit = 20,
) {
  return api.get<PaginatedList<Variant>>(
    `${BASE}/products/${productId}/variants`,
    { page, limit },
  );
}

export async function getVariant(productId: string, variantId: string) {
  return api.get<Variant>(
    `${BASE}/products/${productId}/variants/${variantId}`,
  );
}

export async function createVariant(
  productId: string,
  data: VariantCreateInput,
) {
  return api.post<Variant>(
    `${BASE}/products/${productId}/variants`,
    data,
  );
}

export async function updateVariant(
  productId: string,
  variantId: string,
  data: VariantUpdateInput,
) {
  return api.patch<Variant>(
    `${BASE}/products/${productId}/variants/${variantId}`,
    data,
  );
}

export async function deleteVariant(productId: string, variantId: string) {
  return api.delete<{ message: string }>(
    `${BASE}/products/${productId}/variants/${variantId}`,
  );
}

export async function listCollectionProducts(
  collectionId: string,
  page = 1,
  limit = 20,
) {
  return api.get<PaginatedList<ProductCollection>>(
    `${BASE}/collections/${collectionId}/products`,
    { page, limit },
  );
}

export async function addProductToCollection(
  collectionId: string,
  productId: string,
) {
  return api.post<ProductCollection>(
    `${BASE}/collections/${collectionId}/products/${productId}`,
  );
}

export async function removeProductFromCollection(
  collectionId: string,
  productId: string,
) {
  return api.delete<{ message: string }>(
    `${BASE}/collections/${collectionId}/products/${productId}`,
  );
}

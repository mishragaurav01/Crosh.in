import { api } from "@/lib/api";
import type {
  Category,
  Collection,
  Product,
  Variant,
  VariantCollection,
  PaginatedList,
  CategoryCreateInput,
  CategoryUpdateInput,
  CollectionCreateInput,
  CollectionUpdateInput,
  ProductCreateInput,
  ProductUpdateInput,
  VariantCreateInput,
  VariantUpdateInput,
  ImageOwnerRef,
  CatalogImage,
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

export async function listCollectionVariants(
  collectionId: string,
  page = 1,
  limit = 20,
) {
  return api.get<PaginatedList<VariantCollection>>(
    `${BASE}/collections/${collectionId}/variants`,
    { page, limit },
  );
}

export async function addVariantToCollection(
  collectionId: string,
  variantId: string,
) {
  return api.post<VariantCollection>(
    `${BASE}/collections/${collectionId}/variants/${variantId}`,
  );
}

export async function removeVariantFromCollection(
  collectionId: string,
  variantId: string,
) {
  return api.delete<{ message: string }>(
    `${BASE}/collections/${collectionId}/variants/${variantId}`,
  );
}

export interface ImageUploadUrlResult {
  key: string;
  uploadUrl: string;
}

export function createImageUploadUrl(data: {
  filename: string;
  contentType: string;
  size: number;
  owner: ImageOwnerRef;
}) {
  return api.post<ImageUploadUrlResult>(`${BASE}/images/upload-url`, data);
}

export function confirmImage(data: {
  key: string;
  alt?: string | null;
  owner: ImageOwnerRef;
}) {
  return api.post<CatalogImage>(`${BASE}/images`, data);
}

export function updateImage(
  id: string,
  data: { alt?: string | null; sortOrder?: number },
) {
  return api.patch<CatalogImage>(`${BASE}/images/${id}`, data);
}

export function deleteImage(id: string) {
  return api.delete<{ message: string }>(`${BASE}/images/${id}`);
}

export function listImagesByOwner(
  ownerType: ImageOwnerRef["type"],
  ownerId: string,
) {
  return api.get<CatalogImage[]>(
    `${BASE}/images/${ownerType}/${ownerId}`,
  );
}

/**
 * PUTs raw file bytes to a presigned upload URL. Lives outside the shared
 * `api` client because that client is JSON-only and fetch cannot report
 * upload progress; the presigned URL must receive the exact signed
 * Content-Type header.
 */
export function putFileToPresignedUrl(
  uploadUrl: string,
  contentType: string,
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject({
          code: "UPLOAD_FAILED",
          message: `The file could not be uploaded to storage (status ${xhr.status}).`,
        });
      }
    };
    xhr.onerror = () => {
      reject({
        code: "UPLOAD_FAILED",
        message: "The file could not be uploaded to storage.",
      });
    };
    xhr.send(file);
  });
}

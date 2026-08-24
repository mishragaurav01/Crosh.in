import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";
import { buildPublicUrl } from "./image.service.js";

// Public DTOs are mapped explicitly so database representation never leaks:
// raw stock stays behind `available`, and fields added to Prisma models do not
// automatically become part of the customer-facing contract. Image URLs are
// derived from the stored object key at mapping time; keys never leave the API.
export type PublicImageSlot = {
  url: string;
  alt: string | null;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  // Reserved banner slot; populated when category banners are surfaced publicly.
  banner: PublicImageSlot | null;
};

export type PublicProductImage = PublicImageSlot;

export type PublicProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMin: number | null;
  priceMax: number | null;
  images: PublicProductImage[];
};

export type PublicVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  available: boolean;
};

export type PublicProductDetail = PublicProductListItem & {
  variants: PublicVariant[];
};

export type PublicCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type PublicCollectionVariant = PublicVariant & {
  productId: string;
  productName: string;
};

export type PublicCollectionDetail = PublicCollection & {
  variants: PublicCollectionVariant[];
  banner: PublicImageSlot | null;
};

type ImageRowRef = {
  key: string;
  alt: string | null;
};

type Paginated<T> = { data: T[]; total: number; page: number; limit: number };

export async function listPublicCategories(params: {
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<Paginated<PublicCategory>> {
  const { page, limit, prisma } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, description: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.category.count(),
  ]);

  return {
    data: data.map((category) => ({
      ...category,
      // Reserved banner slot; stays null until category banners are surfaced.
      banner: null,
    })),
    total,
    page,
    limit,
  };
}

export async function listPublicProducts(params: {
  page: number;
  limit: number;
  category?: string;
  prisma: PrismaClient;
}): Promise<Paginated<PublicProductListItem>> {
  const { page, limit, category, prisma } = params;
  const skip = (page - 1) * limit;

  let categoryId: string | undefined;
  if (category !== undefined) {
    const categoryRow = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true },
    });
    if (!categoryRow) {
      throw new CatalogError("CATEGORY_NOT_FOUND", "Category not found", 404);
    }
    categoryId = categoryRow.id;
  }

  const where = categoryId ? { categoryId } : undefined;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        variants: { select: { price: true }, orderBy: { createdAt: "asc" } },
        images: {
          select: { key: true, alt: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      ...priceRange(product.variants.map((variant) => variant.price)),
      images: product.images.map(toPublicImage),
    })),
    total,
    page,
    limit,
  };
}

export async function getPublicProduct(params: {
  slug: string;
  prisma: PrismaClient;
}): Promise<PublicProductDetail> {
  const { slug, prisma } = params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      variants: {
        select: { id: true, sku: true, size: true, color: true, price: true, stock: true },
        orderBy: { createdAt: "asc" },
      },
      images: {
        select: { key: true, alt: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!product) {
    throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
  }

  const { variants, images, ...base } = product;
  return {
    ...base,
    ...priceRange(variants.map((variant) => variant.price)),
    images: images.map(toPublicImage),
    variants: variants.map(toPublicVariant),
  };
}

export async function listPublicCollections(params: {
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<Paginated<PublicCollection>> {
  const { page, limit, prisma } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.collection.findMany({
      select: { id: true, name: true, slug: true, description: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.collection.count(),
  ]);

  return { data, total, page, limit };
}

export async function getPublicCollection(params: {
  slug: string;
  prisma: PrismaClient;
}): Promise<PublicCollectionDetail> {
  const { slug, prisma } = params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      images: {
        select: { key: true, alt: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      variants: {
        orderBy: { createdAt: "asc" },
        select: {
          variant: {
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              price: true,
              stock: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }

  const { variants, images, ...base } = collection;
  const bannerImage = images[0];
  return {
    ...base,
    banner: bannerImage ? toPublicImage(bannerImage) : null,
    variants: variants.map((membership) => ({
      ...toPublicVariant(membership.variant),
      productId: membership.variant.product.id,
      productName: membership.variant.product.name,
    })),
  };
}

function toPublicImage(image: ImageRowRef): PublicImageSlot {
  return {
    url: buildPublicUrl(image.key),
    alt: image.alt,
  };
}

function toPublicVariant(variant: {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}): PublicVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    price: variant.price,
    available: variant.stock > 0,
  };
}

function priceRange(prices: number[]): { priceMin: number | null; priceMax: number | null } {
  if (prices.length === 0) {
    return { priceMin: null, priceMax: null };
  }
  return { priceMin: Math.min(...prices), priceMax: Math.max(...prices) };
}

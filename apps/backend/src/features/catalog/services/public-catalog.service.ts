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
  // Hex from the grounded ColorOption lookup; null while a legacy variant has
  // no linked option (transition period — free-text color stays authoritative).
  colorHex: string | null;
  price: number;
  available: boolean;
};

export type PublicProductDetail = PublicProductListItem & {
  // Storefront needs the product's category (e.g. related-items rail) without
  // a second lookup; slug is the public lookup key for catalog reads.
  categorySlug: string;
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
  // Members link to /products/<slug>; slugs are the public lookup key.
  productSlug: string;
};

export type PublicCollectionDetail = PublicCollection & {
  variants: PublicCollectionVariant[];
  banner: PublicImageSlot | null;
  // Storefront card grid: one summary per distinct published member product,
  // in membership first-seen order. Same shape as /api/products list items.
  products: PublicProductListItem[];
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

  const where = {
    // Storefront reads are published-only; drafts/archived never surface here.
    status: "PUBLISHED" as const,
    ...(categoryId !== undefined && { categoryId }),
  };

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

  // Slug is not unique-filtered here because drafts must be unreachable: a
  // draft and a nonexistent product produce the identical 404 below.
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: { select: { slug: true } },
      variants: {
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          colorOption: { select: { hex: true } },
          price: true,
          stock: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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

  const { variants, images, category, ...base } = product;
  return {
    ...base,
    categorySlug: category.slug,
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
              colorOption: { select: { hex: true } },
              price: true,
              stock: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  status: true,
                  // Full image/variant sets so card summaries are computed
                  // from the same data as /api/products list items.
                  images: {
                    select: { key: true, alt: true },
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  },
                  variants: { select: { price: true } },
                },
              },
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

  // Read-model grouping lives in the service: member variants are the unit of
  // membership, cards are distinct products in first-seen order. Draft or
  // archived products never surface as cards, even via a stale membership.
  const products = new Map<string, PublicProductListItem>();
  for (const membership of variants) {
    const product = membership.variant.product;
    if (product.status !== "PUBLISHED" || products.has(product.id)) {
      continue;
    }
    // Card prices span the product's FULL variant set so priceMin matches
    // /api/products exactly — not just the variants this collection contains.
    products.set(product.id, {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      ...priceRange(product.variants.map((variant) => variant.price)),
      images: product.images.map(toPublicImage),
    });
  }

  return {
    ...base,
    banner: bannerImage ? toPublicImage(bannerImage) : null,
    products: [...products.values()],
    variants: variants.map((membership) => ({
      ...toPublicVariant(membership.variant),
      productId: membership.variant.product.id,
      productName: membership.variant.product.name,
      productSlug: membership.variant.product.slug,
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
  colorOption?: { hex: string } | null;
  price: number;
  stock: number;
}): PublicVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    colorHex: variant.colorOption?.hex ?? null,
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

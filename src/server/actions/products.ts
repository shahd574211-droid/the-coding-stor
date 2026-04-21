"use server";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

const CACHE_TAG_PRODUCTS = "products";
const CACHE_TAG_CATEGORIES = "categories";
const REVALIDATE_PRODUCTS = 45;
const REVALIDATE_CATEGORIES = 300;

async function getPublishedProductsUncached(opts?: {
  categorySlug?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.ProductWhereInput = { published: true };
  if (opts?.categorySlug) {
    where.category = { slug: opts.categorySlug };
  }
  const searchTerm = opts?.q?.trim();
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { shortDescription: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          type: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: opts?.limit ?? 24,
        skip: opts?.offset ?? 0,
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total };
  } catch {
    return { products: [], total: 0 };
  }
}

export async function getPublishedProducts(opts?: {
  categorySlug?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const key = ["products", opts?.categorySlug ?? "all", opts?.q ?? "", String(opts?.limit ?? 24), String(opts?.offset ?? 0)];
  return unstable_cache(
    () => getPublishedProductsUncached(opts),
    key,
    { revalidate: REVALIDATE_PRODUCTS, tags: [CACHE_TAG_PRODUCTS] }
  )();
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const uniq = Array.from(new Set(ids));
  try {
    return prisma.product.findMany({
      where: { id: { in: uniq }, published: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        imageUrl: true,
        type: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return prisma.product.findFirst({
      where: { slug, published: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        type: true,
        imageUrl: true,
        images: true,
        stock: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        digitalAssets: { orderBy: { sortOrder: "asc" }, select: { id: true, fileName: true, filePath: true, mimeType: true, sortOrder: true } },
      },
    });
  } catch {
    return null;
  }
}

async function getCategoriesUncached() {
  try {
    return prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        children: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, sortOrder: true } },
      },
    });
  } catch {
    return [];
  }
}

export async function getCategories() {
  return unstable_cache(getCategoriesUncached, [CACHE_TAG_CATEGORIES], {
    revalidate: REVALIDATE_CATEGORIES,
    tags: [CACHE_TAG_CATEGORIES],
  })();
}

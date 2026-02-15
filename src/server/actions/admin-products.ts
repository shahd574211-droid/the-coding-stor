"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { revalidatePath, revalidateTag } from "next/cache";

const CACHE_TAG_PRODUCTS = "products";
const CACHE_TAG_CATEGORIES = "categories";

export async function listProducts(opts?: { limit?: number; offset?: number }) {
  await requireAdmin();
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: opts?.limit ?? 50,
      skip: opts?.offset ?? 0,
    }),
    prisma.product.count(),
  ]);
  return { products, total };
}

export async function getProductForEdit(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, digitalAssets: true },
  });
  return product;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export async function createProduct(form: {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  type: "DIGITAL" | "PHYSICAL";
  published?: boolean;
  stock?: number | null;
  categoryId?: string | null;
  imageUrl?: string;
}) {
  await requireAdmin();
  const slug = form.slug ?? slugify(form.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
  const product = await prisma.product.create({
    data: {
      name: form.name,
      slug: finalSlug,
      description: form.description ?? null,
      shortDescription: form.shortDescription ?? null,
      price: form.price,
      compareAtPrice: form.compareAtPrice ?? null,
      currency: form.currency ?? "IQD",
      type: form.type,
      published: form.published ?? false,
      stock: form.stock ?? null,
      categoryId: form.categoryId ?? null,
      imageUrl: form.imageUrl ?? null,
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidateTag(CACHE_TAG_PRODUCTS);
  return product;
}

export async function updateProduct(
  id: string,
  form: {
    name?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    price?: number;
    compareAtPrice?: number;
    currency?: string;
    type?: "DIGITAL" | "PHYSICAL";
    published?: boolean;
    stock?: number | null;
    categoryId?: string | null;
    imageUrl?: string | null;
  }
) {
  await requireAdmin();
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(form.name != null && { name: form.name }),
      ...(form.slug != null && { slug: form.slug }),
      ...(form.description != null && { description: form.description }),
      ...(form.shortDescription != null && { shortDescription: form.shortDescription }),
      ...(form.price != null && { price: form.price }),
      ...(form.compareAtPrice != null && { compareAtPrice: form.compareAtPrice }),
      ...(form.currency != null && { currency: form.currency }),
      ...(form.type != null && { type: form.type }),
      ...(form.published != null && { published: form.published }),
      ...(form.stock !== undefined && { stock: form.stock }),
      ...(form.categoryId !== undefined && { categoryId: form.categoryId }),
      ...(form.imageUrl !== undefined && { imageUrl: form.imageUrl }),
    },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/products");
  revalidatePath("/");
  revalidateTag(CACHE_TAG_PRODUCTS);
  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidateTag(CACHE_TAG_PRODUCTS);
}

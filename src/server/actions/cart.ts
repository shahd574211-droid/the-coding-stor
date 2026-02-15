"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string | null> {
  // In Phase 4 we don't have auth middleware yet; cart will require auth at checkout.
  // For now we use a placeholder. Phase 3 session will be read from cookie/header in middleware.
  return null;
}

export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { select: { id: true, name: true, slug: true, price: true, imageUrl: true, type: true } } },
  });
  return items;
}

export async function addToCart(userId: string, productId: string, quantity: number = 1) {
  await prisma.cartItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    create: { userId, productId, quantity },
    update: { quantity: { increment: quantity } },
  });
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function updateCartItem(userId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { userId, productId },
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { userId, productId },
      data: { quantity },
    });
  }
  revalidatePath("/cart");
}

export async function removeFromCart(userId: string, productId: string) {
  await prisma.cartItem.deleteMany({
    where: { userId, productId },
  });
  revalidatePath("/cart");
}

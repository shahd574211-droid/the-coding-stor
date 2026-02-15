"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/get-current-user";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  return order;
}

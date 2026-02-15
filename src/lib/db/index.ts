import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Singleton Prisma client.
 * - Development: log queries for debugging.
 * - Production: errors only (أقل حمل على الأداء).
 * - للاتصال المباشر: استخدم connection pooling في DATABASE_URL إن أمكن (مثل ?connection_limit=10).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

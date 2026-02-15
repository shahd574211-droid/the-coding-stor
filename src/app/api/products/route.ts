import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 24, 50);
    const offset = Number(searchParams.get("offset")) || 0;

    const where: { published: boolean; category?: { slug: string } } = {
      published: true,
    };
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.product.count({ where });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        price: Number(p.price),
        currency: p.currency,
        type: p.type,
        imageUrl: p.imageUrl,
        category: p.category,
      })),
      total,
    });
  } catch (e) {
    console.error("API products:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

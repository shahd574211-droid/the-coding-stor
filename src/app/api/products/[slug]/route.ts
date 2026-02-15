import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: { slug, published: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        digitalAssets: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      currency: product.currency,
      type: product.type,
      imageUrl: product.imageUrl,
      category: product.category,
      digitalAssets: product.digitalAssets.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        mimeType: a.mimeType,
        sizeBytes: Number(a.sizeBytes),
      })),
    });
  } catch (e) {
    console.error("API product:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

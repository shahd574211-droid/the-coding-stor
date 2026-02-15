import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductForEdit } from "@/server/actions/admin-products";
import { getCategories } from "@/server/actions/products";
import { ProductForm } from "@/components/dashboard/product-form";
import { updateProduct } from "@/server/actions/admin-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForEdit(id),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">← Products</Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit: {product.name}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            submit={(form) => updateProduct(id, form)}
            initialValues={{
              name: product.name,
              slug: product.slug,
              description: product.description ?? "",
              shortDescription: product.shortDescription ?? "",
              price: Number(product.price),
              compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
              currency: product.currency,
              type: product.type,
              published: product.published,
              stock: product.stock ?? null,
              categoryId: product.categoryId ?? null,
              imageUrl: product.imageUrl ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

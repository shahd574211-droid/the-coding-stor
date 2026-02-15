import { getCategories } from "@/server/actions/products";
import { ProductForm } from "@/components/dashboard/product-form";
import { createProduct } from "@/server/actions/admin-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">← Products</Button>
        </Link>
        <h1 className="text-2xl font-bold">New product</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            submit={createProduct}
            initialValues={{
              name: "",
              slug: "",
              description: "",
              shortDescription: "",
              price: 0,
              type: "PHYSICAL",
              published: false,
              stock: null,
              categoryId: null,
              imageUrl: "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

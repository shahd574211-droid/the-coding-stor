import Link from "next/link";
import { listProducts } from "@/server/actions/admin-products";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { Plus, Pencil } from "lucide-react";

export default async function AdminProductsPage() {
  const [locale, { products, total }] = await Promise.all([
    getLocale(),
    listProducts({ limit: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New product
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">Total: {total}</p>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Name</th>
                    <th className="p-2">Slug</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Published</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2 text-muted-foreground">{p.slug}</td>
                      <td className="p-2">{p.type}</td>
                      <td className="p-2">{formatPrice(p.price, "IQD", locale)}</td>
                      <td className="p-2">{p.published ? "Yes" : "No"}</td>
                      <td className="p-2">
                        <Link href={`/admin/products/${p.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

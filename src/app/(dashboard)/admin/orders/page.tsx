import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminOrdersPage() {
  await requireAdmin();

  const [locale, orders] = await Promise.all([
    getLocale(),
    prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, phone: true, name: true } },
      orderItems: {
        include: { product: { select: { name: true, slug: true } } },
      },
    },
  }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Order</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-2 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                      <td className="p-2">{o.user.phone}</td>
                      <td className="p-2">{o.status}</td>
                      <td className="p-2">{formatPrice(Number(o.total), "IQD", locale)}</td>
                      <td className="p-2">{new Date(o.createdAt).toLocaleString()}</td>
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

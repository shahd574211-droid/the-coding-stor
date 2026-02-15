import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Users, ArrowRight, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const [ordersCount, productsCount, usersCount, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { phone: true } } },
    }),
  ]);

  const statCards = [
    { label: "Total orders", value: ordersCount, icon: ShoppingCart, href: "/admin/orders", color: "text-[#28AC28]" },
    { label: "Products", value: productsCount, icon: Package, href: "/admin/products", color: "text-[#404079]" },
    { label: "Users", value: usersCount, icon: Users, href: "/admin/users", color: "text-[#FFE210]" },
  ];

  return (
    <div className="space-y-8 text-on-dark">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-white/70 mt-1 text-sm md:text-base">
          Overview of your store
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="glass-card-on-dark border-white/20 hover:border-[#FFE210]/40 h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/90">
                  {label}
                </CardTitle>
                <Icon className={`h-6 w-6 ${color} opacity-90 group-hover:scale-110 transition-transform`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{value}</p>
                <span className="inline-flex items-center gap-1 text-xs text-white/60 mt-2 group-hover:text-[#FFE210]/90 transition-colors">
                  View <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="glass-card-on-dark border-white/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#FFE210]" />
            Recent orders
          </CardTitle>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/15">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-white/60 text-sm py-4">No orders yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="font-mono text-white/90">{o.id.slice(0, 8)}…</span>
                  <span className="text-white/80">{o.status}</span>
                  <span className="text-white/80">{o.user.phone}</span>
                  <span className="text-white/60">{new Date(o.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

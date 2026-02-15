import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { Package, ShoppingCart, Users, LayoutDashboard, Store, Sparkles } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/admin");
  }
  if (!user.isAdmin) {
    redirect("/login?error=admin");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — نفس الخلفية مع زجاج عصري */}
      <aside className="w-64 shrink-0 glass-nav-on-dark border-r border-white/10 p-5 flex flex-col gap-1 shadow-2xl">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-bold text-lg text-white mb-6 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
        >
          <Sparkles className="h-5 w-5 text-[#FFE210] group-hover:scale-110 transition-transform" />
          <span>Admin</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition-all duration-200 font-medium"
            >
              <Icon className="h-5 w-5 shrink-0 text-[#FFE210]/90" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/15 space-y-3">
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="text-sm text-white/70">Theme</span>
            <ThemeToggle variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10" />
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 text-sm font-medium"
          >
            <Store className="h-4 w-4" />
            Store
          </Link>
        </div>
      </aside>
      <main className="admin-main flex-1 p-6 md:p-8 overflow-auto text-on-dark">{children}</main>
    </div>
  );
}

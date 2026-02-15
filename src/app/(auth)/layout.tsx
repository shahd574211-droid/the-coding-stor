import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 rtl:right-auto rtl:left-4">
        <LanguageSwitcher variant="outline" />
        <ThemeToggle variant="outline" size="icon" />
      </div>
      {children}
    </div>
  );
}

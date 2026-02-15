import DynamicBackground from "@/components/background/DynamicBackground";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DynamicBackground>
      <div className="min-h-screen relative z-10">{children}</div>
    </DynamicBackground>
  );
}

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";

// Fetch the sidebar's types and collections per-request so it reflects the
// current DB state rather than baking data in at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [itemTypes, collections] = await Promise.all([
    getSidebarItemTypes(),
    getDashboardCollections(),
  ]);

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections}>
      {children}
    </DashboardShell>
  );
}

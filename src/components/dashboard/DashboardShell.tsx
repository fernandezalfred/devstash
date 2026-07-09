"use client";

import { useState } from "react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { type DashboardCollection } from "@/lib/db/collections";
import { type SidebarItemType } from "@/lib/db/items";
import { type CurrentUser } from "@/lib/db/users";
import { cn } from "@/lib/utils";

// Owns the dashboard layout and sidebar visibility state. On desktop the sidebar
// collapses inline; on mobile it slides in as an overlay drawer. The same toggle
// button in the top bar drives whichever mode is active. Sidebar data is fetched
// in the server layout and passed through.
export function DashboardShell({
  children,
  itemTypes,
  collections,
  user,
}: {
  children: React.ReactNode;
  itemTypes: SidebarItemType[];
  collections: DashboardCollection[];
  user: CurrentUser;
}) {
  const isMobile = useIsMobile();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () =>
    isMobile ? setMobileOpen((o) => !o) : setDesktopOpen((o) => !o);

  return (
    <div className="flex h-screen flex-col">
      <TopBar onToggleSidebar={toggle} itemTypes={itemTypes} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: inline collapsible sidebar */}
        <div
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 md:block",
            desktopOpen ? "w-60" : "w-0",
          )}
        >
          <Sidebar itemTypes={itemTypes} collections={collections} user={user} />
        </div>

        {/* Mobile: overlay drawer */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar itemTypes={itemTypes} collections={collections} user={user} />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <ItemDrawerProvider>{children}</ItemDrawerProvider>
        </main>
      </div>
    </div>
  );
}

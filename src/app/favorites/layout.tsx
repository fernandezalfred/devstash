import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  getCollectionsForPicker,
  getDashboardCollections,
} from "@/lib/db/collections";
import { getSearchableItems, getSidebarItemTypes } from "@/lib/db/items";
import { getCurrentUser, getEditorPreferences } from "@/lib/db/users";

// Wrap the favorites page in the same shell as the dashboard/items/collections
// pages (sidebar links here). Fetch the sidebar's types and collections
// per-request so it reflects the current DB state rather than baking data in
// at build time.
export const dynamic = "force-dynamic";

export default async function FavoritesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // The proxy already guards /favorites, but guard here too so `user` is
  // never null below (and to cover any session/DB drift).
  if (!user) redirect("/sign-in");

  const [itemTypes, collections, collectionOptions, searchItems, editorPreferences] =
    await Promise.all([
      getSidebarItemTypes(user.id),
      getDashboardCollections(user.id),
      getCollectionsForPicker(user.id),
      getSearchableItems(user.id),
      getEditorPreferences(user.id),
    ]);

  return (
    <DashboardShell
      itemTypes={itemTypes}
      collections={collections}
      collectionOptions={collectionOptions}
      searchItems={searchItems}
      user={user}
      editorPreferences={editorPreferences}
    >
      {children}
    </DashboardShell>
  );
}

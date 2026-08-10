import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionsGrid } from "@/components/dashboard/CollectionsGrid";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { getCollectionsPage } from "@/lib/db/collections";
import { parsePageParam } from "@/lib/pagination";

// Render per-request so the list reflects the current DB state instead of
// baking data in at build time.
export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePageParam((await searchParams).page);

  // The layout already redirects unauthenticated users, but guard here too so
  // getCollectionsPage always gets a real userId.
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { collections, currentPage, totalPages } = await getCollectionsPage(
    session.user.id,
    page,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CollectionsGrid collections={collections} />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/collections"
      />
    </div>
  );
}

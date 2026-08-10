import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

// Page numbers to render, always including page 1 and the last page, plus a
// window around the current page, with "ellipsis" markers for any gaps.
function buildPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const kept = new Set(
    [1, total, current - 1, current, current + 1].filter(
      (page) => page >= 1 && page <= total,
    ),
  );
  const sorted = [...kept].sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push("ellipsis");
    result.push(page);
    previous = page;
  }
  return result;
}

// Numbered page links plus prev/next, rendered as plain navigable <Link>s
// (server-component friendly — no client state). basePath is the page's own
// route (e.g. "/items/snippets", "/collections/abc123"); the current page is
// read from/written to its "page" search param. Renders nothing when there's
// only one page.
export function PaginationControls({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const disabledClass = "pointer-events-none opacity-40";

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hasPrevious ? pageHref(basePath, currentPage - 1) : "#"}
            aria-disabled={!hasPrevious}
            tabIndex={hasPrevious ? undefined : -1}
            className={cn(!hasPrevious && disabledClass)}
          />
        </PaginationItem>

        {buildPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={pageHref(basePath, page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={hasNext ? pageHref(basePath, currentPage + 1) : "#"}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={cn(!hasNext && disabledClass)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
